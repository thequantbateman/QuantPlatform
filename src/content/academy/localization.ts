import type { Locale } from "@/src/i18n";
import type { AcademyLesson, AcademyTrack } from "./types";

const phrases: Array<[string, string]> = [
  ["Realized volatility", "Volatilidad realizada"],
  ["Realized versus implied volatility", "Volatilidad realizada frente a implícita"],
  ["Implied volatility", "Volatilidad implícita"],
  ["Volatility smile and skew", "Sonrisa y skew de volatilidad"],
  ["Volatility term structure", "Estructura temporal de volatilidad"],
  ["Implied-volatility surface", "Superficie de volatilidad implícita"],
  ["Local volatility", "Volatilidad local"],
  ["Stochastic volatility", "Volatilidad estocástica"],
  ["Volatility-model calibration", "Calibración de modelos de volatilidad"],
  ["Vega, vanna and volga", "Vega, vanna y volga"],
  ["Volatility", "Volatilidad"],
  ["volatility", "volatilidad"],
  ["Implied", "Implícita"],
  ["implied", "implícita"],
  ["Realized", "Realizada"],
  ["realized", "realizada"],
  ["Calibration", "Calibración"],
  ["calibration", "calibración"],
  ["Mathematics", "Matemáticas"],
  ["mathematics", "matemáticas"],
  ["Derivation", "Derivación"],
  ["derivation", "derivación"],
  ["Parameters", "Parámetros"],
  ["parameters", "parámetros"],
  ["Parameter", "Parámetro"],
  ["parameter", "parámetro"],
  ["Risk", "Riesgo"],
  ["risk", "riesgo"],
  ["Market", "Mercado"],
  ["market", "mercado"],
  ["Markets", "Mercados"],
  ["markets", "mercados"],
  ["Model", "Modelo"],
  ["model", "modelo"],
  ["Pricing", "Valoración"],
  ["pricing", "valoración"],
  ["Option", "Opción"],
  ["option", "opción"],
  ["Options", "Opciones"],
  ["options", "opciones"],
  ["Surface", "Superficie"],
  ["surface", "superficie"],
  ["Term structure", "Estructura temporal"],
  ["term structure", "estructura temporal"],
  ["Maturity", "Vencimiento"],
  ["maturity", "vencimiento"],
  ["Strike", "Strike"],
  ["Forward", "Forward"],
  ["variance", "varianza"],
  ["Variance", "Varianza"],
  ["correlation", "correlación"],
  ["Correlation", "Correlación"],
  ["estimator", "estimador"],
  ["Estimator", "Estimador"],
  ["scenario", "escenario"],
  ["Scenario", "Escenario"],
  ["scenarios", "escenarios"],
  ["Scenarios", "Escenarios"],
  ["assumptions", "supuestos"],
  ["Assumptions", "Supuestos"],
  ["limitation", "limitación"],
  ["limitation", "limitación"],
  ["limitations", "limitaciones"],
  ["Limitations", "Limitaciones"],
  ["inputs", "inputs"],
  ["Inputs", "Inputs"],
  ["method", "método"],
  ["Method", "Método"],
  ["source", "fuente"],
  ["Source", "Fuente"],
  ["sources", "fuentes"],
  ["Sources", "Fuentes"],
  ["quote", "cotización"],
  ["Quote", "Cotización"],
  ["desk", "mesa"],
  ["Desk", "Mesa"],
  ["workflow", "flujo de trabajo"],
  ["Workflow", "Flujo de trabajo"],
  ["data", "datos"],
  ["Data", "Datos"],
  ["price", "precio"],
  ["Price", "Precio"],
  ["returns", "retornos"],
  ["Returns", "Retornos"],
  ["hedge", "cobertura"],
  ["Hedge", "Cobertura"],
];

function replacePhrase(value: string): string {
  return phrases.reduce((current, [source, target]) => current.replaceAll(source, target), value);
}

export function localizeAcademyText(value: string, locale: Locale): string {
  return locale === "en" ? value : replacePhrase(value);
}

const map = (items: string[], locale: Locale): string[] => items.map((item) => localizeAcademyText(item, locale));

type SpanishProfile = { title: string; subtitle: string; focus: string; market: string; desk: string };

