import { AppShell } from "@/src/components/AppShell";
import { Labs } from "@/src/components/labs/Labs";
import { localizedMetadata } from "@/src/i18n/server";

export const generateMetadata = () => localizedMetadata({ en: { title: "Quant Lab", description: "Interactive pricing, Greeks, volatility, curves and market-making hedging experiments." }, es: { title: "Laboratorio Quant", description: "Experimentos interactivos de valoración, griegas, volatilidad, curvas y cobertura de market making." } });

export default async function LabPage({ searchParams }: { searchParams: Promise<{ lab?: string }> }) {
  return <AppShell><Labs initialLab={(await searchParams).lab} /></AppShell>;
}
