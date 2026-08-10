import { blackScholes, type OptionAnalytics, type OptionType } from "./blackScholes";

export interface GarmanKohlhagenInput {
  spot: number;
  strike: number;
  time: number;
  domesticRate: number;
  foreignRate: number;
  volatility: number;
  type: OptionType;
}

export function garmanKohlhagen(input: GarmanKohlhagenInput): OptionAnalytics {
  return blackScholes({
    spot: input.spot,
    strike: input.strike,
    time: input.time,
    rate: input.domesticRate,
    dividend: input.foreignRate,
    volatility: input.volatility,
    type: input.type,
  });
}
