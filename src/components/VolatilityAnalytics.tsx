"use client";

import type { ReactNode } from "react";
import { pick, useI18n } from "@/src/i18n";

export function VolatilityAnalytics({ lab }: { lab: ReactNode }) {
  const { locale } = useI18n();
  return <div className="vol-analytics"><header className="vol-analytics-intro section-shell"><span className="eyebrow">{pick(locale, { en: "ANALYTICS · VOLATILITY", es: "ANALÍTICA · VOLATILIDAD" })}</span><p>{pick(locale, { en: "One canonical workbench links exact values, surface geometry and two-dimensional slices without introducing market data or forecasts.", es: "Una estación canónica conecta valores exactos, geometría de superficie y cortes bidimensionales sin incorporar datos de mercado ni previsiones." })}</p></header><section className="section-shell">{lab}</section></div>;
}
