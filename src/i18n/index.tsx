"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";

export type Locale = "en" | "es";

const dictionaries = {
  en: {
    "nav.home": "Home", "nav.learn": "Learn", "nav.lab": "Lab", "nav.markets": "Markets", "nav.analytics": "Analytics", "nav.intelligence": "Intelligence", "nav.research": "Research", "nav.desk": "The Desk", "nav.ask": "Ask",
    "shell.search": "Search models", "shell.searchPlaceholder": "Search models, instruments, methods…", "shell.suggested": "Suggested", "shell.results": "results", "shell.noResults": "No exact match. Try “volatility”, “curve” or “forward”.", "shell.academyLoading": "Loading the Academy index…", "shell.searchCategoryAcademy": "Academy", "shell.searchCategoryPlatform": "Platform", "shell.menu": "Menu", "shell.close": "Close", "shell.light": "Use light mode", "shell.dark": "Use dark mode", "shell.footer": "Quant Finance. Visually Explained.", "shell.disclaimer": "Educational and research platform. Models, simulations and commentary are not investment advice.", "shell.demo": "DEMO MARKET DATA",
    "home.hero.eyebrow": "THEQUANTBATEMAN · QUANTITATIVE DISCOVERY", "home.hero.title": "Learn the model. Test the assumptions.", "home.hero.copy": "Move from quantitative intuition to mathematics, observed market context and deterministic analytics in one source-aware workspace.", "home.hero.primary": "Enter the Academy",
    "home.map.eyebrow": "PLATFORM MAP", "home.map.title": "Choose your quantitative path", "home.map.copy": "Follow the learning tracks, then move into market context, pricing workflows or a grounded question.", "home.map.instructions": "Focus or point to a node to trace its direct connections. Select it to inspect the route, then use the link to open it.", "home.map.selected": "Selected route", "home.map.cta": "Open selected route", "home.map.select": "Select", "home.map.open": "Open", "home.map.groupPlatform": "Platform", "home.map.groupTracks": "Learning tracks", "home.map.groupWorkflows": "Workflows", "home.map.tracks": "learning tracks", "home.map.workflows": "workflows",
    "home.tasks.title": "Start with the task", "home.tasks.copy": "Four direct ways into the same quantitative system.", "home.tasks.learn.title": "Learn", "home.tasks.learn.copy": "Build intuition, derive the mathematics and follow a structured track.", "home.tasks.learn.cta": "Choose a learning path", "home.tasks.analyze.title": "Analyze", "home.tasks.analyze.copy": "Change assumptions and inspect deterministic pricing and risk outputs.", "home.tasks.analyze.cta": "Run analytics", "home.tasks.markets.title": "Explore markets", "home.tasks.markets.copy": "Read labelled market inputs with visible sources and status.", "home.tasks.markets.cta": "Open market context", "home.tasks.ask.title": "Ask", "home.tasks.ask.copy": "Frame a grounded question across the Academy and analytics.", "home.tasks.ask.cta": "Ask a question",
    "common.parameters": "Parameters", "common.reset": "Reset", "common.desk": "Desk View", "common.assumptions": "Assumptions", "common.math": "Mathematics", "common.open": "Open concept", "common.all": "All", "common.level": "Learning level", "common.asset": "Asset class", "common.coming": "Coming Soon",
    "academy.formula": "Formula", "academy.definition": "Definition", "academy.shortDerivation": "Short derivation", "academy.fullDerivation": "Full derivation", "academy.inputs": "Inputs", "academy.assumptions": "Assumptions and limits", "academy.openLab": "Open in Analytics", "academy.numericalCheck": "Numerical check",
    "lab.eyebrow": "QUANT LAB · CONTROLLED EXPERIMENTS", "lab.title": "TOUCH THE MODEL.", "lab.copy": "Change one assumption. Watch every dependent output react.", "lab.bs": "Black–Scholes", "lab.bsDesc": "Price + Greeks", "lab.greeks": "Greeks Dashboard", "lab.greeksDesc": "1D + 2D risk geometry", "lab.vol": "Volatility Explorer", "lab.volDesc": "Smile → surface", "lab.curve": "Yield Curve", "lab.curveDesc": "Bootstrap + risk", "lab.marketMaking": "Market-Making Desk", "lab.marketMakingDesc": "Flow → hedge → replay",
    "learn.eyebrow": "KNOWLEDGE GRAPH", "learn.titleA": "FROM INTUITION", "learn.titleB": "TO DESK VIEW.", "learn.copy": "Progressive explanations connect assumptions, equations, implementation and market use.", "learn.entries": "entries in this view", "learn.tip": "Search by concept, model, instrument or tag.", "learn.levels": "All levels",
    "analytics.market.title": "Market state", "analytics.market.spot": "Spot", "analytics.market.volatility": "Volatility", "analytics.market.rate": "Rate", "analytics.market.dividend": "Dividend yield", "analytics.market.valuationTime": "Valuation time", "analytics.market.engineUnits": "Rates and volatility use decimal engine inputs. Time is measured in years.",
    "analytics.position.table": "Portfolio positions", "analytics.position.instrument": "Instrument", "analytics.position.direction": "Direction", "analytics.position.quantity": "Quantity", "analytics.position.multiplier": "Multiplier", "analytics.position.optionType": "Option type", "analytics.position.strike": "Strike", "analytics.position.maturity": "Maturity", "analytics.position.entry": "Entry", "analytics.position.premium": "Premium", "analytics.position.entryPrice": "Entry price", "analytics.position.actions": "Actions", "analytics.position.remove": "Remove position", "analytics.position.select": "Select position", "analytics.position.long": "Long", "analytics.position.short": "Short", "analytics.position.call": "Call", "analytics.position.put": "Put", "analytics.position.option": "Option", "analytics.position.underlying": "Underlying",
    "analytics.risk.deskUnits": "Desk units", "analytics.risk.change": "Change", "analytics.risk.deltaUnit": "per 1 spot unit", "analytics.risk.gammaUnit": "delta change per 1 spot unit", "analytics.risk.vegaUnit": "per 1 volatility point", "analytics.risk.thetaUnit": "per calendar day", "analytics.risk.rhoUnit": "per 100bp",
    "analytics.pnl.matrix": "Spot by volatility P&L matrix", "analytics.pnl.volBySpot": "VOL × SPOT", "analytics.pnl.numericMatrix": "Accessible numeric P&L matrix",
    "analytics.guide.eyebrow": "GUIDED EXPERIMENT", "analytics.guide.title": "Change one assumption with intent", "analytics.guide.copy": "Load a coherent example, observe the linked calculation, then return to unrestricted manual exploration.", "analytics.guide.hintTitle": "New here? ", "analytics.guide.hintCopy": "Start with one example and change only the suggested input.", "analytics.guide.dismiss": "Dismiss", "analytics.guide.firstTry": "First try", "analytics.guide.resetExample": "Reset to example", "analytics.guide.manual": "Return to manual", "analytics.guide.openExplanation": "Open explanation", "analytics.guide.objective": "Learning objective", "analytics.guide.change": "What to change", "analytics.guide.watch": "What to watch", "analytics.guide.why": "Why it moves", "analytics.guide.boundary": "Model boundary", "analytics.guide.beforeAfter": "Before / after", "analytics.guide.academy": "Study the mathematics", "analytics.guide.ask": "Ask about this", "analytics.guide.difficulty.foundation": "Foundation", "analytics.guide.difficulty.practitioner": "Practitioner", "analytics.guide.difficulty.front-office": "Front office",
    "assistant.title": "Ask Bateman", "assistant.subtitle": "Context-aware quant tutor", "assistant.placeholder": "Ask about this page or model…", "assistant.send": "Ask", "assistant.context": "Context", "assistant.local": "LOCAL DEMO · NO API KEY", "assistant.close": "Close assistant",
  },
  es: {
    "nav.home": "Inicio", "nav.learn": "Aprender", "nav.lab": "Laboratorio", "nav.markets": "Mercados", "nav.analytics": "Analítica", "nav.intelligence": "Inteligencia", "nav.research": "Investigación", "nav.desk": "La Mesa", "nav.ask": "Preguntar",
    "shell.search": "Buscar modelos", "shell.searchPlaceholder": "Buscar modelos, instrumentos, métodos…", "shell.suggested": "Sugerencias", "shell.results": "resultados", "shell.noResults": "Sin coincidencia exacta. Prueba «volatilidad», «curva» o «forward».", "shell.academyLoading": "Cargando el índice de la Academia…", "shell.searchCategoryAcademy": "Academia", "shell.searchCategoryPlatform": "Plataforma", "shell.menu": "Menú", "shell.close": "Cerrar", "shell.light": "Usar modo claro", "shell.dark": "Usar modo oscuro", "shell.footer": "Finanzas cuantitativas, explicadas visualmente.", "shell.disclaimer": "Plataforma educativa y de investigación. Los modelos, simulaciones y comentarios no son asesoramiento financiero.", "shell.demo": "DATOS DE MERCADO DEMO",
    "home.hero.eyebrow": "THEQUANTBATEMAN · DESCUBRIMIENTO CUANTITATIVO", "home.hero.title": "Aprende el modelo. Pon a prueba los supuestos.", "home.hero.copy": "Avanza desde la intuición cuantitativa hasta las matemáticas, el contexto de mercado observado y la analítica determinista en un espacio con fuentes explícitas.", "home.hero.primary": "Entrar en la Academia",
    "home.map.eyebrow": "MAPA DE LA PLATAFORMA", "home.map.title": "Elige tu ruta cuantitativa", "home.map.copy": "Sigue los itinerarios formativos y avanza hacia el contexto de mercado, los flujos de valoración o una pregunta fundamentada.", "home.map.instructions": "Enfoca o señala un nodo para trazar sus conexiones directas. Selecciónalo para inspeccionar la ruta y usa el enlace para abrirla.", "home.map.selected": "Ruta seleccionada", "home.map.cta": "Abrir la ruta seleccionada", "home.map.select": "Seleccionar", "home.map.open": "Abrir", "home.map.groupPlatform": "Plataforma", "home.map.groupTracks": "Itinerarios formativos", "home.map.groupWorkflows": "Flujos de trabajo", "home.map.tracks": "itinerarios formativos", "home.map.workflows": "flujos de trabajo",
    "home.tasks.title": "Empieza por la tarea", "home.tasks.copy": "Cuatro accesos directos al mismo sistema cuantitativo.", "home.tasks.learn.title": "Aprender", "home.tasks.learn.copy": "Construye intuición, deriva las matemáticas y sigue un itinerario estructurado.", "home.tasks.learn.cta": "Elegir un itinerario", "home.tasks.analyze.title": "Analizar", "home.tasks.analyze.copy": "Cambia supuestos e inspecciona resultados deterministas de valoración y riesgo.", "home.tasks.analyze.cta": "Ejecutar analítica", "home.tasks.markets.title": "Explorar mercados", "home.tasks.markets.copy": "Consulta inputs de mercado etiquetados, con fuentes y estado visibles.", "home.tasks.markets.cta": "Abrir contexto de mercado", "home.tasks.ask.title": "Preguntar", "home.tasks.ask.copy": "Formula una pregunta fundamentada sobre la Academia y la analítica.", "home.tasks.ask.cta": "Hacer una pregunta",
    "common.parameters": "Parámetros", "common.reset": "Restablecer", "common.desk": "Vista de mesa", "common.assumptions": "Supuestos", "common.math": "Matemáticas", "common.open": "Abrir concepto", "common.all": "Todos", "common.level": "Nivel", "common.asset": "Clase de activo", "common.coming": "Próximamente",
    "academy.formula": "Fórmula", "academy.definition": "Definición", "academy.shortDerivation": "Derivación breve", "academy.fullDerivation": "Derivación completa", "academy.inputs": "Entradas", "academy.assumptions": "Supuestos y límites", "academy.openLab": "Abrir en Analítica", "academy.numericalCheck": "Comprobación numérica",
    "lab.eyebrow": "LABORATORIO QUANT · EXPERIMENTOS CONTROLADOS", "lab.title": "TOCA EL MODELO.", "lab.copy": "Cambia un supuesto. Observa cómo reacciona cada resultado dependiente.", "lab.bs": "Black–Scholes", "lab.bsDesc": "Precio + griegas", "lab.greeks": "Panel de griegas", "lab.greeksDesc": "Geometría de riesgo 1D + 2D", "lab.vol": "Explorador de volatilidad", "lab.volDesc": "Sonrisa → superficie", "lab.curve": "Curva de tipos", "lab.curveDesc": "Bootstrap + riesgo", "lab.marketMaking": "Mesa de Market Making", "lab.marketMakingDesc": "Flujo → cobertura → repetición",
    "learn.eyebrow": "GRAFO DE CONOCIMIENTO", "learn.titleA": "DE LA INTUICIÓN", "learn.titleB": "A LA MESA.", "learn.copy": "Explicaciones progresivas conectan supuestos, ecuaciones, implementación y uso de mercado.", "learn.entries": "entradas en esta vista", "learn.tip": "Busca por concepto, modelo, instrumento o etiqueta.", "learn.levels": "Todos los niveles",
    "analytics.market.title": "Estado de mercado", "analytics.market.spot": "Spot", "analytics.market.volatility": "Volatilidad", "analytics.market.rate": "Tipo", "analytics.market.dividend": "Rentabilidad por dividendo", "analytics.market.valuationTime": "Tiempo de valoración", "analytics.market.engineUnits": "Los tipos y la volatilidad usan inputs decimales del motor. El tiempo se mide en años.",
    "analytics.position.table": "Posiciones de la cartera", "analytics.position.instrument": "Instrumento", "analytics.position.direction": "Dirección", "analytics.position.quantity": "Cantidad", "analytics.position.multiplier": "Multiplicador", "analytics.position.optionType": "Tipo de opción", "analytics.position.strike": "Strike", "analytics.position.maturity": "Vencimiento", "analytics.position.entry": "Entrada", "analytics.position.premium": "Prima", "analytics.position.entryPrice": "Precio de entrada", "analytics.position.actions": "Acciones", "analytics.position.remove": "Eliminar posición", "analytics.position.select": "Seleccionar posición", "analytics.position.long": "Largo", "analytics.position.short": "Corto", "analytics.position.call": "Call", "analytics.position.put": "Put", "analytics.position.option": "Opción", "analytics.position.underlying": "Subyacente",
    "analytics.risk.deskUnits": "Unidades de mesa", "analytics.risk.change": "Cambio", "analytics.risk.deltaUnit": "por 1 unidad de spot", "analytics.risk.gammaUnit": "cambio de delta por 1 unidad de spot", "analytics.risk.vegaUnit": "por 1 punto de volatilidad", "analytics.risk.thetaUnit": "por día natural", "analytics.risk.rhoUnit": "por 100 pb",
    "analytics.pnl.matrix": "Matriz de P&L por spot y volatilidad", "analytics.pnl.volBySpot": "VOL × SPOT", "analytics.pnl.numericMatrix": "Matriz numérica accesible de P&L",
    "analytics.guide.eyebrow": "EXPERIMENTO GUIADO", "analytics.guide.title": "Cambia un supuesto con intención", "analytics.guide.copy": "Carga un ejemplo coherente, observa el cálculo enlazado y vuelve después a la exploración manual sin restricciones.", "analytics.guide.hintTitle": "¿Es tu primera vez? ", "analytics.guide.hintCopy": "Empieza con un ejemplo y cambia solo el input sugerido.", "analytics.guide.dismiss": "Descartar", "analytics.guide.firstTry": "Primer experimento", "analytics.guide.resetExample": "Restablecer ejemplo", "analytics.guide.manual": "Volver a manual", "analytics.guide.openExplanation": "Abrir explicación", "analytics.guide.objective": "Objetivo de aprendizaje", "analytics.guide.change": "Qué cambiar", "analytics.guide.watch": "Qué observar", "analytics.guide.why": "Por qué se mueve", "analytics.guide.boundary": "Límite del modelo", "analytics.guide.beforeAfter": "Antes / después", "analytics.guide.academy": "Estudiar las matemáticas", "analytics.guide.ask": "Preguntar sobre esto", "analytics.guide.difficulty.foundation": "Fundamentos", "analytics.guide.difficulty.practitioner": "Práctica", "analytics.guide.difficulty.front-office": "Front office",
    "assistant.title": "Pregunta a Bateman", "assistant.subtitle": "Tutor quant con contexto", "assistant.placeholder": "Pregunta sobre esta página o modelo…", "assistant.send": "Preguntar", "assistant.context": "Contexto", "assistant.local": "DEMO LOCAL · SIN CLAVE API", "assistant.close": "Cerrar asistente",
  },
} as const;

