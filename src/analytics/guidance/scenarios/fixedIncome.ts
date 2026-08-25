import { localizedText as t, type AnalyticsScenario } from "../types";

export type FixedIncomeScenarioId =
  | "government-term-structure"
  | "corporate-g-to-z"
  | "benchmark-government-vs-swap"
  | "spread-widening"
  | "rate-vs-credit"
  | "curve-steepener"
  | "asset-swap"
  | "carry-rolldown";

const scenario = (
  sourceId: FixedIncomeScenarioId,
  id: string,
  name: ReturnType<typeof t>,
  description: ReturnType<typeof t>,
  objective: ReturnType<typeof t>,
  initialInputs: Record<string, number | string | boolean>,
  observation: ReturnType<typeof t>,
  interactions: readonly ReturnType<typeof t>[],
  explanation: ReturnType<typeof t>,
  boundary: ReturnType<typeof t>,
  difficulty: AnalyticsScenario["difficulty"],
  academyHref: string,
): AnalyticsScenario => ({ id, sourceId, labId: "fixed-income", name, description, learningObjective: objective, initialInputs, expectedObservation: observation, suggestedInteractions: interactions, explanation, modelBoundary: boundary, difficulty, academyHref });

export const fixedIncomeScenarios: readonly AnalyticsScenario[] = [
  scenario(
    "government-term-structure", "fixed-income-government-term-structure",
    t("Government bond · term structure", "Bono soberano · estructura temporal"),
    t("Price one coupon schedule with dated discount factors before introducing credit spread.", "Valora un calendario de cupones con factores de descuento fechados antes de introducir spread de crédito."),
    t("Separate one summary YTM from cash-flow-aware curve valuation.", "Separar un YTM resumen de la valoración por curva sensible a cada flujo."),
    { bondPreset: "government", benchmark: "government", mode: "bond", rateShiftBps: 0, spreadShiftBps: 0 },
    t("YTM discounts every payment at one internal rate; the zero curve assigns a different discount factor to every payment date.", "El YTM descuenta cada pago a un único tipo interno; la curva cero asigna un factor distinto a cada fecha."),
    [t("Select a coupon in the cash-flow timeline.", "Selecciona un cupón en la línea temporal."), t("Compare its discount factor and PV with the YTM price.", "Compara su factor de descuento y VA con el precio por YTM.")],
    t("The bond price is the sum of dated present values. YTM is the periodic rate that reproduces that total, not the term structure used by an arbitrage-free engine.", "El precio es la suma de valores actuales fechados. El YTM es el tipo periódico que reproduce ese total, no la estructura temporal de un motor sin arbitraje."),
    t("The schedule uses regular ACT/365-like educational year fractions and excludes holiday calendars, settlement lags and instrument-specific tax treatment.", "El calendario usa fracciones educativas regulares tipo ACT/365 y excluye festivos, lags de liquidación y fiscalidad específica."),
    "foundation", "/learn/rates/discount-factors",
  ),
  scenario(
    "corporate-g-to-z", "fixed-income-corporate-g-to-z",
    t("Corporate bond · G-spread to Z-spread", "Bono corporativo · de G-spread a Z-spread"),
    t("Compare a yield spread with the constant spread that actually reprices every cash flow.", "Compara un spread de rentabilidad con el spread constante que revalora cada flujo."),
    t("Explain why G-spread and Z-spread answer different questions for the same bond.", "Explicar por qué G-spread y Z-spread responden preguntas distintas para el mismo bono."),
    { bondPreset: "corporate", benchmark: "government", mode: "spreads", rateShiftBps: 0, spreadShiftBps: 0 },
    t("G-spread uses two summarized yields; Z-spread shifts the benchmark discount curve until the full schedule matches market dirty price.", "G-spread usa dos rentabilidades resumidas; Z-spread desplaza la curva de descuento hasta igualar el precio dirty de mercado."),
    [t("Inspect G-spread, then activate the zero-curve overlay.", "Inspecciona G-spread y activa después la superposición de curva cero."), t("Select a long-dated cash flow and compare its shifted discount factor.", "Selecciona un flujo largo y compara su factor desplazado.")],
    t("A non-flat curve makes the yield comparison and cash-flow calibration diverge. The difference is structure, not a numerical error.", "Una curva no plana separa la comparación de yields de la calibración por flujos. La diferencia es estructura, no un error numérico."),
    t("The Z-spread is continuously compounded over one deterministic benchmark curve and assumes fixed cash flows.", "El Z-spread es continuo sobre una curva determinista y asume flujos fijos."),
    "practitioner", "/learn/rates/zero-and-forward-rates",
  ),
  scenario(
    "benchmark-government-vs-swap", "fixed-income-benchmark-change",
    t("Benchmark change · government vs swap", "Cambio de benchmark · soberano frente a swap"),
    t("Keep the bond unchanged and change only the ruler used for relative value.", "Mantén el bono sin cambios y cambia solo la regla usada para valor relativo."),
    t("Make benchmark dependence visible through G-spread and I-spread.", "Hacer visible la dependencia del benchmark mediante G-spread e I-spread."),
    { bondPreset: "corporate", benchmark: "swap", mode: "spreads", rateShiftBps: 0, spreadShiftBps: 0 },
    t("The bond YTM stays fixed while the benchmark yield changes, so the reported spread changes without any bond-price move.", "El YTM del bono queda fijo mientras cambia la rentabilidad benchmark; el spread cambia sin movimiento del bono."),
    [t("Toggle Government and Swap benchmarks.", "Alterna benchmarks soberano y swap."), t("Move the swap-government basis and watch I-spread versus G-spread.", "Mueve la base swap-soberano y observa I-spread frente a G-spread.")],
    t("A spread is a relative measure. The bond did not move; the ruler did.", "Un spread es una medida relativa. El bono no se movió; cambió la regla."),
    t("Displayed G/I conventions use interpolated benchmark zero/par proxies; vendor conventions and instrument sets can differ.", "Las convenciones G/I mostradas usan proxies cero/par interpolados; proveedores e instrumentos pueden diferir."),
    "practitioner", "/learn/rates/interest-rate-swaps",
  ),
  scenario(
    "spread-widening", "fixed-income-spread-widening",
    t("Spread widening · credit repricing", "Ampliación de spread · revaloración de crédito"),
    t("Hold the benchmark curve fixed and widen only the calibrated bond spread.", "Mantén fija la curva benchmark y amplía solo el spread calibrado."),
    t("Separate CS01/spread duration from benchmark DV01.", "Separar CS01/duración de spread de DV01 benchmark."),
    { bondPreset: "corporate", benchmark: "government", mode: "risk", rateShiftBps: 0, spreadShiftBps: 50 },
    t("Price falls through spread discounting while the benchmark contribution remains zero.", "El precio cae por descuento de spread mientras la contribución benchmark permanece en cero."),
    [t("Compare +10bp, +25bp and +50bp spread shocks.", "Compara shocks de spread de +10, +25 y +50 pb."), t("Compare Taylor spread-duration P&L with full repricing.", "Compara P&L por duración de spread con revaloración completa.")],
    t("The benchmark is unchanged. This P&L comes from spread risk; curvature creates the gap between local approximation and full repricing.", "El benchmark no cambia. Este P&L procede del riesgo de spread; la curvatura genera la diferencia entre aproximación local y revaloración."),
    t("Spread risk is a deterministic parallel Z-spread shock, not a default-probability or recovery model.", "El riesgo de spread es un shock paralelo determinista de Z-spread, no un modelo de probabilidad de default o recuperación."),
    "practitioner", "/learn/rates/curve-risk",
  ),
  scenario(
    "rate-vs-credit", "fixed-income-rate-vs-credit",
    t("Rate shock vs credit shock", "Shock de tipos frente a shock de crédito"),
    t("Shock benchmark and spread independently, then reconcile combined P&L.", "Shockea benchmark y spread por separado y reconcilia el P&L combinado."),
    t("Read benchmark DV01, CS01 and interaction as distinct full-repricing contributions.", "Leer DV01 benchmark, CS01 e interacción como contribuciones distintas de revaloración."),
    { bondPreset: "corporate", benchmark: "government", mode: "risk", rateShiftBps: 25, spreadShiftBps: 50 },
    t("Both shocks lower price; their nonlinear interaction closes the exact P&L reconciliation.", "Ambos shocks reducen precio; su interacción no lineal cierra la reconciliación exacta de P&L."),
    [t("Select the zero/zero heatmap cell as base.", "Selecciona la celda cero/cero como base."), t("Compare pure-rate, pure-spread and joint cells.", "Compara celdas de solo tipos, solo spread y conjunta.")],
    t("A bond owns at least two rulers of risk: benchmark discounting and issuer spread. The heatmap makes the independent axes explicit.", "Un bono tiene al menos dos reglas de riesgo: descuento benchmark y spread del emisor. El mapa hace explícitos ambos ejes."),
    t("The decomposition excludes stochastic correlation, migration/default jumps and liquidity repricing.", "La descomposición excluye correlación estocástica, saltos de migración/default y revaloración de liquidez."),
    "front-office", "/learn/rates/curve-risk",
  ),
  scenario(
    "curve-steepener", "fixed-income-curve-steepener",
    t("Curve steepener · key-rate profile", "Steepener de curva · perfil key-rate"),
    t("Move short and long benchmark nodes in opposite directions and inspect bucketed risk.", "Mueve nodos cortos y largos en direcciones opuestas e inspecciona el riesgo por buckets."),
    t("Distinguish curve direction from curve shape and notional from DV01 neutrality.", "Distinguir dirección de forma de curva y nominal de neutralidad DV01."),
    { bondPreset: "corporate", benchmark: "government", mode: "curve", curveScenario: "steepener", curveShockBps: 25 },
    t("P&L follows the bond's key-rate concentration, not the average rate move or equal notional assumption.", "El P&L sigue la concentración key-rate del bono, no el movimiento medio ni nominales iguales."),
    [t("Switch Parallel to Steepener and Flattener.", "Cambia Paralelo por Steepener y Flattener."), t("Inspect which KRD bucket dominates the trade ratio.", "Inspecciona qué bucket KRD domina la ratio de la operación.")],
    t("Rates falling or rising describes direction; steepening or flattening describes shape. Check KRD before calling a trade neutral.", "Tipos al alza o a la baja describen dirección; steepening o flattening describen forma. Revisa KRD antes de llamar neutral a la operación."),
    t("Node bumps use the displayed zero-curve interpolation and are not quote-space recalibrations of liquid instruments.", "Los bumps de nodo usan la interpolación cero mostrada y no recalibran instrumentos líquidos en espacio de cotizaciones."),
    "front-office", "/learn/rates/curve-risk",
  ),
  scenario(
    "asset-swap", "fixed-income-asset-swap",
    t("Asset swap · fixed to floating economics", "Asset swap · economía fija a flotante"),
    t("Combine a fixed bond with a discounted swap annuity instead of subtracting two yields.", "Combina un bono fijo con una anualidad swap descontada en lugar de restar dos yields."),
    t("Interpret ASW as a par package spread under explicit curve and schedule assumptions.", "Interpretar ASW como spread de un paquete par bajo curva y calendario explícitos."),
    { bondPreset: "corporate", benchmark: "swap", mode: "spreads", spreadMeasure: "asw" },
    t("The fixed coupon is transformed into floating economics plus ASW; issuer spread risk remains.", "El cupón fijo se transforma en economía flotante más ASW; el riesgo del emisor permanece."),
    [t("Compare benchmark bond PV with market dirty price.", "Compara VA del bono benchmark con precio dirty de mercado."), t("Inspect par swap rate and fixed-leg annuity.", "Inspecciona tipo swap par y anualidad fija.")],
    t("ASW is the discounted benchmark-value difference divided by the swap annuity. It is not generally bond YTM minus swap rate.", "ASW es la diferencia de valor benchmark descontada dividida por la anualidad swap. No es, en general, YTM menos tipo swap."),
    t("The lab uses a single-curve, matched-schedule par asset swap without funding, repo, collateral optionality or transaction costs.", "El laboratorio usa un asset swap par de calendario alineado y curva única, sin funding, repo, opcionalidad de colateral ni costes."),
    "front-office", "/learn/rates/interest-rate-swaps",
  ),
  scenario(
    "carry-rolldown", "fixed-income-carry-rolldown",
    t("Carry + rolldown · unchanged curves", "Carry + rolldown · curvas sin cambios"),
    t("Advance the holding clock while preserving today's benchmark and issuer spread curves.", "Avanza el horizonte manteniendo las curvas actuales de benchmark y spread."),
    t("Decompose coupon/pull-to-par, curve roll, spread roll and funding under one conditional scenario.", "Descomponer cupón/pull-to-par, roll de curva, roll de spread y funding bajo un escenario condicional."),
    { bondPreset: "corporate", benchmark: "government", mode: "carry", horizon: 0.5, fundingRate: 0.03 },
    t("The bond moves to shorter curve coordinates; coupon carry can be offset by adverse curve shape, spread roll or funding.", "El bono pasa a coordenadas más cortas; el carry de cupón puede verse compensado por forma de curva, roll de spread o funding."),
    [t("Move the horizon from three to twelve months.", "Mueve el horizonte de tres a doce meses."), t("Steepen the credit curve and increase funding.", "Empina la curva de crédito y aumenta funding.")],
    t("Rolldown is not free money. It is a conditional unchanged-curve experiment whose assumptions can fail before the horizon.", "El rolldown no es dinero gratis. Es un experimento condicional de curva sin cambios cuyos supuestos pueden fallar antes del horizonte."),
    t("No forecast probability is attached; taxes, repo specialness, transaction costs and default are excluded.", "No se asigna probabilidad de previsión; se excluyen impuestos, repo special, costes y default."),
    "front-office", "/learn/rates/curve-risk",
  ),
];
