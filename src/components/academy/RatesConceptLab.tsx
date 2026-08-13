"use client";

import { useMemo, useState } from "react";
import { LineChart, type Series } from "@/src/components/charts/LineChart";
import { formatRate, formatYear } from "@/src/components/charts/chartModel";
import type { AcademyLesson } from "@/src/content/academy/types";
import { discountFactor, parSwapRate } from "@/src/quant/curves/rates";
import { pick, type Locale, useI18n } from "@/src/i18n";

type LabId = AcademyLesson["interactiveLabs"][number]["id"];
type Copy = { en: string; es: string };
type Scenario = { id: string; label: Copy; note: Copy; primary: number; secondary: number };
type LabResult = { x: number[]; series: Series[]; metrics: Array<[Copy, string]> };
type AxisContract = { unit: string; formatter: (value: number) => string };
type Definition = { eyebrow: Copy; xLabel: Copy; yLabel: Copy; xAxis: AxisContract; yAxis: AxisContract; scenarios: Scenario[]; build: (scenario: Scenario, intensity: number, locale: Locale) => LabResult };

const range = (count: number, start: number, end: number): number[] => Array.from({ length: count }, (_, index) => start + index * ((end - start) / (count - 1)));
const percent = (value: number): string => `${(value * 100).toFixed(2)}%`;
const basisPoints = (value: number): string => `${(value * 10_000).toFixed(1)} bp`;
const c = (en: string, es: string): Copy => ({ en, es });
const axes = {
  years: { unit: "years", formatter: formatYear },
  days: { unit: "days", formatter: (value: number): string => value.toFixed(0) },
  rate: { unit: "decimal annual rate", formatter: (value: number): string => formatRate(value, 3) },
  strikeRate: { unit: "decimal annual rate", formatter: (value: number): string => formatRate(value, 2) },
  basisPoints: { unit: "basis points", formatter: (value: number): string => `${value.toFixed(2)} bp` },
  discountFactor: { unit: "discount factor", formatter: (value: number): string => value.toFixed(5) },
  currencyUnits: { unit: "currency units", formatter: (value: number): string => `${value.toFixed(1)} CU` },
  factorValue: { unit: "factor response / decimal volatility", formatter: (value: number): string => value.toFixed(5) },
  premium: { unit: "premium per unit notional", formatter: (value: number): string => value.toFixed(5) },
} satisfies Record<string, AxisContract>;

