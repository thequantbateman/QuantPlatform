import assert from "node:assert/strict";
import test from "node:test";
import {
  clientSideToDealerDirection,
  createClientOptionTrade,
  valueMarketMakingBook,
} from "../src/quant/market-making/book";
import {
  proposeMarketMakingDeltaHedge,
  proposeMarketMakingOptionHedge,
} from "../src/quant/market-making/hedging";
import {
  createMarketMakingSnapshot,
  explainMarketMakingScenario,
} from "../src/quant/market-making/scenarios";
import { calculateMarketMakingDiagnostics } from "../src/quant/market-making/diagnostics";
import {
  advanceMarketMakingReplay,
  executeMarketMakingReplayHedge,
  runMarketMakingDeltaBenchmark,
  replayReconciliation,
  startMarketMakingReplay,
  type MarketMakingReplayEvent,
} from "../src/quant/market-making/replay";
import { evaluateMarketMakingMission } from "../src/quant/market-making/missions";
import { marketMakingVolatility } from "../src/quant/market-making/surface";
import type {
  MarketMakingMarketState,
  MarketMakingSurface,
  MarketMakingTrade,
} from "../src/quant/market-making/types";

const surface: MarketMakingSurface = {
  atmVolatility: 0.28,
  skew: -0.12,
  curvature: 0.2,
  termSlope: 0.015,
  referenceMaturity: 1,
  minimumVolatility: 0.01,
};

const market: MarketMakingMarketState = {
  valuationTime: 0,
  underlyings: [
    {
      id: "retail",
      label: "Retail EQ",
      spot: 50,
      rate: 0.03,
      dividend: 0.01,
      surface,
    },
    {
      id: "bank",
      label: "Bank EQ",
      spot: 10,
      rate: 0.03,
      dividend: 0.02,
      surface: { ...surface, atmVolatility: 0.34, skew: -0.18 },
    },
  ],
};

test("educational surface preserves ATM and exposes skew, curvature and term effects", () => {
  assert.equal(
    marketMakingVolatility(surface, { spot: 50, strike: 50, remainingTime: 1 }),
    0.28,
  );

  const downside = marketMakingVolatility(surface, {
    spot: 50,
    strike: 50 * Math.exp(-0.2),
    remainingTime: 1,
  });
  const upside = marketMakingVolatility(surface, {
    spot: 50,
    strike: 50 * Math.exp(0.2),
    remainingTime: 1,
  });
  const longDated = marketMakingVolatility(surface, {
    spot: 50,
    strike: 50,
    remainingTime: 2,
  });

  assert.ok(downside > upside);
  assert.ok(downside > 0.28);
  assert.equal(longDated, 0.29500000000000004);
  assert.throws(
    () => marketMakingVolatility({ ...surface, atmVolatility: Number.NaN }, { spot: 50, strike: 50, remainingTime: 1 }),
    /finite/i,
  );
});

test("client direction converts to dealer direction exactly once and captures spread", () => {
  assert.equal(clientSideToDealerDirection("buy"), "short");
  assert.equal(clientSideToDealerDirection("sell"), "long");

  const clientBuy = createClientOptionTrade(
    {
      id: "client-buy",
      underlyingId: "retail",
      clientSide: "buy",
      optionType: "call",
      quantity: 2,
      multiplier: 100,
      strike: 50,
      maturity: 1,
      halfSpread: 0.1,
    },
    market,
  );
  const clientSell = createClientOptionTrade(
    {
      id: "client-sell",
      underlyingId: "retail",
      clientSide: "sell",
      optionType: "put",
      quantity: 1,
      multiplier: 100,
      strike: 47.5,
      maturity: 0.5,
      halfSpread: 0.1,
    },
    market,
  );

  assert.equal(clientBuy.dealerDirection, "short");
  assert.equal(clientBuy.executionPrice, clientBuy.referencePrice + 0.1);
  assert.equal(clientSell.dealerDirection, "long");
  assert.equal(clientSell.executionPrice, clientSell.referencePrice - 0.1);

  const result = valueMarketMakingBook([clientBuy, clientSell], market);
  assert.ok(Math.abs(result.clientSpreadCapture - 30) < 1e-9);
  assert.equal(result.hedgeFriction, 0);
});

