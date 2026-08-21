import { mulberry32 } from "./simulation/monteCarlo";

export interface ComplexValue {
  real: number;
  imaginary: number;
}

export interface BrownianPathInput {
  steps: number;
  horizon: number;
  seed: number;
}

export interface BrownianPathResult {
  time: number[];
  path: number[];
  increments: number[];
  quadraticVariation: number;
}

function requireFinite(values: Array<[name: string, value: number]>): void {
  for (const [name, value] of values) if (!Number.isFinite(value)) throw new Error(`${name} must be finite.`);
}

function standardNormal(random: () => number): number {
  const first = Math.max(random(), Number.EPSILON);
  const second = random();
  return Math.sqrt(-2 * Math.log(first)) * Math.cos(2 * Math.PI * second);
}

export function normalCharacteristicFunction(frequency: number, mean: number, variance: number): ComplexValue {
  requireFinite([["frequency", frequency], ["mean", mean], ["variance", variance]]);
  if (variance < 0) throw new Error("variance must be non-negative.");
  const modulus = Math.exp(-0.5 * variance * frequency ** 2);
  const angle = frequency * mean;
  return { real: modulus * Math.cos(angle), imaginary: modulus * Math.sin(angle) };
}

export function brownianPath(input: BrownianPathInput): BrownianPathResult {
  const { steps, horizon, seed } = input;
  requireFinite([["steps", steps], ["horizon", horizon], ["seed", seed]]);
  if (!Number.isInteger(steps) || steps < 1 || steps > 1_000_000) throw new Error("steps must be an integer between 1 and 1,000,000.");
  if (horizon <= 0) throw new Error("horizon must be positive.");
  const random = mulberry32(Math.trunc(seed));
  const time = new Array<number>(steps + 1);
  const path = new Array<number>(steps + 1);
  const increments = new Array<number>(steps);
  const dt = horizon / steps;
  const scale = Math.sqrt(dt);
  let state = 0;
  let quadraticVariation = 0;
  time[0] = 0;
  path[0] = 0;
  for (let index = 0; index < steps; index += 1) {
    const increment = scale * standardNormal(random);
    increments[index] = increment;
    state += increment;
    quadraticVariation += increment * increment;
    time[index + 1] = (index + 1) * dt;
    path[index + 1] = state;
  }
  return { time, path, increments, quadraticVariation };
}

export function gbmExpectedSpot(spot: number, drift: number, horizon: number): number {
  requireFinite([["spot", spot], ["drift", drift], ["horizon", horizon]]);
  if (spot <= 0) throw new Error("spot must be positive.");
  if (horizon < 0) throw new Error("horizon must be non-negative.");
  return spot * Math.exp(drift * horizon);
}

export function discountedTotalReturnExpectation(spot: number, rate: number, dividend: number, horizon: number): number {
  requireFinite([["spot", spot], ["rate", rate], ["dividend", dividend], ["horizon", horizon]]);
  if (spot <= 0) throw new Error("spot must be positive.");
  if (horizon < 0) throw new Error("horizon must be non-negative.");
  const expectedExDividendSpot = gbmExpectedSpot(spot, rate - dividend, horizon);
  return Math.exp(-rate * horizon) * Math.exp(dividend * horizon) * expectedExDividendSpot;
}