const spanishProfiles: Record<string, SpanishProfile> = {
  "vol-realized": { title: "Volatilidad realizada", subtitle: "Medición reproducible de la dispersión observada en una trayectoria de precios", focus: "la elección del estimador, la ventana, el reloj de muestreo y la anualización", market: "límites de riesgo, swaps de varianza, volatility targeting y validación de modelos", desk: "riesgo de estimación, saltos, cambio de régimen y sesgo de muestreo" },
  "vol-realized-implied": { title: "Volatilidad realizada frente a implícita", subtitle: "Separación entre una estimación histórica y una coordenada prospectiva extraída del precio de opciones", focus: "la comparación de varianza física y neutral al riesgo sobre horizontes exactamente alineados", market: "carry de volatilidad, prima de riesgo de varianza y backtesting de opciones", desk: "gap risk, convexidad corta, skew y costes de roll" },
  "vol-implied": { title: "Volatilidad implícita", subtitle: "Inversión numérica del precio de una opción bajo convenciones explícitas", focus: "la existencia, unicidad, acotación y estabilidad de la raíz que reproduce la prima observada", market: "cotización comparable de opciones, interpolación de sonrisas y control de calidad", desk: "vega, bid/offer, residuo numérico y coherencia de inputs" },
  "vol-smile": { title: "Sonrisa y skew de volatilidad", subtitle: "Lectura de la forma distributiva contenida en los precios relativos por strike", focus: "moneyness forward, pendiente, convexidad y ausencia de arbitraje butterfly", market: "risk reversals, butterflies, digitales, barreras y valor relativo", desk: "alas poco líquidas, dinámica sticky y convexidad en espacio de precios" },
  "vol-term": { title: "Estructura temporal de volatilidad", subtitle: "Distribución de incertidumbre, eventos y varianza total entre vencimientos", focus: "varianza total, forward variance y consistencia calendario", market: "event risk, calendar spreads, roll-down y cobertura por tenor", desk: "inversión de plazos, interpolación y desplazamiento de eventos" },
  "vol-surface": { title: "Superficie de volatilidad implícita", subtitle: "Construcción conjunta de strike y vencimiento con controles estáticos de arbitraje", focus: "la limpieza de cotizaciones, la parametrización de varianza total y la validación de alas y calendarios", market: "marking de vanillas, calibración de exóticos y agregación de riesgo por buckets", desk: "datos dispersos, extrapolación, forward skew y estabilidad entre snapshots" },
  "vol-local": { title: "Volatilidad local", subtitle: "Difusión dependiente del estado que reproduce una superficie vanilla bajo supuestos precisos", focus: "la relación de Dupire entre precios, derivadas de la superficie y varianza instantánea", market: "valoración de barreras, cliquets y escenarios con smile", desk: "derivadas numéricas, regularización y dinámica de cobertura spot-driven" },
  "vol-stochastic": { title: "Volatilidad estocástica", subtitle: "Dinámica conjunta del subyacente y un factor aleatorio de varianza", focus: "correlación spot-vol, mean reversion, vol-of-vol y positividad de la varianza", market: "smile dinámica, exóticos, forward skew y riesgo de varianza", desk: "parámetros no identificados, discretización y riesgo de correlación" },
  "vol-heston": { title: "Modelo de Heston", subtitle: "Varianza CIR, correlación y valoración por Fourier con diagnóstico de calibración", focus: "la función característica, la condición de Feller y la estabilidad de integración", market: "calibración de superficies, valoración semi-analítica y escenarios de smile", desk: "vol-of-vol, correlación, mean reversion y riesgo de integración" },
  "vol-sabr": { title: "SABR", subtitle: "Dinámica de sonrisa forward mediante backbone, correlación y vol-of-vol", focus: "las convenciones normal, lognormal y shifted junto con los límites ATM de la expansión", market: "caps, floors, swaptions y opciones sobre forwards", desk: "identificabilidad de beta, estabilidad de parámetros y error asintótico" },
  "vol-calibration": { title: "Calibración de modelos de volatilidad", subtitle: "Conversión de cotizaciones en parámetros con residuos, condicionamiento y gobernanza", focus: "la función objetivo, los pesos, las restricciones, el Jacobiano y la identificación", market: "cestas de calibración, superficies, modelos estocásticos y modelos proxy", desk: "mínimos locales, saltos de parámetros, unidades y fallback operativo" },
  "vol-higher-risk": { title: "Vega, vanna y volga", subtitle: "Geometría local del P&L de volatilidad más allá del primer orden", focus: "unidades de griegas, términos cruzados spot-vol y curvatura de volatilidad", market: "explicación de P&L, cobertura de superficies y stress de libros de opciones", desk: "vega por buckets, vanna, volga, bumps y recalibración" },
};

