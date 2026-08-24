import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { auditSourceRegistry } from "../src/licensing/audit";
import { sourceRegistry } from "../src/licensing/registry";

const root = path.resolve(import.meta.dirname, "..");
const notices = await readFile(path.join(root, "THIRD_PARTY_NOTICES.md"), "utf8");
const existingPaths: string[] = [];
for (const affectedPath of sourceRegistry.flatMap((record) => record.affectedPaths)) {
  try {
    await access(path.join(root, affectedPath));
    existingPaths.push(affectedPath);
  } catch {
    // The pure audit reports the exact missing repository-relative path.
  }
}
const result = auditSourceRegistry(sourceRegistry, { notices, existingPaths });
if (result.failures.length > 0) {
  console.error("Source licensing audit failed:");
  for (const failure of result.failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Source licensing audit passed (${sourceRegistry.length} registered sources).`);
}
