import { AppShell } from "@/src/components/AppShell";
import { AcademyLanding } from "@/src/components/academy/AcademyLanding";
import { localizedMetadata } from "@/src/i18n/server";

export const generateMetadata = () => localizedMetadata({ en: { title: "Learn", description: "A progressive quantitative finance knowledge graph from intuition to desk view." }, es: { title: "Aprender", description: "Grafo progresivo de finanzas cuantitativas, desde la intuición hasta la mesa." } });

export default async function LearnPage({ searchParams }: { searchParams: Promise<{ asset?: string }> }) {
  const requested = (await searchParams).asset;
  return <AppShell><AcademyLanding initialAsset={requested} /></AppShell>;
}
