import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { I18nProvider, type Locale } from "@/src/i18n";
import "katex/dist/katex.min.css";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const locale: Locale = (await cookies()).get("tqb-locale")?.value === "es" ? "es" : "en";
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const image = `${protocol}://${host}/og.png`;
  return {
    title: { default: locale === "es" ? "TheQuantBateman — Finanzas cuantitativas explicadas visualmente" : "TheQuantBateman — Quant Finance, Visually Explained", template: "%s — TheQuantBateman" },
    description: locale === "es" ? "Laboratorios interactivos de finanzas cuantitativas, formación progresiva e intuición institucional de mercado." : "Interactive quantitative finance labs, progressive model education and institutional market intuition.",
    applicationName: "TheQuantBateman",
    keywords: ["quantitative finance", "Black-Scholes", "volatility", "yield curves", "quant education"],
    openGraph: { title: "TheQuantBateman", description: locale === "es" ? "Finanzas cuantitativas explicadas visualmente." : "Quant Finance. Visually Explained.", type: "website", siteName: "TheQuantBateman", images: [{ url: image, width: 1731, height: 909, alt: locale === "es" ? "TheQuantBateman — Finanzas cuantitativas explicadas visualmente" : "TheQuantBateman — Quant Finance. Visually Explained." }] },
    twitter: { card: "summary_large_image", title: "TheQuantBateman", description: locale === "es" ? "Finanzas cuantitativas explicadas visualmente." : "Quant Finance. Visually Explained.", images: [image] },
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale: Locale = (await cookies()).get("tqb-locale")?.value === "es" ? "es" : "en";
  return (
    <html lang={locale} suppressHydrationWarning>
      <head><link rel="preload" as="image" href="/characters/quant-bateman/web/idle-pinstripe.png" /><script dangerouslySetInnerHTML={{ __html: `try{document.documentElement.dataset.theme=localStorage.getItem('tqb-theme')||'dark';document.documentElement.lang=localStorage.getItem('tqb-locale')||document.documentElement.lang}catch{}` }} /></head>
      <body><I18nProvider initialLocale={locale}>{children}</I18nProvider></body>
    </html>
  );
}
