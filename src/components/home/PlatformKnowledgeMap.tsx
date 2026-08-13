"use client";

import { useMemo, useState } from "react";
import { getLocalizedPlatformMap, getPlatformMapSelection, type PlatformMapNodeKind } from "@/src/content/platformMap";
import { useI18n } from "@/src/i18n";

const mapGroups: Array<{
  kind: PlatformMapNodeKind;
  labelKey: "home.map.groupPlatform" | "home.map.groupTracks" | "home.map.groupWorkflows";
}> = [
  { kind: "platform", labelKey: "home.map.groupPlatform" },
  { kind: "track", labelKey: "home.map.groupTracks" },
  { kind: "workflow", labelKey: "home.map.groupWorkflows" },
];

export function PlatformKnowledgeMap() {
  const { locale, t } = useI18n();
  const { nodes, edges } = useMemo(() => getLocalizedPlatformMap(locale), [locale]);
  const [selectedId, setSelectedId] = useState("academy");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const highlightedId = previewId ?? selectedId;
  const highlightedIds = useMemo(
    () => new Set(getPlatformMapSelection(highlightedId).map((node) => node.id)),
    [highlightedId],
  );
  const nodeById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);
  const selected = nodeById.get(selectedId) ?? nodes[0]!;
  const trackCount = nodes.filter((node) => node.kind === "track").length;
  const workflowCount = nodes.filter((node) => node.kind === "workflow").length;

  return (
    <section className="platform-knowledge-map section-shell" aria-labelledby="platform-map-title">
      <header className="platform-map-header">
        <div>
          <span className="eyebrow">{t("home.map.eyebrow")}</span>
          <h2 id="platform-map-title">{t("home.map.title")}</h2>
          <p>{t("home.map.copy")}</p>
        </div>
        <p className="platform-map-counts" aria-label={`${trackCount} ${t("home.map.tracks")}, ${workflowCount} ${t("home.map.workflows")}`}>
          <strong>{trackCount}</strong> {t("home.map.tracks")} <span>·</span> <strong>{workflowCount}</strong> {t("home.map.workflows")}
        </p>
      </header>

      <p className="platform-map-instructions" id="platform-map-instructions">{t("home.map.instructions")}</p>

      <div className="platform-map-layout">
        <div className="platform-map-stage" aria-describedby="platform-map-instructions">
          <svg className="platform-map-edges" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {edges.map((edge) => {
              const source = nodeById.get(edge.source);
              const target = nodeById.get(edge.target);
              if (!source || !target) return null;
              const active = edge.source === highlightedId || edge.target === highlightedId;
              return <line className={active ? "is-active" : "is-muted"} key={`${edge.source}-${edge.target}`} x1={source.x} y1={source.y} x2={target.x} y2={target.y} vectorEffect="non-scaling-stroke" />;
            })}
          </svg>

          <div className="platform-map-groups">
            {mapGroups.map((group) => (
              <div className="platform-map-group" data-map-group={group.kind} role="group" aria-labelledby={`platform-map-group-${group.kind}`} key={group.kind}>
                <h3 id={`platform-map-group-${group.kind}`}>{t(group.labelKey)}</h3>
                <ul>
                  {nodes.filter((node) => node.kind === group.kind).map((node) => {
                    const isSelected = node.id === selectedId;
                    const isHighlighted = node.id === highlightedId;
                    const isRelated = highlightedIds.has(node.id) && !isHighlighted;
                    const className = [
                      "platform-map-node",
                      isSelected ? "is-selected" : "",
                      isHighlighted ? "is-highlighted" : "",
                      isRelated ? "is-related" : "",
                      highlightedIds.has(node.id) ? "" : "is-muted",
                    ].filter(Boolean).join(" ");
                    return (
                      <li
                        className={className}
                        data-kind={node.kind}
                        key={node.id}
                        style={{ left: `${node.x}%`, top: `${node.y}%` }}
                        onMouseEnter={() => setPreviewId(node.id)}
                        onMouseLeave={() => setPreviewId(null)}
                        onFocus={() => setPreviewId(node.id)}
                        onBlur={(event) => {
                          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPreviewId(null);
                        }}
                      >
                        <button
                          type="button"
                          data-map-node={node.id}
                          aria-controls="platform-map-detail"
                          aria-describedby={`platform-map-node-description-${node.id}`}
                          aria-label={`${t("home.map.select")} ${node.label}`}
                          aria-pressed={isSelected}
                          onClick={() => setSelectedId(node.id)}
                        >
                          <span>{node.label}</span>
                          <small id={`platform-map-node-description-${node.id}`}>{node.description}</small>
                        </button>
                        <a href={node.href} aria-label={`${t("home.map.open")} ${node.label}`}>↗</a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <aside className="platform-map-detail" id="platform-map-detail" aria-live="polite" aria-atomic="true">
          <span>{t("home.map.selected")}</span>
          <h3>{selected.label}</h3>
          <p>{selected.description}</p>
          <a className="button button-primary" href={selected.href}>{t("home.map.cta")} <span aria-hidden="true">→</span></a>
        </aside>
      </div>
    </section>
  );
}
