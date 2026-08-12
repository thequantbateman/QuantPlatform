import type { Metadata } from "next";
import { AppShell } from "@/src/components/AppShell";

const tools = [
  ["01", "European option pricer", "BSM · Garman–Kohlhagen · Black-76", "/lab?lab=vanilla"],
  ["02", "Greeks dashboard", "Delta · Gamma · Vega · Theta · Rho", "/lab?lab=greeks"],
  ["03", "Volatility surface workbench", "3D · Heatmap · Smile · Term · Scenarios", "/analytics/volatility"],
  ["04", "Yield-curve engine", "Discount factors · Zeroes · Forwards", "/lab?lab=curve"],
];
export const metadata: Metadata = { title: "Analytics · TheQuantBateman", description: "Deterministic pricing, Greeks, volatility and curve analytics." };
export default function AnalyticsPage() { return <AppShell><div className="analytics-hub"><header className="page-hero compact-hero section-shell"><span className="eyebrow">QUANT ENGINE · DETERMINISTIC</span><h1>ANALYTICS,<br /><em>NOT ORACLES.</em></h1><p>Inspect assumptions, move parameters and reproduce every number through the platform’s typed pricing engine.</p></header><section className="analytics-tool-grid section-shell">{tools.map(([index, title, copy, href]) => <a href={href} key={title}><span>{index}</span><h2>{title}</h2><p>{copy}</p><b>OPEN TOOL →</b></a>)}</section><section className="method-note section-shell"><span>AUTHORITY ORDER</span><p>Quant engine for calculations → market providers for observed prices → local Learn corpus for definitions → AI only for explanation and navigation.</p></section></div></AppShell>; }
