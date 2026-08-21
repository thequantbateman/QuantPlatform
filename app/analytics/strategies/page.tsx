import { AppShell } from "@/src/components/AppShell";
import { StrategyPayoffLab } from "@/src/components/analytics/StrategyPayoffLab";
import { localizedMetadata } from "@/src/i18n/server";

export const generateMetadata = () => localizedMetadata({
  en: { title: "Options Strategy & Payoff", description: "Compose option strategies, inspect exact terminal payoff algebra and transfer the book into portfolio risk analytics." },
  es: { title: "Estrategias y payoff de opciones", description: "Combina estrategias de opciones, inspecciona el álgebra terminal exacta y transfiere la cartera a analítica de riesgos." },
});

export default function StrategyAnalyticsPage() {
  return <AppShell><StrategyPayoffLab /></AppShell>;
}
