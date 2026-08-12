import { ratesLessons, ratesTrack } from "./rates";
import { volatilityLessons, volatilityTrack } from "./volatility";
import type { AcademyLesson, AcademyTrack } from "./types";

export const academyLessons: AcademyLesson[] = [...volatilityLessons, ...ratesLessons];
export const academyTracks: AcademyTrack[] = [volatilityTrack, ratesTrack];
export { ratesTrack, volatilityTrack };

export function findAcademyLesson(slug: string): AcademyLesson | undefined {
  return academyLessons.find((lesson) => lesson.slug === slug);
}

export function findAcademyLessonById(id: string): AcademyLesson | undefined {
  return academyLessons.find((lesson) => lesson.id === id);
}

export function findAcademyLessonForRoute(asset: string, slug: string): AcademyLesson | undefined {
  const route = `/learn/${asset}/${slug}`;
  return academyLessons.find((lesson) =>
    (asset === lesson.domain && slug === lesson.slug) || lesson.legacyRoutes?.includes(route),
  );
}
