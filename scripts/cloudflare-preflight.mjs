import { readFile } from "node:fs/promises";

const CONFIG_PATH = new URL("../wrangler.jsonc", import.meta.url);
const D1_PLACEHOLDER = "00000000-0000-4000-8000-000000000000";
const EXPECTED_WORKER = "thequantbateman";
const EXPECTED_DATABASE = "thequantbateman-production";

function parseJsonc(source) {
  return JSON.parse(
    source
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, ""),
  );
}

const config = parseJsonc(await readFile(CONFIG_PATH, "utf8"));
const database = config.d1_databases?.find((entry) => entry.binding === "DB");
const failures = [];

if (config.name !== EXPECTED_WORKER) {
  failures.push(`Worker name must be ${EXPECTED_WORKER}.`);
}
if (!config.workers_dev) {
  failures.push("workers.dev must remain enabled for the first public deployment.");
}
if (!database) {
  failures.push("The required D1 binding DB is missing.");
} else {
  if (database.database_name !== EXPECTED_DATABASE) {
    failures.push(`D1 database_name must be ${EXPECTED_DATABASE}.`);
  }
  if (!database.database_id || database.database_id === D1_PLACEHOLDER) {
    failures.push("Replace the D1 database_id placeholder with the ID returned by Cloudflare.");
  }
  if (database.migrations_dir !== "drizzle") {
    failures.push("D1 migrations_dir must point to drizzle.");
  }
}

if (failures.length) {
  console.error("Cloudflare production preflight failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log("Cloudflare production preflight passed.");
}
