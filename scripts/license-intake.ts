import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createIntakeRecord } from "../src/licensing/intake";
import { isKnownCategory } from "../src/licensing/policy";
import type { SourceAction } from "../src/licensing/types";

const SOURCE_ACTIONS = new Set<SourceAction>(["research", "independent-synthesis", "independent-validation", "short-quote", "copy-code", "adapt-code", "embed-asset", "redistribute-data", "publish-derived-output", "public-display"]);

function parseArguments(args: readonly string[]): Map<string, string> {
  const values = new Map<string, string>();
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index];
    const value = args[index + 1];
    if (!flag?.startsWith("--") || !value) throw new Error(`Expected --name value arguments; received ${flag ?? "end of input"}.`);
    values.set(flag.slice(2), value);
  }
  return values;
}

export async function runLicenseIntake(args: readonly string[]): Promise<string> {
  const values = parseArguments(args);
  const filePath = values.get("file");
  const title = values.get("title");
  const authorOrOwner = values.get("owner");
  const category = values.get("category");
  const intent = values.get("intent");
  if (!filePath || !title || !authorOrOwner || !category || !intent) throw new Error("Required arguments: --file, --title, --owner, --category, and --intent.");
  if (!isKnownCategory(category)) throw new Error(`Unsupported category: ${category}.`);
  const actions = intent.split(",").map((action) => action.trim()).filter(Boolean);
  if (!actions.length || actions.some((action) => !SOURCE_ACTIONS.has(action as SourceAction))) throw new Error("--intent contains an unsupported action.");
  const record = await createIntakeRecord({
    filePath,
    title,
    authorOrOwner,
    category,
    actions: actions as SourceAction[],
    licenseId: values.get("license"),
    evidence: values.get("evidence"),
    publicSourceUrl: values.get("source-url"),
  });
  const outputPath = path.resolve(values.get("output") ?? path.join("docs", "legal", "intake", `${record.id}.json`));
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  return [
    `Source: ${record.id}`,
    `Fingerprint: ${record.localFingerprint}`,
    `Decision: ${record.decision}`,
    `Attribution: ${record.attributionPlacement}`,
    `Permitted: ${record.permittedActions.join(", ") || "none"}`,
    `Prohibited: ${record.prohibitedActions.join(", ") || "none"}`,
    `Draft: ${outputPath}`,
  ].join("\n");
}

const isMain = process.argv[1] ? import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href : false;
if (isMain) {
  runLicenseIntake(process.argv.slice(2)).then((summary) => console.log(summary)).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Source intake failed.");
    process.exitCode = 1;
  });
}
