import type { AcademyLesson, AcademyNarrativeProfile } from "./types";

export type AcademySectionId = "intuition" | "market" | "mathematics" | "derivation" | "pricing" | "python" | "interactive" | "desk" | "macro" | "pitfalls" | "sources";

export interface AcademySectionDefinition {
  index: string;
  id: AcademySectionId;
  navLabel: string;
  eyebrow: string;
  title: string;
}

type Locale = "en" | "es";
type Localized = { en: string; es: string };

const text = (en: string, es: string): Localized => ({ en, es });

const sectionMeta: Record<AcademySectionId, { index: string; navLabel: Localized; eyebrow: Localized }> = {
  intuition: { index: "01", navLabel: text("Intuition", "Intuición"), eyebrow: text("INTUITION", "INTUICIÓN") },
  market: { index: "02", navLabel: text("Why markets care", "Por qué importa"), eyebrow: text("WHY MARKETS CARE", "POR QUÉ IMPORTA") },
  mathematics: { index: "03", navLabel: text("Mathematics", "Matemáticas"), eyebrow: text("MATHEMATICS", "MATEMÁTICAS") },
  derivation: { index: "04", navLabel: text("Derivation", "Derivación"), eyebrow: text("DERIVATION", "DERIVACIÓN") },
  pricing: { index: "05", navLabel: text("Model / pricing", "Modelo / valoración"), eyebrow: text("MODEL / PRICING", "MODELO / VALORACIÓN") },
  python: { index: "06", navLabel: text("Python lab", "Laboratorio Python"), eyebrow: text("PYTHON IMPLEMENTATION", "IMPLEMENTACIÓN PYTHON") },
  interactive: { index: "07", navLabel: text("Interactive lab", "Laboratorio interactivo"), eyebrow: text("INTERACTIVE LAB", "LABORATORIO INTERACTIVO") },
  desk: { index: "08", navLabel: text("On the desk", "En la mesa"), eyebrow: text("FRONT OFFICE", "FRONT OFFICE") },
  macro: { index: "09", navLabel: text("Macro connection", "Conexión macro"), eyebrow: text("MACRO CONNECTION", "CONEXIÓN MACRO") },
  pitfalls: { index: "10", navLabel: text("Pitfalls", "Errores"), eyebrow: text("COMMON PITFALLS", "ERRORES FRECUENTES") },
  sources: { index: "11", navLabel: text("Sources", "Fuentes"), eyebrow: text("SOURCES / FURTHER READING", "FUENTES / LECTURAS") },
};

const baseTitles: Record<AcademySectionId, Localized> = {
  intuition: text("Build the state before the equation.", "Construye el estado antes de la ecuación."),
  market: text("The product exists before the model.", "El producto existe antes que el modelo."),
  mathematics: text("Notation, units, and exact claims.", "Notación, unidades y afirmaciones exactas."),
  derivation: text("Follow the argument without skipping its hinge.", "Sigue el argumento sin saltarte su paso decisivo."),
  pricing: text("Fit, compute, then challenge the assumptions.", "Ajusta, calcula y después cuestiona los supuestos."),
  python: text("Open the implementation and checks.", "Abre la implementación y sus comprobaciones."),
  interactive: text("Move the state. Challenge the equation.", "Mueve el estado y cuestiona la ecuación."),
  desk: text("Where the model meets the book.", "Donde el modelo se encuentra con el libro."),
  macro: text("Open the transmission channel.", "Abre el canal de transmisión."),
  pitfalls: text("Open the failure checklist.", "Abre la lista de fallos."),
  sources: text("Open sources and continue the track.", "Abre las fuentes y continúa el itinerario."),
};

