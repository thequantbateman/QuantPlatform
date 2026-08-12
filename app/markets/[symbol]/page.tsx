import type { Metadata } from "next";
import { AppShell } from "@/src/components/AppShell";
import { MarketDetail } from "@/src/components/markets/MarketDetail";
import { findInstrument, instrumentMaster } from "@/src/market-data/instrumentMaster";
import { serverLocale } from "@/src/i18n/server";

type PageProps = { params: Promise<{ symbol: string }> };
export function generateStaticParams() { return instrumentMaster.map((instrument) => ({ symbol: instrument.slug })); }
export async function generateMetadata({ params }: PageProps): Promise<Metadata> { const instrument = findInstrument((await params).symbol); const locale = await serverLocale(); return { title: instrument ? `${instrument.symbol} ${locale === "es" ? "Mercado" : "Market"}` : locale === "es" ? "Instrumento de mercado" : "Market instrument", description: instrument ? locale === "es" ? `Procedencia de la cotización de ${instrument.name} y flujo cuantitativo.` : `${instrument.name} quote provenance and quant workflow.` : locale === "es" ? "Detalle del instrumento de mercado." : "Market instrument detail." }; }
export default async function MarketSymbolPage({ params }: PageProps) { return <AppShell><MarketDetail symbol={(await params).symbol} /></AppShell>; }
