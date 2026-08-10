import type { Metadata } from "next";
import { AppShell } from "@/src/components/AppShell";
import { PredictionEventStudy } from "@/src/components/markets/PredictionEventStudy";
export const metadata: Metadata = { title: "Cross-Asset Event Study · TheQuantBateman", description: "Curated comparison of prediction probabilities and related traditional markets." };
export default function EventStudyPage() { return <AppShell><PredictionEventStudy /></AppShell>; }