const profileTitles: Record<AcademyNarrativeProfile, Partial<Record<AcademySectionId, Localized>>> = {
  foundation: {
    intuition: text("Observe the object before formalizing it.", "Observa el objeto antes de formalizarlo."),
    market: text("Connect the mathematical object to a pricing question.", "Conecta el objeto matemático con una pregunta de valoración."),
    mathematics: text("Construct the definition and its invariants.", "Construye la definición y sus invariantes."),
    interactive: text("Run the thought experiment.", "Ejecuta el experimento mental."),
    desk: text("Carry the abstraction into valuation.", "Lleva la abstracción a la valoración."),
  },
  "classical-derivation": {
    intuition: text("Read the contract before deriving its price.", "Lee el contrato antes de derivar su precio."),
    market: text("Fix cash flows, conventions, and hedge instruments.", "Fija flujos, convenciones e instrumentos de cobertura."),
    mathematics: text("From dynamics and replication to valuation.", "De la dinámica y la réplica a la valoración."),
    pricing: text("Reconcile PDE, expectation, and closed form.", "Concilia EDP, esperanza y forma cerrada."),
    desk: text("Translate the derivation into a hedge.", "Traduce la derivación en una cobertura."),
  },
  "market-observable": {
    intuition: text("Separate the quote from the quantity inferred from it.", "Separa la cotización de la magnitud inferida."),
    market: text("Start from executable inputs and conventions.", "Empieza por entradas ejecutables y convenciones."),
    mathematics: text("Transform quotes without losing units or arbitrage constraints.", "Transforma cotizaciones sin perder unidades ni restricciones de arbitraje."),
    pricing: text("Invert, fit, and reprice the market instruments.", "Invierte, ajusta y revalora los instrumentos de mercado."),
    interactive: text("Move the quote and inspect every linked representation.", "Mueve la cotización e inspecciona cada representación conectada."),
  },
  instrument: {
    intuition: text("Read the cash-flow timeline first.", "Lee primero la línea temporal de flujos."),
    market: text("Start from cash flows and quotation.", "Empieza por flujos y cotización."),
    mathematics: text("Value each dated cash flow under explicit conventions.", "Valora cada flujo fechado con convenciones explícitas."),
    pricing: text("Build, calibrate, and reprice the contract.", "Construye, calibra y revalora el contrato."),
    desk: text("Follow the trade through risk and lifecycle events.", "Sigue la operación a través del riesgo y sus eventos de ciclo de vida."),
  },
  model: {
    intuition: text("Identify the state variables and the behavior they add.", "Identifica las variables de estado y el comportamiento que añaden."),
    market: text("Ask which instruments can identify the dynamics.", "Pregunta qué instrumentos pueden identificar la dinámica."),
    mathematics: text("Write the dynamics before interpreting parameters.", "Escribe la dinámica antes de interpretar parámetros."),
    pricing: text("Calibrate, compute, and challenge the dynamics.", "Calibra, calcula y cuestiona la dinámica."),
    interactive: text("Shock one parameter and trace the full response.", "Perturba un parámetro y sigue toda la respuesta."),
  },
  "numerical-method": {
    intuition: text("Name the mathematical target and the approximation error.", "Nombra el objetivo matemático y el error de aproximación."),
    market: text("Tie accuracy to the decision the number supports.", "Vincula la precisión con la decisión que sostiene el número."),
    mathematics: text("Separate estimator, discretization, truncation, and convergence.", "Separa estimador, discretización, truncamiento y convergencia."),
    pricing: text("Benchmark the algorithm against a controlled reference.", "Contrasta el algoritmo con una referencia controlada."),
    interactive: text("Change the error budget, not just the picture.", "Cambia el presupuesto de error, no solo la imagen."),
  },
  "risk-workflow": {
    intuition: text("Define the exposure before compressing it into a metric.", "Define la exposición antes de comprimirla en una métrica."),
    market: text("Fix portfolio, scenarios, horizon, and legal terms.", "Fija cartera, escenarios, horizonte y términos legales."),
    mathematics: text("Aggregate with an explicit measure and convention.", "Agrega con una medida y convención explícitas."),
    pricing: text("Reconcile valuation, risk, and model limitations.", "Concilia valoración, riesgo y limitaciones del modelo."),
    desk: text("Turn exposure into a controlled decision.", "Convierte la exposición en una decisión controlada."),
  },
};

const instrumentIds = new Set(["rate-conventions", "rate-ois", "rate-fra-futures", "rate-swaps", "rate-optionality"]);
const marketObservableIds = new Set(["vol-realized", "vol-realized-implied", "vol-implied", "vol-smile", "vol-term", "vol-surface", "rate-discount", "rate-zero-forward", "rate-curve-bootstrap", "rate-curve-interpolation", "rate-multi-curve", "rate-curve-risk"]);

export function academyNarrativeForLesson(lesson: AcademyLesson): AcademyNarrativeProfile {
  if (lesson.narrativeProfile) return lesson.narrativeProfile;
  if (lesson.domain === "foundations") return "foundation";
  if (lesson.domain === "derivatives") return "classical-derivation";
  if (lesson.domain === "numerical-finance") return "numerical-method";
  if (lesson.domain === "risk" || lesson.domain === "xva") return "risk-workflow";
  if (instrumentIds.has(lesson.id)) return "instrument";
  if (marketObservableIds.has(lesson.id)) return "market-observable";
  return "model";
}

export function academySectionDefinitions(profile: AcademyNarrativeProfile, locale: Locale): AcademySectionDefinition[] {
  return (Object.keys(sectionMeta) as AcademySectionId[]).map((id) => {
    const meta = sectionMeta[id];
    const title = profileTitles[profile][id] ?? baseTitles[id];
    return { index: meta.index, id, navLabel: meta.navLabel[locale], eyebrow: meta.eyebrow[locale], title: title[locale] };
  });
}
