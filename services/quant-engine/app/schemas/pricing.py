from math import isfinite
from typing import Literal, Optional

from pydantic import BaseModel, Field, model_validator

from app.domain.conventions import Model, OptionType


class PricingRequest(BaseModel):
    model: Model
    option_type: OptionType = OptionType.CALL
    spot: Optional[float] = Field(None, gt=0, le=1e12)
    forward: Optional[float] = Field(None, gt=0, le=1e12)
    strike: float = Field(gt=0, le=1e12)
    time: float = Field(ge=0, le=100)
    rate: float = Field(ge=-10, le=10)
    foreign_rate: float = Field(0.0, ge=-10, le=10)
    volatility: float = Field(ge=0, le=10)
    notional: float = Field(1.0, gt=0, le=1e15)

    @model_validator(mode="after")
    def validate_underlying(self):
        if self.model == Model.BLACK_76 and self.forward is None:
            raise ValueError("forward is required for Black-76")
        if self.model != Model.BLACK_76 and self.spot is None:
            raise ValueError("spot is required for BSM/Garman-Kohlhagen")
        values = (self.spot, self.forward, self.strike, self.time, self.rate, self.foreign_rate, self.volatility, self.notional)
        if any(value is not None and not isfinite(value) for value in values):
            raise ValueError("all numerical inputs must be finite")
        return self


class ImpliedVolRequest(PricingRequest):
    market_price: float = Field(ge=0)
    volatility: float = 0.2


class ScenarioRequest(PricingRequest):
    metric: Literal["pv", "delta", "gamma", "vega"] = "pv"
    underlying_shocks: list[float] = Field(default=[-0.2, -0.1, 0.0, 0.1, 0.2], min_length=1, max_length=41)
    volatility_shocks: list[float] = Field(default=[-0.1, -0.05, 0.0, 0.05, 0.1], min_length=1, max_length=41)

    @model_validator(mode="after")
    def validate_shocks(self):
        shocks = (*self.underlying_shocks, *self.volatility_shocks)
        if any(not isfinite(value) for value in shocks):
            raise ValueError("all scenario shocks must be finite")
        if any(value <= -1 or value > 10 for value in self.underlying_shocks):
            raise ValueError("underlying shocks must be greater than -1 and no greater than 10")
        if any(abs(value) > 10 for value in self.volatility_shocks):
            raise ValueError("volatility shocks must be between -10 and 10")
        return self
