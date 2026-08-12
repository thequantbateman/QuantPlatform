import { AppShell } from "@/src/components/AppShell";
import { AnalyticsHub } from "@/src/components/AnalyticsHub";
import { localizedMetadata } from "@/src/i18n/server";

export const generateMetadata = () => localizedMetadata({ en: { title: "Analytics", description: "Deterministic pricing, Greeks, volatility and curve analytics." }, es: { title: "Analítica", description: "Valoración, griegas, volatilidad y curvas mediante analítica determinista." } });
export default function AnalyticsPage() { return <AppShell><AnalyticsHub /></AppShell>; }
