"use client";
/* eslint-disable @next/next/no-html-link-for-pages */

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { QuantBatemanAssistant } from "@/src/components/quant-bateman/QuantBatemanAssistant";
import { QuantBatemanImageRenderer } from "@/src/components/quant-bateman/renderers/QuantBatemanImageRenderer";
import { QuantBatemanProvider } from "@/src/components/quant-bateman/QuantBatemanProvider";
import { useQuantBateman } from "@/src/components/quant-bateman/useQuantBateman";
import { createCoreSearchItems, mergeSearchItems, searchPlatformItems, type PlatformSearchItem } from "@/src/content/search";
import { useI18n } from "@/src/i18n";

const navigation = [
  ["nav.learn", "/learn"], ["nav.markets", "/markets"], ["nav.analytics", "/analytics"],
  ["nav.intelligence", "/intelligence"], ["nav.research", "/research"], ["nav.ask", "/ask"],
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return <QuantBatemanProvider><Shell>{children}</Shell></QuantBatemanProvider>;
}

function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const quantBateman = useQuantBateman();
  const { locale, setLocale, t } = useI18n();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [dark, setDark] = useState(true);
  const [academyIndex, setAcademyIndex] = useState<{ locale: "en" | "es"; items: PlatformSearchItem[] } | null>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setPaletteOpen((value) => !value); }
      if (event.key === "Escape") setPaletteOpen(false);
    };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => { const id = window.setTimeout(() => setDark(document.documentElement.dataset.theme !== "light"), 0); return () => window.clearTimeout(id); }, []);
  useEffect(() => {
    if (!paletteOpen || academyIndex?.locale === locale) return;
    let active = true;
    const requestedLocale = locale;
    void import("@/src/content/academy/search").then(({ createAcademySearchItems }) => {
      if (!active) return;
      setAcademyIndex({ locale: requestedLocale, items: createAcademySearchItems(requestedLocale) });
    }).catch(() => {
      if (active) setAcademyIndex({ locale: requestedLocale, items: [] });
    });
    return () => { active = false; };
  }, [academyIndex?.locale, locale, paletteOpen]);

  const coreSearchItems = useMemo(() => createCoreSearchItems(locale), [locale]);
  const platformSearchItems = useMemo(
    () => academyIndex?.locale === locale ? mergeSearchItems(coreSearchItems, academyIndex.items) : coreSearchItems,
    [academyIndex, coreSearchItems, locale],
  );

  const results = useMemo(() => searchPlatformItems(platformSearchItems, query), [platformSearchItems, query]);
  const academyLoading = paletteOpen && academyIndex?.locale !== locale;

  const activeRoot = pathname === "/" ? "/" : `/${pathname.split("/").filter(Boolean)[0] ?? ""}`;
  const crumbs = pathname.split("/").filter(Boolean).slice(0, 3);

  function toggleTheme() {
    const next = !dark; setDark(next); document.documentElement.dataset.theme = next ? "dark" : "light"; localStorage.setItem("tqb-theme", next ? "dark" : "light");
  }
  return (
    <div className="site-shell">
      <header className="topbar">
        <a href="/" className="wordmark" aria-label={locale === "es" ? "Inicio de TheQuantBateman" : "TheQuantBateman home"}><span className={`wordmark-mark${pathname === "/ask" ? " ask-character-mark" : ""}`}>{pathname === "/ask" ? <QuantBatemanImageRenderer state={quantBateman.state} dragging={false} hovered={false} talking={false} pose="default" outfit="default" /> : "TQB"}</span><span>THEQUANTBATEMAN</span></a>
        <nav className={menuOpen ? "primary-nav is-open" : "primary-nav"} aria-label={locale === "es" ? "Navegación principal" : "Primary navigation"}>
          {navigation.map(([key, href]) => <a className={activeRoot === href ? "active" : ""} aria-current={activeRoot === href ? "page" : undefined} key={href} href={href} onClick={() => setMenuOpen(false)}>{t(key)}</a>)}
        </nav>
        <div className="nav-actions">
          <button className="search-trigger" type="button" onClick={() => setPaletteOpen(true)} aria-label={t("shell.search")}><span>{t("shell.search")}</span><kbd>⌘K</kbd></button>
          <div className="locale-switch" aria-label={locale === "es" ? "Idioma" : "Language"}><button aria-label="English" className={locale === "en" ? "active" : ""} onClick={() => setLocale("en")}>EN</button><button aria-label="Español" className={locale === "es" ? "active" : ""} onClick={() => setLocale("es")}>ES</button></div>
          <button className="icon-button" type="button" onClick={toggleTheme} aria-label={dark ? t("shell.light") : t("shell.dark")}>◐</button>
          <button className="menu-button" type="button" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen} aria-label={locale === "es" ? "Alternar navegación" : "Toggle navigation"}>{t("shell.menu")}</button>
        </div>
      </header>

      {pathname !== "/" && <div className="context-nav"><a href="/">TQB</a>{crumbs.map((crumb, index) => <span key={crumb}>/ <a href={`/${crumbs.slice(0, index + 1).join("/")}`}>{({ learn: locale === "es" ? "aprender" : "learn", markets: locale === "es" ? "mercados" : "markets", analytics: locale === "es" ? "analítica" : "analytics", intelligence: locale === "es" ? "inteligencia" : "intelligence", research: locale === "es" ? "investigación" : "research", ask: locale === "es" ? "preguntar" : "ask", volatility: locale === "es" ? "volatilidad" : "volatility" } as Record<string, string>)[crumb] ?? crumb.replaceAll("-", " ")}</a></span>)}<i /><b>{locale.toUpperCase()} · {dark ? (locale === "es" ? "OSCURO" : "DARK") : (locale === "es" ? "CLARO" : "LIGHT")}</b></div>}
      <main>{children}</main>

      <QuantBatemanAssistant />

      <footer className="site-footer"><div className="footer-brand"><span className="wordmark-mark">TQB</span><div><strong>THEQUANTBATEMAN</strong><span>{t("shell.footer")}</span></div></div><p>{t("shell.disclaimer")}</p><span className="footer-meta">© 2026 · {t("shell.demo")} · {locale.toUpperCase()}<a href="/legal/third-party">{t("shell.thirdPartyNotices")}</a></span></footer>

      {paletteOpen && <div className="palette-backdrop"><button className="palette-dismiss" type="button" onClick={() => setPaletteOpen(false)} aria-label={t("shell.close")} /><section className="command-palette" role="dialog" aria-modal="true" aria-label={t("shell.search")}><div className="palette-input-row"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("shell.searchPlaceholder")} aria-label={t("shell.search")} /><kbd>ESC</kbd></div><div className="palette-results" aria-busy={academyLoading}><span className="eyebrow">{query ? `${results.length} ${t("shell.results")}` : t("shell.suggested")}</span>{academyLoading && <p className="palette-loading" role="status">{t("shell.academyLoading")}</p>}{results.map((entry) => <a key={entry.href} href={entry.href} onClick={() => setPaletteOpen(false)}><span className="asset-dot asset-foundations" /><div><strong>{entry.title}</strong><small>{entry.description}</small></div><span className="result-meta"><b>{entry.source === "academy" ? t("shell.searchCategoryAcademy") : t("shell.searchCategoryPlatform")}</b>{entry.meta}</span></a>)}{!academyLoading && !results.length && <p className="empty-state">{t("shell.noResults")}</p>}</div></section></div>}
    </div>
  );
}
