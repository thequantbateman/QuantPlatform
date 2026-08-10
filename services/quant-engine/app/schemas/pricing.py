from typing import Literal, Optional

from pydantic import BaseModel, Field, model_validator

from app.domain.conventions import Model, OptionType


class PricingRequest(BaseModel):
    model: Model
    option_type: OptionType = OptionType.CALL
    spot: Optional[float] = Field(None, gt=0)
    forward: Optional[float] = Field(None, gt=0)
    strike: float = Field(gt=0)
    time: float = Field(ge=0)
    rate: float
    foreign_rate: float = 0.0
    volatility: float = Field(ge=0)
    notional: float = Field(1.0, gt=0)

    @model_validator(mode="after")
    def validate_underlying(self):
        if self.model == Model.BLACK_76 and self.forward is None:
            raise ValueError("forward is required for Black-76")
        if self.model != Model.BLACK_76 and self.spot is None:
            raise ValueError("spot is required for BSM/Garman-Kohlhagen")
        return self


class ImpliedVolRequest(PricingRequest):
    market_price: float = Field(ge=0)
    volatility: float = 0.2


class ScenarioRequest(PricingRequest):
    metric: Literal["pv", "delta", "gamma", "vega"] = "pv"
    underlying_shocks: list[float] = [-0.2, -0.1, 0.0, 0.1, 0.2]
    volatility_shocks: list[float] = [-0.1, -0.05, 0.0, 0.05, 0.1]
