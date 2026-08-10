import type { Metadata } from "next";
import { AppShell } from "@/src/components/AppShell";
import { PredictionDataExplorer } from "@/src/components/markets/PredictionDataExplorer";
export const metadata: Metadata = { title: "Prediction Data Explorer · TheQuantBateman", description: "Read-only inspection of normalized prediction-market persistence and coverage." };
export default function PredictionDataPage() { return <AppShell><PredictionDataExplorer /></AppShell>; }
