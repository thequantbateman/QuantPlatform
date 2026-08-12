import { readFileSync } from "node:fs";

const file = readFileSync(new URL("../src/i18n/index.tsx", import.meta.url), "utf8");
const blocks = [...file.matchAll(/\b(en|es):\s*\{([\s\S]*?)\n\s*\},/g)];
if (blocks.length !== 2) throw new Error("Unable to inspect en/es dictionaries");
const keys = Object.fromEntries(blocks.map(([, locale, body]) => [locale, [...body.matchAll(/"([^"]+)":/g)].map((match) => match[1])]));
const missingEs = keys.en.filter((key) => !keys.es.includes(key));
const missingEn = keys.es.filter((key) => !keys.en.includes(key));
if (missingEs.length || missingEn.length) {
  console.error(JSON.stringify({ missingEs, missingEn }, null, 2));
  process.exitCode = 1;
} else {
  console.log(`i18n dictionaries aligned: ${keys.en.length} keys per locale`);
}
