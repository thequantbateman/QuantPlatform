import { AppShell } from "@/src/components/AppShell";
import { PredictionEventDetail } from "@/src/components/markets/PredictionEventDetail";
import { localizedMetadata } from "@/src/i18n/server";

export const generateMetadata = () => localizedMetadata({ en: { title: "Prediction Event", description: "Live read-only event probability, order book, trades, history and source lineage." }, es: { title: "Evento de predicción", description: "Probabilidad, libro, operaciones, histórico y procedencia en vivo y en modo solo lectura." } });
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ market?: string }> };
export default async function PredictionEventPage({ params, searchParams }: Props) { return <AppShell><PredictionEventDetail slug={(await params).slug} initialMarketId={(await searchParams).market} /></AppShell>; }
