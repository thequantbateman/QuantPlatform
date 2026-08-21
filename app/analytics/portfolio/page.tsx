import { AppShell } from "@/src/components/AppShell";
import { PortfolioGreeksLab } from "@/src/components/analytics/PortfolioGreeksLab";
import { localizedMetadata } from "@/src/i18n/server";

export const generateMetadata = () => localizedMetadata({
  en: { title: "Portfolio Greeks & Hedging", description: "Build a European-option portfolio, inspect aggregate Greeks, reprice scenarios and preview hedge tickets." },
  es: { title: "Griegas y coberturas de cartera", description: "Construye una cartera de opciones europeas, inspecciona griegas agregadas, revalora escenarios y previsualiza coberturas." },
});

export default function PortfolioAnalyticsPage() {
  return <AppShell><PortfolioGreeksLab /></AppShell>;
}
