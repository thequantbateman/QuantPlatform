"use client";

import { pick, useI18n } from "@/src/i18n";

const articles = {
  en: [
    { category: "MODEL DEBATES", title: "Is Local Vol Actually Useful?", deck: "Perfect vanilla calibration, deterministic smile dynamics, and a very particular relationship with forward skew.", read: "8 MIN", quote: "A fit is a property of today’s surface. A hedge is a theory about tomorrow’s." },
    { category: "QUANT THOUGHTS", title: "Sticky Delta vs Sticky Strike", deck: "What are we actually assuming when spot moves and the implied-volatility surface must follow—or refuse?", read: "6 MIN", quote: "Your surface moved. The convention merely chose how to describe the scene." },
    { category: "RESEARCH", title: "Why your model calibration is not your model.", deck: "Objective functions, identifiability, parameter stability and the things a small RMSE does not tell you.", read: "10 MIN", quote: "Excellent. The optimizer has given up before you did." },
    { category: "QUESTIONS", title: "Should every desk own a differentiable pricer?", deck: "AAD, automatic differentiation and the architecture tax behind attractive gradient benchmarks.", read: "5 MIN", quote: "A gradient is only cheap after somebody pays for the tape." },
  ],
  es: [
    { category: "DEBATES DE MODELOS", title: "¿Es realmente útil la volatilidad local?", deck: "Calibración perfecta de vanillas, dinámica determinista de sonrisa y una relación muy particular con el skew forward.", read: "8 MIN", quote: "El ajuste pertenece a la superficie de hoy. La cobertura es una teoría sobre mañana." },
    { category: "REFLEXIONES QUANT", title: "Sticky Delta frente a Sticky Strike", deck: "¿Qué suponemos realmente cuando se mueve el spot y la superficie implícita debe acompañarlo —o negarse?", read: "6 MIN", quote: "La superficie se movió. La convención solo eligió cómo describir la escena." },
    { category: "INVESTIGACIÓN", title: "Por qué calibrar el modelo no define el modelo.", deck: "Funciones objetivo, identificabilidad, estabilidad paramétrica y lo que un RMSE pequeño no revela.", read: "10 MIN", quote: "Excelente. El optimizador se rindió antes que tú." },
    { category: "PREGUNTAS", title: "¿Debe cada mesa tener un pricer diferenciable?", deck: "AAD, diferenciación automática y el coste arquitectónico detrás de benchmarks atractivos.", read: "5 MIN", quote: "Un gradiente solo es barato después de que alguien pague por la cinta." },
  ],
};

export function DeskEditorial() {
  const { locale } = useI18n(); const entries = articles[locale];
  const discuss = pick(locale, { en: "Discuss with tutor", es: "Comentar con el tutor" });
  return <><header className="page-hero section-shell desk-hero"><div><span className="eyebrow">{pick(locale, { en: "THE DESK · EDITORIAL PROTOTYPE", es: "LA MESA · PROTOTIPO EDITORIAL" })}</span><h1>{pick(locale, { en: <>NOTES WITH<br /><em>CONSEQUENCES.</em></>, es: <>NOTAS CON<br /><em>CONSECUENCIAS.</em></> })}</h1></div><p>{pick(locale, { en: "Models, markets and research—written for people who eventually have to hedge the answer.", es: "Modelos, mercados e investigación para quienes finalmente deben cubrir la respuesta." })}</p></header><section className="desk-layout section-shell"><article className="featured-story"><span className="eyebrow">{pick(locale, { en: "FEATURED", es: "DESTACADO" })} · {entries[0].category}</span><div className="editorial-visual"><div className="local-vol-lines">{Array.from({ length: 18 }, (_, index) => <i key={index} style={{ transform: `rotate(${index * 10}deg)`, opacity: 0.18 + index * 0.035 }} />)}</div><span>σ<sub>loc</sub>(S,t)</span></div><h2>{entries[0].title}</h2><p>{entries[0].deck}</p><blockquote>“{entries[0].quote}”</blockquote><footer><span>{entries[0].read} {pick(locale, { en: "READ", es: "LECTURA" })}</span><a href={`/ask?topic=${encodeURIComponent(entries[0].title)}`}>{discuss} →</a></footer></article><div className="story-list">{entries.slice(1).map((article, index) => <article key={article.title}><header><span className="eyebrow">{article.category}</span><span>0{index + 2}</span></header><h2>{article.title}</h2><p>{article.deck}</p><blockquote>“{article.quote}”</blockquote><footer><span>{article.read} {pick(locale, { en: "READ", es: "LECTURA" })}</span><a href={`/ask?topic=${encodeURIComponent(article.title)}`}>{discuss} →</a></footer></article>)}</div></section></>;
}
