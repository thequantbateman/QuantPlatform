import { AppShell } from "@/src/components/AppShell";
import { QuantChat } from "@/src/components/ai/QuantChat";
import { localizedMetadata } from "@/src/i18n/server";

export const generateMetadata = () => localizedMetadata({ en: { title: "Ask Bateman", description: "A source-grounded quantitative tutor with progressive explanations and desk context." }, es: { title: "Pregunta a Bateman", description: "Tutor cuantitativo fundamentado en fuentes, con explicaciones progresivas y contexto de mesa." } });

export default function AskPage() { return <AppShell><QuantChat /></AppShell>; }
