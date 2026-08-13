import { AppShell } from "@/src/components/AppShell";
import { Labs } from "@/src/components/labs/Labs";
import { localizedMetadata } from "@/src/i18n/server";

export const generateMetadata = () => localizedMetadata({ en: { title: "Quant Lab", description: "Interactive Black-Scholes, Greeks, volatility surface and yield curve experiments." }, es: { title: "Laboratorio Quant", description: "Experimentos interactivos de Black–Scholes, griegas, superficie de volatilidad y curva de tipos." } });

export default async function LabPage({ searchParams }: { searchParams: Promise<{ lab?: string }> }) {
  return <AppShell><Labs initialLab={(await searchParams).lab} /></AppShell>;
}
