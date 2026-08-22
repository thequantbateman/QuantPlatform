import { blackScholes } from "../models/blackScholes";
import type { DeskGreeks, PortfolioMarketState, PortfolioPosition } from "../portfolio/types";
import { positionWeight, valuePosition } from "../portfolio/valuation";
import { marketMakingVolatility, validateMarketMakingSurface } from "./surface";
import type {
  ClientOptionOrder,
  ClientSide,
  MarketMakingBookValuation,
  MarketMakingMarketState,
  MarketMakingOptionTrade,
  MarketMakingTrade,
  MarketMakingTradeValuation,
  MarketMakingUnderlyingState,
  MarketMakingUnderlyingValuation,
} from "./types";

const ZERO_GREEKS: DeskGreeks = { delta: 0, gamma: 0, vega: 0, theta: 0, rho: 0 };

function requireFinite(value: number, label: string): void {
  if (!Number.isFinite(value)) throw new RangeError(`${label} must be finite.`);
}

function requireNonNegative(value: number, label: string): void {
  requireFinite(value, label);
  if (value < 0) throw new RangeError(`${label} cannot be negative.`);
}

function requirePositive(value: number, label: string): void {
  requireFinite(value, label);
  if (value <= 0) throw new RangeError(`${label} must be positive.`);
}

function addGreeks(left: DeskGreeks, right: DeskGreeks): DeskGreeks {
  return {
    delta: left.delta + right.delta,
    gamma: left.gamma + right.gamma,
    vega: left.vega + right.vega,
    theta: left.theta + right.theta,
    rho: left.rho + right.rho,
  };
}

function isNonEmpty(value: string): boolean {
  return value.trim().length > 0;
}

export function validateMarketMakingMarketState(market: MarketMakingMarketState): void {
  requireNonNegative(market.valuationTime, "Valuation time");
  if (!Array.isArray(market.underlyings) || market.underlyings.length === 0) {
    throw new RangeError("Market must contain at least one underlying.");
  }
  const ids = new Set<string>();
  for (const underlying of market.underlyings) {
    if (!isNonEmpty(underlying.id) || !isNonEmpty(underlying.label)) {
      throw new TypeError("Underlying id and label must be non-empty strings.");
    }
    if (ids.has(underlying.id)) throw new RangeError("Underlying ids must be unique.");
    ids.add(underlying.id);
    requirePositive(underlying.spot, `${underlying.id} spot`);
    requireFinite(underlying.rate, `${underlying.id} rate`);
    requireFinite(underlying.dividend, `${underlying.id} dividend`);
    validateMarketMakingSurface(underlying.surface);
  }
}

function underlyingFor(
  market: MarketMakingMarketState,
  underlyingId: string,
): MarketMakingUnderlyingState {
  const underlying = market.underlyings.find((candidate) => candidate.id === underlyingId);
  if (!underlying) throw new RangeError(`Unknown underlying: ${underlyingId}.`);
  return underlying;
}

function validateTrade(trade: MarketMakingTrade, market: MarketMakingMarketState): void {
  if (!isNonEmpty(trade.id)) throw new TypeError("Trade id must be a non-empty string.");
  underlyingFor(market, trade.underlyingId);
  if (trade.dealerDirection !== "long" && trade.dealerDirection !== "short") {
    throw new TypeError("Dealer direction must be long or short.");
  }
  requireNonNegative(trade.quantity, "Trade quantity");
  requirePositive(trade.multiplier, "Trade multiplier");
  requireNonNegative(trade.referencePrice, "Reference price");
  requireNonNegative(trade.executionPrice, "Execution price");

  if (trade.instrument === "option") {
    if (trade.source !== "client" && trade.source !== "hedge") {
      throw new TypeError("Option source must be client or hedge.");
    }
    if (trade.optionType !== "call" && trade.optionType !== "put") {
      throw new TypeError("Option type must be call or put.");
    }
    requirePositive(trade.strike, "Strike");
    requireNonNegative(trade.maturity, "Maturity");
    requireNonNegative(trade.executionHalfSpread, "Execution half-spread");
  } else {
    if (trade.source !== "hedge") throw new TypeError("Underlying trades must be hedge trades.");
    if (trade.multiplier !== 1) throw new RangeError("Underlying trade multiplier must equal one.");
    requireNonNegative(trade.executionCostBps, "Execution cost");
  }
}