export function localizeAcademyLesson(lesson: AcademyLesson, locale: Locale): AcademyLesson {
  if (locale === "en") return lesson;
  const profile = spanishProfiles[lesson.id] ?? { title: localizeAcademyText(lesson.title, locale), subtitle: `Tratamiento cuantitativo profesional de ${localizeAcademyText(lesson.title, locale).toLowerCase()}`, focus: "las convenciones, los supuestos, el cálculo y su validación", market: "valoración, riesgo y análisis cuantitativo", desk: "riesgo de modelo, datos y ejecución" };
  const objectiveVerbs = ["Definir", "Derivar", "Implementar", "Diagnosticar"];
  return {
    ...lesson,
    title: profile.title,
    subtitle: profile.subtitle,
    prerequisites: lesson.prerequisites.map((item) => localizeAcademyText(item, locale)),
    learningObjectives: lesson.learningObjectives.map((_, index) => `${objectiveVerbs[index] ?? "Evaluar"} ${profile.focus} con unidades, convenciones y límites explícitos.`),
    tags: map(lesson.tags, locale),
    intuition: {
      lead: `${profile.title} exige separar el dato observable, la variable de estado y la convención que conecta ambos. El objetivo es comprender ${profile.focus} antes de seleccionar el método numérico.`,
      points: [
        "La cotización y el resultado del modelo son objetos distintos y deben conservar su procedencia.",
        "Las unidades, el horizonte y la convención forman parte del valor, no son metadatos opcionales.",
        "Un buen ajuste estático no garantiza una dinámica de cobertura realista ni estabilidad fuera de muestra.",
      ],
    },
    marketContext: {
      why: `${profile.title} se utiliza en ${profile.market}. La lectura profesional requiere distinguir observación, cálculo y juicio de modelo.`,
      instruments: lesson.marketContext.instruments.map((item) => localizeAcademyText(item, locale)),
      quoteConvention: "Declare siempre subyacente o forward, strike o delta, vencimiento, moneda, unidad de volatilidad, base temporal, timestamp y fuente de la cotización.",
    },
    mathematics: {
      notation: lesson.mathematics.notation.map((item) => `${item.split(":")[0]}: variable definida bajo las convenciones y unidades de esta lección.`),
      formulas: lesson.mathematics.formulas.map((formula, index) => ({ ...formula, label: ["Relación principal", "Condición de consistencia", "Diagnóstico de riesgo"][index] ?? `Relación ${index + 1}`, interpretation: `Esta expresión formaliza ${profile.focus}; debe evaluarse únicamente dentro de su dominio financiero y numérico.` })),
    },
    derivation: {
      title: `Derivación controlada de ${profile.title.toLowerCase()}`,
      introduction: `La derivación conserva explícitamente la convención de cotización, el dominio de los inputs y la unidad del resultado. Cada paso debe poder contrastarse con un límite analítico o un test numérico.`,
      steps: lesson.derivation.steps.map((step, index) => ({
        ...step,
        title: ["Fijar el estado y las convenciones", "Plantear la relación matemática", "Aplicar el supuesto del modelo", "Obtener el resultado operativo", "Validar límites y estabilidad"][index] ?? `Paso ${index + 1}`,
        body: [
          `Identifique inputs observables, parámetros, horizonte y unidad antes de transformar los datos.`,
          `Escriba la relación en variables coherentes y mantenga visibles descuento, carry y medida de probabilidad cuando sean relevantes.`,
          `Aplique únicamente los supuestos declarados; cualquier simplificación debe quedar etiquetada como educativa.`,
          `Calcule la magnitud requerida y devuelva también residuos, condicionamiento o sensibilidad cuando el método sea inverso o calibrado.`,
          `Compruebe dominios, casos límite, invariantes y estabilidad frente a perturbaciones pequeñas antes de usar el resultado.`,
        ][index] ?? `Verifique este paso contra las convenciones de ${profile.title.toLowerCase()}.`,
        check: step.check ? "Comprobación obligatoria: unidades, dominio, límite analítico y tolerancia numérica." : undefined,
      })),
      conclusion: `El resultado es utilizable solo si ${profile.focus} quedan documentados junto con los diagnósticos y las limitaciones.`,
    },
    pricing: {
      method: `Construya el cálculo desde datos limpios, valide dominios y conserve diagnósticos reproducibles. En ${profile.title.toLowerCase()}, el método debe separar interpolación, extrapolación y supuestos dinámicos.`,
      calibration: `Cuando exista calibración, use cotizaciones con timestamp y bid/offer, pesos documentados, restricciones explícitas, múltiples puntos iniciales y validación temporal de parámetros.`,
      limitations: ["El resultado depende de la convención, la calidad de datos y el dominio de calibración.", "Un ajuste preciso hoy no identifica por sí solo la dinámica futura.", "La extrapolación y los escenarios extremos requieren límites y fallback independientes."],
    },
    implementation: {
      ...lesson.implementation,
      architecture: ["Validar dominios y unidades en la frontera.", "Mantener el kernel numérico determinista e independiente de React.", "Devolver diagnósticos junto al valor.", "Testear referencias analíticas, invariantes y fallos esperados."],
      quantLib: lesson.implementation.quantLib ? "QuantLib separa estructuras de mercado, procesos, instrumentos, motores y helpers de calibración. Utilice esas abstracciones después de fijar convenciones y tests propios." : undefined,
      pythonLab: {
        ...lesson.implementation.pythonLab,
        title: `Implementación reproducible de ${profile.title.toLowerCase()}`,
        objective: `Ejecutar un ejemplo determinista con validación de inputs, referencia numérica y comprobaciones explícitas.`,
        output: ["Resultado determinista expresado en las unidades declaradas."],
        checks: ["Inputs finitos y dentro del dominio financiero.", "Unidades y convenciones documentadas.", "Referencia o invariante numérico verificado."],
      },
    },
    interactiveLabs: lesson.interactiveLabs.map((lab) => ({ ...lab, title: `Laboratorio de ${profile.title.toLowerCase()}`, description: `Modifique el escenario y observe cómo cambian el estado, la salida y los diagnósticos sin introducir datos de mercado no declarados.` })),
    frontOffice: {
      quote: `La cifra solo es profesional cuando viaja con su convención, procedencia y riesgo de modelo.`,
      inputs: ["cotizaciones con timestamp y fuente", "convención y unidad", "curvas, carry y calendario", "parámetros y restricciones", "política de fallback"],
      calibration: `Calibre únicamente dentro del universo líquido y conserve residuos, estabilidad temporal, parámetros activos y decisión de aceptación.`,
      risk: profile.desk.split(", ").map((item) => item.trim()),
      workflow: ["congelar el snapshot", "validar y normalizar inputs", "calcular o calibrar", "inspeccionar diagnósticos", "aprobar o activar fallback"],
      productionIssues: ["unidades mezcladas", "timestamp o fuente ausentes", "restricciones silenciosas", "extrapolación no gobernada"],
    },
    macroConnections: lesson.macroConnections.map(() => ({
      title: `Transmisión macro hacia ${profile.title.toLowerCase()}`,
      thesis: `Los shocks de política, crecimiento, liquidez y aversión al riesgo modifican la distribución esperada, la demanda de cobertura y la forma de la superficie.`,
      nodes: [
        { label: "Shock macro", effect: "altera tipos, spot, correlaciones y liquidez" },
        { label: "Demanda de cobertura", effect: "revalora nivel, skew y vencimientos" },
        { label: profile.title, effect: "traduce primas a una coordenada comparable" },
        { label: "Riesgo de mesa", effect: "se cubre, limita y contrasta con escenarios" },
      ],
    })),
    pitfalls: ["Confundir cotización observada con output del modelo.", "Omitir unidades, horizonte o convención.", "Interpretar un ajuste estático como dinámica futura.", "Extrapolar fuera del dominio líquido sin límites ni fallback."],
    references: lesson.references.map((reference) => ({ ...reference, note: "Referencia técnica para contrastar formulación, implementación y validación; la explicación y el código de esta plataforma son originales." })),
  };
}

export function localizeAcademyTrack(track: AcademyTrack, locale: Locale): AcademyTrack {
  if (locale === "en") return track;
  return {
    ...track,
    title: localizeAcademyText(track.title, locale),
    subtitle: localizeAcademyText(track.subtitle, locale),
    description: localizeAcademyText(track.description, locale),
    nodes: track.nodes.map((node) => ({ ...node, title: localizeAcademyText(node.title, locale), stage: localizeAcademyText(node.stage, locale) })),
  };
}
