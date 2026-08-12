import { AppShell } from "@/src/components/AppShell";
import { ResearchFrontier } from "@/src/components/ResearchFrontier";
import { localizedMetadata } from "@/src/i18n/server";

export const generateMetadata = () => localizedMetadata({ en: { title: "Quant Frontier", description: "Industry-standard methods separated clearly from active quantitative research." }, es: { title: "Frontera Quant", description: "Métodos estándar del sector separados con claridad de la investigación cuantitativa activa." } });

export default function ResearchPage() { return <AppShell><ResearchFrontier /></AppShell>; }