export function clientSideToDealerDirection(clientSide: ClientSide): "long" | "short" {
  if (clientSide === "buy") return "short";
  if (clientSide === "sell") return "long";
  throw new TypeError("Client side must be buy or sell.");
}

function optionAnalytics(
  underlying: MarketMakingUnderlyingState,
  market: MarketMakingMarketState,
  trade: Pick<MarketMakingOptionTrade, "optionType" | "strike" | "maturity">,
) {
  const remainingTime = Math.max(trade.maturity - market.valuationTime, 0);
  const volatility = marketMakingVolatility(underlying.surface, {
    spot: underlying.spot,
    strike: trade.strike,
    remainingTime,
  });
  return {
    analytics: blackScholes({
      spot: underlying.spot,
      strike: trade.strike,
      time: remainingTime,
      rate: underlying.rate,
      dividend: underlying.dividend,
      volatility,
      type: trade.optionType,
    }),
    volatility,
  };
}

export function createClientOptionTrade(
  order: ClientOptionOrder,
  market: MarketMakingMarketState,
): MarketMakingOptionTrade {
  validateMarketMakingMarketState(market);
  if (!isNonEmpty(order.id)) throw new TypeError("Order id must be a non-empty string.");
  requirePositive(order.quantity, "Order quantity");
  requirePositive(order.multiplier, "Order multiplier");
  requirePositive(order.strike, "Order strike");
  requireFinite(order.maturity, "Order maturity");
  if (order.maturity <= market.valuationTime) {
    throw new RangeError("Order maturity must be after the valuation time.");
  }
  requireNonNegative(order.halfSpread, "Order half-spread");
  const underlying = underlyingFor(market, order.underlyingId);
  const { analytics } = optionAnalytics(underlying, market, {
    optionType: order.optionType,
    strike: order.strike,
    maturity: order.maturity,
  });
  const dealerDirection = clientSideToDealerDirection(order.clientSide);
  const executionPrice =
    analytics.price + (order.clientSide === "buy" ? order.halfSpread : -order.halfSpread);
  if (executionPrice < 0) {
    throw new RangeError("Half-spread cannot produce a negative execution price.");
  }
  return {
    id: order.id,
    instrument: "option",
    source: "client",
    underlyingId: order.underlyingId,
    dealerDirection,
    optionType: order.optionType,
    quantity: order.quantity,
    multiplier: order.multiplier,
    strike: order.strike,
    maturity: order.maturity,
    referencePrice: analytics.price,
    executionPrice,
    executionHalfSpread: order.halfSpread,
  };
}

function portfolioState(
  market: MarketMakingMarketState,
  underlying: MarketMakingUnderlyingState,
  volatility: number,
): PortfolioMarketState {
  return {
    spot: underlying.spot,
    volatility,
    rate: underlying.rate,
    dividend: underlying.dividend,
    valuationTime: market.valuationTime,
  };
}

function portfolioPosition(trade: MarketMakingTrade): PortfolioPosition {
  if (trade.instrument === "underlying") {
    return {
      id: trade.id,
      instrument: "underlying",
      direction: trade.dealerDirection,
      quantity: trade.quantity,
      multiplier: 1,
      entryPrice: trade.executionPrice,
    };
  }
  return {
    id: trade.id,
    instrument: "option",
    optionType: trade.optionType,
    direction: trade.dealerDirection,
    quantity: trade.quantity,
    multiplier: trade.multiplier,
    strike: trade.strike,
    maturity: trade.maturity,
    premium: trade.executionPrice,
  };
}

