"use client";
/* eslint-disable @next/next/no-html-link-for-pages */

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { assetPath, contentCatalog } from "@/src/content/catalog";
import { QuantBatemanAssistant } from "@/src/components/quant-bateman/QuantBatemanAssistant";
import { QuantBatemanImageRenderer } from "@/src/components/quant-bateman/renderers/QuantBatemanImageRenderer";
import { QuantBatemanProvider } from "@/src/components/quant-bateman/QuantBatemanProvider";
import { useQuantBateman } from "@/src/components/quant-bateman/useQuantBateman";
import { demoMarketQuotes, marketDetailPath } from "@/src/data/markets";
import { I18nProvider, useI18n } from "@/src/i18n";

const navigation = [
  ["nav.learn", "/learn"], ["nav.markets", "/markets"], ["nav.analytics", "/analytics"],
  ["nav.intelligence", "/intelligence"], ["nav.research", "/research"], ["nav.ask", "/ask"],
] as const;

const platformSearchItems = [
  ...contentCatalog.map((entry) => ({ title: entry.title, description: entry.description, meta: `${entry.assetClass} · ${entry.difficulty}`, href: `/learn/${assetPath(entry.assetClass)}/${entry.slug}`, keywords: [entry.title, entry.description, entry.assetClass, entry.type, entry.difficulty, ...entry.tags].join(" ") })),
  ...demoMarketQuotes.map((quote) => ({ title: quote.displaySymbol, description: quote.name, meta: `${quote.assetClass} · ${quote.status}`, href: marketDetailPath(quote.symbol), keywords: `${quote.symbol} ${quote.name} ${quote.assetClass} market quote` })),
  { title: "European option pricer", description: "BSM, Garman–Kohlhagen and Black-76", meta: "ANALYTICS · LAB", href: "/lab?lab=vanilla", keywords: "price option bsm black scholes garman kohlhagen black 76 analytics lab" },
  { title: "Greeks dashboard", description: "Delta, Gamma, Vega, Theta and Rho", meta: "ANALYTICS · LAB", href: "/lab?lab=greeks", keywords: "greeks delta gamma vega theta rho analytics lab" },
  { title: "Prediction workstation", description: "Live events, L2 books, trades and public analytics", meta: "MARKETS · LIVE PUBLIC", href: "/markets/predictions", keywords: "polymarket predictions probability events order book trades screener" },
  { title: "Prediction Data Explorer", description: "Persisted quotes, history, coverage and normalized schema", meta: "INTELLIGENCE · DATA", href: "/intelligence/data", keywords: "polymarket prediction data explorer database history quotes coverage d1" },
  { title: "Cross-asset Event Study", description: "Curated prediction-versus-market comparisons", meta: "INTELLIGENCE · EVENT STUDY", href: "/intelligence/event-study", keywords: "polymarket prediction event study cross asset correlation probability" },
  { title: "Prediction pipeline health", description: "Provider latency, stream topology and database lag", meta: "DEVELOPER · HEALTH", href: "/dev/data", keywords: "polymarket prediction pipeline websocket database health lag coverage" },
  { title: "Market intelligence", description: "Returns, realized volatility, z-scores and range", meta: "INTELLIGENCE", href: "/intelligence", keywords: "market intelligence return realized volatility z score range analytics" },
  { title: "Quant research", description: "Frontier models and implementation notes", meta: "RESEARCH", href: "/research", keywords: "research rough volatility differentiable pricing monte carlo" },
];

export function AppShell({ children }: { children: ReactNode }) {
  return <I18nProvider><QuantBatemanProvider><Shell>{children}</Shell></QuantBatemanProvider></I18nProvider>;
}