const definitions: Partial<Record<LabId, Definition>> = {
  discounting: {
    eyebrow: c("DATED PRICE WEIGHTS AND PRESENT VALUE", "PESOS DE PRECIO FECHADOS Y VALOR ACTUAL"), xLabel: c("Maturity (years)", "Vencimiento (años)"), yLabel: c("Discount factor", "Factor de descuento"),
    xAxis: axes.years, yAxis: axes.discountFactor,
    scenarios: [
      { id: "normal", label: c("Normal curve", "Curva normal"), note: c("Positive upward zero curve", "Curva cero positiva y creciente"), primary: 0.025, secondary: 0.015 },
      { id: "inverted", label: c("Inverted", "Invertida"), note: c("High front end, lower long end", "Tramo corto alto y largo bajo"), primary: 0.052, secondary: -0.025 },
      { id: "negative", label: c("Negative front end", "Tramo corto negativo"), note: c("Discount factors can exceed one", "Los factores pueden superar uno"), primary: -0.005, secondary: 0.032 },
    ],
    build: (scenario, intensity, locale) => { const x = range(61, 0, 30); const zero = x.map((t) => scenario.primary + scenario.secondary * intensity * (1 - Math.exp(-t / 7))); const base = x.map((t, i) => discountFactor(zero[i], t)); const bumped = x.map((t, i) => discountFactor(zero[i] + 0.0025 * intensity, t)); return { x, series: [{ name: pick(locale, c("discount factor", "factor de descuento")), values: base, color: "--chart-series-2" }, { name: pick(locale, c("+25bp curve", "curva +25pb")), values: bumped, color: "--chart-series-3" }], metrics: [[c("10Y zero", "Cero 10A"), percent(zero[20])], [c("10Y discount", "Descuento 10A"), base[20].toFixed(6)], [c("30Y +25bp PV impact", "Impacto VA 30A +25pb"), percent((bumped.at(-1) ?? 0) / (base.at(-1) ?? 1) - 1)]] }; },
  },
  "zero-forward-rates": {
    eyebrow: c("AVERAGE ZERO VS MARGINAL FORWARD", "TIPO CERO MEDIO FRENTE A FORWARD MARGINAL"), xLabel: c("Maturity (years)", "Vencimiento (años)"), yLabel: c("Annualised rate", "Tipo anualizado"),
    xAxis: axes.years, yAxis: axes.rate,
    scenarios: [
      { id: "normal", label: c("Normal", "Normal"), note: c("Rising zeros and forwards", "Tipos cero y forward crecientes"), primary: 0.022, secondary: 0.025 },
      { id: "inverted", label: c("Inverted", "Invertida"), note: c("Front-loaded policy restriction", "Restricción monetaria concentrada al inicio"), primary: 0.052, secondary: -0.027 },
      { id: "hump", label: c("Humped", "Con joroba"), note: c("Mid-curve premium", "Prima en el centro de la curva"), primary: 0.025, secondary: 0.03 },
    ],
    build: (scenario, intensity, locale) => { const x = range(61, 0.1, 30); const zero = x.map((t) => scenario.id === "hump" ? scenario.primary + scenario.secondary * intensity * Math.exp(-1 * (((t - 6) / 4) ** 2)) : scenario.primary + scenario.secondary * intensity * (1 - Math.exp(-t / 6))); const discounts = x.map((t, index) => discountFactor(zero[index], t)); const forward = discounts.map((p, index) => index === 0 ? zero[0] : Math.log(discounts[index - 1] / p) / (x[index] - x[index - 1])); return { x, series: [{ name: pick(locale, c("zero rate", "tipo cero")), values: zero, color: "--chart-series-2" }, { name: pick(locale, c("segment forward", "forward de tramo")), values: forward, color: "--chart-series-3" }], metrics: [[c("2Y zero", "Cero 2A"), percent(zero[4])], [c("10Y zero", "Cero 10A"), percent(zero[20])], [c("Max forward", "Forward máximo"), percent(Math.max(...forward))]] }; },
  },
  "rate-conventions": {
    eyebrow: c("ONE PAYOFF · MULTIPLE QUOTE CONVENTIONS", "UN PAYOFF · VARIAS CONVENCIONES"), xLabel: c("Accrual days", "Días de devengo"), yLabel: c("Accumulated interest (bp)", "Interés acumulado (pb)"),
    xAxis: axes.days, yAxis: axes.basisPoints,
    scenarios: [
      { id: "quarter", label: c("3M period", "Periodo 3M"), note: c("Standard money-market accrual", "Devengo monetario estándar"), primary: 91, secondary: 0.0425 },
      { id: "stub", label: c("Long stub", "Stub largo"), note: c("Irregular first coupon", "Primer cupón irregular"), primary: 184, secondary: 0.0425 },
      { id: "leap", label: c("Leap-year window", "Periodo bisiesto"), note: c("Basis difference becomes visible", "La diferencia de base se hace visible"), primary: 366, secondary: 0.0425 },
    ],
    build: (scenario, intensity, locale) => { const days = Math.round(scenario.primary * (0.6 + 0.4 * intensity)); const x = range(41, 0, days); const a360 = x.map((d) => scenario.secondary * d / 360 * 10_000); const a365 = x.map((d) => scenario.secondary * d / 365 * 10_000); const continuous = x.map((d) => (Math.exp(scenario.secondary * d / 365) - 1) * 10_000); return { x, series: [{ name: "ACT/360 simple", values: a360, color: "--chart-series-2" }, { name: "ACT/365F simple", values: a365, color: "--chart-series-3" }, { name: pick(locale, c("continuous", "continuo")), values: continuous, color: "--chart-series-4" }], metrics: [[c("Days", "Días"), days.toString()], [c("ACT/360 accrual", "Devengo ACT/360"), (days / 360).toFixed(6)], [c("Basis cash difference", "Diferencia de caja por base"), `${(a360.at(-1)! - a365.at(-1)!).toFixed(2)} bp`]] }; },
  },
  "ois-compounding": {
    eyebrow: c("DAILY FIXINGS → COMPOUNDED COUPON", "FIXINGS DIARIOS → CUPÓN COMPUESTO"), xLabel: c("Observation day", "Día de observación"), yLabel: c("Annualised overnight rate", "Tipo overnight anualizado"),
    xAxis: axes.days, yAxis: axes.rate,
    scenarios: [
      { id: "hold", label: c("Policy hold", "Tipos sin cambio"), note: c("Stable overnight path", "Trayectoria overnight estable"), primary: 0.041, secondary: 0 },
      { id: "hike", label: c("Meeting hike", "Subida en reunión"), note: c("Step-up after day 15", "Escalón al alza tras el día 15"), primary: 0.041, secondary: 0.005 },
      { id: "cut", label: c("Meeting cut", "Recorte en reunión"), note: c("Step-down after day 15", "Escalón a la baja tras el día 15"), primary: 0.041, secondary: -0.0075 },
    ],
    build: (scenario, intensity, locale) => { const x = range(31, 1, 31); const overnight = x.map((day) => scenario.primary + (day >= 15 ? scenario.secondary * intensity : 0)); let factor = 1; const compound = overnight.map((rate, index) => { factor *= 1 + rate / 360; return (factor - 1) / ((index + 1) / 360); }); return { x, series: [{ name: pick(locale, c("overnight fixing", "fixing overnight")), values: overnight, color: "--chart-series-2" }, { name: pick(locale, c("running compound", "compuesto acumulado")), values: compound, color: "--chart-series-3" }], metrics: [[c("Last fixing", "Último fixing"), percent(overnight.at(-1)!)], [c("Compounded coupon", "Cupón compuesto"), percent(compound.at(-1)!)], [c("Policy step", "Escalón monetario"), basisPoints(scenario.secondary * intensity)]] }; },
  },
  "fra-futures": {
    eyebrow: c("FORWARD FIXING AND MARGINING CONVEXITY", "FIXING FORWARD Y CONVEXIDAD DE MÁRGENES"), xLabel: c("Contract start (years)", "Inicio del contrato (años)"), yLabel: c("Annualised rate", "Tipo anualizado"),
    xAxis: axes.years, yAxis: axes.rate,
    scenarios: [
      { id: "low", label: c("Low volatility", "Volatilidad baja"), note: c("Forward and futures nearly coincide", "Forward y futuro casi coinciden"), primary: 0.008, secondary: 0.15 },
      { id: "high", label: c("High volatility", "Volatilidad alta"), note: c("Convexity grows with horizon", "La convexidad crece con el horizonte"), primary: 0.018, secondary: 0.45 },
      { id: "negative", label: c("Negative correlation", "Correlación negativa"), note: c("Adjustment changes direction", "El ajuste cambia de dirección"), primary: 0.015, secondary: -0.45 },
    ],
    build: (scenario, intensity, locale) => { const x = range(41, 0.25, 10); const forward = x.map((t) => 0.032 + 0.012 * (1 - Math.exp(-t / 4))); const adjustment = x.map((t) => scenario.primary ** 2 * scenario.secondary * intensity * t * (t + 0.25) / 2); const futures = forward.map((rate, index) => rate + adjustment[index]); return { x, series: [{ name: pick(locale, c("forward rate", "tipo forward")), values: forward, color: "--chart-series-3" }, { name: pick(locale, c("futures-equivalent", "equivalente de futuro")), values: futures, color: "--chart-series-2" }], metrics: [[c("10Y adjustment", "Ajuste 10A"), basisPoints(adjustment.at(-1)!)], [c("Rate volatility", "Volatilidad de tipos"), percent(scenario.primary)], [c("Correlation", "Correlación"), scenario.secondary.toFixed(2)]] }; },
  },
  "interest-rate-swaps": {
    eyebrow: c("FIXED ANNUITY · FLOATING PV · PAR RATE", "ANUALIDAD FIJA · VA FLOTANTE · TIPO PAR"), xLabel: c("Swap maturity (years)", "Vencimiento del swap (años)"), yLabel: c("Par / fixed rate", "Tipo par / fijo"),
    xAxis: axes.years, yAxis: axes.rate,
    scenarios: [
      { id: "base", label: c("Base", "Base"), note: c("Gently upward par curve", "Curva par suavemente creciente"), primary: 0.03, secondary: 0.015 },
      { id: "payer", label: c("Rates +50bp", "Tipos +50pb"), note: c("Payer-fixed gains", "Paga fijo gana"), primary: 0.035, secondary: 0.015 },
      { id: "flatten", label: c("Bear flattening", "Aplanamiento bajista"), note: c("Front end rises faster", "El tramo corto sube más"), primary: 0.045, secondary: -0.005 },
    ],
    build: (scenario, intensity, locale) => { const x = range(30, 1, 30); const zero = x.map((t) => scenario.primary + scenario.secondary * intensity * (1 - Math.exp(-t / 7))); const par = x.map((maturity) => { const periods = Array.from({ length: Math.max(1, Math.round(maturity)) }, (_, i) => ({ discount: discountFactor(zero[Math.min(i, zero.length - 1)], i + 1), accrualFactor: 1 })); return parSwapRate(periods); }); const fixed = x.map(() => 0.04); return { x, series: [{ name: pick(locale, c("par swap", "swap par")), values: par, color: "--chart-series-2" }, { name: pick(locale, c("4.00% fixed coupon", "cupón fijo 4,00%")), values: fixed, color: "--chart-series-3" }], metrics: [[c("5Y par", "Par 5A"), percent(par[4])], [c("10Y par", "Par 10A"), percent(par[9])], [c("10Y receiver margin", "Margen receptor 10A"), basisPoints(0.04 - par[9])]] }; },
  },
  "curve-interpolation": {
    eyebrow: c("OFF-GRID FORWARD STABILITY", "ESTABILIDAD FORWARD FUERA DE NODOS"), xLabel: c("Maturity (years)", "Vencimiento (años)"), yLabel: c("Instantaneous forward", "Forward instantáneo"),
    xAxis: axes.years, yAxis: axes.rate,
    scenarios: [
      { id: "clean", label: c("Clean pillars", "Nodos limpios"), note: c("Methods remain controlled", "Los métodos permanecen controlados"), primary: 0.015, secondary: 0.006 },
      { id: "kink", label: c("5Y kink", "Quiebro 5A"), note: c("Node noise creates forward jumps", "El ruido crea saltos forward"), primary: 0.03, secondary: 0.012 },
      { id: "wing", label: c("Long-end extrapolation", "Extrapolación larga"), note: c("Boundary assumption dominates", "Domina el supuesto de frontera"), primary: 0.02, secondary: -0.006 },
    ],
    build: (scenario, intensity, locale) => { const x = range(61, 0.1, 30); const logLinear = x.map((t) => scenario.primary + scenario.secondary * intensity * (Math.floor(t / 5) % 2 ? 1.2 : 0.8)); const smooth = x.map((t) => scenario.primary + scenario.secondary * intensity * (1 - Math.exp(-t / 8)) + (scenario.id === "kink" ? 0.008 * Math.exp(-1 * (((t - 5) / 1.2) ** 2)) : 0)); return { x, series: [{ name: pick(locale, c("log-linear discount", "descuento log-lineal")), values: logLinear, color: "--chart-series-2" }, { name: pick(locale, c("monotone smooth", "monótona suave")), values: smooth, color: "--chart-series-3" }], metrics: [[c("Max forward gap", "Brecha forward máxima"), basisPoints(Math.max(...logLinear.map((value, i) => Math.abs(value - smooth[i]))))], [c("Minimum forward", "Forward mínimo"), percent(Math.min(...smooth))], [c("Boundary state", "Estado de frontera"), pick(locale, scenario.label)]] }; },
  },
  "multi-curve": {
    eyebrow: c("DISCOUNT CURVE ≠ PROJECTION CURVE", "CURVA DE DESCUENTO ≠ CURVA DE PROYECCIÓN"), xLabel: c("Maturity (years)", "Vencimiento (años)"), yLabel: c("Annualised rate", "Tipo anualizado"),
    xAxis: axes.years, yAxis: axes.rate,
    scenarios: [
      { id: "normal", label: c("Normal basis", "Base normal"), note: c("Term projection above OIS", "Proyección term por encima de OIS"), primary: 0.0035, secondary: 0.001 },
      { id: "stress", label: c("Funding stress", "Estrés de financiación"), note: c("Basis widens at the front", "La base se amplía en el corto"), primary: 0.009, secondary: -0.004 },
      { id: "compress", label: c("Basis compression", "Compresión de base"), note: c("Projection converges toward OIS", "La proyección converge hacia OIS"), primary: 0.0015, secondary: 0.0002 },
    ],
    build: (scenario, intensity, locale) => { const x = range(41, 0.25, 20); const ois = x.map((t) => 0.028 + 0.014 * (1 - Math.exp(-t / 6))); const basis = x.map((t) => scenario.primary * intensity + scenario.secondary * Math.exp(-t / 3)); const projection = ois.map((rate, index) => rate + basis[index]); return { x, series: [{ name: "OIS", values: ois, color: "--chart-series-3" }, { name: pick(locale, c("term projection", "proyección term")), values: projection, color: "--chart-series-2" }, { name: pick(locale, c("basis", "base")), values: basis, color: "--chart-series-4" }], metrics: [[c("1Y basis", "Base 1A"), basisPoints(basis[2])], [c("5Y basis", "Base 5A"), basisPoints(basis[10])], [c("10Y projection", "Proyección 10A"), percent(projection[20])]] }; },
  },
  "curve-risk": {
    eyebrow: c("QUOTE-SPACE DV01 AND CURVE FACTORS", "DV01 EN ESPACIO DE COTIZACIONES Y FACTORES"), xLabel: c("Key-rate tenor (years)", "Tenor clave (años)"), yLabel: c("PV / DV01 (currency units)", "VA / DV01 (unidades monetarias)"),
    xAxis: axes.years, yAxis: axes.currencyUnits,
    scenarios: [
      { id: "level", label: c("Parallel +25bp", "Paralelo +25pb"), note: c("Level factor", "Factor de nivel"), primary: 1, secondary: 1 },
      { id: "steepen", label: c("Bear steepener", "Pronunciamiento bajista"), note: c("Long end sells off", "Se vende el tramo largo"), primary: -0.5, secondary: 1.5 },
      { id: "butterfly", label: c("5s10s30s butterfly", "Mariposa 5s10s30s"), note: c("Belly-rich shape", "Enriquecimiento del vientre"), primary: 0.8, secondary: -1 },
    ],
    build: (scenario, intensity, locale) => { const x = [0.5, 1, 2, 3, 5, 7, 10, 15, 20, 30]; const dv01 = x.map((t) => -120 * Math.exp(-1 * (((Math.log(t) - Math.log(7)) / 1.2) ** 2)) * (0.5 + intensity)); const shock = x.map((t) => scenario.id === "level" ? 25 : scenario.id === "steepen" ? -10 + 35 * t / 30 : 20 * Math.exp(-1 * (((t - 10) / 5) ** 2)) * scenario.secondary); const pnl = dv01.map((risk, index) => risk * shock[index]); return { x, series: [{ name: "DV01", values: dv01, color: "--chart-series-3" }, { name: pick(locale, c("scenario P&L / 10", "P&L escenario / 10")), values: pnl.map((value) => value / 10), color: "--chart-series-2" }], metrics: [[c("Net DV01", "DV01 neto"), dv01.reduce((sum, value) => sum + value, 0).toFixed(1)], [c("Full scenario P&L", "P&L de escenario"), pnl.reduce((sum, value) => sum + value, 0).toFixed(0)], [c("Largest bucket", "Mayor bucket"), `${x[dv01.indexOf(Math.min(...dv01))]}Y`]] }; },
  },
  "hull-white": {
    eyebrow: c("MEAN REVERSION AND GAUSSIAN RATE DISPERSION", "REVERSIÓN A LA MEDIA Y DISPERSIÓN GAUSSIANA"), xLabel: c("Horizon (years)", "Horizonte (años)"), yLabel: c("Factor response / volatility", "Respuesta del factor / volatilidad"),
    xAxis: axes.years, yAxis: axes.factorValue,
    scenarios: [
      { id: "slow", label: c("Slow reversion", "Reversión lenta"), note: c("Shocks persist across the curve", "Los shocks persisten en la curva"), primary: 0.03, secondary: 0.01 },
      { id: "fast", label: c("Fast reversion", "Reversión rápida"), note: c("Short-rate shock decays quickly", "El shock corto decae rápido"), primary: 0.2, secondary: 0.01 },
      { id: "vol", label: c("High rate volatility", "Volatilidad de tipos alta"), note: c("Distribution widens", "La distribución se ensancha"), primary: 0.08, secondary: 0.02 },
    ],
    build: (scenario, intensity, locale) => { const x = range(61, 0, 30); const decay = x.map((t) => Math.exp(-scenario.primary * t)); const sigma = x.map((t) => scenario.secondary * intensity * Math.sqrt((1 - Math.exp(-2 * scenario.primary * t)) / (2 * scenario.primary))); return { x, series: [{ name: pick(locale, c("shock persistence", "persistencia del shock")), values: decay, color: "--chart-series-2" }, { name: pick(locale, c("short-rate std dev", "desv. típica del tipo corto")), values: sigma, color: "--chart-series-3" }], metrics: [[c("Mean reversion", "Reversión a la media"), scenario.primary.toFixed(3)], [c("Long-run factor std", "Desv. típica límite"), percent(scenario.secondary * intensity / Math.sqrt(2 * scenario.primary))], [c("10Y persistence", "Persistencia 10A"), percent(decay[20])]] }; },
  },
  "rate-optionality": {
    eyebrow: c("ONE PAYOFF · EXPLICIT VOLATILITY COORDINATE", "UN PAYOFF · COORDENADA DE VOLATILIDAD EXPLÍCITA"), xLabel: c("Strike (annual rate)", "Strike (tipo anual)"), yLabel: c("Premium per unit notional", "Prima por unidad de nocional"),
    xAxis: axes.strikeRate, yAxis: axes.premium,
    scenarios: [
      { id: "black", label: c("Lognormal Black", "Black lognormal"), note: c("Positive forward and strike", "Forward y strike positivos"), primary: 0.24, secondary: 0.032 },
      { id: "normal", label: c("Normal Bachelier", "Bachelier normal"), note: c("Absolute rate volatility", "Volatilidad en unidades absolutas de tipo"), primary: 0.009, secondary: 0.012 },
      { id: "shifted", label: c("Shifted lognormal", "Lognormal desplazado"), note: c("Negative forward with a 3% shift", "Forward negativo con desplazamiento del 3%"), primary: 0.3, secondary: -0.005 },
    ],
    build: (scenario, intensity, locale) => {
      const x = range(61, -0.015, 0.075); const expiry = 2; const annuity = 4.35; const rootT = Math.sqrt(expiry); const normalPdf = (z: number) => Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI); const normalCdf = (z: number) => 0.5 * (1 + Math.sign(z) * Math.sqrt(1 - Math.exp(-2 * z * z / Math.PI))); const forward = scenario.secondary; const shifted = scenario.id === "shifted" ? 0.03 : 0; const vol = scenario.primary * (0.55 + 0.45 * intensity);
      const payer = x.map((strike) => { if (scenario.id === "normal") { const std = vol * rootT; const z = (forward - strike) / std; return annuity * ((forward - strike) * normalCdf(z) + std * normalPdf(z)); } const shiftedForward = forward + shifted; const shiftedStrike = strike + shifted; if (shiftedStrike <= 0) return annuity * Math.max(forward - strike, 0); const d1 = (Math.log(shiftedForward / shiftedStrike) + 0.5 * vol * vol * expiry) / (vol * rootT); const d2 = d1 - vol * rootT; return annuity * (shiftedForward * normalCdf(d1) - shiftedStrike * normalCdf(d2)); });
      const intrinsic = x.map((strike) => annuity * Math.max(forward - strike, 0)); const atmIndex = x.reduce((best, strike, index) => Math.abs(strike - forward) < Math.abs(x[best] - forward) ? index : best, 0); return { x, series: [{ name: pick(locale, c("payer premium", "prima payer")), values: payer, color: "--chart-series-2" }, { name: pick(locale, c("intrinsic value", "valor intrínseco")), values: intrinsic, color: "--chart-series-3" }], metrics: [[c("Forward swap rate", "Tipo swap forward"), percent(forward)], [c("ATM premium", "Prima ATM"), payer[atmIndex].toFixed(5)], [c("Quote volatility", "Volatilidad cotizada"), scenario.id === "normal" ? `${(vol * 10_000).toFixed(0)} bp` : percent(vol)]] };
    },
  },
  hjm: {
    eyebrow: c("FORWARD VOLATILITY DETERMINES RISK-NEUTRAL DRIFT", "LA VOLATILIDAD FORWARD DETERMINA EL DRIFT"), xLabel: c("Forward maturity (years)", "Vencimiento forward (años)"), yLabel: c("Instantaneous forward", "Forward instantáneo"),
    xAxis: axes.years, yAxis: axes.rate,
    scenarios: [
      { id: "one", label: c("One-factor decay", "Decaimiento unifactorial"), note: c("Linked level-like curve move", "Movimiento ligado tipo nivel"), primary: 0.012, secondary: 0.15 },
      { id: "persistent", label: c("Persistent volatility", "Volatilidad persistente"), note: c("Long-end forwards remain volatile", "Los forwards largos siguen volátiles"), primary: 0.016, secondary: 0.04 },
      { id: "policy", label: c("Policy shock", "Shock monetario"), note: c("Front-end factor dominates", "Domina el factor corto"), primary: 0.02, secondary: 0.35 },
    ],
    build: (scenario, intensity, locale) => { const x = range(61, 0.01, 30); const initial = x.map((t) => 0.027 + 0.018 * (1 - Math.exp(-t / 6))); const sigma = x.map((t) => scenario.primary * Math.exp(-scenario.secondary * t)); const integral = sigma.map((_, index) => sigma.slice(0, index + 1).reduce((sum, value) => sum + value, 0) * (x[1] - x[0])); const drift = sigma.map((value, index) => value * integral[index]); const evolved = initial.map((rate, index) => rate + drift[index] * intensity + sigma[index] * intensity * 0.25); return { x, series: [{ name: pick(locale, c("initial forward", "forward inicial")), values: initial, color: "--chart-series-3" }, { name: pick(locale, c("evolved forward", "forward evolucionado")), values: evolved, color: "--chart-series-2" }, { name: pick(locale, c("HJM drift ×10", "drift HJM ×10")), values: drift.map((value) => value * 10), color: "--chart-series-4" }], metrics: [[c("Front volatility", "Volatilidad corta"), percent(scenario.primary)], [c("Max HJM drift", "Drift HJM máximo"), basisPoints(Math.max(...drift))], [c("30Y forward move", "Movimiento forward 30A"), basisPoints(evolved.at(-1)! - initial.at(-1)!)]] }; },
  },
};

