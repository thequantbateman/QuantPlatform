import type { LicenseCategory, SourceAction, SourcePolicyInput, SourcePolicyResult, SourceRecord } from "./types";

const RESEARCH_ACTIONS = new Set<SourceAction>(["research", "independent-synthesis", "independent-validation"]);
const REUSE_ACTIONS: readonly SourceAction[] = ["short-quote", "copy-code", "adapt-code", "embed-asset", "redistribute-data", "publish-derived-output", "public-display"];
const PERMISSIVE_LICENSES = new Set(["BSD-2-Clause", "BSD-3-Clause", "MIT", "Apache-2.0", "ISC", "QuantLib"]);
const ATTRIBUTION_LICENSES = new Set(["CC-BY-3.0", "CC-BY-4.0"]);
const PUBLIC_DOMAIN_MARKS = new Set(["CC0-1.0", "Public-Domain"]);

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function isResearchOnly(actions: readonly SourceAction[]): boolean {
  return actions.length > 0 && actions.every((action) => RESEARCH_ACTIONS.has(action));
}

function blocked(actions: readonly SourceAction[], reason: string): SourcePolicyResult {
  return { decision: "BLOCKED_UNCLEAR", attributionPlacement: "NONE", permittedActions: [], prohibitedActions: unique(actions), reason };
}

function referenceOnly(actions: readonly SourceAction[], reason: string): SourcePolicyResult {
  return { decision: "REFERENCE_ONLY", attributionPlacement: "NONE", permittedActions: unique(actions.filter((action) => RESEARCH_ACTIONS.has(action))), prohibitedActions: [...REUSE_ACTIONS], reason };
}

function hasEvidence(input: SourcePolicyInput): boolean {
  return Boolean(input.evidence?.trim());
}

export function classifySourceUse(input: SourcePolicyInput): SourcePolicyResult {
  const actions = unique(input.actions);
  if (actions.length === 0) return blocked(actions, "At least one intended action is required.");

  if (input.category === "unknown" || input.category === "all-rights-reserved") {
    return isResearchOnly(actions)
      ? referenceOnly(actions, "Rights are not verified; only research and independent synthesis are allowed.")
      : blocked(actions, "Requested reuse requires verifiable license or permission evidence.");
  }

  if (input.category === "permissive-code") {
    if (!hasEvidence(input) || !input.licenseId || !PERMISSIVE_LICENSES.has(input.licenseId)) return blocked(actions, "A supported permissive license and evidence are required.");
    if (isResearchOnly(actions)) return referenceOnly(actions, "The source is used only as a research or validation reference.");
    if (actions.some((action) => action === "embed-asset" || action === "redistribute-data")) return blocked(actions, "A source-code license does not establish asset or data redistribution rights.");
    return { decision: "SAFE_WITH_ATTRIBUTION", attributionPlacement: "CENTRAL_NOTICE", permittedActions: actions, prohibitedActions: [], reason: "Verified permissive code reuse requires its notice obligations." };
  }

  if (input.category === "creative-commons-attribution") {
    if (!hasEvidence(input) || !input.licenseId || !ATTRIBUTION_LICENSES.has(input.licenseId)) return blocked(actions, "A supported Creative Commons attribution license and evidence are required.");
    if (isResearchOnly(actions)) return referenceOnly(actions, "The source is used only as a research reference.");
    if (!input.title?.trim() || !input.authorOrOwner?.trim() || !input.publicSourceUrl?.trim()) return blocked(actions, "Title, author, source, and license metadata are required for CC attribution.");
    const inline = actions.some((action) => action === "embed-asset" || action === "public-display");
    return { decision: "SAFE_WITH_ATTRIBUTION", attributionPlacement: inline ? "INLINE" : "CENTRAL_NOTICE", permittedActions: actions, prohibitedActions: [], reason: "Verified CC reuse requires Title, Author, Source, and License attribution." };
  }

  if (input.category === "public-domain") {
    if (!hasEvidence(input) || !input.licenseId || !PUBLIC_DOMAIN_MARKS.has(input.licenseId)) return blocked(actions, "Public-domain or CC0 evidence is required.");
    return { decision: "SAFE_TO_REUSE", attributionPlacement: "NONE", permittedActions: actions, prohibitedActions: [], reason: "Verified public-domain or CC0 material has no mandatory legal attribution." };
  }

  if (input.category === "proprietary-permission") {
    if (!hasEvidence(input) || !input.permissionActions?.length) return blocked(actions, "Explicit permission evidence and permitted actions are required.");
    const permitted = actions.filter((action) => input.permissionActions?.includes(action));
    const prohibited = actions.filter((action) => !input.permissionActions?.includes(action));
    if (prohibited.length > 0) return { decision: "BLOCKED_UNCLEAR", attributionPlacement: "NONE", permittedActions: permitted, prohibitedActions: prohibited, reason: "The requested action exceeds the recorded permission." };
    return { decision: input.requiredAttribution === "NONE" ? "SAFE_TO_REUSE" : "SAFE_WITH_ATTRIBUTION", attributionPlacement: input.requiredAttribution ?? "CENTRAL_NOTICE", permittedActions: permitted, prohibitedActions: [], reason: "Use is limited to the actions recorded in explicit permission." };
  }

  return blocked(actions, `Unsupported license category: ${input.category satisfies never}`);
}

