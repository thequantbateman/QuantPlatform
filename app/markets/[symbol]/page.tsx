import type { Metadata } from "next";
import { AppShell } from "@/src/components/AppShell";
import { MarketDetail } from "@/src/components/markets/MarketDetail";
import { demoMarketQuotes, findMarketQuote } from "@/src/data/markets";

type PageProps = { params: Promise<{ symbol: string }> };
export function generateStaticParams() { return demoMarketQuotes.map((quote) => ({ symbol: quote.symbol.toLowerCase() })); }
export async function generateMetadata({ params }: PageProps): Promise<Metadata> { const quote = findMarketQuote((await params).symbol); return { title: quote ? `${quote.displaySymbol} Market` : "Market instrument", description: quote ? `${quote.name} quote provenance and quant workflow.` : "Market instrument detail." }; }
export default async function MarketSymbolPage({ params }: PageProps) { return <AppShell><MarketDetail symbol={(await params).symbol} /></AppShell>; }
