import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";
import { createIntakeRecord, fingerprintFile, inferSourceKind } from "../src/licensing/intake";

const execFileAsync = promisify(execFile);

test("intake fingerprints a private file without retaining its local path", async (context) => {
  const directory = await mkdtemp(path.join(tmpdir(), "tqb-license-intake-"));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const filePath = path.join(directory, "Private Notes.pdf");
  await writeFile(filePath, "private educational notes\n", "utf8");

  const first = await fingerprintFile(filePath);
  const second = await fingerprintFile(filePath);
  const record = await createIntakeRecord({ filePath, title: "Private notes", authorOrOwner: "Unknown", category: "unknown", actions: ["research"] });

  assert.equal(first, second);
  assert.match(first, /^sha256:[a-f0-9]{64}$/);
  assert.equal(record.kind, "document");
  assert.equal(record.decision, "REFERENCE_ONLY");
  assert.equal(JSON.stringify(record).includes(filePath), false);
});

test("intake blocks unverified public reuse", async (context) => {
  const directory = await mkdtemp(path.join(tmpdir(), "tqb-license-intake-"));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const filePath = path.join(directory, "chart.png");
  await writeFile(filePath, "not-a-real-image", "utf8");
  const record = await createIntakeRecord({ filePath, title: "Unknown chart", authorOrOwner: "Unknown", category: "unknown", actions: ["embed-asset", "public-display"] });
  assert.equal(record.decision, "BLOCKED_UNCLEAR");
  assert.deepEqual(record.permittedActions, []);
});

test("source-kind inference covers common attached material", () => {
  assert.equal(inferSourceKind("book.pdf"), "document");
  assert.equal(inferSourceKind("model.xlsm"), "spreadsheet");
  assert.equal(inferSourceKind("surface.png"), "image");
  assert.equal(inferSourceKind("engine.ts"), "code");
  assert.equal(inferSourceKind("quotes.csv"), "dataset");
  assert.equal(inferSourceKind("lesson.mp4"), "video");
  assert.equal(inferSourceKind("voice.mp3"), "audio");
  assert.equal(inferSourceKind("archive.bin"), "other");
});

test("the CLI writes a conservative registry draft without private provenance", async (context) => {
  const directory = await mkdtemp(path.join(tmpdir(), "tqb-license-cli-"));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const filePath = path.join(directory, "notes.txt");
  const outputPath = path.join(directory, "draft.json");
  await writeFile(filePath, "source material\n", "utf8");

  const { stdout } = await execFileAsync(process.execPath, [
    "--import", "tsx", "scripts/license-intake.ts",
    "--file", filePath,
    "--title", "Research notes",
    "--owner", "Unknown",
    "--category", "unknown",
    "--intent", "research,independent-synthesis",
    "--output", outputPath,
  ], { cwd: path.resolve(import.meta.dirname, "..") });

  const output = await readFile(outputPath, "utf8");
  assert.match(stdout, /REFERENCE_ONLY/);
  assert.match(output, /sha256:[a-f0-9]{64}/);
  assert.equal(output.includes(filePath), false);
});