test("multi-underlying valuation equals its independently labelled books", () => {
  const trades: MarketMakingTrade[] = [
    createClientOptionTrade(
      {
        id: "retail-call",
        underlyingId: "retail",
        clientSide: "buy",
        optionType: "call",
        quantity: 2,
        multiplier: 100,
        strike: 52,
        maturity: 1,
        halfSpread: 0.08,
      },
      market,
    ),
    createClientOptionTrade(
      {
        id: "bank-put",
        underlyingId: "bank",
        clientSide: "sell",
        optionType: "put",
        quantity: 5,
        multiplier: 100,
        strike: 9.5,
        maturity: 0.5,
        halfSpread: 0.02,
      },
      market,
    ),
  ];

  const result = valueMarketMakingBook(trades, market);
  assert.equal(result.trades.length, 2);
  assert.equal(result.byUnderlying.length, 2);
  assert.deepEqual(result.byUnderlying.map((book) => book.underlyingId), ["retail", "bank"]);
  assert.ok(
    Math.abs(
      result.modelValue - result.byUnderlying.reduce((sum, book) => sum + book.modelValue, 0),
    ) < 1e-10,
  );
  assert.ok(
    Math.abs(
      result.greeks.vega - result.byUnderlying.reduce((sum, book) => sum + book.greeks.vega, 0),
    ) < 1e-10,
  );
  assert.throws(
    () => valueMarketMakingBook([{ ...trades[0], underlyingId: "missing" }], market),
    /underlying/i,
  );
  assert.throws(
    () => valueMarketMakingBook(trades, { ...market, underlyings: [market.underlyings[0], market.underlyings[0]] }),
    /unique/i,
  );
});

function seedRetailBook(): MarketMakingTrade[] {
  return [
    createClientOptionTrade(
      {
        id: "short-client-call",
        underlyingId: "retail",
        clientSide: "buy",
        optionType: "call",
        quantity: 12,
        multiplier: 100,
        strike: 52,
        maturity: 1,
        halfSpread: 0.08,
      },
      market,
    ),
    createClientOptionTrade(
      {
        id: "long-client-put",
        underlyingId: "retail",
        clientSide: "sell",
        optionType: "put",
        quantity: 4,
        multiplier: 100,
        strike: 47.5,
        maturity: 0.5,
        halfSpread: 0.06,
      },
      market,
    ),
  ];
}

test("delta hedge neutralizes one labelled underlying and pays explicit spread friction", () => {
  const book = seedRetailBook();
  const lowCost = proposeMarketMakingDeltaHedge(book, market, "retail", 1);
  const highCost = proposeMarketMakingDeltaHedge(book, market, "retail", 8);

  assert.equal(lowCost.status, "ok");
  assert.equal(highCost.status, "ok");
  if (lowCost.status === "ok" && highCost.status === "ok") {
    const lowRisk = lowCost.after.byUnderlying.find((item) => item.underlyingId === "retail");
    assert.ok(lowRisk);
    assert.ok(Math.abs(lowRisk.greeks.delta) < 1e-8);
    assert.equal(lowCost.tickets.length, 1);
    assert.equal(lowCost.tickets[0].instrument, "underlying");
    assert.ok(lowCost.estimatedHedgeFriction > 0);
    assert.ok(highCost.estimatedHedgeFriction > lowCost.estimatedHedgeFriction);
  }
});

