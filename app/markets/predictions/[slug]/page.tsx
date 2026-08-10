import type { Metadata } from "next";
import { AppShell } from "@/src/components/AppShell";
import { PredictionEventDetail } from "@/src/components/markets/PredictionEventDetail";

export const metadata: Metadata = { title: "Prediction Event · TheQuantBateman", description: "Live read-only event-market probability, order book, trades, history, and source lineage." };
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ market?: string }> };
export default async function PredictionEventPage({ params, searchParams }: Props) { return <AppShell><PredictionEventDetail slug={(await params).slug} initialMarketId={(await searchParams).market} /></AppShell>; }
