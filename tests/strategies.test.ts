import assert from "node:assert/strict";
import test from "node:test";
import {
  analyzeTerminalStrategy,
  buildPayoffIntervals,
  terminalLegPayoff,
  terminalLegProfit,
} from "../src/quant/strategies/payoff";
import {
  buildStrategyPreset,
  strategyPresets,
} from "../src/quant/strategies/presets";
import {
  parseStrategyTransfer,
  serializeStrategyTransfer,
  STRATEGY_TRANSFER_KEY,
  STRATEGY_TRANSFER_VERSION,
} from "../src/quant/strategies/transfer";
import type {
  OptionPosition,
  PortfolioPosition,
  UnderlyingPosition,
} from "../src/quant/portfolio/types";

const longCall: OptionPosition = {
  id: "lc",
  instrument: "option",
  optionType: "call",
  direction: "long",
  quantity: 1,
  multiplier: 100,
  strike: 100,
  maturity: 1,
  premium: 5,
};

test("long call has exact breakeven, finite loss and unlimited gain", () => {
  assert.equal(terminalLegPayoff(longCall, 120), 2_000);
  assert.equal(terminalLegProfit(longCall, 80), -500);
  assert.equal(terminalLegProfit(longCall, 120), 1_500);

  const analysis = analyzeTerminalStrategy([longCall]);

  assert.equal(analysis.netEntryCashflow, -500);
  assert.deepEqual(analysis.breakevens, [105]);
  assert.deepEqual(analysis.maxLoss, { kind: "finite", value: 500 });
  assert.deepEqual(analysis.maxGain, { kind: "unlimited" });
});

test("call butterfly resolves two roots and a finite right-tail plateau", () => {
  const legs: OptionPosition[] = [
    { ...longCall, id: "c90", strike: 90, premium: 12 },
    { ...longCall, id: "c100", direction: "short", quantity: 2, strike: 100, premium: 6 },
    { ...longCall, id: "c110", strike: 110, premium: 2 },
  ];

  const analysis = analyzeTerminalStrategy(legs);

  assert.deepEqual(analysis.breakevens, [92, 108]);
  assert.deepEqual(analysis.maxGain, { kind: "finite", value: 800 });
  assert.deepEqual(analysis.maxLoss, { kind: "finite", value: 200 });
});

test("mixed expiries fail instead of producing a misleading payoff summary", () => {
  assert.throws(
    () => analyzeTerminalStrategy([longCall, { ...longCall, id: "other", maturity: 2 }]),
    /common expiry/i,
  );
});

test("same-strike call minus put reproduces the synthetic forward payoff", () => {
  const put: OptionPosition = {
    ...longCall,
    id: "p",
    optionType: "put",
    direction: "short",
  };

  for (const spot of [0, 75, 100, 140]) {
    const optionProfit = terminalLegProfit(longCall, spot) + terminalLegProfit(put, spot);
    const syntheticEntry = (longCall.premium - put.premium) * longCall.multiplier;
    assert.equal(
      optionProfit,
      longCall.multiplier * (spot - longCall.strike) - syntheticEntry,
    );
  }
});

test("tail slopes distinguish short-call unlimited loss from short-put finite loss", () => {
  const shortCall = { ...longCall, id: "sc", direction: "short" as const };
  const shortPut = {
    ...longCall,
    id: "sp",
    optionType: "put" as const,
    direction: "short" as const,
  };

  assert.deepEqual(analyzeTerminalStrategy([shortCall]).maxLoss, { kind: "unlimited" });
  assert.deepEqual(analyzeTerminalStrategy([shortCall]).maxGain, {
    kind: "finite",
    value: 500,
  });
  assert.deepEqual(analyzeTerminalStrategy([shortPut]).maxLoss, {
    kind: "finite",
    value: 9_500,
  });
});

test("covered calls and protective puts preserve exact stock-option bounds", () => {
  const stock: UnderlyingPosition = {
    id: "stock",
    instrument: "underlying",
    direction: "long",
    quantity: 100,
    multiplier: 1,
    entryPrice: 100,
  };
  const coveredCall = {
    ...longCall,
    id: "cc",
    direction: "short" as const,
    strike: 110,
    premium: 3,
  };
  const protectivePut = {
    ...longCall,
    id: "pp",
    optionType: "put" as const,
    strike: 90,
    premium: 2,
  };

  const covered = analyzeTerminalStrategy([stock, coveredCall]);
  assert.deepEqual(covered.maxGain, { kind: "finite", value: 1_300 });
  assert.deepEqual(covered.maxLoss, { kind: "finite", value: 9_700 });

  const protectedBook = analyzeTerminalStrategy([stock, protectivePut]);
  assert.deepEqual(protectedBook.maxGain, { kind: "unlimited" });
  assert.deepEqual(protectedBook.maxLoss, { kind: "finite", value: 1_200 });
  assert.deepEqual(protectedBook.breakevens, [102]);
});

test("vertical spread intervals expose exact aS+b equations", () => {
  const legs: OptionPosition[] = [
    longCall,
    { ...longCall, id: "short-110", direction: "short", strike: 110, premium: 2 },
  ];

  assert.deepEqual(buildPayoffIntervals(legs), [
    { lower: 0, upper: 100, slope: 0, intercept: -300, activeLegIds: [] },
    { lower: 100, upper: 110, slope: 100, intercept: -10_300, activeLegIds: ["lc"] },
    {
      lower: 110,
      upper: null,
      slope: 0,
      intercept: 700,
      activeLegIds: ["lc", "short-110"],
    },
  ]);
});

