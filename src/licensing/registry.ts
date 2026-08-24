import registryJson from "../../docs/legal/source-registry.json";
import type { SourceRecord } from "./types";

export const sourceRegistry = registryJson as readonly SourceRecord[];

export function findSourceRecord(id: string): SourceRecord | undefined {
  return sourceRegistry.find((source) => source.id === id);
}
