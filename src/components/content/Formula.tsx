import katex from "katex";

export function Formula({ latex, block = true }: { latex: string; block?: boolean }) {
  const html = katex.renderToString(latex, { displayMode: block, throwOnError: false, strict: false });
  return <div className={block ? "formula-block" : "formula-inline"} role="math" aria-label={latex} dangerouslySetInnerHTML={{ __html: html }} />;
}
