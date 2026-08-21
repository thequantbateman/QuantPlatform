import assert from "node:assert/strict";
import test from "node:test";
import {
  positionWeight,
  validateMarketState,
  validatePosition,
  valuePortfolio,
  valuePosition,
} from "../src/quant/portfolio/valuation";
import {
  buildSpotVolPnlGrid,
  buildTimeDecayProfile,
  explainPortfolioPnl,
} from "../src/quant/portfolio/scenarios";
import {
  applyHedgeProposal,
  proposeDeltaHedge,
  proposeOptionHedge,
} from "../src/quant/portfolio/hedging";
import type {
  OptionPosition,
  PortfolioMarketState,
  UnderlyingPosition,
} from "../src/quant/portfolio/types";

const market: PortfolioMarketState = {
  spot: 100,
  volatility: 0.2,
  rate: 0.05,
  dividend: 0,
  valuationTime: 0,
};

const call: OptionPosition = {
  id: "c1",
  instrument: "option",
  optionType: "call",
  direction: "long",
  quantity: 2,
  multiplier: 100,
  strike: 100,
  maturity: 1,
  premium: 9,
};

test("portfolio valuation preserves Black-Scholes desk units and position scale", () => {
  const result = valuePosition(call, market);

  assert.ok(Math.abs(result.modelValue - 2090.1150831) < 1e-6);
  assert.ok(Math.abs(result.greeks.delta - 127.3661172) < 1e-5);
  assert.ok(Math.abs(result.greeks.vega - 75.04807) < 1e-4);
  assert.ok(Math.abs(result.greeks.theta - -3.51453) < 1e-4);
  assert.ok(Math.abs(result.greeks.rho - 106.4649664) < 1e-4);
});

test("short direction and underlying delta aggregate with one signed scale", () => {
  const stock: UnderlyingPosition = {
    id: "s1",
    instrument: "underlying",
    direction: "short",
    quantity: 50,
    multiplier: 1,
    entryPrice: 98,
  };

  const result = valuePortfolio([call, stock], market);

  assert.equal(result.positions.length, 2);
  assert.ok(Math.abs(result.greeks.delta - (127.3661172 - 50)) < 1e-5);
});

test("validation rejects financial-domain errors but accepts negative rates and zero quantity", () => {
  assert.doesNotThrow(() =>
    valuePortfolio([{ ...call, quantity: 0 }], { ...market, rate: -0.01 }),
  );
  assert.throws(() => valuePortfolio([{ ...call, multiplier: 0 }], market), /multiplier/i);
  assert.throws(
    () => valuePortfolio([{ ...call, strike: Number.NaN }], market),
    /finite/i,
  );
});

test("runtime validation rejects malformed unions before reading financial fields", () => {
  assert.throws(() => validateMarketState({} as PortfolioMarketState), /spot.*finite/i);
  assert.throws(
    () =>
      validatePosition({
        id: "bad",
        instrument: "future",
        direction: "long",
        quantity: 1,
        multiplier: 1,
      }),
    /instrument/i,
  );
  assert.equal(positionWeight({ ...call, direction: "short", quantity: 1.5 }), -150);
});

test("reported desk Greeks agree with symmetric finite differences", () => {
  const state = { ...market, valuationTime: 0.25 };
  const position = { ...call, quantity: 1 };
  const base = valuePosition(position, state);
  const price = (next: PortfolioMarketState) => valuePosition(position, next).modelValue;
  const hSpot = 1e-3;
  const hVol = 1e-5;
  const hRate = 1e-5;
  const hTime = 1 / 365;
  const upSpot = price({ ...state, spot: state.spot + hSpot });
  const downSpot = price({ ...state, spot: state.spot - hSpot });
  const delta = (upSpot - downSpot) / (2 * hSpot);
  const gamma = (upSpot - 2 * base.modelValue + downSpot) / hSpot ** 2;
  const vega =
    ((price({ ...state, volatility: state.volatility + hVol }) -
      price({ ...state, volatility: state.volatility - hVol })) /
      (2 * hVol)) *
    0.01;
  const rho =
    ((price({ ...state, rate: state.rate + hRate }) -
      price({ ...state, rate: state.rate - hRate })) /
      (2 * hRate)) *
    0.01;
  const theta =
    (price({ ...state, valuationTime: state.valuationTime + hTime }) -
      price({ ...state, valuationTime: state.valuationTime - hTime })) /
    2;

  assert.ok(Math.abs(base.greeks.delta - delta) < 1e-3);
  assert.ok(Math.abs(base.greeks.gamma - gamma) < 1e-3);
  assert.ok(Math.abs(base.greeks.vega - vega) < 1e-3);
  assert.ok(Math.abs(base.greeks.rho - rho) < 1e-3);
  assert.ok(Math.abs(base.greeks.theta - theta) < 1e-4);
});

