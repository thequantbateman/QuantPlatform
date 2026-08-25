export interface BracketedRootOptions {
  lower: number;
  upper: number;
  functionTolerance?: number;
  intervalTolerance?: number;
  maxIterations?: number;
}

export interface BracketedRootResult {
  root: number;
  iterations: number;
  residual: number;
  converged: boolean;
  solver: "BISECTION";
}

function finite(value: number, label: string): void {
  if (!Number.isFinite(value)) throw new RangeError(`${label} must be finite.`);
}

/** Deterministic bounded solver. It favors a guaranteed bracket over fast but fragile steps. */
export function solveBracketedRoot(
  objective: (value: number) => number,
  options: BracketedRootOptions,
): BracketedRootResult {
  const functionTolerance = options.functionTolerance ?? 1e-12;
  const intervalTolerance = options.intervalTolerance ?? 1e-12;
  const maxIterations = options.maxIterations ?? 200;
  finite(options.lower, "Lower bound");
  finite(options.upper, "Upper bound");
  finite(functionTolerance, "Function tolerance");
  finite(intervalTolerance, "Interval tolerance");
  if (options.lower >= options.upper) throw new RangeError("Lower bound must be below upper bound.");
  if (functionTolerance <= 0 || intervalTolerance <= 0) throw new RangeError("Solver tolerances must be positive.");
  if (!Number.isInteger(maxIterations) || maxIterations <= 0) throw new RangeError("Maximum iterations must be a positive integer.");

  let lower = options.lower;
  let upper = options.upper;
  let fLower = objective(lower);
  let fUpper = objective(upper);
  finite(fLower, "Objective at lower bound");
  finite(fUpper, "Objective at upper bound");
  if (Math.abs(fLower) <= functionTolerance) return { root: lower, iterations: 0, residual: fLower, converged: true, solver: "BISECTION" };
  if (Math.abs(fUpper) <= functionTolerance) return { root: upper, iterations: 0, residual: fUpper, converged: true, solver: "BISECTION" };
  if (Math.sign(fLower) === Math.sign(fUpper)) throw new RangeError("Root interval does not bracket a sign change.");

  for (let iteration = 1; iteration <= maxIterations; iteration += 1) {
    const root = lower + (upper - lower) / 2;
    const residual = objective(root);
    finite(residual, "Objective at candidate root");
    if (Math.abs(residual) <= functionTolerance || Math.abs(upper - lower) <= intervalTolerance) {
      return { root, iterations: iteration, residual, converged: true, solver: "BISECTION" };
    }
    if (Math.sign(fLower) === Math.sign(residual)) {
      lower = root;
      fLower = residual;
    } else {
      upper = root;
      fUpper = residual;
    }
  }
  const root = lower + (upper - lower) / 2;
  const residual = objective(root);
  return { root, iterations: maxIterations, residual, converged: false, solver: "BISECTION" };
}