export function valueMarketMakingTrade(
  trade: MarketMakingTrade,
  market: MarketMakingMarketState,
): MarketMakingTradeValuation {
  validateMarketMakingMarketState(market);
  validateTrade(trade, market);
  const underlying = underlyingFor(market, trade.underlyingId);
  const volatility =
    trade.instrument === "option"
      ? optionAnalytics(underlying, market, trade).volatility
      : underlying.surface.atmVolatility;
  const position = portfolioPosition(trade);
  const valuation = valuePosition(position, portfolioState(market, underlying, volatility));
  const weight = positionWeight(position);
  const referenceValue = weight * trade.referencePrice;
  const executionValue = weight * trade.executionPrice;
  const liquidityPnl = referenceValue - executionValue;
  return {
    tradeId: trade.id,
    underlyingId: trade.underlyingId,
    source: trade.source,
    instrument: trade.instrument,
    modelPrice: trade.quantity === 0 ? 0 : valuation.modelValue / weight,
    volatility: trade.instrument === "option" ? volatility : null,
    modelValue: valuation.modelValue,
    referenceValue,
    executionValue,
    unrealizedPnl: valuation.modelValue - executionValue,
    liquidityPnl,
    greeks: valuation.greeks,
    expired: valuation.expired,
  };
}

function emptyUnderlying(
  underlying: MarketMakingUnderlyingState,
): MarketMakingUnderlyingValuation {
  return {
    underlyingId: underlying.id,
    label: underlying.label,
    modelValue: 0,
    referenceValue: 0,
    executionValue: 0,
    unrealizedPnl: 0,
    clientSpreadCapture: 0,
    hedgeFriction: 0,
    greeks: { ...ZERO_GREEKS },
  };
}

export function valueMarketMakingBook(
  trades: readonly MarketMakingTrade[],
  market: MarketMakingMarketState,
): MarketMakingBookValuation {
  validateMarketMakingMarketState(market);
  const ids = new Set<string>();
  for (const trade of trades) {
    if (ids.has(trade.id)) throw new RangeError("Trade ids must be unique.");
    ids.add(trade.id);
  }
  const tradeValues = trades.map((trade) => valueMarketMakingTrade(trade, market));
  const byUnderlying = market.underlyings
    .filter((underlying) => trades.some((trade) => trade.underlyingId === underlying.id))
    .map((underlying) =>
      tradeValues
        .filter((trade) => trade.underlyingId === underlying.id)
        .reduce<MarketMakingUnderlyingValuation>(
          (book, trade) => ({
            ...book,
            modelValue: book.modelValue + trade.modelValue,
            referenceValue: book.referenceValue + trade.referenceValue,
            executionValue: book.executionValue + trade.executionValue,
            unrealizedPnl: book.unrealizedPnl + trade.unrealizedPnl,
            clientSpreadCapture:
              book.clientSpreadCapture + (trade.source === "client" ? trade.liquidityPnl : 0),
            hedgeFriction:
              book.hedgeFriction + (trade.source === "hedge" ? -trade.liquidityPnl : 0),
            greeks: addGreeks(book.greeks, trade.greeks),
          }),
          emptyUnderlying(underlying),
        ),
    );

  const totals = byUnderlying.reduce<Omit<MarketMakingBookValuation, "trades" | "byUnderlying">>(
    (book, underlying) => ({
      modelValue: book.modelValue + underlying.modelValue,
      referenceValue: book.referenceValue + underlying.referenceValue,
      executionValue: book.executionValue + underlying.executionValue,
      unrealizedPnl: book.unrealizedPnl + underlying.unrealizedPnl,
      clientSpreadCapture: book.clientSpreadCapture + underlying.clientSpreadCapture,
      hedgeFriction: book.hedgeFriction + underlying.hedgeFriction,
      greeks: addGreeks(book.greeks, underlying.greeks),
    }),
    {
      modelValue: 0,
      referenceValue: 0,
      executionValue: 0,
      unrealizedPnl: 0,
      clientSpreadCapture: 0,
      hedgeFriction: 0,
      greeks: { ...ZERO_GREEKS },
    },
  );
  return { trades: tradeValues, byUnderlying, ...totals };
}
