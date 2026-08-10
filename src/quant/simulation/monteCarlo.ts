export function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function standardNormal(random: () => number): number {
  const u1 = Math.max(random(), Number.EPSILON);
  const u2 = random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

export function simulateGeometricBrownianMotion(
  spot: number,
  drift: number,
  volatility: number,
  time: number,
  steps: number,
  seed = 42,
): number[] {
  if (spot <= 0 || volatility < 0 || time < 0 || steps < 1) throw new Error("Invalid simulation input.");
  const random = mulberry32(seed);
  const dt = time / steps;
  const path = [spot];
  for (let index = 0; index < steps; index += 1) {
    const next = path[index] * Math.exp((drift - 0.5 * volatility ** 2) * dt + volatility * Math.sqrt(dt) * standardNormal(random));
    path.push(next);
  }
  return path;
}
