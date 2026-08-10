import type { Metadata } from "next";
import { AppShell } from "@/src/components/AppShell";
import { MarketPulse } from "@/src/components/markets/MarketPulse";

export const metadata: Metadata = { title: "Markets", description: "A source-aware professional market board connecting instruments to quantitative models." };
export default function MarketsPage() { return <AppShell><MarketPulse /></AppShell>; }
