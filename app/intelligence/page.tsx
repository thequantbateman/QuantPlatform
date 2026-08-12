import { AppShell } from "@/src/components/AppShell";
import { IntelligenceHub } from "@/src/components/IntelligenceHub";
import { localizedMetadata } from "@/src/i18n/server";

export const generateMetadata = () => localizedMetadata({ en: { title: "Market Intelligence", description: "Deterministic cross-asset metrics with explicit source lineage." }, es: { title: "Inteligencia de mercado", description: "Métricas deterministas multiactivo con procedencia explícita." } });
export default function IntelligencePage() { return <AppShell><IntelligenceHub /></AppShell>; }
