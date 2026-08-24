export type SourceKind = "document" | "code" | "image" | "dataset" | "spreadsheet" | "audio" | "video" | "other";

export type SourceAction =
  | "research"
  | "independent-synthesis"
  | "independent-validation"
  | "short-quote"
  | "copy-code"
  | "adapt-code"
  | "embed-asset"
  | "redistribute-data"
  | "publish-derived-output"
  | "public-display";

export type SourceDecision = "SAFE_TO_REUSE" | "SAFE_WITH_ATTRIBUTION" | "REFERENCE_ONLY" | "BLOCKED_UNCLEAR";
export type AttributionPlacement = "NONE" | "CENTRAL_NOTICE" | "INLINE";
export type LicenseCategory = "permissive-code" | "creative-commons-attribution" | "public-domain" | "proprietary-permission" | "all-rights-reserved" | "unknown";

export interface SourcePolicyInput {
  category: LicenseCategory;
  actions: readonly SourceAction[];
  licenseId?: string;
  evidence?: string;
  title?: string;
  authorOrOwner?: string;
  publicSourceUrl?: string;
  permissionActions?: readonly SourceAction[];
  requiredAttribution?: AttributionPlacement;
}

export interface SourcePolicyResult {
  decision: SourceDecision;
  attributionPlacement: AttributionPlacement;
  permittedActions: readonly SourceAction[];
  prohibitedActions: readonly SourceAction[];
  reason: string;
}

export interface SourceRecord {
  id: string;
  title: string;
  kind: SourceKind;
  authorOrOwner: string;
  publicSourceUrl?: string;
  localFingerprint?: string;
  category: LicenseCategory;
  licenseId: string;
  evidence?: string;
  copyrightNotice?: string;
  usageIntent: readonly SourceAction[];
  decision: SourceDecision;
  permittedActions: readonly SourceAction[];
  prohibitedActions: readonly SourceAction[];
  attributionPlacement: AttributionPlacement;
  affectedPaths: readonly string[];
  reviewedBy: string;
  reviewedOn: string;
  notes?: string;
}
