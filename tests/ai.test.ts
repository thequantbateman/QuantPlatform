import test from "node:test";
import assert from "node:assert/strict";
import { resolveEvidence } from "../src/ai/evidence";

const cases = [
  ...["EURUSD", "EUR/USD", "GBPUSD", "GBP/USD", "USDJPY", "AAPL", "MSFT", "ESTR", "BRENT", "GOLD"].map((question) => [question, "market_data"] as const),
  ...["Random Variables", "Brownian Motion", "Risk-Neutral Pricing", "Black-Scholes", "Greeks", "Implied Volatility", "FX Forward", "Garman-Kohlhagen", "Yield Curves", "Black-76"].map((question) => [`Explain ${question}`, "learn"] as const),
  ...["price an option", "calculate delta", "calculate gamma", "calculate vega", "calculate theta", "calculate rho", "implied vol calculation", "run black scholes", "use garman model", "use black 76"].map((question) => [question, "analytics"] as const),
  ...["prediction markets", "current probability", "Polymarket", "macro prediction", "event probability", "prediction dashboard", "public prediction API", "probability market", "prediction liquidity", "prediction volume"].map((question) => [question, "navigation"] as const),
  ...["hello", "where should I start", "help me navigate", "what can you do", "show the platform", "unknown subject", "find resources", "learning path", "start", "help"].map((question) => [question, "navigation"] as const),
];

test("50 assistant evaluation cases route to authoritative tools", async () => {
  assert.equal(cases.length, 50);
  for (const [question, expected] of cases) assert.equal((await resolveEvidence(question)).tool, expected, question);
});

test("analytics requests with incomplete inputs do not invent a price", async () => {
  const evidence = await resolveEvidence("price an option");
  assert.match(evidence.answer, /requires explicit model/i);
  assert.doesNotMatch(evidence.answer, /\$\d|price is \d/i);
});

test("Spanish assistant evidence stays source-grounded and localized", async () => {
  const evidence = await resolveEvidence("calcular delta", false, "es");
  assert.equal(evidence.tool, "analytics");
  assert.match(evidence.answer, /requiere modelo/i);
  assert.doesNotMatch(evidence.answer, /A numerical answer/);
});
