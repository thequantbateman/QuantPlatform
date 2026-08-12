import { AppShell } from "@/src/components/AppShell";
import { LazyVolSurfaceLab } from "@/src/components/academy/LazyVolSurfaceLab";
import { VolatilityAnalytics } from "@/src/components/VolatilityAnalytics";
import { localizedMetadata } from "@/src/i18n/server";

export const generateMetadata = () => localizedMetadata({ en: { title: "Volatility Surface Workbench", description: "A deterministic educational implied-volatility surface with four linked analytical views." }, es: { title: "Estación de superficies de volatilidad", description: "Superficie educativa determinista de volatilidad implícita con cuatro vistas analíticas vinculadas." } });

export default function VolatilityAnalyticsPage() {
  return <AppShell><VolatilityAnalytics lab={<LazyVolSurfaceLab compact />} /></AppShell>;
}