test("base scenario has zero actual, approximation and residual P&L", () => {
  const explain = explainPortfolioPnl([call], market, {
    spotMove: 0,
    volatilityMove: 0,
    elapsedDays: 0,
    rateMove: 0,
  });

  assert.deepEqual(explain, {
    actual: 0,
    delta: 0,
    gamma: 0,
    vega: 0,
    theta: 0,
    rho: 0,
    approximate: 0,
    residual: 0,
  });
});

test("Taylor residual contracts under a shrinking joint shock", () => {
  const large = explainPortfolioPnl([call], market, {
    spotMove: 2,
    volatilityMove: 0.01,
    elapsedDays: 1,
    rateMove: 0.001,
  });
  const small = explainPortfolioPnl([call], market, {
    spotMove: 0.2,
    volatilityMove: 0.001,
    elapsedDays: 0.1,
    rateMove: 0.0001,
  });

  assert.ok(Math.abs(small.residual) < Math.abs(large.residual));
  assert.equal(
    small.approximate,
    small.delta + small.gamma + small.vega + small.theta + small.rho,
  );
});

test("spot-volatility grid and time profile retain the exact base state", () => {
  const grid = buildSpotVolPnlGrid([call], market, [90, 100, 110], [0.15, 0.2, 0.25]);
  assert.deepEqual(grid.baseCell, { row: 1, column: 1 });
  assert.equal(grid.points[1][1].pnl, 0);
  assert.equal(grid.points[0][2].spot, 110);
  assert.equal(grid.points[0][2].volatility, 0.15);

  const profile = buildTimeDecayProfile([call], market, [0, 30, 365]);
  assert.equal(profile[0].pnl, 0);
  assert.equal(profile[2].modelValue, 0);
  assert.ok(profile[1].modelValue < profile[0].modelValue);
});

test("scenario boundaries reject invalid shocked financial states", () => {
  assert.throws(
    () =>
      explainPortfolioPnl([call], market, {
        spotMove: -100,
        volatilityMove: 0,
        elapsedDays: 0,
        rateMove: 0,
      }),
    /spot/i,
  );
  assert.throws(
    () => buildSpotVolPnlGrid([call], market, [100], [-0.01]),
    /volatility/i,
  );
  assert.throws(() => buildTimeDecayProfile([call], market, [-1]), /elapsed/i);
});

test("delta and delta-gamma proposals neutralize declared targets", () => {
  const delta = proposeDeltaHedge([call], market);
  assert.equal(delta.status, "ok");
  if (delta.status === "ok") {
    assert.ok(Math.abs(delta.after.greeks.delta) < 1e-9);
    assert.equal(delta.tickets.length, 1);
  }

  const hedgeOption = {
    ...call,
    id: "hedge",
    quantity: 1,
    multiplier: 50,
    strike: 110,
    premium: 4,
  };
  const gamma = proposeOptionHedge([call], market, hedgeOption, "gamma");
  assert.equal(gamma.status, "ok");
  if (gamma.status === "ok") {
    assert.equal(gamma.tickets[0].multiplier, 50);
    assert.ok(Math.abs(gamma.after.greeks.delta) < 1e-8);
    assert.ok(Math.abs(gamma.after.greeks.gamma) < 1e-8);
    assert.ok(Number.isFinite(gamma.after.greeks.theta));
    assert.equal(applyHedgeProposal(gamma).length, gamma.positions.length);
  }
  assert.equal(call.quantity, 2);
});

test("delta-vega proposals neutralize vega and disclose unavailable hedge Greeks", () => {
  const hedgeOption = {
    ...call,
    id: "vega-hedge",
    quantity: 1,
    strike: 110,
    premium: 4,
  };
  const vega = proposeOptionHedge([call], market, hedgeOption, "vega");
  assert.equal(vega.status, "ok");
  if (vega.status === "ok") {
    assert.ok(Math.abs(vega.after.greeks.delta) < 1e-8);
    assert.ok(Math.abs(vega.after.greeks.vega) < 1e-8);
  }

  const unavailable = proposeOptionHedge(
    [call],
    market,
    { ...hedgeOption, id: "expired", maturity: 0 },
    "gamma",
  );
  assert.deepEqual(unavailable, { status: "unavailable", reason: "near-zero-gamma" });
});
