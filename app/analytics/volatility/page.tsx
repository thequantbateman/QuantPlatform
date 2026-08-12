import type { Metadata } from "next";
import { AppShell } from "@/src/components/AppShell";
import { LazyVolSurfaceLab } from "@/src/components/academy/LazyVolSurfaceLab";

export const metadata: Metadata = { title: "Volatility Surface Workbench · Analytics", description: "A deterministic educational implied-volatility surface with four linked analytical views." };

export default function VolatilityAnalyticsPage() {
  return <AppShell><div className="vol-analytics"><header className="page-hero compact-hero section-shell"><span className="eyebrow">ANALYTICS · VOLATILITY</span><h1>SURFACE,<br /><em>IN STATE.</em></h1><p>One deterministic synthetic grid, inspected through exact values, a heatmap, linked slices and an optional rotatable 3D projection.</p></header><section className="section-shell"><LazyVolSurfaceLab compact /></section><section className="method-note section-shell"><span>METHOD</span><p>Educational parameters generate the displayed grid locally. No observed quote, live market surface or forecast enters this workbench.</p></section></div></AppShell>;
}
