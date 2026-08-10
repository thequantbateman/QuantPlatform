"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";

export type Locale = "en" | "es";

const dictionaries = {
  en: {
    "nav.home": "Home", "nav.learn": "Learn", "nav.lab": "Lab", "nav.markets": "Markets", "nav.research": "Research", "nav.desk": "The Desk", "nav.ask": "Ask Bateman",
    "shell.search": "Search models", "shell.searchPlaceholder": "Search models, instruments, methods…", "shell.suggested": "Suggested", "shell.results": "results", "shell.noResults": "No exact match. Try “volatility”, “curve” or “forward”.", "shell.menu": "Menu", "shell.close": "Close", "shell.light": "Use light mode", "shell.dark": "Use dark mode", "shell.footer": "Quant Finance. Visually Explained.", "shell.disclaimer": "Educational and research platform. Models, simulations and commentary are not investment advice.", "shell.demo": "DEMO MARKET DATA",
    "common.parameters": "Parameters", "common.reset": "Reset", "common.desk": "Desk View", "common.assumptions": "Assumptions", "common.math": "Mathematics", "common.open": "Open concept", "common.all": "All", "common.level": "Learning level", "common.asset": "Asset class", "common.coming": "Coming Soon",
    "lab.eyebrow": "QUANT LAB · CONTROLLED EXPERIMENTS", "lab.title": "TOUCH THE MODEL.", "lab.copy": "Change one assumption. Watch every dependent output react.", "lab.bs": "Black–Scholes", "lab.bsDesc": "Price + Greeks", "lab.greeks": "Greeks Dashboard", "lab.greeksDesc": "1D + 2D risk geometry", "lab.vol": "Volatility Explorer", "lab.volDesc": "Smile → surface", "lab.curve": "Yield Curve", "lab.curveDesc": "Bootstrap + risk",
    "learn.eyebrow": "KNOWLEDGE GRAPH", "learn.titleA": "FROM INTUITION", "learn.titleB": "TO DESK VIEW.", "learn.copy": "Progressive explanations connect assumptions, equations, implementation and market use.", "learn.entries": "entries in this view", "learn.tip": "Search by concept, model, instrument or tag.", "learn.levels": "All levels",
    "assistant.title": "Ask Bateman", "assistant.subtitle": "Context-aware quant tutor", "assistant.placeholder": "Ask about this page or model…", "assistant.send": "Ask", "assistant.context": "Context", "assistant.local": "LOCAL DEMO · NO API KEY", "assistant.close": "Close assistant",
  },
  es: {
    "nav.home": "Inicio", "nav.learn": "Aprender", "nav.lab": "Laboratorio", "nav.markets": "Mercados", "nav.research": "Investigación", "nav.desk": "La Mesa", "nav.ask": "Preguntar",
    "shell.search": "Buscar modelos", "shell.searchPlaceholder": "Buscar modelos, instrumentos, métodos…", "shell.suggested": "Sugerencias", "shell.results": "resultados", "shell.noResults": "Sin coincidencia exacta. Prueba «volatilidad», «curva» o «forward».", "shell.menu": "Menú", "shell.close": "Cerrar", "shell.light": "Usar modo claro", "shell.dark": "Usar modo oscuro", "shell.footer": "Finanzas cuantitativas, explicadas visualmente.", "shell.disclaimer": "Plataforma educativa y de investigación. Los modelos, simulaciones y comentarios no son asesoramiento financiero.", "shell.demo": "DATOS DE MERCADO DEMO",
    "common.parameters": "Parámetros", "common.reset": "Restablecer", "common.desk": "Vista de mesa", "common.assumptions": "Supuestos", "common.math": "Matemáticas", "common.open": "Abrir concepto", "common.all": "Todos", "common.level": "Nivel", "common.asset": "Clase de activo", "common.coming": "Próximamente",
    "lab.eyebrow": "LABORATORIO QUANT · EXPERIMENTOS CONTROLADOS", "lab.title": "TOCA EL MODELO.", "lab.copy": "Cambia un supuesto. Observa cómo reacciona cada resultado dependiente.", "lab.bs": "Black–Scholes", "lab.bsDesc": "Precio + griegas", "lab.greeks": "Panel de griegas", "lab.greeksDesc": "Geometría de riesgo 1D + 2D", "lab.vol": "Explorador de volatilidad", "lab.volDesc": "Sonrisa → superficie", "lab.curve": "Curva de tipos", "lab.curveDesc": "Bootstrap + riesgo",
    "learn.eyebrow": "GRAFO DE CONOCIMIENTO", "learn.titleA": "DE LA INTUICIÓN", "learn.titleB": "A LA MESA.", "learn.copy": "Explicaciones progresivas conectan supuestos, ecuaciones, implementación y uso de mercado.", "learn.entries": "entradas en esta vista", "learn.tip": "Busca por concepto, modelo, instrumento o etiqueta.", "learn.levels": "Todos los niveles",
    "assistant.title": "Pregunta a Bateman", "assistant.subtitle": "Tutor quant con contexto", "assistant.placeholder": "Pregunta sobre esta página o modelo…", "assistant.send": "Preguntar", "assistant.context": "Contexto", "assistant.local": "DEMO LOCAL · SIN CLAVE API", "assistant.close": "Cerrar asistente",
  },
} as const;

type DictionaryKey = keyof typeof dictionaries.en;
type I18nValue = { locale: Locale; setLocale: (locale: Locale) => void; t: (key: DictionaryKey) => string };
const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore<Locale>(
    (onChange) => { window.addEventListener("tqb-locale", onChange); return () => window.removeEventListener("tqb-locale", onChange); },
    () => localStorage.getItem("tqb-locale") === "es" ? "es" : "en",
    () => "en",
  );
  const setLocale = useCallback((next: Locale) => { localStorage.setItem("tqb-locale", next); document.documentElement.lang = next; window.dispatchEvent(new Event("tqb-locale")); }, []);
  const value = useMemo(() => ({ locale, setLocale, t: (key: DictionaryKey) => dictionaries[locale][key] }), [locale, setLocale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return value;
}

export function pick<T>(locale: Locale, values: { en: T; es: T }): T { return values[locale]; }
