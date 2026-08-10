"use client";
/* eslint-disable @next/next/no-html-link-for-pages */

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { assetPath, contentCatalog } from "@/src/content/catalog";
import { Avatar } from "@/src/components/avatar/Avatar";
import { I18nProvider, useI18n } from "@/src/i18n";

const navigation = [
  ["nav.home", "/"], ["nav.learn", "/learn"], ["nav.lab", "/lab"], ["nav.markets", "/markets"],
  ["nav.research", "/research"], ["nav.desk", "/desk"], ["nav.ask", "/ask"],
] as const;

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
    if (!term) return contentCatalog.slice(0, 7);
    return contentCatalog.filter((entry) => [entry.title, entry.description, entry.assetClass, entry.type, entry.difficulty, ...entry.tags].join(" ").toLowerCase().includes(term)).slice(0, 9);
  }, [query]);

  const activeRoot = pathname === "/" ? "/" : `/${pathname.split("/").filter(Boolean)[0] ?? ""}`;
  const crumbs = pathname.split("/").filter(Boolean).slice(0, 3);

  function toggleTheme() {
    const next = !dark; setDark(next); document.documentElement.dataset.theme = next ? "dark" : "light"; localStorage.setItem("tqb-theme", next ? "dark" : "light");
  }
  function submitAssistant(event: FormEvent) {
    event.preventDefault(); if (!question.trim()) return;
    const labContext = pathname.includes("lab") ? localStorage.getItem("tqb-lab-context") : null;
    const page = pathname.includes("lab") ? (locale === "es" ? "el laboratorio y sus parámetros actuales" : "the lab and its current parameters") : (locale === "es" ? "esta página" : "this page");
    const params = labContext ? ` ${locale === "es" ? "Parámetros" : "Parameters"}: ${labContext}.` : "";
    setAnswer(locale === "es" ? `Contexto recibido: ${page}.${params} Empieza por la convención, identifica la variable que cambia y separa precio, cobertura y dinámica. «${question.trim()}» merece una respuesta por capas; la integración del proveedor remoto está marcada como demo local.` : `Context received: ${page}.${params} Start with the convention, identify the variable that moves, then separate pricing, hedging and dynamics. “${question.trim()}” deserves a layered answer; the remote provider integration is explicitly a local demo.`);
    setQuestion("");
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
        {answer && <p className="assistant-answer">{answer}</p>}
        <form onSubmit={submitAssistant}><textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder={t("assistant.placeholder")} rows={3}/><button disabled={!question.trim()}>{t("assistant.send")} ↗</button></form><small>{t("assistant.local")}</small>
      </aside>}

      <footer className="site-footer"><div className="footer-brand"><span className="wordmark-mark">TQB</span><div><strong>THEQUANTBATEMAN</strong><span>{t("shell.footer")}</span></div></div><p>{t("shell.disclaimer")}</p><span className="footer-meta">© 2026 · {t("shell.demo")} · {locale.toUpperCase()}</span></footer>

      {paletteOpen && <div className="palette-backdrop"><button className="palette-dismiss" type="button" onClick={() => setPaletteOpen(false)} aria-label={t("shell.close")} /><section className="command-palette" role="dialog" aria-modal="true" aria-label={t("shell.search")}><div className="palette-input-row"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("shell.searchPlaceholder")} aria-label={t("shell.search")} /><kbd>ESC</kbd></div><div className="palette-results"><span className="eyebrow">{query ? `${results.length} ${t("shell.results")}` : t("shell.suggested")}</span>{results.map((entry) => <a key={`${entry.assetClass}-${entry.slug}`} href={`/learn/${assetPath(entry.assetClass)}/${entry.slug}`} onClick={() => setPaletteOpen(false)}><span className={`asset-dot asset-${entry.assetClass.toLowerCase()}`} /><div><strong>{entry.title}</strong><small>{entry.description}</small></div><span className="result-meta">{entry.assetClass} · {entry.difficulty}</span></a>)}{!results.length && <p className="empty-state">{t("shell.noResults")}</p>}</div></section></div>}
    </div>
  );
}