test("duplicate strikes and zero quantities collapse without false discrete roots", () => {
  const cancelled: OptionPosition[] = [
    longCall,
    { ...longCall, id: "offset", direction: "short" },
    { ...longCall, id: "zero", quantity: 0 },
  ];
  const analysis = analyzeTerminalStrategy(cancelled);

  assert.deepEqual(analysis.breakevens, []);
  assert.deepEqual(analysis.maxGain, { kind: "finite", value: 0 });
  assert.deepEqual(analysis.maxLoss, { kind: "finite", value: 0 });
});

test("iron condor returns exact credit, roots and bounded tails", () => {
  const legs: OptionPosition[] = [
    { ...longCall, id: "p90", optionType: "put", strike: 90, premium: 1 },
    {
      ...longCall,
      id: "p95",
      optionType: "put",
      direction: "short",
      strike: 95,
      premium: 3,
    },
    { ...longCall, id: "c105", direction: "short", strike: 105, premium: 3 },
    { ...longCall, id: "c110", strike: 110, premium: 1 },
  ];
  const analysis = analyzeTerminalStrategy(legs);

  assert.equal(analysis.netEntryCashflow, 400);
  assert.deepEqual(analysis.breakevens, [91, 109]);
  assert.deepEqual(analysis.maxGain, { kind: "finite", value: 400 });
  assert.deepEqual(analysis.maxLoss, { kind: "finite", value: 100 });
});

test("terminal analysis validates spot, books and underlying-only horizon", () => {
  assert.throws(() => terminalLegProfit(longCall, -1), /terminal spot/i);
  assert.throws(() => analyzeTerminalStrategy([]), /position/i);

  const stock: PortfolioPosition = {
    id: "stock",
    instrument: "underlying",
    direction: "long",
    quantity: 1,
    multiplier: 1,
    entryPrice: 100,
  };
  assert.throws(() => analyzeTerminalStrategy([stock]), /expiry/i);
  assert.equal(analyzeTerminalStrategy([stock], 0.5).expiry, 0.5);
});

test("every approved preset produces a deterministic common-expiry strategy", () => {
  assert.equal(strategyPresets.length, 22);
  assert.equal(new Set(strategyPresets.map((preset) => preset.id)).size, 22);

  for (const preset of strategyPresets) {
    const context = { spot: 100, expiry: 1, multiplier: 100 };
    const first = buildStrategyPreset(preset.id, context);
    const second = buildStrategyPreset(preset.id, context);
    const expiries = new Set(
      first.flatMap((leg) => (leg.instrument === "option" ? [leg.maturity] : [])),
    );

    assert.deepEqual(first, second, preset.id);
    assert.equal(first.length, preset.legCount, preset.id);
    assert.equal(new Set(first.map((leg) => leg.id)).size, first.length, preset.id);
    assert.equal(expiries.size, 1, preset.id);
    assert.doesNotThrow(() => analyzeTerminalStrategy(first), preset.id);
  }
});

test("preset definitions preserve signed stock-option and bounded strike structures", () => {
  const covered = buildStrategyPreset("covered-call", {
    spot: 100,
    expiry: 1,
    multiplier: 100,
  });
  assert.deepEqual(
    covered.map((leg) => [leg.instrument, leg.direction, leg.quantity, leg.multiplier]),
    [
      ["underlying", "long", 100, 1],
      ["option", "short", 1, 100],
    ],
  );

  const condor = buildStrategyPreset("iron-condor", {
    spot: 100,
    expiry: 1,
    multiplier: 100,
  });
  assert.deepEqual(
    condor.map((leg) =>
      leg.instrument === "option"
        ? [leg.optionType, leg.direction, leg.strike]
        : [leg.instrument, leg.direction],
    ),
    [
      ["put", "long", 90],
      ["put", "short", 95],
      ["call", "short", 105],
      ["call", "long", 110],
    ],
  );
});

test("preset builders reject invalid financial context", () => {
  assert.throws(
    () => buildStrategyPreset("long-call", { spot: 0, expiry: 1, multiplier: 100 }),
    /spot/i,
  );
  assert.throws(
    () => buildStrategyPreset("long-call", { spot: 100, expiry: -1, multiplier: 100 }),
    /expiry/i,
  );
  assert.throws(
    () => buildStrategyPreset("long-call", { spot: 100, expiry: 1, multiplier: 0 }),
    /multiplier/i,
  );
});

test("strategy transfer round-trips through one stable versioned key", () => {
  const payload = {
    version: 1 as const,
    market: {
      spot: 100,
      volatility: 0.2,
      rate: 0.03,
      dividend: 0,
      valuationTime: 0,
    },
    positions: buildStrategyPreset("covered-call", {
      spot: 100,
      expiry: 1,
      multiplier: 100,
    }),
  };

  assert.equal(STRATEGY_TRANSFER_KEY, "tqb-strategy-transfer-v1");
  assert.equal(STRATEGY_TRANSFER_VERSION, 1);
  assert.deepEqual(parseStrategyTransfer(serializeStrategyTransfer(payload)), payload);
});

test("strategy transfer rejects unknown versions and malformed nested fields", () => {
  assert.equal(parseStrategyTransfer('{"version":2}'), null);
  assert.equal(parseStrategyTransfer("not-json"), null);
  assert.equal(
    parseStrategyTransfer(
      JSON.stringify({
        version: 1,
        market: { spot: 100 },
        positions: [],
      }),
    ),
    null,
  );
  assert.equal(
    parseStrategyTransfer(
      JSON.stringify({
        version: 1,
        market: {
          spot: 100,
          volatility: 0.2,
          rate: 0.03,
          dividend: 0,
          valuationTime: 0,
        },
        positions: [{ id: "bad", instrument: "future" }],
      }),
    ),
    null,
  );
});
