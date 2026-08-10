import type { Metadata } from "next";
import { AppShell } from "@/src/components/AppShell";
import { IntelligenceHub } from "@/src/components/IntelligenceHub";

export const metadata: Metadata = { title: "Market Intelligence · TheQuantBateman", description: "Deterministic cross-asset metrics with explicit source lineage." };
export default function IntelligencePage() { return <AppShell><IntelligenceHub /></AppShell>; }
