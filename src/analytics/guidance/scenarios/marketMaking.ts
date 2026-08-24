import type { MarketMakingMissionId } from "../../../quant/market-making/missions";
import { localizedText as t, type AnalyticsScenario } from "../types";

const mission = (
  sourceId: MarketMakingMissionId,
  id: string,
  name: ReturnType<typeof t>,
  description: ReturnType<typeof t>,
  objective: ReturnType<typeof t>,
  observation: ReturnType<typeof t>,
  interactions: readonly ReturnType<typeof t>[],
  explanation: ReturnType<typeof t>,
  boundary: ReturnType<typeof t>,
  difficulty: AnalyticsScenario["difficulty"],
): AnalyticsScenario => ({
  id,
  labId: "market-making",
  sourceId,
  name,
  description,
  learningObjective: objective,
  initialInputs: { missionId: sourceId },
  expectedObservation: observation,
  suggestedInteractions: interactions,
  explanation,
  modelBoundary: boundary,
  difficulty,
  academyHref: "/learn/risk/hedging-pnl-attribution",
});

export const marketMakingScenarios: readonly AnalyticsScenario[] = [
  mission(
    "client-flow",
    "market-making-client-inventory",
    t("Client fill creates dealer inventory", "La operación cliente crea inventario dealer"),
    t("Translate client direction into the dealer's signed option and underlying risk.", "Traduce la dirección del cliente al riesgo firmado del dealer en opción y subyacente."),
    t("Apply the client/dealer sign convention exactly once before reading delta, vega or P&L.", "Aplicar la convención de signo cliente/dealer exactamente una vez antes de leer delta, vega o P&L."),
    t("Buying from the client makes the dealer long the instrument; selling to the client makes the dealer short.", "Comprar al cliente deja al dealer largo del instrumento; venderle lo deja corto."),
    [t("Change client buy to client sell and submit the fill.", "Cambia compra del cliente por venta del cliente y ejecuta."), t("Inspect dealer delta and vega before hedging.", "Inspecciona delta y vega del dealer antes de cubrir.")],
    t("Dealer inventory is the signed negative of the client-facing trade direction after execution. Risk must be aggregated on the dealer book, not on the client ticket label.", "El inventario dealer es el signo opuesto a la dirección de la operación cliente tras ejecutar. El riesgo se agrega sobre la cartera dealer, no sobre la etiqueta del ticket cliente."),
    t("The simulation uses synthetic quotes and simplified execution; it does not model queue position, adverse selection or exchange microstructure.", "La simulación usa cotizaciones sintéticas y ejecución simplificada; no modeliza prioridad de cola, selección adversa ni microestructura de mercado."),
    "foundation",
  ),
  mission(
    "delta-discipline",
    "market-making-hedge-friction",
    t("Hedge inventory, price the friction", "Cubrir inventario, valorar la fricción"),
    t("Reduce dealer delta while charging spread, fees and slippage to the hedge decision.", "Reduce delta del dealer cargando spread, comisiones y slippage a la decisión de cobertura."),
    t("Distinguish risk reduction from economic improvement after explicit transaction costs.", "Distinguir reducción de riesgo de mejora económica tras costes de transacción explícitos."),
    t("Residual delta falls, but the hedge pays crossing and execution costs that reduce marked wealth.", "Delta residual disminuye, pero la cobertura paga cruce y costes de ejecución que reducen la riqueza marcada."),
    [t("Compare no hedge with the proposed delta hedge.", "Compara sin cobertura con la cobertura delta propuesta."), t("Increase spread or slippage and replay the same hedge.", "Aumenta spread o slippage y repite la misma cobertura." )],
    t("The hedge quantity targets local delta. Executed price and fees enter cash once; marked inventory then reconciles cash plus market value.", "La cantidad de cobertura apunta a delta local. Precio ejecutado y comisiones entran una vez en caja; el inventario marcado reconcilia después caja más valor de mercado."),
    t("A single snapshot omits latency, market impact, inventory limits and future rehedging; lower delta is not automatically better P&L.", "Una instantánea omite latencia, impacto, límites de inventario y futuras coberturas; menor delta no implica automáticamente mejor P&L."),
    "practitioner",
  ),
  mission(
    "cross-effects",
    "market-making-cross-hedge",
    t("Cross hedge under basis risk", "Cobertura cruzada bajo riesgo de base"),
    t("Use a correlated but non-identical hedge and inspect what the headline delta misses.", "Usa una cobertura correlacionada pero no idéntica e inspecciona lo que delta agregada no muestra."),
    t("Recognize residual basis, vanna, volga and charm after an apparently effective first-order hedge.", "Reconocer base residual, vanna, volga y charm tras una cobertura de primer orden aparentemente efectiva."),
    t("Immediate delta can improve while joint spot/volatility diagnostics and basis mismatch remain.", "Delta inmediata puede mejorar mientras persisten diagnósticos conjuntos spot/volatilidad y desajuste de base."),
    [t("Apply a joint spot and volatility shock.", "Aplica un shock conjunto de spot y volatilidad."), t("Compare exact repricing with local and higher-order attribution.", "Compara revaloración exacta con atribución local y de orden superior." )],
    t("A cross hedge projects risk onto another instrument. Correlation and beta are state-dependent, so residual P&L contains basis and cross-Greek terms.", "Una cobertura cruzada proyecta riesgo sobre otro instrumento. Correlación y beta dependen del estado, por lo que el P&L residual contiene base y griegas cruzadas."),
    t("The educational correlation and liquidity assumptions are fixed; they are not forecasts of stressed hedge effectiveness.", "Los supuestos educativos de correlación y liquidez son fijos; no son previsiones de eficacia de cobertura bajo estrés."),
    "front-office",
  ),
];

