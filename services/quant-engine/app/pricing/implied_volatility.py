from dataclasses import dataclass
from typing import Callable

from scipy.optimize import brentq

from app.domain.conventions import QuantInputError


@dataclass(frozen=True)
class ImpliedVolResult:
    volatility: float
    iterations: int
    residual: float
    converged: bool
    solver: str = "BRENT"


def solve_implied_volatility(market_price: float, price_for_vol: Callable[[float], float]) -> ImpliedVolResult:
    if market_price < 0:
        raise QuantInputError("Market option price cannot be negative.")
    low, high = 1e-8, 5.0
    lower_price, upper_price = price_for_vol(low), price_for_vol(high)
    if market_price < lower_price - 1e-10 or market_price > upper_price + 1e-10:
        raise QuantInputError(f"Price violates model bounds [{lower_price:.8f}, {upper_price:.8f}].")
    iterations = 0

    def objective(volatility: float) -> float:
        nonlocal iterations
        iterations += 1
        return price_for_vol(volatility) - market_price

    volatility = brentq(objective, low, high, xtol=1e-12, rtol=1e-12, maxiter=100)
    residual = objective(volatility)
    return ImpliedVolResult(volatility, iterations, residual, abs(residual) < 1e-9)
