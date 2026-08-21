import type { AcademyFormulaDepth, AcademyLabId, AcademyLesson, AcademyNarrativeProfile } from "./types";

type Copy = readonly [en: string, es: string];
type FormulaSeed = { label: Copy; latex: string; interpretation: Copy; depth: AcademyFormulaDepth; analyticsHref?: string };
type StepSeed = { title: Copy; body: Copy; latex?: string; check?: Copy };
type CoreSeed = {
  id: string;
  slug: string;
  domain: AcademyLesson["domain"];
  title: Copy;
  subtitle: Copy;
  level: AcademyLesson["level"];
  minutes: number;
  narrativeProfile: AcademyNarrativeProfile;
  legacyRoutes: string[];
  prerequisites: Copy[];
  prerequisiteLessonIds: string[];
  objectives: Copy[];
  tags: string[];
  lead: Copy;
  points: Copy[];
  why: Copy;
  instruments: Copy[];
  quote: Copy;
  notation: Copy[];
  formulas: FormulaSeed[];
  derivationFormulaIndex: number;
  derivationTitle: Copy;
  derivationIntro: Copy;
  steps: StepSeed[];
  derivationConclusion: Copy;
  method: Copy;
  calibration: Copy;
  limitations: Copy[];
  architecture: Copy[];
  pythonTitle: Copy;
  pythonObjective: Copy;
  pythonCode: string;
  pythonOutput: string[];
  pythonChecks: Copy[];
  labId: AcademyLabId;
  labTitle: Copy;
  labDescription: Copy;
  deskQuote: Copy;
  deskInputs: Copy[];
  deskCalibration: Copy;
  deskRisk: Copy[];
  deskWorkflow: Copy[];
  productionIssues: Copy[];
  macroTitle: Copy;
  macroThesis: Copy;
  macroNodes: Array<{ label: Copy; effect: Copy }>;
  pitfalls: Copy[];
  locator: string;
  related: string[];
};

const c = (en: string, es: string): Copy => [en, es];
const at = (copy: Copy, locale: 0 | 1): string => copy[locale];
const list = (copies: Copy[], locale: 0 | 1): string[] => copies.map((copy) => at(copy, locale));

function build(seed: CoreSeed, locale: 0 | 1): Omit<AcademyLesson, "localized"> {
  const derivationDepth = seed.formulas[seed.derivationFormulaIndex].depth;
  if (derivationDepth !== 2 && derivationDepth !== 3) throw new Error(`${seed.id}: derivation must bind to depth 2 or 3`);
  return {
    id: seed.id,
    slug: seed.slug,
    title: at(seed.title, locale),
    subtitle: at(seed.subtitle, locale),
    domain: seed.domain,
    assetClass: "Foundations",
    level: seed.level,
    prerequisites: list(seed.prerequisites, locale),
    prerequisiteLessonIds: seed.prerequisiteLessonIds,
    learningObjectives: list(seed.objectives, locale),
    tags: seed.tags,
    estimatedMinutes: seed.minutes,
    lastReviewed: "2026-08-21",
    narrativeProfile: seed.narrativeProfile,
    legacyRoutes: seed.legacyRoutes,
    intuition: { lead: at(seed.lead, locale), points: list(seed.points, locale) },
    marketContext: { why: at(seed.why, locale), instruments: list(seed.instruments, locale), quoteConvention: at(seed.quote, locale) },
    mathematics: {
      notation: list(seed.notation, locale),
      formulas: seed.formulas.map((formula) => ({ label: at(formula.label, locale), latex: formula.latex, interpretation: at(formula.interpretation, locale), depth: formula.depth, analyticsHref: formula.analyticsHref })),
    },
    derivation: {
      formulaIndex: seed.derivationFormulaIndex,
      depth: derivationDepth,
      title: at(seed.derivationTitle, locale),
      introduction: at(seed.derivationIntro, locale),
      steps: seed.steps.map((step) => ({ title: at(step.title, locale), body: at(step.body, locale), latex: step.latex, check: step.check ? at(step.check, locale) : undefined })),
      conclusion: at(seed.derivationConclusion, locale),
    },
    pricing: { method: at(seed.method, locale), calibration: at(seed.calibration, locale), limitations: list(seed.limitations, locale) },
    implementation: {
      architecture: list(seed.architecture, locale),
      pythonLab: {
        title: at(seed.pythonTitle, locale),
        objective: at(seed.pythonObjective, locale),
        code: seed.pythonCode,
        output: seed.pythonOutput,
        checks: list(seed.pythonChecks, locale),
      },
    },
    interactiveLabs: [{ id: seed.labId, title: at(seed.labTitle, locale), description: at(seed.labDescription, locale) }],
    frontOffice: {
      quote: at(seed.deskQuote, locale),
      inputs: list(seed.deskInputs, locale),
      calibration: at(seed.deskCalibration, locale),
      risk: list(seed.deskRisk, locale),
      workflow: list(seed.deskWorkflow, locale),
      productionIssues: list(seed.productionIssues, locale),
    },
    macroConnections: [{
      title: at(seed.macroTitle, locale),
      thesis: at(seed.macroThesis, locale),
      nodes: seed.macroNodes.map((node) => ({ label: at(node.label, locale), effect: at(node.effect, locale) })),
    }],
    pitfalls: list(seed.pitfalls, locale),
    references: [{
      sourceId: "oosterlee-grzelak-2020",
      locator: seed.locator,
      url: "https://www.worldscientific.com/worldscibooks/10.1142/q0236",
      note: at(c("The formulation was checked against the cited sections; prose, examples and code are original to the Academy.", "La formulación se contrastó con las secciones citadas; la redacción, los ejemplos y el código son originales de la Academy."), locale),
    }],
    relatedLessonIds: seed.related,
  };
}

