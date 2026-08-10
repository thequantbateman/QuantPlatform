import type { Metadata } from "next";
import { headers } from "next/headers";
import "katex/dist/katex.min.css";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const image = `${protocol}://${host}/og.png`;
  return {
    title: { default: "TheQuantBateman — Quant Finance, Visually Explained", template: "%s — TheQuantBateman" },
    description: "Interactive quantitative finance labs, progressive model education and institutional market intuition.",
    applicationName: "TheQuantBateman",
    keywords: ["quantitative finance", "Black-Scholes", "volatility", "yield curves", "quant education"],
    openGraph: { title: "TheQuantBateman", description: "Quant Finance. Visually Explained.", type: "website", siteName: "TheQuantBateman", images: [{ url: image, width: 1731, height: 909, alt: "TheQuantBateman — Quant Finance. Visually Explained." }] },
    twitter: { card: "summary_large_image", title: "TheQuantBateman", description: "Quant Finance. Visually Explained.", images: [image] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: `try{const s=localStorage.getItem('tqb-theme');document.documentElement.dataset.theme=s||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch{}` }} /></head>
      <body>{children}</body>
    </html>
  );
}
