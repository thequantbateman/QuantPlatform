import type { ContentEntry, ContentType } from "./types";
import type { Locale } from "@/src/i18n";

export type LegacyNarrativeProfile = "concept" | "model" | "instrument" | "method" | "market-note" | "research";

export interface LegacyNarrativeSection {
  id: "intuition" | "mathematics" | "assumptions" | "market" | "desk" | "related";
  label: string;
  title: string;
}

export interface LegacyNarrative {
  profile: LegacyNarrativeProfile;
  tocLabel: string;
  sections: LegacyNarrativeSection[];
}

const profileByType: Record<ContentType, LegacyNarrativeProfile> = {
  concept: "concept",
  model: "model",
  instrument: "instrument",
  method: "method",
  lab: "method",
  "market-note": "market-note",
  research: "research",
};

const labels = {
  en: ["Intuition", "Mathematics", "Assumptions", "Market use", "Desk view", "Related"],
  es: ["Intuición", "Matemáticas", "Supuestos", "Uso de mercado", "Vista de mesa", "Relacionados"],
} as const;

const titles: Record<LegacyNarrativeProfile, { en: string[]; es: string[] }> = {
  concept: {
    en: ["Name the object before manipulating it.", "State the governing relationship.", "Draw the boundary of the claim.", "Connect the definition to an observable.", "Translate the concept into a risk question.", "Follow the nearest dependency."],
    es: ["Nombra el objeto antes de manipularlo.", "Formula la relación que lo gobierna.", "Delimita el alcance de la afirmación.", "Conecta la definición con un observable.", "Traduce el concepto a una pregunta de riesgo.", "Sigue la dependencia más cercana."],
  },
  model: {
    en: ["Start from the observable dynamics.", "Write the state process and pricing map.", "Identify what the model cannot represent.", "Separate calibration fit from dynamics.", "Challenge the hedge outside the fitted slice.", "Compare the adjacent model family."],
    es: ["Empieza por la dinámica observable.", "Escribe el proceso de estado y el mapa de valoración.", "Identifica lo que el modelo no puede representar.", "Separa el ajuste de calibración de la dinámica.", "Pon a prueba la cobertura fuera del corte calibrado.", "Compara la familia de modelos adyacente."],
  },
  instrument: {
    en: ["Read the contractual cash flows first.", "Express payoff and present value precisely.", "Make conventions part of the contract.", "Locate the quote and replication instruments.", "Map cash-flow changes into hedge risk.", "Continue to the nearest instrument or model."],
    es: ["Lee primero los flujos contractuales.", "Expresa con precisión el pago y su valor actual.", "Haz que las convenciones formen parte del contrato.", "Localiza la cotización y los instrumentos de réplica.", "Convierte cambios de flujos en riesgo de cobertura.", "Continúa hacia el instrumento o modelo más cercano."],
  },
  method: {
    en: ["Define the numerical question and error budget.", "Specify the estimator or discretization.", "Expose convergence and stability conditions.", "Connect controls to an observable output.", "Monitor bias, variance, and failure modes.", "Choose the next implementation dependency."],
    es: ["Define la pregunta numérica y el presupuesto de error.", "Especifica el estimador o la discretización.", "Expón las condiciones de convergencia y estabilidad.", "Conecta los controles con un resultado observable.", "Vigila sesgo, varianza y modos de fallo.", "Elige la siguiente dependencia de implementación."],
  },
  "market-note": {
    en: ["Begin with the executable market object.", "Make the quote arithmetic explicit.", "Record venue, timestamp, and convention.", "Distinguish observation from inference.", "Ask what can actually be traded or hedged.", "Inspect the connected market state."],
    es: ["Empieza por el objeto de mercado ejecutable.", "Haz explícita la aritmética de cotización.", "Registra mercado, hora y convención.", "Distingue observación de inferencia.", "Pregunta qué puede negociarse o cubrirse realmente.", "Inspecciona el estado de mercado conectado."],
  },
  research: {
    en: ["State the empirical or computational motivation.", "Expose the proposed mathematical object.", "Separate evidence from modelling choice.", "Define a falsifiable validation target.", "Treat governance as part of the method.", "Trace the nearest established baseline."],
    es: ["Expón la motivación empírica o computacional.", "Presenta el objeto matemático propuesto.", "Separa la evidencia de la elección de modelización.", "Define un objetivo de validación falsable.", "Trata la gobernanza como parte del método.", "Rastrea el punto de referencia consolidado más cercano."],
  },
};

export function legacyNarrativeForEntry(entry: ContentEntry, locale: Locale): LegacyNarrative {
  const profile = profileByType[entry.type];
  const sectionIds: LegacyNarrativeSection["id"][] = ["intuition", "mathematics", "assumptions", "market", "desk", "related"];
  return {
    profile,
    tocLabel: locale === "es" ? "EN ESTA NOTA" : "IN THIS NOTE",
    sections: sectionIds.map((id, index) => ({ id, label: labels[locale][index], title: titles[profile][locale][index] })),
  };
}
