/* eslint-disable @next/next/no-html-link-for-pages */
import type { Metadata } from "next";
import { AppShell } from "@/src/components/AppShell";
import { ConceptArticle } from "@/src/components/content/ConceptArticle";
import { assetPath, contentCatalog, findByTitle, findContent } from "@/src/content/catalog";
import { AcademyLessonPage } from "@/src/components/academy/AcademyLessonPage";
import { academyLessons, findAcademyLesson } from "@/src/content/academy/catalog";

type PageProps = { params: Promise<{ asset: string; slug: string }> };

export function generateStaticParams() {
  return [...contentCatalog.map((entry) => ({ asset: assetPath(entry.assetClass), slug: entry.slug })), ...academyLessons.map((lesson) => ({ asset: lesson.domain, slug: lesson.slug }))];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { asset, slug } = await params;
  const academyLesson = asset === "volatility" ? findAcademyLesson(slug) : undefined;
  if (academyLesson) return { title: `${academyLesson.title} · Academy`, description: academyLesson.subtitle };
  const entry = findContent(asset, slug);
  return entry ? { title: entry.title, description: entry.description } : { title: "Concept not found" };
}

export default async function ConceptPage({ params }: PageProps) {
  const { asset, slug } = await params;
  const academyLesson = asset === "volatility" ? findAcademyLesson(slug) : undefined;
  if (academyLesson) return <AppShell><AcademyLessonPage lesson={academyLesson} /></AppShell>;
  const entry = findContent(asset, slug);
  if (!entry) return <AppShell><div className="not-found section-shell"><span className="eyebrow">404 · KNOWLEDGE GRAPH</span><h1>Concept not found.</h1><a className="button button-primary" href="/learn">Return to Learn</a></div></AppShell>;
  const related = entry.relatedTopics.map(findByTitle).filter((item): item is NonNullable<typeof item> => Boolean(item));
  return <AppShell><ConceptArticle source={entry} relatedSources={related} /></AppShell>;
}
