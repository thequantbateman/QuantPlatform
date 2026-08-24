import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { MarketStateControls } from "../src/components/analytics/MarketStateControls";
import { PnlHeatmap } from "../src/components/analytics/PnlHeatmap";
import { PositionEditor } from "../src/components/analytics/PositionEditor";
import { PortfolioGreeksLab } from "../src/components/analytics/PortfolioGreeksLab";
import { RiskVector } from "../src/components/analytics/RiskVector";
import { StrategyPayoffLab } from "../src/components/analytics/StrategyPayoffLab";
import { MarketMakingLab } from "../src/components/labs/MarketMakingLab";
import { I18nProvider } from "../src/i18n";
import { QuantBatemanProvider } from "../src/components/quant-bateman/QuantBatemanProvider";
import type { OptionPosition } from "../src/quant/portfolio/types";
import { AnalyticsGuide } from "../src/components/analytics/AnalyticsGuide";

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

test("guided Analytics renders compact academic actions and explanation", () => {
  const html = renderToStaticMarkup(
    <I18nProvider initialLocale="en">
      <AnalyticsGuide
        labId="greeks"
        activeScenarioId="greeks-through-strike"
        snapshots={{ before: { gamma: 0.01 }, after: { gamma: 0.04 } }}
        onApply={() => undefined}
        onReset={() => undefined}
        onManual={() => undefined}
        onAsk={() => undefined}
      />
    </I18nProvider>,
  );
  assert.match(html, /data-analytics-guide="greeks"/i);
  assert.match(html, /data-analytics-scenario="greeks-through-strike"/i);
  for (const marker of ["First try", "Learning objective", "What to change", "What to watch", "Why it moves", "Model boundary", "Ask about this"]) {
    assert.match(html, new RegExp(marker, "i"), marker);
  }
  assert.match(html, /<details[^>]*>/i);
  assert.match(html, /href="\/learn\/risk\/first-order-greeks"/i);
});

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
  assert.match(html, /href="\/learn\/risk\/first-order-greeks"/i);
});

test("strategy lab exposes taxonomy, exact payoff algebra and portfolio transfer", () => {
  const html = renderToStaticMarkup(
    <I18nProvider initialLocale="en">
      <QuantBatemanProvider>
        <StrategyPayoffLab />
      </QuantBatemanProvider>
    </I18nProvider>,
  );
  assert.match(html, /OPTIONS STRATEGY[\s\S]*?PAYOFF/i);
  for (const marker of [
    "Strategy legs",
    "EXPIRY PROFIT",
    "Breakeven",
    "Settlement by leg",
    "Piecewise payoff",
    "Open in Portfolio Lab",
    "single expiry",
  ]) assert.match(html, new RegExp(marker, "i"), marker);
  assert.match(html, /role="tab"[^>]+aria-controls="strategy-panel-profit"/i);

  const spanish = renderToStaticMarkup(
    <I18nProvider initialLocale="es">
      <QuantBatemanProvider><StrategyPayoffLab /></QuantBatemanProvider>
    </I18nProvider>,
  );
  for (const marker of ["BENEFICIO AL VENCIMIENTO", "Acotadas", "Cóndor de hierro", "Patas de la estrategia", "Abrir en Laboratorio de Carteras"]) {
    assert.match(spanish, new RegExp(marker, "i"), marker);
  }
});

test("market-making lab exposes one dealer workflow with costs, repricing and replay", () => {
  const html = renderToStaticMarkup(
    <I18nProvider initialLocale="en">
      <QuantBatemanProvider>
        <MarketMakingLab />
      </QuantBatemanProvider>
    </I18nProvider>,
  );

  assert.match(html, /MARKET-MAKING DESK/i);
  for (const marker of [
    "Morning market",
    "Client flow",
    "Dealer blotter",
    "Book risk",
    "Hedge decision",
    "Snapshot &amp; shock",
    "Hedge replay",
    "Client side",
    "Dealer side",
    "Client spread capture",
    "Hedge friction",
    "Exact repricing",
    "Local Greek approximation",
    "Cash / wealth reconciliation",
    "Delta-band benchmark",
    "SYNTHETIC / EDUCATIONAL",
    "MODEL BOUNDARY",
  ]) assert.match(html, new RegExp(marker, "i"), marker);

  assert.equal((html.match(/data-mm-stage=/g) ?? []).length, 6);
  assert.match(html, /role="tab"[^>]+aria-controls="mm-panel-market"/i);
  assert.match(html, /role="tabpanel"[^>]+id="mm-panel-replay"/i);
  assert.match(html, /<table[^>]+aria-label="Dealer blotter"/i);
  assert.match(html, /<table[^>]+aria-label="Replay ledger"/i);
  assert.match(html, /aria-live="polite"/i);

  const spanish = renderToStaticMarkup(
    <I18nProvider initialLocale="es">
      <QuantBatemanProvider><MarketMakingLab /></QuantBatemanProvider>
    </I18nProvider>,
  );
  for (const marker of [
    "Mesa de market making",
    "Mercado de apertura",
    "Flujo de clientes",
    "Riesgo del libro",
    "Decisión de cobertura",
    "Foto y escenario",
    "Repetición de coberturas",
    "Datos sintéticos / educativos",
    "Inicio",
  ]) assert.match(spanish, new RegExp(marker, "i"), marker);
});
