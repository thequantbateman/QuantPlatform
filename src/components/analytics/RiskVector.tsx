"use client";

import { useI18n, type DictionaryKey } from "@/src/i18n";
import type { DeskGreeks } from "@/src/quant/portfolio/types";

const greekRows: Array<{
  key: keyof DeskGreeks;
  label: string;
  unit: DictionaryKey;
}> = [
  { key: "delta", label: "Delta", unit: "analytics.risk.deltaUnit" },
  { key: "gamma", label: "Gamma", unit: "analytics.risk.gammaUnit" },
  { key: "vega", label: "Vega", unit: "analytics.risk.vegaUnit" },
  { key: "theta", label: "Theta", unit: "analytics.risk.thetaUnit" },
  { key: "rho", label: "Rho", unit: "analytics.risk.rhoUnit" },
];

function signed(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

export function RiskVector({
  label,
  greeks,
  comparison,
}: {
  label: string;
  greeks: DeskGreeks;
  comparison?: DeskGreeks;
}) {
  const { t, formatNumber } = useI18n();
  return (
    <section className="analytics-risk-vector" aria-label={label}>
      <header>
        <h3>{label}</h3>
        <span>{t("analytics.risk.deskUnits")}</span>
      </header>
      <dl>
        {greekRows.map((row) => (
          <div key={row.key}>
            <dt>{row.label}<small>{t(row.unit)}</small></dt>
            <dd>{formatNumber(greeks[row.key], { maximumFractionDigits: 4 })}</dd>
            {comparison && (
              <small>
                {t("analytics.risk.change")} {signed(greeks[row.key] - comparison[row.key])}
              </small>
            )}
          </div>
        ))}
      </dl>
    </section>
  );
}
