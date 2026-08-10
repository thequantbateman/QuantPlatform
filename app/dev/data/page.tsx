import type { Metadata } from "next";
import { AppShell } from "@/src/components/AppShell";
import { PredictionPipelineHealth } from "@/src/components/markets/PredictionPipelineHealth";
export const metadata: Metadata = { title: "Prediction Pipeline Health · TheQuantBateman", robots: { index: false, follow: false } };
export default function DataHealthPage() { return <AppShell><PredictionPipelineHealth /></AppShell>; }
