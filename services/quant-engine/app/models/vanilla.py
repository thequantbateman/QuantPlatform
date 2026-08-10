from dataclasses import asdict, dataclass
from math import erf, exp, isfinite, log, pi, sqrt
from typing import Dict, Optional

from app.domain.conventions import OptionType, QuantInputError


EPSILON = 1e-12


def normal_cdf(value: float) -> float:
    return 0.5 * (1.0 + erf(value / sqrt(2.0)))


def normal_pdf(value: float) -> float:
    return exp(-0.5 * value * value) / sqrt(2.0 * pi)


@dataclass(frozen=True)
class Analytics:
    pv: float
    delta: float
    gamma: float
    vega: float
    theta: float
    rho: float
    d1: float
    d2: float
    forward: float
    discount_factor: float
    intrinsic_value: float
    time_value: float
    moneyness: float
    domestic_rho: Optional[float] = None
    foreign_rho: Optional[float] = None

    def dict(self) -> Dict[str, Optional[float]]:
        return asdict(self)


def _validate(*values: float) -> None:
    if not all(isfinite(value) for value in values):
        raise QuantInputError("All model inputs must be finite.")


def price_black_scholes(spot: float, strike: float, time: float, rate: float, dividend: float, volatility: float, option_type: OptionType) -> Analytics:
    _validate(spot, strike, time, rate, dividend, volatility)
    if spot <= 0 or strike <= 0 or time < 0 or volatility < 0:
        raise QuantInputError("Spot and strike must be positive; time and volatility cannot be negative.")
    sign = 1.0 if option_type == OptionType.CALL else -1.0
    discount_r, discount_q = exp(-rate * time), exp(-dividend * time)
    forward = spot * exp((rate - dividend) * time)
    intrinsic = max(sign * (spot - strike), 0.0)
    if time <= EPSILON or volatility <= EPSILON:
        pv = max(sign * (spot * discount_q - strike * discount_r), 0.0)
        return Analytics(pv, sign * discount_q if pv > 0 else 0.0, 0.0, 0.0, 0.0, sign * strike * time * discount_r * 0.01 if pv > 0 else 0.0, float("inf"), float("inf"), forward, discount_r, intrinsic, max(pv - intrinsic, 0.0), spot / strike)
    root_time = sqrt(time)
    d1 = (log(spot / strike) + (rate - dividend + 0.5 * volatility * volatility) * time) / (volatility * root_time)
    d2 = d1 - volatility * root_time
    nd1, nd2, density = normal_cdf(sign * d1), normal_cdf(sign * d2), normal_pdf(d1)
    pv = sign * (spot * discount_q * nd1 - strike * discount_r * nd2)
    delta = sign * discount_q * nd1
    gamma = discount_q * density / (spot * volatility * root_time)
    vega = spot * discount_q * density * root_time * 0.01
    theta_annual = -(spot * discount_q * density * volatility) / (2.0 * root_time) - sign * rate * strike * discount_r * nd2 + sign * dividend * spot * discount_q * nd1
    rho = sign * strike * time * discount_r * nd2 * 0.01
    foreign_rho = -sign * spot * time * discount_q * nd1 * 0.01
    return Analytics(pv, delta, gamma, vega, theta_annual / 365.0, rho, d1, d2, forward, discount_r, intrinsic, max(pv - intrinsic, 0.0), spot / strike, rho, foreign_rho)


def price_garman_kohlhagen(spot: float, strike: float, time: float, domestic_rate: float, foreign_rate: float, volatility: float, option_type: OptionType) -> Analytics:
    return price_black_scholes(spot, strike, time, domestic_rate, foreign_rate, volatility, option_type)


def price_black_76(forward: float, strike: float, time: float, rate: float, volatility: float, option_type: OptionType) -> Analytics:
    _validate(forward, strike, time, rate, volatility)
    if forward <= 0 or strike <= 0 or time < 0 or volatility < 0:
        raise QuantInputError("Forward and strike must be positive; time and volatility cannot be negative.")
    sign = 1.0 if option_type == OptionType.CALL else -1.0
    discount = exp(-rate * time)
    intrinsic = discount * max(sign * (forward - strike), 0.0)
    if time <= EPSILON or volatility <= EPSILON:
        return Analytics(intrinsic, sign * discount if intrinsic > 0 else 0.0, 0.0, 0.0, 0.0, -time * intrinsic * 0.01, float("inf"), float("inf"), forward, discount, intrinsic, 0.0, forward / strike)
    root_time = sqrt(time)
    d1 = (log(forward / strike) + 0.5 * volatility * volatility * time) / (volatility * root_time)
    d2 = d1 - volatility * root_time
    pv = discount * sign * (forward * normal_cdf(sign * d1) - strike * normal_cdf(sign * d2))
    delta = sign * discount * normal_cdf(sign * d1)
    gamma = discount * normal_pdf(d1) / (forward * volatility * root_time)
    vega = discount * forward * normal_pdf(d1) * root_time * 0.01
    theta = (rate * pv - discount * forward * normal_pdf(d1) * volatility / (2.0 * root_time)) / 365.0
    return Analytics(pv, delta, gamma, vega, theta, -time * pv * 0.01, d1, d2, forward, discount, intrinsic, max(pv - intrinsic, 0.0), forward / strike)
