import type { VanillaInput } from "@/src/quant/pricing/vanilla";

export type QuantEngineState = "online" | "fallback";

function localEngineUrl() {
  if (typeof window === "undefined" || !["localhost", "127.0.0.1"].includes(window.location.hostname)) return null;
  return "http://127.0.0.1:8000";
}

export async function validateWithQuantEngine(input: VanillaInput, signal: AbortSignal): Promise<QuantEngineState> {
  const baseUrl = localEngineUrl();
  if (!baseUrl) return "fallback";
  const response = await fetch(`${baseUrl}/v1/price`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({
      model: input.mode === "forward" ? "black_76" : input.mode === "fx" ? "garman_kohlhagen" : "black_scholes_merton",
      option_type: input.type,
      spot: input.mode === "forward" ? undefined : input.spot,
      forward: input.mode === "forward" ? input.forward : undefined,
      strike: input.strike,
      time: input.time,
      rate: input.rate,
      foreign_rate: input.foreignRate,
      volatility: input.volatility,
      notional: input.notional,
    }),
  });
  if (!response.ok) throw new Error(`Quant engine returned ${response.status}`);
  return "online";
}
