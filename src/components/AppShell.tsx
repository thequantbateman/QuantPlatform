"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { assetPath, contentCatalog } from "@/src/content/catalog";

const navigation = [
  ["Home", "/"],
  ["Learn", "/learn"],
  ["Lab", "/lab"],
  ["Markets", "/markets"],
  ["Research", "/research"],
  ["The Desk", "/desk"],
  ["Ask Bateman", "/ask"],
];

export function AppShell({ children }: { children: ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [dark, setDark] = useState(() => typeof document !== "undefined" && document.documentElement.dataset.theme === "dark");

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((value) => !value);
      }
      if (event.key === "Escape") setPaletteOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return contentCatalog.slice(0, 7);
    return contentCatalog.filter((entry) =>
      [entry.title, entry.description, entry.assetClass, entry.type, entry.difficulty, ...entry.tags]
        .join(" ")
        .toLowerCase()
        .includes(term),
    ).slice(0, 9);
  }, [query]);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem("tqb-theme", next ? "dark" : "light");
  }

  return (
    <div className="site-shell">
      <header className="topbar">
        <Link href="/" className="wordmark" aria-label="TheQuantBateman home">
          <span className="wordmark-mark">TQB</span>
          <span>THEQUANTBATEMAN</span>
        </Link>
        <nav className={menuOpen ? "primary-nav is-open" : "primary-nav"} aria-label="Primary navigation">
          {navigation.map(([label, href]) => <Link key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</Link>)}
        </nav>
        <div className="nav-actions">
          <button className="search-trigger" type="button" onClick={() => setPaletteOpen(true)} aria-label="Open search">
            <span>Search models</span><kbd>⌘K</kbd>
          </button>
          <button className="icon-button" type="button" onClick={toggleTheme} aria-label={`Use ${dark ? "light" : "dark"} mode`}>
            ◐
          </button>
          <button className="menu-button" type="button" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen} aria-label="Toggle navigation">Menu</button>
        </div>
      </header>

      <main>{children}</main>

      <footer className="site-footer">
        <div className="footer-brand">
          <span className="wordmark-mark">TQB</span>
          <div><strong>THEQUANTBATEMAN</strong><span>Quant Finance. Visually Explained.</span></div>
        </div>
        <p>TheQuantBateman is an educational and research platform. Models, simulations, market commentary and outputs are provided for educational purposes only and do not constitute investment advice, financial advice, trading recommendations or guarantees of future performance.</p>
        <span className="footer-meta">© 2026 · DEMO MARKET DATA · EN</span>
      </footer>

      {paletteOpen && (
        <div className="palette-backdrop">
          <button className="palette-dismiss" type="button" onClick={() => setPaletteOpen(false)} aria-label="Close search" />
          <section className="command-palette" role="dialog" aria-modal="true" aria-label="Search the knowledge graph">
            <div className="palette-input-row">
              <span>⌕</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search models, instruments, methods…" aria-label="Search content" />
              <kbd>ESC</kbd>
            </div>
            <div className="palette-results">
              <span className="eyebrow">{query ? `${results.length} results` : "Suggested"}</span>
              {results.map((entry) => (
                <Link key={`${entry.assetClass}-${entry.slug}`} href={`/learn/${assetPath(entry.assetClass)}/${entry.slug}`} onClick={() => setPaletteOpen(false)}>
                  <span className={`asset-dot asset-${entry.assetClass.toLowerCase()}`} />
                  <div><strong>{entry.title}</strong><small>{entry.description}</small></div>
                  <span className="result-meta">{entry.assetClass} · {entry.difficulty}</span>
                </Link>
              ))}
              {!results.length && <p className="empty-state">No exact match. Try “volatility”, “curve” or “forward”.</p>}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