test("rounded option hedge reduces the target Greek and repairs delta after rounding", () => {
  const book = seedRetailBook();
  const proposal = proposeMarketMakingOptionHedge(
    book,
    market,
    {
      underlyingId: "retail",
      optionType: "call",
      strike: 50,
      maturity: 1,
      multiplier: 100,
      lotSize: 1,
      halfSpread: 0.05,
    },
    "vega",
  );

  assert.equal(proposal.status, "ok");
  if (proposal.status === "ok") {
    const before = proposal.before.byUnderlying.find((item) => item.underlyingId === "retail");
    const after = proposal.after.byUnderlying.find((item) => item.underlyingId === "retail");
    assert.ok(before && after);
    assert.equal(proposal.tickets.length, 2);
    assert.notEqual(proposal.roundedOptionQuantity, undefined);
    assert.equal(proposal.roundedOptionQuantity! % 1, 0);
    assert.ok(Math.abs(after.greeks.vega) < Math.abs(before.greeks.vega));
    assert.ok(Math.abs(after.greeks.delta) < 1e-8);
    assert.ok(proposal.estimatedHedgeFriction > 0);
  }

  const unavailable = proposeMarketMakingOptionHedge(
    book,
    market,
    {
      underlyingId: "retail",
      optionType: "call",
      strike: 50,
      maturity: 0,
      multiplier: 100,
      lotSize: 1,
      halfSpread: 0.05,
    },
    "gamma",
  );
  assert.deepEqual(unavailable, { status: "unavailable", reason: "expired-hedge-option" });
});

test("snapshots are detached and the zero shock has zero exact and local P&L", () => {
  const trades = seedRetailBook();
  const localMarket: MarketMakingMarketState = {
    valuationTime: market.valuationTime,
    underlyings: market.underlyings.map((underlying) => ({
      ...underlying,
      surface: { ...underlying.surface },
    })),
  };
  const snapshot = createMarketMakingSnapshot(trades, localMarket);
  trades[0].quantity = 999;
  localMarket.underlyings[0].spot = 999;

  assert.notEqual(snapshot.trades[0].quantity, 999);
  assert.notEqual(snapshot.market.underlyings[0].spot, 999);

  const explanation = explainMarketMakingScenario(snapshot, "retail", {
    spotMovePercent: 0,
    volatilityLevelMove: 0,
    skewMove: 0,
    rateMove: 0,
    elapsedDays: 0,
  });
  assert.deepEqual(
    {
      actual: explanation.actual,
      delta: explanation.delta,
      gamma: explanation.gamma,
      vega: explanation.vega,
      theta: explanation.theta,
      rho: explanation.rho,
      approximate: explanation.approximate,
      residual: explanation.residual,
    },
    { actual: 0, delta: 0, gamma: 0, vega: 0, theta: 0, rho: 0, approximate: 0, residual: 0 },
  );
});

test("full repricing is authoritative and the Taylor residual contracts with the shock", () => {
  const snapshot = createMarketMakingSnapshot(seedRetailBook(), market);
  const large = explainMarketMakingScenario(snapshot, "retail", {
    spotMovePercent: 0.08,
    volatilityLevelMove: 0.04,
    skewMove: -0.02,
    rateMove: 0.01,
    elapsedDays: 10,
  });
  const small = explainMarketMakingScenario(snapshot, "retail", {
    spotMovePercent: 0.008,
    volatilityLevelMove: 0.004,
    skewMove: -0.002,
    rateMove: 0.001,
    elapsedDays: 1,
  });

  assert.equal(
    large.approximate,
    large.delta + large.gamma + large.vega + large.theta + large.rho,
  );
  assert.equal(large.residual, large.actual - large.approximate);
  assert.ok(Math.abs(small.residual) < Math.abs(large.residual));
  assert.ok(large.shockedMarket.underlyings[0].surface.skew < snapshot.market.underlyings[0].surface.skew);
});

test("higher-order diagnostics stay finite and preserve desk bump units", () => {
  const trades = seedRetailBook();
  const diagnostics = calculateMarketMakingDiagnostics(trades, market, "retail");
  for (const value of [
    diagnostics.vanna,
    diagnostics.volga,
    diagnostics.charm,
    diagnostics.color,
    diagnostics.veta,
  ]) assert.ok(Number.isFinite(value));

  const volBump = 0.005;
  const bumped = (move: number) => valueMarketMakingBook(
    trades,
    {
      ...market,
      underlyings: market.underlyings.map((underlying) => underlying.id === "retail"
        ? { ...underlying, surface: { ...underlying.surface, atmVolatility: underlying.surface.atmVolatility + move } }
        : { ...underlying, surface: { ...underlying.surface } }),
    },
  ).byUnderlying.find((item) => item.underlyingId === "retail")!;
  const expectedVanna = (bumped(volBump).greeks.delta - bumped(-volBump).greeks.delta) / (2 * volBump) * 0.01;
  assert.ok(Math.abs(diagnostics.vanna - expectedVanna) < 1e-10);
});