export type DictionaryKey = keyof typeof dictionaries.en;
type I18nValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: DictionaryKey) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatDate: (value: Date | number | string, options?: Intl.DateTimeFormatOptions) => string;
};
const I18nContext = createContext<I18nValue | null>(null);

const localeCookie = "tqb-locale";

export function I18nProvider({ children, initialLocale = "en" }: { children: ReactNode; initialLocale?: Locale }) {
  const locale = useSyncExternalStore<Locale>(
    (onChange) => { window.addEventListener("tqb-locale", onChange); return () => window.removeEventListener("tqb-locale", onChange); },
    () => localStorage.getItem(localeCookie) === "es" ? "es" : localStorage.getItem(localeCookie) === "en" ? "en" : initialLocale,
    () => initialLocale,
  );
  useEffect(() => {
    document.documentElement.lang = locale;
    document.cookie = `${localeCookie}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`;
  }, [locale]);
  useEffect(() => {
    if (localStorage.getItem(localeCookie)) return;
    const browserLocale: Locale = navigator.language.toLowerCase().startsWith("es") ? "es" : initialLocale;
    localStorage.setItem(localeCookie, browserLocale);
    window.dispatchEvent(new Event("tqb-locale"));
  }, [initialLocale]);
  const setLocale = useCallback((next: Locale) => {
    localStorage.setItem(localeCookie, next);
    document.cookie = `${localeCookie}=${next}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`;
    document.documentElement.lang = next;
    window.dispatchEvent(new Event("tqb-locale"));
  }, []);
  const value = useMemo(() => ({
    locale,
    setLocale,
    t: (key: DictionaryKey) => dictionaries[locale][key],
    formatNumber: (number: number, options?: Intl.NumberFormatOptions) => new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-US", options).format(number),
    formatDate: (date: Date | number | string, options?: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-US", options).format(typeof date === "string" ? new Date(date) : date),
  }), [locale, setLocale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return value;
}

export function pick<T>(locale: Locale, values: { en: T; es: T }): T { return values[locale]; }
