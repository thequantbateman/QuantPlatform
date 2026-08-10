"use client";
/* eslint-disable @next/next/no-html-link-for-pages */

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { assetPath, contentCatalog } from "@/src/content/catalog";
import { Avatar } from "@/src/components/avatar/Avatar";
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
  return <I18nProvider><Shell>{children}</Shell></I18nProvider>;
}

function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { locale, setLocale, t } = useI18n();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [assistantMeta, setAssistantMeta] = useState("");
  const [assistantBusy, setAssistantBusy] = useState(false);
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setPaletteOpen((value) => !value); }
      if (event.key === "Escape") { setPaletteOpen(false); setAssistantOpen(false); }
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
  async function submitAssistant(event: FormEvent) {
    event.preventDefault(); if (!question.trim()) return;
    const labContext = pathname.includes("lab") ? localStorage.getItem("tqb-lab-context") : null;
    const asked = question.trim(); setQuestion(""); setAssistantBusy(true); setAnswer(""); setAssistantMeta("");
    try { const response = await fetch("/api/assistant", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question: asked, context: JSON.stringify({ pathname, locale, labContext }) }) }); const payload = await response.json() as { answer?: string; provider?: string; tool?: string; error?: string }; if (!response.ok) throw new Error(payload.error || "Assistant unavailable"); setAnswer(payload.answer || "No answer returned."); setAssistantMeta(`${payload.provider} · ${payload.tool}`); } catch (error) { setAnswer(error instanceof Error ? error.message : "Assistant unavailable"); setAssistantMeta("ERROR · NO UNGROUNDED FALLBACK"); } finally { setAssistantBusy(false); }
  }

  return (
    <div className="site-shell">
      <header className="topbar">
        <a href="/" className="wordmark" aria-label="TheQuantBateman home"><span className="wordmark-mark">TQB</span><span>THEQUANTBATEMAN</span></a>
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

      <button className="assistant-launcher" type="button" onClick={() => setAssistantOpen(true)} aria-label={t("assistant.title")}><span>∂</span><b>{t("assistant.title")}</b></button>
      {assistantOpen && <aside className="assistant-drawer" aria-label={t("assistant.title")}>
        <header><Avatar state={answer ? "explaining" : "idle"} compact /><div><strong>{t("assistant.title")}</strong><span>{t("assistant.subtitle")}</span></div><button onClick={() => setAssistantOpen(false)} aria-label={t("assistant.close")}>×</button></header>
        <div className="assistant-context"><b>{t("assistant.context")}</b><code>{`{ page: "${pathname}", locale: "${locale}", mode: "${pathname.includes("lab") ? "lab" : "page"}" }`}</code></div>
        {assistantBusy && <p className="assistant-answer">{t("assistant.title")} · checking authoritative sources…</p>}{answer && <p className="assistant-answer">{answer}</p>}{assistantMeta && <small>{assistantMeta}</small>}
        <form onSubmit={submitAssistant}><textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder={t("assistant.placeholder")} rows={3}/><button disabled={!question.trim() || assistantBusy}>{t("assistant.send")} ↗</button></form><small>TOOLS FIRST · NUMBERS REQUIRE AUTHORITATIVE SOURCES</small>
      </aside>}

      <footer className="site-footer"><div className="footer-brand"><span className="wordmark-mark">TQB</span><div><strong>THEQUANTBATEMAN</strong><span>{t("shell.footer")}</span></div></div><p>{t("shell.disclaimer")}</p><span className="footer-meta">© 2026 · {t("shell.demo")} · {locale.toUpperCase()}</span></footer>

      {paletteOpen && <div className="palette-backdrop"><button className="palette-dismiss" type="button" onClick={() => setPaletteOpen(false)} aria-label={t("shell.close")} /><section className="command-palette" role="dialog" aria-modal="true" aria-label={t("shell.search")}><div className="palette-input-row"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("shell.searchPlaceholder")} aria-label={t("shell.search")} /><kbd>ESC</kbd></div><div className="palette-results"><span className="eyebrow">{query ? `${results.length} ${t("shell.results")}` : t("shell.suggested")}</span>{results.map((entry) => <a key={entry.href} href={entry.href} onClick={() => setPaletteOpen(false)}><span className="asset-dot asset-foundations" /><div><strong>{entry.title}</strong><small>{entry.description}</small></div><span className="result-meta">{entry.meta}</span></a>)}{!results.length && <p className="empty-state">{t("shell.noResults")}</p>}</div></section></div>}
    </div>
  );
}
