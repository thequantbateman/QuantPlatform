import type { Metadata } from "next";
import { cookies } from "next/headers";
import type { Locale } from ".";

export async function serverLocale(): Promise<Locale> {
  return (await cookies()).get("tqb-locale")?.value === "es" ? "es" : "en";
}

export async function localizedMetadata(values: { en: { title: string; description: string }; es: { title: string; description: string } }): Promise<Metadata> {
  return values[await serverLocale()];
}