function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const quantBateman = useQuantBateman();
  const { locale, setLocale, t } = useI18n();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setPaletteOpen((value) => !value); }
      if (event.key === "Escape") setPaletteOpen(false);
    };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => { const id = window.setTimeout(() => setDark(document.documentElement.dataset.theme !== "light"), 0); return () => window.clearTimeout(id); }, []);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return platformSearchItems.slice(0, 8);
    return platformSearchItems.filter((entry) => entry.keywords.toLowerCase().includes(term)).slice(0, 10);
  }, [query]);

  const activeRoot = pathname === "/" ? "/" : `/${pathname.split("/").filter(Boolean)[0] ?? ""}`;
  const crumbs = pathname.split("/").filter(Boolean).slice(0, 3);

  function toggleTheme() {
    const next = !dark; setDark(next); document.documentElement.dataset.theme = next ? "dark" : "light"; localStorage.setItem("tqb-theme", next ? "dark" : "light");
  }
  return (
    <div className="site-shell">
      <header className="topbar">
        <a href="/" className="wordmark" aria-label="TheQuantBateman home"><span className={`wordmark-mark${pathname === "/ask" ? " ask-character-mark" : ""}`}>{pathname === "/ask" ? <QuantBatemanImageRenderer state={quantBateman.state} dragging={false} hovered={false} talking={false} pose="default" outfit="default" /> : "TQB"}</span><span>THEQUANTBATEMAN</span></a>
        <nav className={menuOpen ? "primary-nav is-open" : "primary-nav"} aria-label="Primary navigation">
          {navigation.map(([key, href]) => <a className={activeRoot === href ? "active" : ""} aria-current={activeRoot === href ? "page" : undefined} key={href} href={href} onClick={() => setMenuOpen(false)}>{t(key)}</a>)}
        </nav>
        <div className="nav-actions">
          <button className="search-trigger" type="button" onClick={() => setPaletteOpen(true)} aria-label={t("shell.search")}><span>{t("shell.search")}</span><kbd>⌘K</kbd></button>
          <div className="locale-switch" aria-label="Language"><button className={locale === "en" ? "active" : ""} onClick={() => setLocale("en")}>EN</button><button className={locale === "es" ? "active" : ""} onClick={() => setLocale("es")}>ES</button></div>
          <button className="icon-button" type="button" onClick={toggleTheme} aria-label={dark ? t("shell.light") : t("shell.dark")}>◐</button>
          <button className="menu-button" type="button" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen} aria-label="Toggle navigation">{t("shell.menu")}</button>
        </div>
      </header>

      {pathname !== "/" && <div className="context-nav"><a href="/">TQB</a>{crumbs.map((crumb, index) => <span key={crumb}>/ <a href={`/${crumbs.slice(0, index + 1).join("/")}`}>{crumb.replaceAll("-", " ")}</a></span>)}<i /><b>{locale.toUpperCase()} · {dark ? "DARK" : "LIGHT"}</b></div>}
      <main>{children}</main>

      <QuantBatemanAssistant />

      <footer className="site-footer"><div className="footer-brand"><span className="wordmark-mark">TQB</span><div><strong>THEQUANTBATEMAN</strong><span>{t("shell.footer")}</span></div></div><p>{t("shell.disclaimer")}</p><span className="footer-meta">© 2026 · {t("shell.demo")} · {locale.toUpperCase()}</span></footer>

      {paletteOpen && <div className="palette-backdrop"><button className="palette-dismiss" type="button" onClick={() => setPaletteOpen(false)} aria-label={t("shell.close")} /><section className="command-palette" role="dialog" aria-modal="true" aria-label={t("shell.search")}><div className="palette-input-row"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("shell.searchPlaceholder")} aria-label={t("shell.search")} /><kbd>ESC</kbd></div><div className="palette-results"><span className="eyebrow">{query ? `${results.length} ${t("shell.results")}` : t("shell.suggested")}</span>{results.map((entry) => <a key={entry.href} href={entry.href} onClick={() => setPaletteOpen(false)}><span className="asset-dot asset-foundations" /><div><strong>{entry.title}</strong><small>{entry.description}</small></div><span className="result-meta">{entry.meta}</span></a>)}{!results.length && <p className="empty-state">{t("shell.noResults")}</p>}</div></section></div>}
    </div>
  );
}
