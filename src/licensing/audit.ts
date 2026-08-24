import { isReuseAction, validateSourceRecord } from "./policy";
import { renderThirdPartyNotices } from "./notices";
import type { SourceRecord } from "./types";

export interface AuditOptions {
  notices?: string;
  existingPaths?: readonly string[];
}

export interface AuditResult {
  failures: string[];
  warnings: string[];
}

export function auditSourceRegistry(records: readonly SourceRecord[], options: AuditOptions = {}): AuditResult {
  const failures: string[] = [];
  const warnings: string[] = [];
  const ids = new Set<string>();
  const fingerprints = new Set<string>();
  const existingPaths = options.existingPaths ? new Set(options.existingPaths) : null;

  for (const record of records) {
    if (ids.has(record.id)) failures.push(`${record.id}: duplicate source id`);
    ids.add(record.id);
    if (record.localFingerprint) {
      if (fingerprints.has(record.localFingerprint)) failures.push(`${record.id}: duplicate source fingerprint`);
      fingerprints.add(record.localFingerprint);
    }
    for (const failure of validateSourceRecord(record)) failures.push(`${record.id}: ${failure}`);
    if ((record.decision === "REFERENCE_ONLY" || record.decision === "BLOCKED_UNCLEAR") && record.affectedPaths.length > 0) failures.push(`${record.id}: ${record.decision} records cannot claim committed public or runtime paths`);
    if ((record.decision === "SAFE_TO_REUSE" || record.decision === "SAFE_WITH_ATTRIBUTION") && record.usageIntent.some(isReuseAction) && record.affectedPaths.length === 0) failures.push(`${record.id}: reused material must declare affectedPaths`);
    if (existingPaths) for (const affectedPath of record.affectedPaths) if (!existingPaths.has(affectedPath)) failures.push(`${record.id}: affected path does not exist: ${affectedPath}`);
  }

  if (options.notices !== undefined && options.notices !== renderThirdPartyNotices(records)) failures.push("THIRD_PARTY_NOTICES.md is stale; run npm run license:notices");
  return { failures, warnings };
}