const seeds: CoreSeed[] = [
  {
    id: "foundation-distributions",
    slug: "distributions-moments-characteristic-functions",
    domain: "foundations",
    title: c("Distributions, moments & characteristic functions", "Distribuciones, momentos y funciones características"),
    subtitle: c("Describe a payoff law before estimating, transforming, or pricing it.", "Describe la ley de un payoff antes de estimarla, transformarla o valorarla."),
    level: "foundation",
    minutes: 58,
    narrativeProfile: "foundation",
    legacyRoutes: ["/learn/foundations/random-variables"],
    prerequisites: [c("Algebra and elementary calculus", "Álgebra y cálculo elemental"), c("Functions and integration", "Funciones e integración")],
    prerequisiteLessonIds: [],
    objectives: [c("Separate a random variable from its probability law.", "Separar una variable aleatoria de su ley de probabilidad."), c("Compute expectations, variance, and standardized moments with units intact.", "Calcular esperanza, varianza y momentos estandarizados conservando las unidades."), c("Use a characteristic function to recover moments and support transform pricing.", "Usar una función característica para recuperar momentos y sostener valoración por transformadas."), c("Diagnose when sample estimates do not identify a pricing distribution.", "Diagnosticar cuándo los estimadores muestrales no identifican una distribución de valoración.")],
    tags: ["probability", "moments", "characteristic function", "distribution", "academy-v2"],
    lead: c("A random variable maps scenarios to numbers; its law assigns probability to those numbers. Pricing, simulation and risk fail when those two objects—or their measures—are silently conflated.", "Una variable aleatoria asigna números a escenarios; su ley asigna probabilidad a esos números. La valoración, la simulación y el riesgo fallan cuando ambos objetos —o sus medidas— se confunden en silencio."),
    points: [c("Expectation is measure-dependent and carries the units of the variable.", "La esperanza depende de la medida y conserva las unidades de la variable."), c("Variance measures squared dispersion; volatility restores the original unit.", "La varianza mide dispersión al cuadrado; la volatilidad recupera la unidad original."), c("The characteristic function always exists and turns convolution into multiplication.", "La función característica siempre existe y convierte la convolución en multiplicación.")],
    why: c("Terminal payoff laws drive option values, exposure profiles, Monte Carlo estimators, Fourier pricing and tail-risk metrics.", "Las leyes de payoffs terminales determinan valores de opciones, perfiles de exposición, estimadores Monte Carlo, valoración de Fourier y métricas de cola."),
    instruments: [c("European options", "Opciones europeas"), c("digital options", "Opciones digitales"), c("structured payoffs", "Payoffs estructurados"), c("portfolio loss distributions", "Distribuciones de pérdidas de cartera")],
    quote: c("State the probability measure, horizon, currency and whether the object is a return, price, payoff or loss before reporting a moment.", "Declara la medida de probabilidad, el horizonte, la moneda y si el objeto es retorno, precio, payoff o pérdida antes de reportar un momento."),
    notation: [c("X: integrable random variable", "X: variable aleatoria integrable"), c("F_X(x)=P(X≤x): cumulative distribution", "F_X(x)=P(X≤x): distribución acumulada"), c("μ=E[X], σ²=Var(X): first two central summaries", "μ=E[X], σ²=Var(X): dos primeros resúmenes centrales"), c("φ_X(u)=E[e^{iuX}]: characteristic function", "φ_X(u)=E[e^{iuX}]: función característica")],
    formulas: [
      { label: c("Expectation", "Esperanza"), latex: "\\mathbb E[X]=\\int_{\\Omega}X(\\omega)d\\mathbb P(\\omega)=\\int_{\\mathbb R}x\\,dF_X(x)", interpretation: c("The two integrals describe the same average in scenario space and value space.", "Las dos integrales describen el mismo promedio en el espacio de escenarios y en el de valores."), depth: 2 },
      { label: c("Variance", "Varianza"), latex: "\\operatorname{Var}(X)=\\mathbb E[(X-\\mu)^2]=\\mathbb E[X^2]-\\mu^2", interpretation: c("Variance is a second central moment and has squared units.", "La varianza es un segundo momento central y tiene unidades al cuadrado."), depth: 2 },
      { label: c("Characteristic function and moments", "Función característica y momentos"), latex: "\\phi_X(u)=\\mathbb E[e^{iuX}],\\qquad \\mathbb E[X^n]=\\frac{1}{i^n}\\phi_X^{(n)}(0)", interpretation: c("Derivatives at the origin recover moments when they exist; transform pricers work directly with φ.", "Las derivadas en el origen recuperan momentos cuando existen; los pricers por transformadas trabajan directamente con φ."), depth: 3 },
    ],
    derivationFormulaIndex: 2,
    derivationTitle: c("From the law to its Fourier representation", "De la ley a su representación de Fourier"),
    derivationIntro: c("Start from an integrable law, expand only when the relevant moments exist, and keep the probability measure explicit.", "Parte de una ley integrable, expande solo cuando existan los momentos pertinentes y mantén explícita la medida de probabilidad."),
    steps: [
      { title: c("Encode the law", "Codificar la ley"), body: c("Average the complex exponential over the distribution of X.", "Promedia la exponencial compleja bajo la distribución de X."), latex: "\\phi_X(u)=\\int_{\\mathbb R}e^{iux}dF_X(x)" },
      { title: c("Check normalization", "Comprobar normalización"), body: c("At zero frequency the integrand is one, so total probability fixes the transform.", "En frecuencia cero el integrando vale uno, de modo que la probabilidad total fija la transformada."), latex: "\\phi_X(0)=\\int dF_X(x)=1" },
      { title: c("Differentiate under the integral", "Derivar bajo la integral"), body: c("If the corresponding absolute moment is finite, differentiation can pass through the expectation.", "Si el momento absoluto correspondiente es finito, la derivación puede pasar a través de la esperanza."), latex: "\\phi_X^{(n)}(u)=\\mathbb E[(iX)^ne^{iuX}]" },
      { title: c("Evaluate at the origin", "Evaluar en el origen"), body: c("The exponential disappears and the nth raw moment remains.", "La exponencial desaparece y queda el momento bruto de orden n."), latex: "\\phi_X^{(n)}(0)=i^n\\mathbb E[X^n]", check: c("For X~N(μ,σ²), φ'(0)/i=μ and −φ''(0)=μ²+σ².", "Para X~N(μ,σ²), φ'(0)/i=μ y −φ''(0)=μ²+σ².") },
    ],
    derivationConclusion: c("The characteristic function is a lossless representation of the law and a computational bridge to convolution and Fourier valuation.", "La función característica es una representación sin pérdida de la ley y un puente computacional hacia convolución y valoración de Fourier."),
    method: c("Define the law and measure first; use analytical moments when available and deterministic seeded estimators only as approximations with sampling error.", "Define primero la ley y la medida; usa momentos analíticos cuando existan y estimadores con semilla determinista solo como aproximaciones con error muestral."),
    calibration: c("Distribution parameters may be estimated under P or calibrated under Q; the two objectives are not interchangeable.", "Los parámetros de distribución pueden estimarse bajo P o calibrarse bajo Q; ambos objetivos no son intercambiables."),
    limitations: [c("Finite variance and higher moments are assumptions, not universal properties.", "La varianza finita y los momentos superiores son supuestos, no propiedades universales."), c("Sample skew and kurtosis are unstable in small or heavy-tailed samples.", "La asimetría y la curtosis muestrales son inestables en muestras pequeñas o de colas pesadas."), c("Risk-neutral and historical laws answer different questions.", "Las leyes neutrales al riesgo e históricas responden preguntas distintas.")],
    architecture: [c("Pure distribution and moment functions", "Funciones puras de distribución y momentos"), c("Deterministic seed at the experiment boundary", "Semilla determinista en la frontera del experimento"), c("Analytical references beside sample diagnostics", "Referencias analíticas junto a diagnósticos muestrales")],
    pythonTitle: c("Normal-law moments and transform", "Momentos y transformada de una ley normal"),
    pythonObjective: c("Verify φ(0)=1 and recover the first two moments from an analytical characteristic function.", "Verificar φ(0)=1 y recuperar los dos primeros momentos desde una función característica analítica."),
    pythonCode: `from __future__ import annotations

import cmath

def normal_cf(u: float, mean: float, variance: float) -> complex:
    if variance < 0:
        raise ValueError("variance must be non-negative")
    return cmath.exp(1j*u*mean - 0.5*variance*u*u)

mean, variance = 0.03, 0.04
assert abs(normal_cf(0.0, mean, variance) - 1.0) < 1e-14
h = 1e-4
first = (normal_cf(h, mean, variance)-normal_cf(-h, mean, variance))/(2*h)
second = (normal_cf(h, mean, variance)-2*normal_cf(0, mean, variance)+normal_cf(-h, mean, variance))/(h*h)
assert abs(first.imag-mean) < 1e-8
assert abs(-second.real-(mean*mean+variance)) < 1e-6
print(f"mean={first.imag:.6f} second_moment={-second.real:.6f}")`,
    pythonOutput: ["mean=0.030000 second_moment=0.040900"],
    pythonChecks: [c("φ(0)=1 to machine precision", "φ(0)=1 con precisión de máquina"), c("First and second moments match the analytical law", "Los momentos primero y segundo coinciden con la ley analítica"), c("Negative variance is rejected", "Se rechaza una varianza negativa")],
    labId: "conditional-expectation",
    labTitle: c("Distribution and information experiment", "Experimento de distribución e información"),
    labDescription: c("Reveal information and watch unconditional values become conditional distributions and expectations.", "Revela información y observa cómo valores incondicionales se convierten en distribuciones y esperanzas condicionales."),
    deskQuote: c("A moment without its measure, horizon and unit is not a risk number.", "Un momento sin medida, horizonte y unidad no es una cifra de riesgo."),
    deskInputs: [c("return or payoff definition", "definición de retorno o payoff"), c("measure and horizon", "medida y horizonte"), c("sample/filter policy", "política de muestra y filtro"), c("currency and unit", "moneda y unidad")],
    deskCalibration: c("Choose estimation under P for forecasting or calibration under Q for pricing and document the objective.", "Elige estimación bajo P para predicción o calibración bajo Q para valoración y documenta el objetivo."),
    deskRisk: [c("tail estimation", "estimación de colas"), c("sampling error", "error muestral"), c("measure mismatch", "desajuste de medida")],
    deskWorkflow: [c("define the random quantity", "definir la magnitud aleatoria"), c("declare measure and horizon", "declarar medida y horizonte"), c("compute analytical or sampled summaries", "calcular resúmenes analíticos o muestrales"), c("compare distributional diagnostics", "comparar diagnósticos distributivos")],
    productionIssues: [c("silent data filtering", "filtrado silencioso de datos"), c("unstable tail moments", "momentos de cola inestables"), c("mixing price and return units", "mezcla de unidades de precio y retorno")],
    macroTitle: c("From regime uncertainty to a priced law", "De la incertidumbre de régimen a una ley valorada"),
    macroThesis: c("Economic regimes alter physical outcomes; market prices add state-price weights before a risk-neutral distribution is inferred.", "Los regímenes económicos alteran resultados físicos; los precios de mercado añaden pesos de estado antes de inferir una distribución neutral al riesgo."),
    macroNodes: [{ label: c("Macro regime", "Régimen macro"), effect: c("changes physical frequencies", "cambia frecuencias físicas") }, { label: c("Risk preferences", "Preferencias de riesgo"), effect: c("change state prices", "cambian precios de estado") }, { label: c("Option prices", "Precios de opciones"), effect: c("identify a Q-law", "identifican una ley Q") }],
    pitfalls: [c("Calling a random variable its distribution.", "Llamar distribución a una variable aleatoria."), c("Comparing variance with volatility without changing units.", "Comparar varianza con volatilidad sin cambiar unidades."), c("Assuming every distribution has finite moments.", "Suponer que toda distribución tiene momentos finitos."), c("Using historical moments as pricing parameters without a measure argument.", "Usar momentos históricos como parámetros de valoración sin justificar la medida.")],
    locator: "Ch. 1 §§1.1–1.1.3, printed pp. 1–8 (PDF pp. 20–27)",
    related: ["foundation-brownian-ito", "foundation-conditional-expectation", "numerical-monte-carlo", "numerical-fourier-cos"],
  },
  {
    id: "foundation-brownian-ito",
    slug: "brownian-motion-ito-calculus",
    domain: "foundations",
    title: c("Brownian motion & Itô calculus", "Movimiento browniano y cálculo de Itô"),
    subtitle: c("Why continuous paths accumulate quadratic variation and change the chain rule.", "Por qué trayectorias continuas acumulan variación cuadrática y cambian la regla de la cadena."),
    level: "intermediate",
    minutes: 68,
    narrativeProfile: "foundation",
    legacyRoutes: ["/learn/foundations/brownian-motion", "/learn/foundations/it-calculus"],
    prerequisites: [c("Distributions, expectation and variance", "Distribuciones, esperanza y varianza"), c("Limits and Taylor expansion", "Límites y expansión de Taylor")],
    prerequisiteLessonIds: ["foundation-distributions"],
    objectives: [c("State the defining increment properties of Brownian motion.", "Enunciar las propiedades definitorias de los incrementos brownianos."), c("Explain why quadratic variation converges to elapsed time.", "Explicar por qué la variación cuadrática converge al tiempo transcurrido."), c("Construct the Itô integral for adapted elementary processes.", "Construir la integral de Itô para procesos elementales adaptados."), c("Apply Itô's lemma and identify the second-order correction.", "Aplicar el lema de Itô e identificar la corrección de segundo orden.")],
    tags: ["Brownian motion", "quadratic variation", "Itô integral", "Itô lemma", "academy-v2"],
    lead: c("Brownian motion is continuous but not differentiable. Its increments are order √dt, so squared increments are order dt and survive when ordinary second-order terms would disappear.", "El movimiento browniano es continuo pero no diferenciable. Sus incrementos son de orden √dt, de modo que los incrementos al cuadrado son de orden dt y sobreviven cuando términos ordinarios de segundo orden desaparecerían."),
    points: [c("Independent Gaussian increments encode a time-homogeneous noise clock.", "Los incrementos gaussianos independientes codifican un reloj de ruido homogéneo."), c("Quadratic variation—not visual roughness—is the mathematical signature that changes calculus.", "La variación cuadrática —no la rugosidad visual— es la firma matemática que cambia el cálculo."), c("Adapted integrands prevent future information entering a stochastic integral.", "Los integrandos adaptados impiden que información futura entre en una integral estocástica.")],
    why: c("Diffusion models, hedging arguments, simulation schemes and measure changes all depend on Brownian scaling and Itô's correction.", "Los modelos de difusión, argumentos de cobertura, esquemas de simulación y cambios de medida dependen del escalado browniano y de la corrección de Itô."),
    instruments: [c("European and barrier options", "Opciones europeas y barrera"), c("stochastic-volatility models", "Modelos de volatilidad estocástica"), c("short-rate models", "Modelos de tipo corto"), c("dynamic hedges", "Coberturas dinámicas")],
    quote: c("Time is measured in years; Brownian increments have √year units, and diffusion coefficients restore the financial unit of the state variable.", "El tiempo se mide en años; los incrementos brownianos tienen unidades √año y los coeficientes de difusión recuperan la unidad financiera de la variable de estado."),
    notation: [c("Wₜ: standard Brownian motion", "Wₜ: movimiento browniano estándar"), c("Πₙ: partition of [0,T]", "Πₙ: partición de [0,T]"), c("[W]ₜ: quadratic variation", "[W]ₜ: variación cuadrática"), c("Xₜ: Itô process with drift a and diffusion b", "Xₜ: proceso de Itô con drift a y difusión b")],
    formulas: [
      { label: c("Brownian increments", "Incrementos brownianos"), latex: "W_t-W_s\\sim\\mathcal N(0,t-s),\\qquad 0\\le s<t", interpretation: c("Increment variance equals elapsed time and disjoint increments are independent.", "La varianza del incremento coincide con el tiempo transcurrido y los incrementos disjuntos son independientes."), depth: 2 },
      { label: c("Quadratic variation", "Variación cuadrática"), latex: "[W]_T=\\lim_{\\lVert\\Pi_n\\rVert\\to0}\\sum_i(W_{t_{i+1}}-W_{t_i})^2=T", interpretation: c("The squared path increments converge to time even though the ordinary variation diverges.", "Los incrementos al cuadrado convergen al tiempo aunque la variación ordinaria diverge."), depth: 3 },
      { label: c("Itô's lemma", "Lema de Itô"), latex: "df(t,X_t)=\\left(f_t+a_tf_x+\\tfrac12b_t^2f_{xx}\\right)dt+b_tf_xdW_t", interpretation: c("The half-variance curvature term is the surviving second-order contribution.", "El término de curvatura de media varianza es la contribución de segundo orden que sobrevive."), depth: 3 },
    ],
    derivationFormulaIndex: 2,
    derivationTitle: c("Why stochastic calculus keeps a second-order term", "Por qué el cálculo estocástico conserva un término de segundo orden"),
    derivationIntro: c("Expand over a short interval and classify terms by Brownian order: ΔW is √Δt, so (ΔW)² is Δt.", "Expande sobre un intervalo corto y clasifica términos por orden browniano: ΔW es √Δt, por lo que (ΔW)² es Δt."),
    steps: [
      { title: c("Write a second-order expansion", "Escribir una expansión de segundo orden"), body: c("For ΔX=aΔt+bΔW, retain the Taylor terms that can contribute at order Δt.", "Para ΔX=aΔt+bΔW, conserva los términos de Taylor que pueden contribuir a orden Δt."), latex: "\\Delta f\\approx f_t\\Delta t+f_x\\Delta X+\\tfrac12f_{xx}(\\Delta X)^2" },
      { title: c("Apply Brownian scaling", "Aplicar el escalado browniano"), body: c("Terms in (Δt)² and ΔtΔW vanish faster than Δt; the squared Brownian increment does not.", "Los términos en (Δt)² y ΔtΔW desaparecen más rápido que Δt; el incremento browniano al cuadrado no."), latex: "(\\Delta X)^2=b^2(\\Delta W)^2+o(\\Delta t)" },
      { title: c("Use quadratic variation", "Usar variación cuadrática"), body: c("Across refining partitions, the accumulated squared Brownian increments converge to elapsed time.", "Sobre particiones cada vez más finas, los incrementos brownianos al cuadrado acumulados convergen al tiempo transcurrido."), latex: "(dW_t)^2=dt,\\qquad dW_tdt=(dt)^2=0" },
      { title: c("Collect drift and diffusion", "Agrupar drift y difusión"), body: c("Substitute the differential identities and separate finite-variation from martingale terms.", "Sustituye las identidades diferenciales y separa los términos de variación finita de los de martingala."), latex: "df=(f_t+af_x+\\tfrac12b^2f_{xx})dt+bf_xdW", check: c("For f(x)=x² and X=W, d(W²)=2W dW+dt; therefore E[W_T²]=T.", "Para f(x)=x² y X=W, d(W²)=2W dW+dt; por tanto E[W_T²]=T.") },
    ],
    derivationConclusion: c("Itô's lemma is the ordinary chain rule plus the deterministic contribution created by quadratic variation.", "El lema de Itô es la regla de la cadena ordinaria más la contribución determinista creada por la variación cuadrática."),
    method: c("Use analytical scaling to classify terms, then simulate only to illustrate path behavior and convergence—not to define the theorem.", "Usa escalado analítico para clasificar términos y simula solo para ilustrar comportamiento de trayectorias y convergencia, no para definir el teorema."),
    calibration: c("Standard Brownian motion has no calibration parameter; model diffusion coefficients and correlations are the calibrated objects.", "El movimiento browniano estándar no tiene parámetros de calibración; los objetos calibrados son coeficientes de difusión y correlaciones del modelo."),
    limitations: [c("Brownian paths exclude jumps and microstructure discontinuities.", "Las trayectorias brownianas excluyen saltos y discontinuidades de microestructura."), c("Continuous-time identities become discretization choices in code.", "Las identidades de tiempo continuo se convierten en decisiones de discretización en código."), c("An adapted integrand and square integrability are not optional technicalities.", "Un integrando adaptado y la integrabilidad cuadrática no son tecnicismos opcionales.")],
    architecture: [c("Seeded normal-increment generator", "Generador de incrementos normales con semilla"), c("Path and quadratic-variation calculations kept separate", "Cálculos de trayectoria y variación cuadrática separados"), c("Convergence diagnostic over refining partitions", "Diagnóstico de convergencia sobre particiones refinadas")],
    pythonTitle: c("Brownian path and quadratic variation", "Trayectoria browniana y variación cuadrática"),
    pythonObjective: c("Show that path increments scale with √dt while their squared sum approaches T.", "Mostrar que los incrementos escalan con √dt mientras su suma al cuadrado se aproxima a T."),
    pythonCode: `from __future__ import annotations

import numpy as np

def brownian_path(steps: int, horizon: float, seed: int) -> tuple[np.ndarray, float]:
    if steps <= 0 or horizon <= 0:
        raise ValueError("positive steps and horizon required")
    rng = np.random.default_rng(seed)
    increments = np.sqrt(horizon/steps)*rng.standard_normal(steps)
    path = np.concatenate(([0.0], np.cumsum(increments)))
    return path, float(np.dot(increments, increments))

path, qv = brownian_path(100_000, 1.0, 7)
assert path.shape == (100_001,)
assert abs(qv-1.0) < 0.02
print(f"terminal={path[-1]:.6f} quadratic_variation={qv:.6f}")`,
    pythonOutput: ["terminal=<seeded value> quadratic_variation≈1.000000"],
    pythonChecks: [c("Path begins at zero", "La trayectoria comienza en cero"), c("Quadratic variation approaches the horizon", "La variación cuadrática se aproxima al horizonte"), c("Invalid grid inputs are rejected", "Se rechazan entradas de malla inválidas")],
    labId: "simulation-schemes",
    labTitle: c("Path refinement and Itô correction", "Refinamiento de trayectoria y corrección de Itô"),
    labDescription: c("Increase time steps and compare exact, Euler and Milstein paths under the same shocks; inspect which error vanishes and which variation remains.", "Aumenta pasos temporales y compara trayectorias exacta, Euler y Milstein con los mismos shocks; inspecciona qué error desaparece y qué variación permanece."),
    deskQuote: c("The noise is not the model; the diffusion coefficient decides what one Brownian shock means in market units.", "El ruido no es el modelo; el coeficiente de difusión decide qué significa un shock browniano en unidades de mercado."),
    deskInputs: [c("time grid and calendar", "malla temporal y calendario"), c("diffusion and correlation", "difusión y correlación"), c("seed and random stream", "semilla y flujo aleatorio"), c("discretization scheme", "esquema de discretización")],
    deskCalibration: c("Calibrate model diffusion parameters to market instruments; validate the simulation scheme independently against moments or analytical prices.", "Calibra parámetros de difusión a instrumentos de mercado; valida el esquema de simulación por separado contra momentos o precios analíticos."),
    deskRisk: [c("discretization bias", "sesgo de discretización"), c("correlation construction", "construcción de correlación"), c("barrier monitoring", "monitorización de barreras")],
    deskWorkflow: [c("fix measure and SDE", "fijar medida y EDE"), c("choose scheme and grid", "elegir esquema y malla"), c("reuse shocks for comparisons", "reutilizar shocks en comparaciones"), c("verify moments and convergence", "verificar momentos y convergencia")],
    productionIssues: [c("unseeded regression tests", "tests de regresión sin semilla"), c("negative states from a naive scheme", "estados negativos por un esquema ingenuo"), c("mis-scaled annual time", "tiempo anual mal escalado")],
    macroTitle: c("From uncertainty clock to market dispersion", "Del reloj de incertidumbre a la dispersión de mercado"),
    macroThesis: c("Brownian time is a modelling clock; volatility and correlation translate it into asset-specific uncertainty rather than economic causality.", "El tiempo browniano es un reloj de modelización; volatilidad y correlación lo traducen en incertidumbre específica del activo, no en causalidad económica."),
    macroNodes: [{ label: c("Information arrival", "Llegada de información"), effect: c("sets a modelling clock", "fija un reloj de modelo") }, { label: c("Diffusion", "Difusión"), effect: c("scales shocks into returns", "escala shocks en retornos") }, { label: c("Hedge grid", "Malla de cobertura"), effect: c("leaves discretization residuals", "deja residuos de discretización") }],
    pitfalls: [c("Treating dW/dt as an ordinary derivative.", "Tratar dW/dt como una derivada ordinaria."), c("Dropping the Itô correction.", "Eliminar la corrección de Itô."), c("Using future information in the integrand.", "Usar información futura en el integrando."), c("Concluding model realism from a visually plausible path.", "Concluir realismo del modelo a partir de una trayectoria visualmente plausible.")],
    locator: "Ch. 1 §§1.2–1.3, printed pp. 9–24 and Ch. 2 §2.1.2, printed pp. 29–34 (PDF pp. 28–43, 49–55)",
    related: ["foundation-distributions", "foundation-filtrations", "foundation-gbm-dynamics", "numerical-schemes"],
  },
  {
    id: "foundation-gbm-dynamics",
    slug: "gbm-physical-risk-neutral-dynamics",
    domain: "derivatives",
    title: c("GBM under physical and pricing measures", "GBM bajo medidas física y de valoración"),
    subtitle: c("Separate forecast drift from no-arbitrage drift before pricing a payoff.", "Separa el drift de predicción del drift de no arbitraje antes de valorar un payoff."),
    level: "intermediate",
    minutes: 64,
    narrativeProfile: "model",
    legacyRoutes: ["/learn/foundations/risk-neutral-pricing"],
    prerequisites: [c("Brownian motion and Itô's lemma", "Movimiento browniano y lema de Itô"), c("Discounting and continuous compounding", "Descuento y capitalización continua")],
    prerequisiteLessonIds: ["foundation-brownian-ito"],
    objectives: [c("Solve the GBM SDE and identify its lognormal law.", "Resolver la EDE GBM e identificar su ley lognormal."), c("Distinguish μ estimated under P from r−q imposed under Q.", "Distinguir μ estimado bajo P de r−q impuesto bajo Q."), c("Verify the discounted total-return martingale condition.", "Verificar la condición de martingala del retorno total descontado."), c("Explain which GBM assumptions fail in option markets.", "Explicar qué supuestos GBM fallan en mercados de opciones.")],
    tags: ["GBM", "physical measure", "risk-neutral measure", "lognormal", "academy-v2"],
    lead: c("GBM is one process written in different probability coordinates. Historical estimation targets the physical law; arbitrage pricing chooses a measure under which discounted tradables are martingales.", "GBM es un proceso escrito en coordenadas probabilísticas distintas. La estimación histórica apunta a la ley física; la valoración por arbitraje elige una medida bajo la que los activos negociables descontados son martingalas."),
    points: [c("The diffusion coefficient controls instantaneous return variance under both measures in the base model.", "El coeficiente de difusión controla la varianza instantánea del retorno bajo ambas medidas en el modelo base."), c("Changing μ to r−q is a measure statement, not a forecast revision.", "Cambiar μ por r−q es una afirmación sobre la medida, no una revisión de la predicción."), c("The exact exponential solution preserves positivity; a naive Euler step need not.", "La solución exponencial exacta preserva positividad; un paso Euler ingenuo puede no hacerlo.")],
    why: c("Equity forwards, vanilla options, implied volatility and delta hedging all inherit GBM's carry, positivity and lognormal assumptions.", "Forwards de equity, opciones vanilla, volatilidad implícita y cobertura delta heredan los supuestos de carry, positividad y lognormalidad de GBM."),
    instruments: [c("Equity forwards", "Forwards de equity"), c("European options", "Opciones europeas"), c("delta-one hedges", "Coberturas delta-one"), c("volatility quotes", "Cotizaciones de volatilidad")],
    quote: c("S is a currency price, q is continuous proportional dividend yield, r is the continuously compounded funding rate, σ is annualized decimal volatility, and T is years.", "S es un precio monetario, q es rentabilidad por dividendo proporcional continua, r es el tipo de financiación con capitalización continua, σ es volatilidad decimal anualizada y T se expresa en años."),
    notation: [c("μ: physical expected return under P", "μ: retorno esperado físico bajo P"), c("r−q: risk-neutral ex-dividend drift under Q", "r−q: drift ex-dividendo neutral al riesgo bajo Q"), c("σ: annualized return volatility", "σ: volatilidad anualizada del retorno"), c("Bₜ=e^{rt}: money-market numeraire", "Bₜ=e^{rt}: numerario monetario")],
    formulas: [
      { label: c("GBM dynamics", "Dinámica GBM"), latex: "\\frac{dS_t}{S_t}=b\\,dt+\\sigma dW_t,\\qquad b=\\mu\\ (\\mathbb P),\\ b=r-q\\ (\\mathbb Q)", interpretation: c("The same diffusion is paired with different drifts after a measure change.", "La misma difusión se combina con drifts distintos tras un cambio de medida."), depth: 2 },
      { label: c("Exact lognormal solution", "Solución lognormal exacta"), latex: "S_T=S_t\\exp\\!\\left((b-\\tfrac12\\sigma^2)\\tau+\\sigma\\sqrt{\\tau}Z\\right),\\quad Z\\sim\\mathcal N(0,1)", interpretation: c("The −σ²/2 term comes from Itô's lemma and makes E[S_T|S_t]=S_te^{bτ}.", "El término −σ²/2 procede del lema de Itô y hace que E[S_T|S_t]=S_te^{bτ}."), depth: 3 },
      { label: c("Discounted total-return martingale", "Martingala de retorno total descontado"), latex: "e^{-rt}e^{qt}S_t\\ \\text{is a }\\mathbb Q\\text{-martingale}", interpretation: c("Dividend reinvestment and funding discounting remove predictable drift under Q.", "La reinversión de dividendos y el descuento de financiación eliminan el drift predecible bajo Q."), depth: 2 },
    ],
    derivationFormulaIndex: 1,
    derivationTitle: c("Solve GBM by transforming log-price", "Resolver GBM transformando el log-precio"),
    derivationIntro: c("Apply Itô's lemma to log S, integrate the resulting arithmetic Brownian motion, then exponentiate.", "Aplica el lema de Itô a log S, integra el movimiento browniano aritmético resultante y exponencia."),
    steps: [
      { title: c("Choose the transformation", "Elegir la transformación"), body: c("Logarithms turn proportional shocks into additive shocks while preserving positivity after inversion.", "Los logaritmos convierten shocks proporcionales en aditivos y preservan positividad al invertir."), latex: "f(S)=\\log S,\\quad f_S=1/S,\\quad f_{SS}=-1/S^2" },
      { title: c("Apply Itô's lemma", "Aplicar el lema de Itô"), body: c("The quadratic-variation correction subtracts half the instantaneous variance from log drift.", "La corrección de variación cuadrática resta la mitad de la varianza instantánea al drift logarítmico."), latex: "d\\log S_t=(b-\\tfrac12\\sigma^2)dt+\\sigma dW_t" },
      { title: c("Integrate over the horizon", "Integrar sobre el horizonte"), body: c("Constant coefficients integrate directly and the Brownian increment is normal with variance τ.", "Los coeficientes constantes se integran directamente y el incremento browniano es normal con varianza τ."), latex: "\\log(S_T/S_t)=(b-\\tfrac12\\sigma^2)\\tau+\\sigma(W_T-W_t)" },
      { title: c("Standardize and exponentiate", "Estandarizar y exponenciar"), body: c("Write W_T−W_t=√τ Z and invert the log transformation.", "Escribe W_T−W_t=√τ Z e invierte la transformación logarítmica."), latex: "S_T=S_t e^{(b-\\sigma^2/2)\\tau+\\sigma\\sqrt{\\tau}Z}", check: c("Using E[e^{aZ}]=e^{a²/2} gives E[S_T|S_t]=S_te^{bτ}.", "Usando E[e^{aZ}]=e^{a²/2} se obtiene E[S_T|S_t]=S_te^{bτ}.") },
    ],
    derivationConclusion: c("The exact solution separates drift, convexity correction, and random shock; changing measure changes b, not the algebra of the solution.", "La solución exacta separa drift, corrección de convexidad y shock aleatorio; cambiar de medida cambia b, no el álgebra de la solución."),
    method: c("Use the exact transition for simulation when coefficients are constant; use the P law for estimation and the Q law for arbitrage pricing.", "Usa la transición exacta en simulación cuando los coeficientes son constantes; usa la ley P para estimación y la ley Q para valoración por arbitraje."),
    calibration: c("Estimate μ and σ from historical returns only for a physical model. Calibrate pricing volatility to option prices under Q and infer carry from consistent curves/dividends.", "Estima μ y σ desde retornos históricos solo para un modelo físico. Calibra volatilidad de valoración a precios de opciones bajo Q e infiere carry desde curvas/dividendos coherentes."),
    limitations: [c("Constant volatility cannot reproduce smile or stochastic variance.", "La volatilidad constante no reproduce sonrisa ni varianza estocástica."), c("Continuous paths omit jumps and gap risk.", "Las trayectorias continuas omiten saltos y gap risk."), c("Continuous trading and frictionless funding are idealizations.", "La negociación continua y la financiación sin fricciones son idealizaciones.")],
    architecture: [c("Separate physical and pricing parameter objects", "Separar objetos de parámetros físicos y de valoración"), c("Use exact transition as numerical reference", "Usar transición exacta como referencia numérica"), c("Return martingale and moment diagnostics", "Devolver diagnósticos de martingala y momentos")],
    pythonTitle: c("Exact GBM transition under P and Q", "Transición exacta GBM bajo P y Q"),
    pythonObjective: c("Use identical shocks to isolate the effect of changing drift and verify the Q expectation.", "Usar shocks idénticos para aislar el efecto del cambio de drift y verificar la esperanza bajo Q."),
    pythonCode: `from __future__ import annotations

import numpy as np

def gbm_terminal(spot: float, drift: float, vol: float, time: float, z: np.ndarray) -> np.ndarray:
    if min(spot, time) <= 0 or vol < 0:
        raise ValueError("invalid GBM inputs")
    return spot*np.exp((drift-0.5*vol*vol)*time+vol*np.sqrt(time)*z)

rng = np.random.default_rng(19)
z = rng.standard_normal(500_000)
spot, rate, dividend, vol, time = 100.0, 0.04, 0.01, 0.20, 1.5
terminal = gbm_terminal(spot, rate-dividend, vol, time, z)
target = spot*np.exp((rate-dividend)*time)
assert abs(terminal.mean()-target)/target < 2e-3
assert np.all(terminal > 0)
print(f"sample_mean={terminal.mean():.4f} analytical_mean={target:.4f}")`,
    pythonOutput: ["sample_mean≈analytical_mean=104.6028"],
    pythonChecks: [c("Exact states remain positive", "Los estados exactos permanecen positivos"), c("Sample Q mean matches forward carry within Monte Carlo error", "La media Q muestral coincide con el carry forward dentro del error Monte Carlo"), c("P and Q reuse identical shocks for controlled comparison", "P y Q reutilizan shocks idénticos para una comparación controlada")],
    labId: "measure-change",
    labTitle: c("Physical versus pricing dynamics", "Dinámica física frente a dinámica de valoración"),
    labDescription: c("Switch P, Q and forward-measure coordinates while keeping volatility and horizon fixed; inspect drift, density weights and martingale state together.", "Alterna coordenadas P, Q y de medida forward manteniendo volatilidad y horizonte; inspecciona conjuntamente drift, pesos de densidad y estado de martingala."),
    deskQuote: c("Risk-neutral drift is a pricing coordinate, not the desk's best forecast.", "El drift neutral al riesgo es una coordenada de valoración, no la mejor predicción de la mesa."),
    deskInputs: [c("spot and dividend curve", "spot y curva de dividendos"), c("funding/discount curve", "curva de financiación/descuento"), c("volatility convention", "convención de volatilidad"), c("measure and numeraire", "medida y numerario")],
    deskCalibration: c("Calibrate Q-volatility to liquid option prices; estimate P-drift only for forecasting and scenario applications with a separate validation objective.", "Calibra volatilidad Q a opciones líquidas; estima drift P solo para predicción y escenarios con un objetivo de validación separado."),
    deskRisk: [c("carry and dividend risk", "riesgo de carry y dividendos"), c("volatility/model risk", "riesgo de volatilidad/modelo"), c("measure confusion", "confusión de medida")],
    deskWorkflow: [c("freeze spot and curves", "congelar spot y curvas"), c("declare P or Q objective", "declarar objetivo P o Q"), c("compute exact reference", "calcular referencia exacta"), c("validate moments and forwards", "validar momentos y forwards")],
    productionIssues: [c("mixing historical and implied volatility", "mezclar volatilidad histórica e implícita"), c("incorrect dividend carry", "carry de dividendos incorrecto"), c("Euler negative states", "estados negativos de Euler")],
    macroTitle: c("Expected returns versus pricing carry", "Retornos esperados frente a carry de valoración"),
    macroThesis: c("Risk premia affect the physical distribution; funding and dividends fix no-arbitrage carry in the pricing coordinate.", "Las primas de riesgo afectan la distribución física; financiación y dividendos fijan el carry de no arbitraje en la coordenada de valoración."),
    macroNodes: [{ label: c("Growth/risk premium", "Crecimiento/prima de riesgo"), effect: c("moves μ under P", "mueve μ bajo P") }, { label: c("Rates/dividends", "Tipos/dividendos"), effect: c("fix r−q under Q", "fijan r−q bajo Q") }, { label: c("Option market", "Mercado de opciones"), effect: c("identifies pricing volatility", "identifica volatilidad de valoración") }],
    pitfalls: [c("Replacing μ by r without declaring a measure change.", "Sustituir μ por r sin declarar un cambio de medida."), c("Forgetting dividend carry in the Q drift.", "Olvidar el carry de dividendos en el drift Q."), c("Estimating pricing drift from historical returns.", "Estimar el drift de valoración desde retornos históricos."), c("Using an Euler scheme when an exact transition exists.", "Usar un esquema Euler cuando existe transición exacta.")],
    locator: "Ch. 2 §§2.1–2.3, printed pp. 27–49 (PDF pp. 46–67)",
    related: ["foundation-brownian-ito", "foundation-black-scholes", "foundation-measure-change", "foundation-girsanov"],
  },
  {
    id: "foundation-black-scholes",
    slug: "black-scholes-replication-pricing",
    domain: "derivatives",
    title: c("Black–Scholes: replication, PDE & pricing", "Black–Scholes: réplica, EDP y valoración"),
    subtitle: c("One contract, three equivalent valuation views, and a hedge that exposes every assumption.", "Un contrato, tres visiones equivalentes de valoración y una cobertura que expone cada supuesto."),
    level: "intermediate",
    minutes: 78,
    narrativeProfile: "classical-derivation",
    legacyRoutes: ["/learn/equity/black-scholes"],
    prerequisites: [c("GBM under the pricing measure", "GBM bajo la medida de valoración"), c("Itô's lemma and self-financing replication", "Lema de Itô y réplica autofinanciada"), c("Discount factors and continuous carry", "Factores de descuento y carry continuo")],
    prerequisiteLessonIds: ["foundation-gbm-dynamics", "rate-discount"],
    objectives: [c("Derive the Black–Scholes PDE from a self-financing delta hedge.", "Derivar la EDP de Black–Scholes desde una cobertura delta autofinanciada."), c("Connect the PDE to risk-neutral expectation through Feynman–Kac.", "Conectar la EDP con la esperanza neutral al riesgo mediante Feynman–Kac."), c("Use the closed form with explicit carry and units.", "Usar la forma cerrada con carry y unidades explícitas."), c("Interpret delta hedging error when model assumptions or trading frequency fail.", "Interpretar el error de cobertura delta cuando fallan supuestos o frecuencia de negociación.")],
    tags: ["Black-Scholes", "replication", "PDE", "Feynman-Kac", "delta hedging", "academy-v2"],
    lead: c("Black–Scholes is not merely a formula. It is an equivalence between a replicating strategy, a parabolic PDE, and a discounted risk-neutral expectation under a precise market model.", "Black–Scholes no es solo una fórmula. Es una equivalencia entre una estrategia de réplica, una EDP parabólica y una esperanza neutral al riesgo descontada bajo un modelo de mercado preciso."),
    points: [c("The physical drift disappears because replication, not forecasting, pins the price.", "El drift físico desaparece porque la réplica, no la predicción, fija el precio."), c("Boundary and terminal conditions are part of the pricing problem.", "Las condiciones de frontera y terminal forman parte del problema de valoración."), c("The closed form is a benchmark and quote coordinate even when smile dynamics require richer models.", "La forma cerrada es un benchmark y coordenada de cotización incluso cuando la sonrisa exige modelos más ricos.")],
    why: c("Vanilla option quotes, implied volatility, desk Greeks, hedging diagnostics and model validation all use Black–Scholes as a common coordinate system.", "Las cotizaciones vanilla, volatilidad implícita, griegas de mesa, diagnósticos de cobertura y validación de modelos usan Black–Scholes como sistema común de coordenadas."),
    instruments: [c("European calls and puts", "Calls y puts europeas"), c("equity and FX vanillas", "Vanillas de equity y FX"), c("option hedges", "Coberturas de opciones"), c("implied-volatility quotes", "Cotizaciones de volatilidad implícita")],
    quote: c("S and K are currency amounts per underlying unit; r and q are continuous annual rates; σ is decimal annualized volatility; T is year fraction; prices are present values.", "S y K son importes monetarios por unidad de subyacente; r y q son tipos anuales continuos; σ es volatilidad decimal anualizada; T es fracción de año; los precios son valores actuales."),
    notation: [c("V(t,S): derivative value", "V(t,S): valor del derivado"), c("τ=T−t: time to expiry", "τ=T−t: tiempo a vencimiento"), c("N(·), n(·): standard normal CDF and density", "N(·), n(·): CDF y densidad normal estándar"), c("Δ=∂V/∂S: spot units held in the hedge", "Δ=∂V/∂S: unidades spot mantenidas en la cobertura")],
    formulas: [
      { label: c("Black–Scholes PDE", "EDP de Black–Scholes"), latex: "V_t+\\tfrac12\\sigma^2S^2V_{SS}+(r-q)SV_S-rV=0,\\qquad V(T,S)=\\Phi(S)", interpretation: c("No-arbitrage fixes the value once dynamics, carry, terminal payoff and boundary behavior are specified.", "La ausencia de arbitraje fija el valor una vez declarados dinámica, carry, payoff terminal y comportamiento de frontera."), depth: 3, analyticsHref: "/lab?lab=vanilla" },
      { label: c("European call", "Call europea"), latex: "C=S_0e^{-qT}N(d_1)-Ke^{-rT}N(d_2),\\quad d_{1,2}=\\frac{\\log(S_0/K)+(r-q\\pm\\tfrac12\\sigma^2)T}{\\sigma\\sqrt T}", interpretation: c("Discounted spot and strike terms are weighted by the model's exercise probabilities in different numeraires.", "Los términos spot y strike descontados se ponderan por probabilidades de ejercicio del modelo en numerarios distintos."), depth: 3, analyticsHref: "/lab?lab=vanilla" },
      { label: c("Put–call parity", "Paridad put–call"), latex: "C-P=S_0e^{-qT}-Ke^{-rT}", interpretation: c("A static replication identity that must hold independently of volatility in the model domain.", "Una identidad de réplica estática que debe cumplirse independientemente de la volatilidad dentro del dominio del modelo."), depth: 2, analyticsHref: "/lab?lab=vanilla" },
      { label: c("Call delta", "Delta de la call"), latex: "\\Delta_C=e^{-qT}N(d_1)", interpretation: c("The instantaneous stock units in the continuous-time replication; desk convention and premium adjustment may differ by asset class.", "Las unidades instantáneas de acciones en la réplica continua; la convención de mesa y el ajuste de prima pueden variar por clase de activo."), depth: 2, analyticsHref: "/lab?lab=greeks" },
    ],
    derivationFormulaIndex: 0,
    derivationTitle: c("From self-financing replication to the pricing PDE", "De la réplica autofinanciada a la EDP de valoración"),
    derivationIntro: c("Apply Itô to the option, cancel the Brownian exposure with stock, and impose that the locally riskless portfolio earns the funding rate.", "Aplica Itô a la opción, cancela la exposición browniana con acciones e impón que la cartera localmente sin riesgo remunere al tipo de financiación."),
    steps: [
      { title: c("State risk-neutral-compatible spot dynamics", "Declarar dinámica spot compatible con Q"), body: c("Use continuous dividend yield q and volatility σ; the replication result does not require the physical drift.", "Usa rentabilidad por dividendo continua q y volatilidad σ; el resultado de réplica no necesita el drift físico."), latex: "dS_t=(\\mu-q)S_tdt+\\sigma S_tdW_t^{\\mathbb P}" },
      { title: c("Apply Itô to the option", "Aplicar Itô a la opción"), body: c("The option inherits drift, delta exposure and the gamma correction from the same Brownian driver.", "La opción hereda drift, exposición delta y corrección gamma del mismo driver browniano."), latex: "dV=(V_t+(\\mu-q)SV_S+\\tfrac12\\sigma^2S^2V_{SS})dt+\\sigma SV_SdW" },
      { title: c("Build the delta-hedged portfolio", "Construir la cartera delta-cubierta"), body: c("Hold one option and short Δ=V_S stock units; include dividend cash flow on the stock position.", "Mantén una opción y vende Δ=V_S unidades spot; incluye el flujo de dividendos de la posición en acciones."), latex: "\\Pi=V-V_SS,\\qquad d\\Pi=dV-V_SdS-qSV_Sdt" },
      { title: c("Cancel diffusion risk", "Cancelar el riesgo de difusión"), body: c("Substitution removes both dW and the unknown physical drift μ.", "La sustitución elimina tanto dW como el drift físico desconocido μ."), latex: "d\\Pi=(V_t+\\tfrac12\\sigma^2S^2V_{SS}-qSV_S)dt" },
      { title: c("Impose no-arbitrage funding", "Imponer financiación sin arbitraje"), body: c("A locally riskless, self-financing portfolio must earn r; rearranging yields the PDE.", "Una cartera localmente sin riesgo y autofinanciada debe remunerar r; al reordenar se obtiene la EDP."), latex: "d\\Pi=r(V-SV_S)dt\\Longrightarrow V_t+\\tfrac12\\sigma^2S^2V_{SS}+(r-q)SV_S-rV=0", check: c("The PDE contains r−q but no μ; put–call parity and intrinsic limits provide independent checks.", "La EDP contiene r−q pero no μ; la paridad put–call y los límites intrínsecos aportan comprobaciones independientes.") },
    ],
    derivationConclusion: c("Feynman–Kac maps this terminal-value PDE to V_t=E^Q[e^{-r(T-t)}Φ(S_T)|F_t]; the closed form is the European call/put solution for a lognormal terminal law.", "Feynman–Kac lleva esta EDP de valor terminal a V_t=E^Q[e^{-r(T-t)}Φ(S_T)|F_t]; la forma cerrada es la solución call/put europea para una ley terminal lognormal."),
    method: c("Use closed form for European vanillas, implied-volatility inversion and analytical Greeks; use the PDE/expectation equivalence as a benchmark for numerical engines.", "Usa forma cerrada para vanillas europeas, inversión de volatilidad implícita y griegas analíticas; usa la equivalencia EDP/esperanza como benchmark de motores numéricos."),
    calibration: c("Black–Scholes has one volatility per quote. A surface is a market coordinate assembled from many inversions, not one globally calibrated constant-σ model.", "Black–Scholes tiene una volatilidad por cotización. Una superficie es una coordenada de mercado construida con muchas inversiones, no un único modelo global calibrado con σ constante."),
    limitations: [c("Constant volatility and lognormal tails contradict observed smiles.", "La volatilidad constante y las colas lognormales contradicen las sonrisas observadas."), c("Continuous frictionless hedging omits gaps, liquidity and transaction costs.", "La cobertura continua sin fricciones omite gaps, liquidez y costes de transacción."), c("European exercise excludes early exercise and path dependence.", "El ejercicio europeo excluye ejercicio anticipado y dependencia de trayectoria.")],
    architecture: [c("One validated Black–Scholes kernel shared by price, IV and Greeks", "Un kernel Black–Scholes validado compartido por precio, IV y griegas"), c("Analytical parity and limit checks", "Comprobaciones analíticas de paridad y límites"), c("Desk-unit conversion outside the raw kernel", "Conversión a unidades de mesa fuera del kernel bruto")],
    pythonTitle: c("Call, put and parity reference", "Referencia de call, put y paridad"),
    pythonObjective: c("Compute European prices from one state and verify put–call parity to numerical tolerance.", "Calcular precios europeos desde un único estado y verificar paridad put–call con tolerancia numérica."),
    pythonCode: `from __future__ import annotations

import math
from statistics import NormalDist

N = NormalDist()

def black_scholes(spot: float, strike: float, time: float, rate: float, dividend: float, vol: float) -> tuple[float, float]:
    if min(spot, strike, time, vol) <= 0:
        raise ValueError("positive spot, strike, time and vol required")
    root_t = math.sqrt(time)
    d1 = (math.log(spot/strike)+(rate-dividend+0.5*vol*vol)*time)/(vol*root_t)
    d2 = d1-vol*root_t
    call = spot*math.exp(-dividend*time)*N.cdf(d1)-strike*math.exp(-rate*time)*N.cdf(d2)
    put = strike*math.exp(-rate*time)*N.cdf(-d2)-spot*math.exp(-dividend*time)*N.cdf(-d1)
    return call, put

s, k, t, r, q, vol = 100.0, 105.0, 1.25, 0.04, 0.015, 0.22
call, put = black_scholes(s, k, t, r, q, vol)
parity = s*math.exp(-q*t)-k*math.exp(-r*t)
assert abs((call-put)-parity) < 1e-12
assert 0.0 <= call <= s*math.exp(-q*t)
print(f"call={call:.6f} put={put:.6f} parity_error={(call-put-parity):.2e}")`,
    pythonOutput: ["call=<deterministic value> put=<deterministic value> parity_error≈0"],
    pythonChecks: [c("Put–call parity holds to 1e−12", "La paridad put–call se cumple a 1e−12"), c("Call value respects arbitrage bounds", "El valor call respeta cotas de arbitraje"), c("Invalid domains fail before calculation", "Dominios inválidos fallan antes del cálculo")],
    labId: "hedging-pnl",
    labTitle: c("Delta hedge and residual P&L", "Cobertura delta y P&L residual"),
    labDescription: c("Move spot, volatility, horizon and transaction cost; connect analytical Greeks to the residual from discrete rebalancing.", "Mueve spot, volatilidad, horizonte y coste de transacción; conecta griegas analíticas con el residuo del rebalanceo discreto."),
    deskQuote: c("Black–Scholes is the common language; the hedge residual tells you where the language stopped describing the market.", "Black–Scholes es el lenguaje común; el residuo de cobertura indica dónde ese lenguaje dejó de describir el mercado."),
    deskInputs: [c("spot/forward and curves", "spot/forward y curvas"), c("strike, expiry and exercise style", "strike, vencimiento y estilo de ejercicio"), c("option premium and volatility convention", "prima de opción y convención de volatilidad"), c("hedge frequency and costs", "frecuencia y costes de cobertura")],
    deskCalibration: c("Invert each liquid premium to implied volatility with consistent curves, timestamps, bid/offer and solver diagnostics.", "Invierte cada prima líquida a volatilidad implícita con curvas, timestamps, bid/offer y diagnósticos del solver coherentes."),
    deskRisk: [c("delta/gamma/vega", "delta/gamma/vega"), c("gap and discrete-hedging error", "error de gap y cobertura discreta"), c("smile dynamics", "dinámica de sonrisa")],
    deskWorkflow: [c("normalize contract and carry", "normalizar contrato y carry"), c("price and invert volatility", "valorar e invertir volatilidad"), c("compute desk-unit Greeks", "calcular griegas en unidades de mesa"), c("reconcile hedge P&L", "conciliar P&L de cobertura")],
    productionIssues: [c("mixed day counts or dividend inputs", "bases temporales o dividendos mezclados"), c("stale volatility quotes", "cotizaciones de volatilidad obsoletas"), c("uncontrolled near-expiry Greeks", "griegas cercanas a vencimiento sin control")],
    macroTitle: c("From policy and earnings to the option coordinate", "De política y resultados a la coordenada de opción"),
    macroThesis: c("Rates and dividends change forward carry; uncertainty and protection demand change quoted implied volatility. The formula maps those inputs to price but does not explain their economic cause.", "Tipos y dividendos cambian el carry forward; incertidumbre y demanda de protección cambian la volatilidad implícita cotizada. La fórmula lleva esos inputs a precio, pero no explica su causa económica."),
    macroNodes: [{ label: c("Rates/dividends", "Tipos/dividendos"), effect: c("move forward carry", "mueven carry forward") }, { label: c("Event risk", "Riesgo de evento"), effect: c("moves option premium", "mueve prima de opción") }, { label: c("Implied volatility", "Volatilidad implícita"), effect: c("normalizes the quote", "normaliza la cotización") }, { label: c("Greeks", "Griegas"), effect: c("translate price into hedge", "traducen precio a cobertura") }],
    pitfalls: [c("Presenting the closed form without the replication assumptions.", "Presentar la forma cerrada sin los supuestos de réplica."), c("Using historical volatility as an implied quote.", "Usar volatilidad histórica como cotización implícita."), c("Ignoring dividends or inconsistent discount curves.", "Ignorar dividendos o curvas de descuento incoherentes."), c("Treating continuous delta hedging as a realizable guarantee.", "Tratar la cobertura delta continua como garantía realizable.")],
    locator: "Ch. 3 §§3.1–3.3, printed pp. 51–78 (PDF pp. 70–96)",
    related: ["foundation-gbm-dynamics", "greeks-first-order", "hedging-pnl", "vol-implied"],
  },
];

export const foundationCoreLessons: AcademyLesson[] = seeds.map((seed) => {
  const english = build(seed, 0);
  const spanish = build(seed, 1);
  return { ...english, localized: { es: spanish } };
});
