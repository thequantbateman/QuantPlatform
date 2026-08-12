/* eslint-disable @next/next/no-html-link-for-pages */
import type { Metadata } from "next";
import { AppShell } from "@/src/components/AppShell";
import { ConceptArticle } from "@/src/components/content/ConceptArticle";
import { assetPath, contentCatalog, findByTitle, findContent } from "@/src/content/catalog";
import { AcademyLessonPage } from "@/src/components/academy/AcademyLessonPage";
import { academyLessons, findAcademyLessonForRoute } from "@/src/content/academy/catalog";
import { localizeAcademyLesson } from "@/src/content/academy/localization";
import { localizeEntry } from "@/src/content/localization";
import { serverLocale } from "@/src/i18n/server";

type PageProps = { params: Promise<{ asset: string; slug: string }> };

export function generateStaticParams() {
  const aliases = academyLessons.flatMap((lesson) => (lesson.legacyRoutes ?? []).map((route) => {
    const [, , asset, slug] = route.split("/");
    return { asset, slug };
  }));
  return [...contentCatalog.map((entry) => ({ asset: assetPath(entry.assetClass), slug: entry.slug })), ...academyLessons.map((lesson) => ({ asset: lesson.domain, slug: lesson.slug })), ...aliases];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { asset, slug } = await params;
  const locale = await serverLocale();
  const academyLesson = findAcademyLessonForRoute(asset, slug);
  if (academyLesson) { const localized = localizeAcademyLesson(academyLesson, locale); return { title: `${localized.title} · Academy`, description: localized.subtitle }; }
  const entry = findContent(asset, slug);
  if (entry) { const localized = localizeEntry(entry, locale); return { title: localized.title, description: localized.description }; }
  return { title: locale === "es" ? "Concepto no encontrado" : "Concept not found" };
}

export default async function ConceptPage({ params }: PageProps) {
  const { asset, slug } = await params;
  const locale = await serverLocale();
  const academyLesson = findAcademyLessonForRoute(asset, slug);
  if (academyLesson) return <AppShell><AcademyLessonPage lesson={academyLesson} /></AppShell>;
  const entry = findContent(asset, slug);
  if (!entry) return <AppShell><div className="not-found section-shell"><span className="eyebrow">404 · {locale === "es" ? "GRAFO DE CONOCIMIENTO" : "KNOWLEDGE GRAPH"}</span><h1>{locale === "es" ? "Concepto no encontrado." : "Concept not found."}</h1><a className="button button-primary" href="/learn">{locale === "es" ? "Volver a Aprender" : "Return to Learn"}</a></div></AppShell>;
  const related = entry.relatedTopics.map(findByTitle).filter((item): item is NonNullable<typeof item> => Boolean(item));
  return <AppShell><ConceptArticle source={entry} relatedSources={related} /></AppShell>;
}
