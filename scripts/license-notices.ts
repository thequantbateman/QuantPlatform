import { writeFile } from "node:fs/promises";
import { renderThirdPartyNotices } from "../src/licensing/notices";
import { sourceRegistry } from "../src/licensing/registry";

const output = new URL("../THIRD_PARTY_NOTICES.md", import.meta.url);
await writeFile(output, renderThirdPartyNotices(sourceRegistry), "utf8");
console.log("Third-party notices generated from docs/legal/source-registry.json.");
