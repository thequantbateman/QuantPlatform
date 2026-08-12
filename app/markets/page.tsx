import { AppShell } from "@/src/components/AppShell";
import { MarketPulse } from "@/src/components/markets/MarketPulse";
import { localizedMetadata } from "@/src/i18n/server";

export const generateMetadata = () => localizedMetadata({ en: { title: "Markets", description: "A source-aware professional market board connecting instruments to quantitative models." }, es: { title: "Mercados", description: "Panel profesional con fuentes explícitas que conecta instrumentos y modelos cuantitativos." } });
export default function MarketsPage() { return <AppShell><MarketPulse /></AppShell>; }
