import type { Metadata } from "next";
import { AppShell } from "@/src/components/AppShell";
import { Labs } from "@/src/components/labs/Labs";

export const metadata: Metadata = { title: "Quant Lab", description: "Interactive Black-Scholes, Greeks, volatility surface and yield curve experiments." };

export default function LabPage() {
  return <AppShell><Labs /></AppShell>;
}
