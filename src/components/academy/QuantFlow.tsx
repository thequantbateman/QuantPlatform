export type QuantNodeKind = "information" | "measure" | "model" | "market" | "risk";

export interface QuantNode {
  id: string;
  label: string;
  value: string;
  detail: string;
  kind?: QuantNodeKind;
}

export function QuantFlow({ eyebrow, title, thesis, nodes }: { eyebrow: string; title: string; thesis: string; nodes: QuantNode[] }) {
  return <figure className="quant-flow">
    <figcaption><span>{eyebrow}</span><h3>{title}</h3><p>{thesis}</p></figcaption>
    <div className="quant-flow-track">
      {nodes.map((node, index) => <div className="quant-flow-step" key={node.id}>
        <article className={`quant-node kind-${node.kind ?? "model"}`} aria-describedby={`${node.id}-detail`}>
          <span>{String(index + 1).padStart(2, "0")}</span><b>{node.label}</b><code>{node.value}</code><p id={`${node.id}-detail`}>{node.detail}</p>
        </article>
        {index < nodes.length - 1 && <i className="quant-edge" aria-hidden="true"><span>→</span></i>}
      </div>)}
    </div>
  </figure>;
}
