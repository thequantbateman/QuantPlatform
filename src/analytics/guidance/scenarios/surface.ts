import type { VolSurfaceScenario } from "../../../quant/volatility/volSurface";
import { localizedText as t, type AnalyticsScenario } from "../types";

const surface = (
  sourceId: VolSurfaceScenario,
  name: ReturnType<typeof t>,
  description: ReturnType<typeof t>,
  objective: ReturnType<typeof t>,
  observation: ReturnType<typeof t>,
  interaction: ReturnType<typeof t>,
  explanation: ReturnType<typeof t>,
  difficulty: AnalyticsScenario["difficulty"],
): AnalyticsScenario => ({
  id: `surface-${sourceId}`,
  labId: "volatility-surface",
  sourceId,
  name,
  description,
  learningObjective: objective,
  initialInputs: { scenario: sourceId, phase: sourceId === "base" ? 0 : 1 },
  expectedObservation: observation,
  suggestedInteractions: [interaction],
  explanation,
  modelBoundary: t("This is a deterministic educational surface, not observed market data or an arbitrage-free calibration.", "Es una superficie educativa determinista, no datos de mercado observados ni una calibración libre de arbitraje."),
  difficulty,
  academyHref: "/learn/volatility/volatility-surface",
});

export const surfaceScenarios: readonly AnalyticsScenario[] = [
  surface("base", t("Base smile", "Smile base"), t("Establish the reference state before applying a deformation.", "Establece el estado de referencia antes de aplicar una deformación."), t("Read moneyness, tenor, ATM level, skew and curvature as separate coordinates.", "Leer moneyness, tenor, nivel ATM, skew y curvatura como coordenadas separadas."), t("The downside wing is richer under negative skew and longer tenors reflect the positive term slope.", "El ala bajista es más cara con skew negativo y los plazos largos reflejan la pendiente temporal positiva."), t("Select the one-year ATM node, then compare a downside wing at the same tenor.", "Selecciona el nodo ATM a un año y compáralo con un ala bajista al mismo plazo."), t("ATM sets the level, skew tilts log-moneyness, curvature lifts both wings and term slope changes tenor.", "ATM fija el nivel, skew inclina el log-moneyness, curvatura eleva ambas alas y la pendiente temporal cambia el plazo."), "foundation"),
  surface("spot-crash", t("Spot crash", "Caída de spot"), t("Move spot down while the educational surface deforms.", "Mueve el spot a la baja mientras se deforma la superficie educativa."), t("Connect a spot sell-off with stronger downside skew and changing strike moneyness.", "Conectar una caída de spot con mayor skew bajista y cambio de moneyness por strike."), t("Fixed strikes migrate in moneyness and downside implied volatility rises.", "Los strikes fijos migran en moneyness y sube la volatilidad implícita bajista."), t("Play the scenario, pause halfway and compare the selected strike before and after.", "Reproduce el escenario, pausa a mitad y compara el strike seleccionado antes y después."), t("A sticky coordinate choice determines how a surface moves when spot changes; this scenario makes one controlled choice explicit.", "Una elección de coordenadas sticky determina cómo se mueve la superficie al cambiar spot; este escenario hace explícita una elección controlada."), "practitioner"),
  surface("vol-spike", t("Parallel volatility spike", "Salto paralelo de volatilidad"), t("Raise the volatility level across the grid.", "Eleva el nivel de volatilidad en toda la rejilla."), t("Separate a level shock from skew, curvature and term-structure changes.", "Separar un shock de nivel de cambios en skew, curvatura y estructura temporal."), t("Most nodes rise while relative smile shape remains broadly recognizable.", "La mayoría de nodos sube mientras la forma relativa del smile sigue siendo reconocible."), t("Compare ATM nodes across three tenors before changing curvature.", "Compara nodos ATM en tres plazos antes de cambiar curvatura."), t("A parallel vega shock is a coordinate experiment; real surfaces typically move non-parallel and recalibrate.", "Un shock paralelo de vega es un experimento de coordenadas; las superficies reales suelen moverse de forma no paralela y recalibrarse."), "foundation"),
  surface("term-inversion", t("Term inversion", "Inversión temporal"), t("Make short implied volatility exceed the long end.", "Haz que la volatilidad implícita corta supere al tramo largo."), t("Identify a calendar deformation independently from smile skew.", "Identificar una deformación de calendario independiente del skew del smile."), t("Short-tenor ATM volatility rises above longer-tenor ATM volatility.", "La volatilidad ATM de corto plazo supera a la de plazos más largos."), t("Switch to the term slice and inspect the ATM column.", "Cambia al corte temporal e inspecciona la columna ATM."), t("Term structure reflects horizon-specific variance expectations; it is not the same object as spot-direction skew.", "La estructura temporal refleja expectativas de varianza por horizonte; no es el mismo objeto que el skew direccional de spot."), "practitioner"),
  surface("skew-steepening", t("Skew steepening", "Aumento del skew"), t("Increase the downside-upside volatility difference.", "Aumenta la diferencia de volatilidad entre ala bajista y alcista."), t("Read directional tail pricing separately from the ATM level.", "Leer el precio direccional de colas por separado del nivel ATM."), t("Downside nodes rise relative to symmetric upside nodes while ATM changes less.", "Los nodos bajistas suben frente a nodos alcistas simétricos mientras ATM cambia menos."), t("Use the smile slice and compare equal absolute log-moneyness points.", "Usa el corte de smile y compara puntos con igual log-moneyness absoluto."), t("Negative skew is the first derivative of implied volatility in log-moneyness; curvature is a separate second-order shape control.", "El skew negativo es la primera derivada de la volatilidad implícita respecto al log-moneyness; la curvatura es un control de forma de segundo orden distinto."), "front-office"),
  surface("normalization", t("Normalization", "Normalización"), t("Return a stressed surface toward the reference state.", "Devuelve una superficie estresada hacia el estado de referencia."), t("Observe mean reversion as a scenario path, not a forecast.", "Observar reversión a la media como trayectoria de escenario, no como previsión."), t("Level and shape converge toward the base parameters as phase advances.", "Nivel y forma convergen hacia los parámetros base al avanzar la fase."), t("Pause at two phases and compare the numeric table, not only color.", "Pausa en dos fases y compara la tabla numérica, no solo el color."), t("A normalization path is a controlled interpolation between states; it has no estimated transition probability.", "Una trayectoria de normalización es una interpolación controlada entre estados; no tiene una probabilidad de transición estimada."), "practitioner"),
];

