import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.domain.conventions import QuantInputError
from app.pricing.service import implied_vol, price, scenarios
from app.schemas.pricing import ImpliedVolRequest, PricingRequest, ScenarioRequest

DEFAULT_ALLOWED_ORIGINS = "http://localhost:3000,http://127.0.0.1:3000"
allowed_origins = [origin.strip() for origin in os.getenv("QUANT_ENGINE_ALLOWED_ORIGINS", DEFAULT_ALLOWED_ORIGINS).split(",") if origin.strip()]

app = FastAPI(title="TheQuantBateman Quant Engine", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=allowed_origins, allow_methods=["GET", "POST"], allow_headers=["Content-Type"])


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "engine": "analytical-v0", "conventions": "TQB-QUANT-2026-08"}


@app.post("/v1/price")
def price_endpoint(request: PricingRequest):
    try:
        result = price(request).dict()
        return {"model": request.model, "option_type": request.option_type, "notional": request.notional, "analytics": {key: value * request.notional if key in {"pv", "delta", "gamma", "vega", "theta", "rho", "domestic_rho", "foreign_rho", "intrinsic_value", "time_value"} and value is not None else value for key, value in result.items()}}
    except QuantInputError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


@app.post("/v1/implied-volatility")
def implied_volatility_endpoint(request: ImpliedVolRequest):
    try:
        return implied_vol(request).__dict__
    except QuantInputError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


@app.post("/v1/scenarios")
def scenarios_endpoint(request: ScenarioRequest):
    try:
        return scenarios(request)
    except QuantInputError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
