import type { Metadata } from "next";
import { AppShell } from "@/src/components/AppShell";

export const metadata: Metadata = { title: "The Desk", description: "Editorial quantitative finance notes, market debates and research questions." };

const articles = [
  { category: "MODEL DEBATES", title: "Is Local Vol Actually Useful?", deck: "Perfect vanilla calibration, deterministic smile dynamics, and a very particular relationship with forward skew.", read: "8 MIN", quote: "A fit is a property of today’s surface. A hedge is a theory about tomorrow’s." },
  { category: "QUANT THOUGHTS", title: "Sticky Delta vs Sticky Strike", deck: "What are we actually assuming when spot moves and the implied-volatility surface must follow—or refuse?", read: "6 MIN", quote: "Your surface moved. The convention merely chose how to describe the scene." },
  { category: "RESEARCH", title: "Why your model calibration is not your model.", deck: "Objective functions, identifiability, parameter stability and the things a small RMSE does not tell you.", read: "10 MIN", quote: "Excellent. The optimizer has given up before you did." },
  { category: "QUESTIONS", title: "Should every desk own a differentiable pricer?", deck: "AAD, automatic differentiation and the architecture tax behind attractive gradient benchmarks.", read: "5 MIN", quote: "A gradient is only cheap after somebody pays for the tape." },
];

export default function DeskPage() {
  return <AppShell><header className="page-hero section-shell desk-hero"><div><span className="eyebrow">THE DESK · EDITORIAL PROTOTYPE</span><h1>NOTES WITH<br /><em>CONSEQUENCES.</em></h1></div><p>Models, markets and research—written for people who eventually have to hedge the answer.</p></header><section className="desk-layout section-shell"><article className="featured-story"><span className="eyebrow">FEATURED · {articles[0].category}</span><div className="editorial-visual"><div className="local-vol-lines">{Array.from({ length: 18 }, (_, index) => <i key={index} style={{ transform: `rotate(${index * 10}deg)`, opacity: 0.18 + index * 0.035 }} />)}</div><span>σ<sub>loc</sub>(S,t)</span></div><h2>{articles[0].title}</h2><p>{articles[0].deck}</p><blockquote>“{articles[0].quote}”</blockquote><footer><span>{articles[0].read} READ</span><button type="button">Read article →</button></footer></article><div className="story-list">{articles.slice(1).map((article, index) => <article key={article.title}><header><span className="eyebrow">{article.category}</span><span>0{index + 2}</span></header><h2>{article.title}</h2><p>{article.deck}</p><blockquote>“{article.quote}”</blockquote><footer><span>{article.read} READ</span><button type="button">Open note →</button></footer></article>)}</div></section></AppShell>;
}
