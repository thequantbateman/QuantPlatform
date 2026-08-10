export type AssetClass = "Foundations" | "EQ" | "FX" | "IR" | "COMM" | "Frontier";
export type Difficulty = "foundation" | "practitioner" | "front-office" | "research";
export type ContentType = "concept" | "model" | "instrument" | "method" | "lab" | "research" | "market-note";

export interface ContentEntry {
  title: string;
  slug: string;
  description: string;
  assetClass: AssetClass;
  category: string;
  difficulty: Difficulty;
  type: ContentType;
  prerequisites: string[];
  relatedTopics: string[];
  labs: string[];
  tags: string[];
  authors: string[];
  lastReviewed: string;
  intuition: string;
  mathematics: string;
  assumptions: string[];
  marketUse: string;
  deskView: string;
}