export function RatesConceptLab({ lesson }: { lesson: AcademyLesson }) {
  const { locale } = useI18n();
  const lab = lesson.interactiveLabs[0];
  const definition = definitions[lab?.id];
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [intensity, setIntensity] = useState(0.7);
  const scenario = definition?.scenarios[scenarioIndex] ?? definition?.scenarios[0];
  const result = useMemo(() => definition && scenario ? definition.build(scenario, intensity, locale) : undefined, [definition, scenario, intensity, locale]);
  if (!definition || !scenario || !result) return null;
  const xLabel = pick(locale, definition.xLabel);
  const yLabel = pick(locale, definition.yLabel);

  return <div className="vol-concept-lab rates-concept-lab">
    <header><div><span>{pick(locale, definition.eyebrow)}</span><h3>{lab.title}</h3><p>{lab.description}</p></div><b>{pick(locale, c("SYNTHETIC · CONTROLLED SCENARIOS", "SINTÉTICO · ESCENARIOS CONTROLADOS"))}</b></header>
    <div className="vol-concept-scenarios" aria-label={pick(locale, c(`${lesson.title} scenarios`, `Escenarios de ${lesson.title}`))}>{definition.scenarios.map((item, index) => <button type="button" className={index === scenarioIndex ? "active" : ""} aria-pressed={index === scenarioIndex} onClick={() => setScenarioIndex(index)} key={item.id}><b>{pick(locale, item.label)}</b><small>{pick(locale, item.note)}</small></button>)}</div>
    <label className="vol-concept-intensity"><span><b>{pick(locale, c("SCENARIO INTENSITY", "INTENSIDAD DEL ESCENARIO"))}</b><output>{Math.round(intensity * 100)}%</output></span><input aria-label={pick(locale, c("Scenario intensity", "Intensidad del escenario"))} type="range" min="0" max="1" step="0.01" value={intensity} onChange={(event) => setIntensity(Number(event.target.value))} /></label>
    <div className="vol-concept-metrics">{result.metrics.map(([label, value]) => <div key={label.en}><span>{pick(locale, label)}</span><b>{value}</b></div>)}</div>
    <div className="vol-concept-chart"><LineChart x={result.x} series={result.series} xLabel={xLabel} yLabel={yLabel} description={`${pick(locale, scenario.label)}: ${pick(locale, scenario.note)}.`} xFormatter={definition.xAxis.formatter} yFormatter={definition.yAxis.formatter} height={410} /></div>
    <footer><span>{pick(locale, c("ACTIVE STATE", "ESTADO ACTIVO"))}</span><p><b>{pick(locale, scenario.label)}</b> — {pick(locale, scenario.note)}. {pick(locale, c("Move the control and inspect every series with pointer or touch.", "Mueve el control e inspecciona cada serie con puntero o toque."))}</p></footer>
  </div>;
}
