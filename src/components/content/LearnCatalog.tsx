"use client";

import { useMemo, useState } from "react";
import { assetPath, contentCatalog } from "@/src/content/catalog";
import type { AssetClass, Difficulty } from "@/src/content/types";
import { localizeEntry } from "@/src/content/localization";
import { useI18n } from "@/src/i18n";

const assets: (AssetClass | "All")[] = ["All", "Foundations", "EQ", "FX", "IR", "COMM", "Frontier"];
const levels: (Difficulty | "all")[] = ["all", "foundation", "practitioner", "front-office", "research"];

export function LearnCatalog({ initialAsset, showHero = true }: { initialAsset?: string; showHero?: boolean }) {
  const { locale, t } = useI18n();
  const validInitial = assets.includes(initialAsset as AssetClass) ? initialAsset as AssetClass : "All";
  const [asset, setAsset] = useState<AssetClass | "All">(validInitial);
  const [level, setLevel] = useState<Difficulty | "all">("all");
  const [query, setQuery] = useState("");
  const entries = useMemo(() => contentCatalog.map((source) => ({ source, localized: localizeEntry(source, locale) })).filter(({ source, localized }) => {
    const search = `${source.title} ${source.description} ${source.tags.join(" ")} ${localized.title} ${localized.description} ${localized.tags.join(" ")}`.toLowerCase();
    return (asset === "All" || source.assetClass === asset) && (level === "all" || source.difficulty === level) && search.includes(query.trim().toLowerCase());
  }).map(({ localized }) => localized), [asset, level, locale, query]);
  return (
    <>
      {showHero && <header className="page-hero section-shell">
        <span className="eyebrow">{t("learn.eyebrow")} · {contentCatalog.length} CONCEPTS</span>
        <h1>{t("learn.titleA")}<br /><em>{t("learn.titleB")}</em></h1>
        <p>{t("learn.copy")}</p>
      </header>}
      <section className="catalog section-shell">
        <div className="catalog-filters">
          <label className="catalog-search"><span className="control-label">{locale === "es" ? "BUSCAR EN ACADEMY" : "SEARCH ACADEMY"}</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={locale === "es" ? "Volatilidad, calibración, curvas…" : "Volatility, calibration, curves…"} /></label>
          <div><span className="control-label">{t("common.asset")}</span><div className="filter-row">{assets.map((item) => <button key={item} className={asset === item ? "active" : ""} onClick={() => setAsset(item)}>{item === "All" ? t("common.all") : item}</button>)}</div></div>
          <label><span className="control-label">{t("common.level")}</span><select value={level} onChange={(event) => setLevel(event.target.value as Difficulty | "all")} aria-label={locale === "es" ? "Filtrar por nivel de aprendizaje" : "Filter by learning level"}>{levels.map((item) => <option value={item} key={item}>{item === "all" ? t("learn.levels") : locale === "es" ? ({ foundation: "fundamentos", practitioner: "profesional", "front-office": "front office", research: "investigación" } as Record<string, string>)[item] : item}</option>)}</select></label>
        </div>
        <div className="catalog-stats"><strong>{entries.length.toString().padStart(2, "0")}</strong><span>{t("learn.entries")}</span><i /><p><kbd>⌘K</kbd> {t("learn.tip")}</p></div>
        <div className="concept-grid">
          {entries.map((entry, index) => <a href={`/learn/${assetPath(entry.assetClass)}/${entry.slug}`} className="concept-card" key={`${entry.assetClass}-${entry.slug}`}><div><span className={`asset-badge badge-${entry.assetClass.toLowerCase()}`}>{entry.assetClass}</span><span className="difficulty-badge">{entry.difficulty}</span></div><span className="card-index">{String(index + 1).padStart(2, "0")}</span><h2>{entry.title}</h2><p>{entry.description}</p><footer><span>{entry.type}</span><b>{t("common.open")} →</b></footer></a>)}
        </div>
      </section>
    </>
  );
}
