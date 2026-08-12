"use client";

import type { ReactNode } from "react";
import { pick, useI18n } from "@/src/i18n";

export function VolatilityAnalytics({ lab }: { lab: ReactNode }) {
  const { locale } = useI18n();
  return <div className="vol-analytics"><header className="page-hero compact-hero section-shell"><span className="eyebrow">{pick(locale, { en: "ANALYTICS · VOLATILITY", es: "ANALÍTICA · VOLATILIDAD" })}</span><h1>{pick(locale, { en: <>SURFACE,<br /><em>IN STATE.</em></>, es: <>SUPERFICIE,<br /><em>EN ESTADO.</em></> })}</h1><p>{pick(locale, { en: "One deterministic synthetic grid, inspected through exact values, a heatmap, linked slices and an optional rotatable 3D projection.", es: "Una malla sintética determinista inspeccionada mediante valores exactos, heatmap, cortes conectados y proyección 3D rotatoria." })}</p></header><section className="section-shell">{lab}</section><section className="method-note section-shell"><span>{pick(locale, { en: "METHOD", es: "MÉTODO" })}</span><p>{pick(locale, { en: "Educational parameters generate the displayed grid locally. No observed quote, live market surface or forecast enters this workbench.", es: "Parámetros educativos generan localmente la malla. No se usan cotizaciones observadas, superficies en vivo ni previsiones." })}</p></section></div>;
}
