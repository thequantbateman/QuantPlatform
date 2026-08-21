"use client";

import { useI18n } from "@/src/i18n";
import type {
  OptionPosition,
  PortfolioPosition,
  PositionDirection,
} from "@/src/quant/portfolio/types";

export interface PositionPatch {
  direction?: PositionDirection;
  quantity?: number;
  multiplier?: number;
  optionType?: "call" | "put";
  strike?: number;
  maturity?: number;
  premium?: number;
  entryPrice?: number;
}

interface PositionEditorProps {
  positions: readonly PortfolioPosition[];
  onChange: (id: string, patch: PositionPatch) => void;
  onRemove: (id: string) => void;
  selectedId?: string;
  onSelect?: (id: string) => void;
}

function NumberField({
  id,
  label,
  value,
  min,
  step,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min?: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <input
      aria-label={`${id} ${label}`}
      type="number"
      inputMode="decimal"
      value={value}
      min={min}
      step={step}
      onChange={(event) => onChange(Number(event.currentTarget.value))}
    />
  );
}

export function PositionEditor({
  positions,
  onChange,
  onRemove,
  selectedId,
  onSelect,
}: PositionEditorProps) {
  const { t } = useI18n();
  const headers = [
    t("analytics.position.instrument"),
    t("analytics.position.direction"),
    t("analytics.position.quantity"),
    t("analytics.position.multiplier"),
    t("analytics.position.optionType"),
    t("analytics.position.strike"),
    t("analytics.position.maturity"),
    t("analytics.position.entry"),
    t("analytics.position.actions"),
  ];

  return (
    <div className="analytics-position-table">
      <table aria-label={t("analytics.position.table")}>
        <thead>
          <tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr>
        </thead>
        <tbody>
          {positions.map((position) => {
            const instrumentLabel = t(
              position.instrument === "option"
                ? "analytics.position.option"
                : "analytics.position.underlying",
            );
            const entryLabel = t(
              position.instrument === "option"
                ? "analytics.position.premium"
                : "analytics.position.entryPrice",
            );
            return (
              <tr key={position.id} data-selected={selectedId === position.id || undefined}>
                <td data-label={headers[0]}>
                  {onSelect ? (
                    <button
                      className="position-select"
                      type="button"
                      aria-pressed={selectedId === position.id}
                      aria-label={`${t("analytics.position.select")} ${position.id}`}
                      onClick={() => onSelect(position.id)}
                    >
                      {instrumentLabel}
                    </button>
                  ) : instrumentLabel}
                </td>
                <td data-label={headers[1]}>
                  <select
                    aria-label={`${position.id} ${t("analytics.position.direction")}`}
                    value={position.direction}
                    onChange={(event) =>
                      onChange(position.id, {
                        direction: event.currentTarget.value as PositionDirection,
                      })
                    }
                  >
                    <option value="long">{t("analytics.position.long")}</option>
                    <option value="short">{t("analytics.position.short")}</option>
                  </select>
                </td>
                <td data-label={headers[2]}>
                  <NumberField
                    id={position.id}
                    label={t("analytics.position.quantity")}
                    value={position.quantity}
                    min={0}
                    step={0.01}
                    onChange={(quantity) => onChange(position.id, { quantity })}
                  />
                </td>
                <td data-label={headers[3]}>
                  <NumberField
                    id={position.id}
                    label={t("analytics.position.multiplier")}
                    value={position.multiplier}
                    min={0.01}
                    step={1}
                    onChange={(multiplier) => onChange(position.id, { multiplier })}
                  />
                </td>
                <td data-label={headers[4]}>
                  {position.instrument === "option" ? (
                    <select
                      aria-label={`${position.id} ${t("analytics.position.optionType")}`}
                      value={position.optionType}
                      onChange={(event) =>
                        onChange(position.id, {
                          optionType: event.currentTarget.value as OptionPosition["optionType"],
                        })
                      }
                    >
                      <option value="call">{t("analytics.position.call")}</option>
                      <option value="put">{t("analytics.position.put")}</option>
                    </select>
                  ) : <span>—</span>}
                </td>
                <td data-label={headers[5]}>
                  {position.instrument === "option" ? (
                    <NumberField
                      id={position.id}
                      label={t("analytics.position.strike")}
                      value={position.strike}
                      min={0.01}
                      step={0.1}
                      onChange={(strike) => onChange(position.id, { strike })}
                    />
                  ) : <span>—</span>}
                </td>
                <td data-label={headers[6]}>
                  {position.instrument === "option" ? (
                    <NumberField
                      id={position.id}
                      label={t("analytics.position.maturity")}
                      value={position.maturity}
                      min={0}
                      step={0.01}
                      onChange={(maturity) => onChange(position.id, { maturity })}
                    />
                  ) : <span>—</span>}
                </td>
                <td data-label={headers[7]}>
                  <NumberField
                    id={position.id}
                    label={entryLabel}
                    value={
                      position.instrument === "option"
                        ? position.premium
                        : position.entryPrice
                    }
                    min={0}
                    step={0.01}
                    onChange={(entry) =>
                      onChange(
                        position.id,
                        position.instrument === "option"
                          ? { premium: entry }
                          : { entryPrice: entry },
                      )
                    }
                  />
                </td>
                <td data-label={headers[8]}>
                  <button
                    className="position-remove"
                    type="button"
                    aria-label={`${position.id} ${t("analytics.position.remove")}`}
                    onClick={() => onRemove(position.id)}
                  >
                    {t("analytics.position.remove")}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
