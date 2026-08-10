import type { Metadata } from "next";
import { AppShell } from "@/src/components/AppShell";
import { PredictionsDashboard } from "@/src/components/markets/PredictionsDashboard";

export const metadata: Metadata = { title: "Prediction Markets · TheQuantBateman", description: "Read-only macro prediction-market probabilities with explicit provenance." };
export default function PredictionsPage() { return <AppShell><PredictionsDashboard /></AppShell>; }
