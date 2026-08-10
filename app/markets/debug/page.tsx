import { AppShell } from "@/src/components/AppShell";
import { MarketDataDebug } from "@/src/components/markets/MarketDataDebug";

export default function MarketDebugPage() {
  const enabled = process.env.NODE_ENV === "development" || process.env.ENABLE_MARKET_DEBUG === "true";
  return <AppShell>{enabled ? <MarketDataDebug /> : <div className="not-found section-shell"><span className="eyebrow">DEVELOPER TOOL</span><h1>Market Data Debug is disabled.</h1><p>Set ENABLE_MARKET_DEBUG=true in a private environment. No provider secrets are displayed.</p></div>}</AppShell>;
}
