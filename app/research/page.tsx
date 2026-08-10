import type { Metadata } from "next";
import { AppShell } from "@/src/components/AppShell";
import { assetPath, contentCatalog } from "@/src/content/catalog";

export const metadata: Metadata = { title: "Quant Frontier", description: "Industry-standard methods separated clearly from active quantitative research." };

const status: Record<string, string> = { AAD: "INDUSTRY STANDARD", "GPU Monte Carlo": "INDUSTRY STANDARD", "Machine Learning Surrogates": "ACTIVE DEPLOYMENT", "Differentiable Pricing": "EMERGING", "Rough Volatility": "ACTIVE RESEARCH", "Deep Hedging": "ACTIVE RESEARCH", "Neural SDEs": "ACTIVE RESEARCH", "Bayesian Calibration": "ACTIVE RESEARCH" };

export default function ResearchPage() {
  const topics = contentCatalog.filter((entry) => entry.assetClass === "Frontier");
  return <AppShell><header className="page-hero section-shell research-hero"><span className="eyebrow">QUANT FRONTIER · RESEARCH MAP</span><h1>THE EDGE,<br /><em>WITHOUT THE HYPE.</em></h1><p>Production technique, emerging infrastructure and active research are not interchangeable labels. We keep them visible.</p></header><section className="research-grid section-shell">{topics.map((topic, index) => <a className="research-card" href={`/learn/${assetPath(topic.assetClass)}/${topic.slug}`} key={topic.slug}><header><span className="card-index">{String(index + 1).padStart(2, "0")}</span><b className={`research-status status-${status[topic.title].toLowerCase().replaceAll(" ", "-")}`}>{status[topic.title]}</b></header><h2>{topic.title}</h2><p>{topic.description}</p><div><span>{topic.type}</span><span>{topic.difficulty}</span><i>↗</i></div></a>)}</section><section className="research-note section-shell"><span className="eyebrow light">RESEARCH DISCIPLINE</span><h2>Fit is not evidence.<br />Speed is not governance.</h2><p>Experimental methods require benchmark error, stability domains, fallback models and production monitoring before they earn desk-standard status.</p></section></AppShell>;
}
