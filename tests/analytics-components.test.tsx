import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { MarketStateControls } from "../src/components/analytics/MarketStateControls";
import { PnlHeatmap } from "../src/components/analytics/PnlHeatmap";
import { PositionEditor } from "../src/components/analytics/PositionEditor";
import { PortfolioGreeksLab } from "../src/components/analytics/PortfolioGreeksLab";
import { RiskVector } from "../src/components/analytics/RiskVector";
import { I18nProvider } from "../src/i18n";
import { QuantBatemanProvider } from "../src/components/quant-bateman/QuantBatemanProvider";
import type { OptionPosition } from "../src/quant/portfolio/types";

const call: OptionPosition = {
  id: "c1",
  instrument: "option",
  optionType: "call",
  direction: "long",
  quantity: 1,
  multiplier: 100,
  strike: 100,
  maturity: 1,
  premium: 8,
};

test("market controls expose decimal inputs with financial labels", () => {
  const html = renderToStaticMarkup(
    <I18nProvider initialLocale="en">
      <MarketStateControls
        value={{ spot: 100, volatility: 0.2, rate: 0.03, dividend: 0, valuationTime: 0 }}
        onChange={() => undefined}
        showValuationTime
      />
    </I18nProvider>,
  );

  for (const name of ["Spot", "Volatility", "Rate", "Dividend yield", "Valuation time"]) {
    assert.match(html, new RegExp(`aria-label="${name}`, "i"));
  }
  assert.match(html, /Rates and volatility use decimal engine inputs/i);
});

test("position editor exposes labelled fields and row actions", () => {
  const html = renderToStaticMarkup(
    <I18nProvider initialLocale="en">
      <PositionEditor
        positions={[call]}
        onChange={() => undefined}
        onRemove={() => undefined}
      />
    </I18nProvider>,
  );

  assert.match(html, /<table[^>]+aria-label="Portfolio positions"/i);
  for (const name of [
    "Direction",
    "Quantity",
    "Multiplier",
    "Strike",
    "Maturity",
    "Premium",
    "Remove position",
  ]) {
    assert.match(html, new RegExp(`aria-label="[^"]*${name}`, "i"));
  }
});

test("underlying rows omit option-only controls instead of rendering fake disabled values", () => {
  const html = renderToStaticMarkup(
    <I18nProvider initialLocale="en">
      <PositionEditor
        positions={[
          {
            id: "stock",
            instrument: "underlying",
            direction: "long",
            quantity: 100,
            multiplier: 1,
            entryPrice: 98,
          },
        ]}
        onChange={() => undefined}
        onRemove={() => undefined}
      />
    </I18nProvider>,
  );

  assert.match(html, /aria-label="stock Entry price"/i);
  assert.doesNotMatch(html, /aria-label="stock Strike"/i);
  assert.doesNotMatch(html, /aria-label="stock Maturity"/i);
});

test("risk vector includes explicit desk units and comparison deltas", () => {
  const html = renderToStaticMarkup(
    <I18nProvider initialLocale="en">
      <RiskVector
        label="Aggregate risk"
        greeks={{ delta: 1, gamma: 2, vega: 3, theta: 4, rho: 5 }}
        comparison={{ delta: 0, gamma: 1, vega: 2, theta: 3, rho: 4 }}
      />
    </I18nProvider>,
  );

  assert.match(html, /Aggregate risk/i);
  assert.match(html, /per 1 spot unit/i);
  assert.match(html, /per 1 volatility point/i);
  assert.match(html, /per calendar day/i);
  assert.match(html, /per 100bp/i);
  assert.match(html, /Change[^<]*\+1\.00/i);
});

test("P&L heatmap exposes every cell and a numeric alternative", () => {
  const grid = {
    spots: [95, 100],
    volatilities: [0.2],
    baseCell: { row: 0, column: 1 },
    points: [
      [
        { spot: 95, volatility: 0.2, modelValue: 10, pnl: -12.34 },
        { spot: 100, volatility: 0.2, modelValue: 22.34, pnl: 0 },
      ],
    ],
  };
  const html = renderToStaticMarkup(
    <I18nProvider initialLocale="en">
      <PnlHeatmap
        grid={grid}
        selected={{ row: 0, column: 0 }}
        onSelect={() => undefined}
      />
    </I18nProvider>,
  );

  assert.match(html, /aria-label="Spot 95, volatility 20\.0%, P&amp;L -12\.34"/i);
  assert.match(html, /aria-pressed="true"/i);
  assert.match(html, /Accessible numeric P&amp;L matrix/i);
  assert.match(html, /<table/i);
});

test("shared controls render authored Spanish labels", () => {
  const html = renderToStaticMarkup(
    <I18nProvider initialLocale="es">
      <PositionEditor
        positions={[call]}
        onChange={() => undefined}
        onRemove={() => undefined}
      />
    </I18nProvider>,
  );

  assert.match(html, /aria-label="Posiciones de la cartera"/i);
  assert.match(html, /Eliminar posición/i);
});

test("portfolio lab exposes one linked risk, scenario, hedge and decay workflow", () => {
  const html = renderToStaticMarkup(
    <I18nProvider initialLocale="en">
      <QuantBatemanProvider>
        <PortfolioGreeksLab />
      </QuantBatemanProvider>
    </I18nProvider>,
  );

  assert.match(html, /PORTFOLIO, GREEKS[\s\S]*?HEDGING/i);
  for (const marker of [
    "Portfolio positions",
    "Aggregate risk",
    "Actual repricing",
    "Taylor approximation",
    "Spot × volatility P&amp;L",
    "Time decay",
    "SYNTHETIC / EDUCATIONAL",
  ]) assert.match(html, new RegExp(marker, "i"), marker);
  assert.match(html, /aria-label="Hedge target"/i);
  assert.match(html, /href="\/learn\/greeks-hedging\/delta-gamma-vega-hedging"/i);
});
