from typing import Dict, Optional

import numpy as np

from app.domain.conventions import Model
from app.models.vanilla import Analytics, price_black_76, price_black_scholes, price_garman_kohlhagen
from app.pricing.implied_volatility import ImpliedVolResult, solve_implied_volatility
from app.schemas.pricing import ImpliedVolRequest, PricingRequest, ScenarioRequest


def price(request: PricingRequest, volatility: Optional[float] = None, underlying: Optional[float] = None) -> Analytics:
    vol = request.volatility if volatility is None else volatility
    if request.model == Model.BLACK_76:
        return price_black_76(request.forward if underlying is None else underlying, request.strike, request.time, request.rate, vol, request.option_type)
    spot = request.spot if underlying is None else underlying
    if request.model == Model.GARMAN_KOHLHAGEN:
        return price_garman_kohlhagen(spot, request.strike, request.time, request.rate, request.foreign_rate, vol, request.option_type)
    return price_black_scholes(spot, request.strike, request.time, request.rate, request.foreign_rate, vol, request.option_type)


def implied_vol(request: ImpliedVolRequest) -> ImpliedVolResult:
    return solve_implied_volatility(request.market_price / request.notional, lambda volatility: price(request, volatility=volatility).pv)


def scenarios(request: ScenarioRequest) -> Dict[str, object]:
    base = request.forward if request.model == Model.BLACK_76 else request.spot
    underlying = base * (1.0 + np.asarray(request.underlying_shocks, dtype=float))
    volatilities = np.maximum(1e-8, request.volatility + np.asarray(request.volatility_shocks, dtype=float))
    values = np.empty((underlying.size, volatilities.size))
    for row, level in enumerate(underlying):
        for column, volatility in enumerate(volatilities):
            values[row, column] = getattr(price(request, volatility=float(volatility), underlying=float(level)), request.metric) * request.notional
    return {"metric": request.metric, "underlying": underlying.tolist(), "volatilities": volatilities.tolist(), "values": values.tolist(), "request_count": 1}
