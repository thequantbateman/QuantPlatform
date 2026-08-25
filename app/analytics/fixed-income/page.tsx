import { AppShell } from "@/src/components/AppShell";
import { FixedIncomeLab } from "@/src/components/analytics/FixedIncomeLab";
import { localizedMetadata } from "@/src/i18n/server";

export const generateMetadata = () => localizedMetadata({
  en: { title: "Fixed-Income Spreads & Curve Analytics", description: "Price fixed-rate bonds, compare benchmark-dependent spreads and separate rate, curve, credit and carry risk." },
  es: { title: "Spreads y analítica de curvas de renta fija", description: "Valora bonos a tipo fijo, compara spreads dependientes del benchmark y separa riesgos de tipos, curva, crédito y carry." },
});

export default function FixedIncomeAnalyticsPage() {
  return <AppShell><FixedIncomeLab /></AppShell>;
}