const replayEvent: MarketMakingReplayEvent = {
  id: "opening-move",
  label: "Opening move",
  elapsedDays: 1,
  shocks: {
    retail: {
      spotMovePercent: 0.02,
      volatilityLevelMove: 0.01,
      skewMove: -0.005,
      rateMove: 0.001,
    },
  },
};

test("replay is deterministic and market/cash attribution reconciles marked wealth", () => {
  const left = advanceMarketMakingReplay(
    startMarketMakingReplay(seedRetailBook(), market, 0.03),
    replayEvent,
  );
  const right = advanceMarketMakingReplay(
    startMarketMakingReplay(seedRetailBook(), market, 0.03),
    replayEvent,
  );

  assert.deepEqual(left, right);
  assert.equal(left.stepIndex, 1);
  assert.notEqual(left.cash, startMarketMakingReplay(seedRetailBook(), market, 0.03).cash);
  assert.ok(Math.abs(replayReconciliation(left)) < 1e-9);
  assert.ok(Math.abs(left.ledger[0].reconciliation) < 1e-9);
});

test("executed hedges reconcile once and higher spread cannot improve identical-path P&L", () => {
  const initial = advanceMarketMakingReplay(
    startMarketMakingReplay(seedRetailBook(), market, 0.03),
    replayEvent,
  );
  const low = proposeMarketMakingDeltaHedge(initial.trades, initial.market, "retail", 1);
  const high = proposeMarketMakingDeltaHedge(initial.trades, initial.market, "retail", 10);
  assert.equal(low.status, "ok");
  assert.equal(high.status, "ok");
  if (low.status === "ok" && high.status === "ok") {
    const lowState = executeMarketMakingReplayHedge(initial, low.tickets, "Manual delta hedge");
    const highState = executeMarketMakingReplayHedge(initial, high.tickets, "Manual delta hedge");
    assert.ok(Math.abs(replayReconciliation(lowState)) < 1e-9);
    assert.ok(Math.abs(lowState.ledger.at(-1)!.reconciliation) < 1e-9);
    assert.ok(highState.pnl < lowState.pnl);
  }
});

test("delta-band benchmark rebalances deterministically and reconciles every event", () => {
  const events = [replayEvent, { ...replayEvent, id: "follow-through", label: "Follow-through" }];
  const left = runMarketMakingDeltaBenchmark(
    seedRetailBook(),
    market,
    0.03,
    events,
    "retail",
    4,
    0.5,
  );
  const right = runMarketMakingDeltaBenchmark(
    seedRetailBook(),
    market,
    0.03,
    events,
    "retail",
    4,
    0.5,
  );

  assert.deepEqual(left, right);
  assert.equal(left.stepIndex, events.length);
  assert.ok(left.ledger.some((entry) => entry.kind === "hedge"));
  assert.ok(left.ledger.every((entry) => Math.abs(entry.reconciliation) < 1e-8));
  assert.ok(Math.abs(replayReconciliation(left)) < 1e-8);
});

test("mission predicates require financial invariants rather than button clicks", () => {
  const incomplete = evaluateMarketMakingMission("delta-discipline", {
    dealerDirectionCorrect: false,
    delta: 25,
    deltaTolerance: 1,
    baselineVega: -500,
    currentVega: -500,
    vegaTarget: 100,
  });
  const complete = evaluateMarketMakingMission("delta-discipline", {
    dealerDirectionCorrect: true,
    delta: 0.25,
    deltaTolerance: 1,
    baselineVega: -500,
    currentVega: -450,
    vegaTarget: 100,
  });
  const vega = evaluateMarketMakingMission("short-vega-repair", {
    dealerDirectionCorrect: true,
    delta: 0.5,
    deltaTolerance: 1,
    baselineVega: -500,
    currentVega: -80,
    vegaTarget: 100,
  });

  assert.deepEqual(incomplete, { complete: false, reason: "delta-outside-tolerance" });
  assert.deepEqual(complete, { complete: true, reason: "delta-controlled" });
  assert.deepEqual(vega, { complete: true, reason: "vega-and-delta-controlled" });
});
