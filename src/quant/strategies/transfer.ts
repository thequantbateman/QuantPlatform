import type {
  PortfolioMarketState,
  PortfolioPosition,
} from "../portfolio/types";
import {
  validateMarketState,
  validatePosition,
} from "../portfolio/valuation";

export const STRATEGY_TRANSFER_VERSION = 1 as const;
export const STRATEGY_TRANSFER_KEY = "tqb-strategy-transfer-v1";

export interface StrategyTransferPayload {
  version: typeof STRATEGY_TRANSFER_VERSION;
  market: PortfolioMarketState;
  positions: PortfolioPosition[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStrategyTransferPayload(value: unknown): value is StrategyTransferPayload {
  if (!isRecord(value) || value.version !== STRATEGY_TRANSFER_VERSION) return false;
  if (!Array.isArray(value.positions) || value.positions.length === 0) return false;
  try {
    validateMarketState(value.market);
    value.positions.forEach(validatePosition);
    return true;
  } catch {
    return false;
  }
}

function validateTransferPayload(value: unknown): asserts value is StrategyTransferPayload {
  if (!isStrategyTransferPayload(value)) {
    throw new RangeError("Invalid strategy transfer payload.");
  }
}

export function serializeStrategyTransfer(payload: StrategyTransferPayload): string {
  validateTransferPayload(payload);
  return JSON.stringify(payload);
}

export function parseStrategyTransfer(serialized: string): StrategyTransferPayload | null {
  try {
    const value: unknown = JSON.parse(serialized);
    return isStrategyTransferPayload(value) ? value : null;
  } catch {
    return null;
  }
}
