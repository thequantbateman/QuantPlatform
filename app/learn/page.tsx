import type { Metadata } from "next";
import { AppShell } from "@/src/components/AppShell";
import { AcademyLanding } from "@/src/components/academy/AcademyLanding";

export const metadata: Metadata = { title: "Learn", description: "A progressive quantitative finance knowledge graph from intuition to desk view." };

export default async function LearnPage({ searchParams }: { searchParams: Promise<{ asset?: string }> }) {
  const requested = (await searchParams).asset;
  return <AppShell><AcademyLanding initialAsset={requested} /></AppShell>;
}
