"use client";

import { useEffect, useMemo, useState } from "react";
import { scenariosForLab } from "@/src/analytics/guidance/scenarios";
import type { AnalyticsLabId, AnalyticsPrimitive, AnalyticsScenario } from "@/src/analytics/guidance/types";
import { pick, useI18n } from "@/src/i18n";

interface AnalyticsGuideProps {
  labId: AnalyticsLabId;
  activeScenarioId: string | null;
  snapshots?: {
    before: Readonly<Record<string, AnalyticsPrimitive>>;
    after: Readonly<Record<string, AnalyticsPrimitive>>;
  } | null;
  onApply: (scenario: AnalyticsScenario) => void;
  onReset: () => void;
  onManual: () => void;
  onAsk: () => void;
}

const HINT_STORAGE_PREFIX = "tqb-analytics-hint-v1:";

export function AnalyticsGuide({
  labId,
  activeScenarioId,
  snapshots = null,
  onApply,
  onReset,
  onManual,
  onAsk,
}: AnalyticsGuideProps) {
  const { formatNumber, locale, t } = useI18n();
  const scenarios = useMemo(() => scenariosForLab(labId), [labId]);
  const activeScenario = scenarios.find(({ id }) => id === activeScenarioId) ?? null;
  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try { setShowHint(localStorage.getItem(`${HINT_STORAGE_PREFIX}${labId}`) !== "dismissed"); } catch { /* Storage is optional. */ }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [labId]);

  const dismissHint = () => {
    setShowHint(false);
    try { localStorage.setItem(`${HINT_STORAGE_PREFIX}${labId}`, "dismissed"); } catch { /* Storage is optional. */ }
  };

  const format = (value: AnalyticsPrimitive) => typeof value === "number"
    ? formatNumber(value, { maximumFractionDigits: 4 })
    : String(value);

  return (
    <section className="analytics-guide" data-analytics-guide={labId} aria-labelledby={`${labId}-guide-title`}>
      <header className="analytics-guide-header">
        <div>
          <span>{t("analytics.guide.eyebrow")}</span>
          <h2 id={`${labId}-guide-title`}>{t("analytics.guide.title")}</h2>
        </div>
        <p>{t("analytics.guide.copy")}</p>
      </header>

      {showHint && <div className="analytics-guide-hint" role="note">
        <p><strong>{t("analytics.guide.hintTitle")}</strong>{t("analytics.guide.hintCopy")}</p>
        <button type="button" onClick={dismissHint}>{t("analytics.guide.dismiss")}</button>
      </div>}

      <div className="analytics-guide-scenarios" aria-label={t("analytics.guide.firstTry")}>
        {scenarios.map((scenario) => <button
          type="button"
          key={scenario.id}
          data-analytics-scenario={scenario.id}
          className={activeScenarioId === scenario.id ? "active" : ""}
          aria-pressed={activeScenarioId === scenario.id}
          onClick={() => onApply(scenario)}
        >
          <span>{pick(locale, scenario.name)}</span>
          <small>{t(`analytics.guide.difficulty.${scenario.difficulty}`)}</small>
        </button>)}
      </div>

      <div className="analytics-guide-actions">
        <span>{t("analytics.guide.firstTry")}</span>
        <div>
          <button type="button" onClick={onReset} disabled={!activeScenario}>{t("analytics.guide.resetExample")}</button>
          <button type="button" onClick={onManual}>{t("analytics.guide.manual")}</button>
        </div>
      </div>

      {activeScenario && <details className="analytics-guide-detail" open>
        <summary>{pick(locale, activeScenario.name)} · {t("analytics.guide.openExplanation")}</summary>
        <div className="analytics-guide-detail-grid">
          <article><span>{t("analytics.guide.objective")}</span><p>{pick(locale, activeScenario.learningObjective)}</p></article>
          <article><span>{t("analytics.guide.change")}</span><ol>{activeScenario.suggestedInteractions.map((entry, index) => <li key={`${activeScenario.id}-${index}`}>{pick(locale, entry)}</li>)}</ol></article>
          <article><span>{t("analytics.guide.watch")}</span><p>{pick(locale, activeScenario.expectedObservation)}</p></article>
          <article><span>{t("analytics.guide.why")}</span><p>{pick(locale, activeScenario.explanation)}</p></article>
          <article><span>{t("analytics.guide.boundary")}</span><p>{pick(locale, activeScenario.modelBoundary)}</p></article>
          {snapshots && <article className="analytics-guide-snapshot"><span>{t("analytics.guide.beforeAfter")}</span><dl>{Object.keys({ ...snapshots.before, ...snapshots.after }).map((key) => <div key={key}><dt>{key}</dt><dd>{snapshots.before[key] === undefined ? "—" : format(snapshots.before[key])} → {snapshots.after[key] === undefined ? "—" : format(snapshots.after[key])}</dd></div>)}</dl></article>}
        </div>
        <footer>
          {activeScenario.academyHref && <a href={activeScenario.academyHref}>{t("analytics.guide.academy")} →</a>}
          <button type="button" onClick={onAsk}>{t("analytics.guide.ask")}</button>
        </footer>
      </details>}
    </section>
  );
}
