import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/src/components/AppShell";
import { ConceptArticle } from "@/src/components/content/ConceptArticle";
import { assetPath, contentCatalog, findByTitle, findContent } from "@/src/content/catalog";

type PageProps = { params: Promise<{ asset: string; slug: string }> };

export function generateStaticParams() {
  return contentCatalog.map((entry) => ({ asset: assetPath(entry.assetClass), slug: entry.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { asset, slug } = await params;
  const entry = findContent(asset, slug);
  return entry ? { title: entry.title, description: entry.description } : { title: "Concept not found" };
}

export default async function ConceptPage({ params }: PageProps) {
  const { asset, slug } = await params;
  const entry = findContent(asset, slug);
  if (!entry) return <AppShell><div className="not-found section-shell"><span className="eyebrow">404 · KNOWLEDGE GRAPH</span><h1>Concept not found.</h1><Link className="button button-primary" href="/learn">Return to Learn</Link></div></AppShell>;
  const related = entry.relatedTopics.map(findByTitle).filter((item): item is NonNullable<typeof item> => Boolean(item));
  return <AppShell><ConceptArticle source={entry} relatedSources={related} /></AppShell>;
}
