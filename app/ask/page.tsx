import type { Metadata } from "next";
import { AppShell } from "@/src/components/AppShell";
import { QuantChat } from "@/src/components/ai/QuantChat";

export const metadata: Metadata = { title: "Ask Bateman", description: "A local demo AI quant tutor with progressive explanations and desk context." };

export default function AskPage() { return <AppShell><QuantChat /></AppShell>; }
