import type { Metadata } from "next";
import { AppShell } from "@/src/components/AppShell";
import { MarketPulse } from "@/src/components/markets/MarketPulse";

export const metadata: Metadata = { title: "Markets", description: "A clearly labelled local-demo market pulse with model impact analysis." };
export default function MarketsPage() { return <AppShell><MarketPulse /></AppShell>; }