function isPrivateOrAbsolute(value: string): boolean {
  return value.startsWith("/") || value.startsWith("file:") || /^[A-Za-z]:[\\/]/.test(value) || value.includes("/Users/") || value.includes("\\Users\\");
}

function isRepositoryRelative(value: string): boolean {
  return value.length > 0 && !isPrivateOrAbsolute(value) && !value.split(/[\\/]/).includes("..");
}

export function validateSourceRecord(record: SourceRecord): readonly string[] {
  const failures: string[] = [];
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.id)) failures.push("id must be stable kebab-case");
  if (!record.title.trim()) failures.push("title is required");
  if (!record.authorOrOwner.trim()) failures.push("authorOrOwner is required");
  if (!record.licenseId.trim()) failures.push("licenseId is required");
  if (record.publicSourceUrl && !/^https:\/\//.test(record.publicSourceUrl)) failures.push("publicSourceUrl must use https");
  if (record.localFingerprint && !/^sha256:[a-f0-9]{64}$/.test(record.localFingerprint)) failures.push("localFingerprint must be a sha256 digest");
  if (record.evidence && isPrivateOrAbsolute(record.evidence)) failures.push("evidence must not expose a private or absolute path");
  if (new Set(record.usageIntent).size !== record.usageIntent.length || record.usageIntent.length === 0) failures.push("usageIntent must contain unique actions");
  if (new Set(record.permittedActions).size !== record.permittedActions.length) failures.push("permittedActions must be unique");
  if (new Set(record.prohibitedActions).size !== record.prohibitedActions.length) failures.push("prohibitedActions must be unique");
  for (const affectedPath of record.affectedPaths) if (!isRepositoryRelative(affectedPath)) failures.push(`affected path must be repository-relative: ${affectedPath}`);
  if ((record.decision === "SAFE_TO_REUSE" || record.decision === "SAFE_WITH_ATTRIBUTION") && !record.evidence?.trim()) failures.push("reusable decisions require evidence");
  if (record.attributionPlacement === "INLINE" && (!record.title.trim() || !record.authorOrOwner.trim() || !record.publicSourceUrl || !record.licenseId.trim())) failures.push("inline attribution requires complete TASL metadata");
  const classified = classifySourceUse({ category: record.category, licenseId: record.licenseId, evidence: record.evidence, title: record.title, authorOrOwner: record.authorOrOwner, publicSourceUrl: record.publicSourceUrl, actions: record.usageIntent });
  if (classified.decision !== record.decision) failures.push(`decision must match policy result ${classified.decision}`);
  if (classified.attributionPlacement !== record.attributionPlacement) failures.push(`attributionPlacement must match policy result ${classified.attributionPlacement}`);
  return failures;
}

export function isReuseAction(action: SourceAction): boolean {
  return REUSE_ACTIONS.includes(action);
}

export function isKnownCategory(category: string): category is LicenseCategory {
  return ["permissive-code", "creative-commons-attribution", "public-domain", "proprietary-permission", "all-rights-reserved", "unknown"].includes(category);
}
