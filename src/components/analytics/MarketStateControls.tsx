"use client";

import { useI18n } from "@/src/i18n";
import type { PortfolioMarketState } from "@/src/quant/portfolio/types";

interface MarketStateControlsProps {
  value: PortfolioMarketState;
  onChange: (next: PortfolioMarketState) => void;
  showValuationTime?: boolean;
}

const fields: Array<{
  key: keyof PortfolioMarketState;
  label: "analytics.market.spot" | "analytics.market.volatility" | "analytics.market.rate" | "analytics.market.dividend" | "analytics.market.valuationTime";
  step: number;
  min?: number;
}> = [
  { key: "spot", label: "analytics.market.spot", step: 0.1, min: 0.01 },
  { key: "volatility", label: "analytics.market.volatility", step: 0.01, min: 0 },
  { key: "rate", label: "analytics.market.rate", step: 0.001 },
  { key: "dividend", label: "analytics.market.dividend", step: 0.001 },
  { key: "valuationTime", label: "analytics.market.valuationTime", step: 0.01, min: 0 },
];

export function MarketStateControls({
  value,
  onChange,
  showValuationTime = false,
}: MarketStateControlsProps) {
  const { t } = useI18n();
  return (
    <fieldset className="analytics-market-controls">
      <legend>{t("analytics.market.title")}</legend>
      <div>
        {fields
          .filter((field) => showValuationTime || field.key !== "valuationTime")
          .map((field) => (
            <label key={field.key}>
              <span>{t(field.label)}</span>
              <input
                aria-label={t(field.label)}
                type="number"
                inputMode="decimal"
                step={field.step}
                min={field.min}
                value={value[field.key]}
                onChange={(event) =>
                  onChange({ ...value, [field.key]: Number(event.currentTarget.value) })
                }
              />
            </label>
          ))}
      </div>
      <small>{t("analytics.market.engineUnits")}</small>
    </fieldset>
  );
}
