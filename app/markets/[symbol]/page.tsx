import type { Metadata } from "next";
import { AppShell } from "@/src/components/AppShell";
import { MarketDetail } from "@/src/components/markets/MarketDetail";
import { findInstrument, instrumentMaster } from "@/src/market-data/instrumentMaster";

type PageProps = { params: Promise<{ symbol: string }> };
export function generateStaticParams() { return instrumentMaster.map((instrument) => ({ symbol: instrument.slug })); }
export async function generateMetadata({ params }: PageProps): Promise<Metadata> { const instrument = findInstrument((await params).symbol); return { title: instrument ? `${instrument.symbol} Market` : "Market instrument", description: instrument ? `${instrument.name} quote provenance and quant workflow.` : "Market instrument detail." }; }
export default async function MarketSymbolPage({ params }: PageProps) { return <AppShell><MarketDetail symbol={(await params).symbol} /></AppShell>; }
