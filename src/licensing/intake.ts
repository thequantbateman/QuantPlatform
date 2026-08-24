import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import path from "node:path";
import { classifySourceUse } from "./policy";
import type { LicenseCategory, SourceAction, SourceKind, SourceRecord } from "./types";

const EXTENSION_KINDS: Readonly<Record<string, SourceKind>> = {
  ".pdf": "document", ".doc": "document", ".docx": "document", ".md": "document", ".txt": "document", ".rtf": "document",
  ".js": "code", ".jsx": "code", ".ts": "code", ".tsx": "code", ".py": "code", ".java": "code", ".cpp": "code", ".c": "code", ".h": "code",
  ".png": "image", ".jpg": "image", ".jpeg": "image", ".gif": "image", ".webp": "image", ".svg": "image",
  ".csv": "dataset", ".json": "dataset", ".parquet": "dataset", ".feather": "dataset",
  ".xls": "spreadsheet", ".xlsx": "spreadsheet", ".xlsm": "spreadsheet", ".ods": "spreadsheet",
  ".mp3": "audio", ".wav": "audio", ".m4a": "audio", ".ogg": "audio",
  ".mp4": "video", ".mov": "video", ".webm": "video", ".mkv": "video",
};

export interface IntakeRecordInput {
  filePath: string;
  title: string;
  authorOrOwner: string;
  category: LicenseCategory;
  actions: readonly SourceAction[];
  licenseId?: string;
  evidence?: string;
  publicSourceUrl?: string;
}

export function inferSourceKind(filePath: string): SourceKind {
  return EXTENSION_KINDS[path.extname(filePath).toLowerCase()] ?? "other";
}

export async function fingerprintFile(filePath: string): Promise<string> {
  const hash = createHash("sha256");
  await new Promise<void>((resolve, reject) => {
    const input = createReadStream(filePath);
    input.on("data", (chunk) => hash.update(chunk));
    input.on("error", reject);
    input.on("end", resolve);
  });
  return `sha256:${hash.digest("hex")}`;
}

function slugify(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 56) || "external-source";
}

export async function createIntakeRecord(input: IntakeRecordInput): Promise<SourceRecord> {
  const localFingerprint = await fingerprintFile(input.filePath);
  const result = classifySourceUse({
    category: input.category,
    actions: input.actions,
    licenseId: input.licenseId,
    evidence: input.evidence,
    title: input.title,
    authorOrOwner: input.authorOrOwner,
    publicSourceUrl: input.publicSourceUrl,
  });
  return {
    id: `${slugify(input.title)}-${localFingerprint.slice(7, 19)}`,
    title: input.title.trim(),
    kind: inferSourceKind(input.filePath),
    authorOrOwner: input.authorOrOwner.trim(),
    publicSourceUrl: input.publicSourceUrl?.trim() || undefined,
    localFingerprint,
    category: input.category,
    licenseId: input.licenseId?.trim() || "NOASSERTION",
    evidence: input.evidence?.trim() || undefined,
    usageIntent: [...new Set(input.actions)],
    decision: result.decision,
    permittedActions: result.permittedActions,
    prohibitedActions: result.prohibitedActions,
    attributionPlacement: result.attributionPlacement,
    affectedPaths: [],
    reviewedBy: "Pending review",
    reviewedOn: new Date().toISOString().slice(0, 10),
    notes: result.reason,
  };
}
