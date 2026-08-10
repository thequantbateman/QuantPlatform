"use client";

import { useMemo, useState } from "react";
import { assetPath, contentCatalog } from "@/src/content/catalog";
import type { AssetClass, Difficulty } from "@/src/content/types";

const assets: (AssetClass | "All")[] = ["All", "Foundations", "EQ", "FX", "IR", "COMM", "Frontier"];
const levels: (Difficulty | "all")[] = ["all", "foundation", "practitioner", "front-office", "research"];

export function LearnCatalog({ initialAsset }: { initialAsset?: string }) {
  const validInitial = assets.includes(initialAsset as AssetClass) ? initialAsset as AssetClass : "All";
  const [asset, setAsset] = useState<AssetClass | "All">(validInitial);
  const [level, setLevel] = useState<Difficulty | "all">("all");
  const entries = useMemo(() => contentCatalog.filter((entry) => (asset === "All" || entry.assetClass === asset) && (level === "all" || entry.difficulty === level)), [asset, level]);
  return (
    <>
      <header className="page-hero section-shell">
        <span className="eyebrow">KNOWLEDGE GRAPH · {contentCatalog.length} CONCEPTS</span>
        <h1>FROM INTUITION<br /><em>TO DESK VIEW.</em></h1>
        <p>Reveal complexity progressively. Every model keeps assumptions, mathematics and market use in the same room.</p>
      </header>
      <section className="catalog section-shell">
        <div className="catalog-filters">
          <div><span className="control-label">ASSET CLASS</span><div className="filter-row">{assets.map((item) => <button key={item} className={asset === item ? "active" : ""} onClick={() => setAsset(item)}>{item}</button>)}</div></div>
          <label><span className="control-label">LEARNING LEVEL</span><select value={level} onChange={(event) => setLevel(event.target.value as Difficulty | "all")} aria-label="Filter by learning level">{levels.map((item) => <option value={item} key={item}>{item === "all" ? "All levels" : item}</option>)}</select></label>
        </div>
        <div className="catalog-stats"><strong>{entries.length.toString().padStart(2, "0")}</strong><span>entries in this view</span><i /><p>Use <kbd>⌘K</kbd> anywhere to search by concept, model, instrument or tag.</p></div>
        <div className="concept-grid">
          {entries.map((entry, index) => <a href={`/learn/${assetPath(entry.assetClass)}/${entry.slug}`} className="concept-card" key={`${entry.assetClass}-${entry.slug}`}><div><span className={`asset-badge badge-${entry.assetClass.toLowerCase()}`}>{entry.assetClass}</span><span className="difficulty-badge">{entry.difficulty}</span></div><span className="card-index">{String(index + 1).padStart(2, "0")}</span><h2>{entry.title}</h2><p>{entry.description}</p><footer><span>{entry.type}</span><b>Open concept →</b></footer></a>)}
        </div>
      </section>
    </>
  );
}
