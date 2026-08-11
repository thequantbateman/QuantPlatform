import type { Metadata } from "next";
import { AppShell } from "@/src/components/AppShell";
import { QuantBatemanLab } from "@/src/components/quant-bateman/QuantBatemanLab";

export const metadata: Metadata = { title: "Quant Bateman Lab", robots: { index: false, follow: false } };

export default function QuantBatemanLabPage() {
  if (process.env.NODE_ENV === "production") return <AppShell><div className="not-found section-shell"><span className="eyebrow">DEVELOPER TOOL</span><h1>Character lab is disabled.</h1><p>This preview is available only in local development.</p></div></AppShell>;
  return <AppShell><QuantBatemanLab /></AppShell>;
}
