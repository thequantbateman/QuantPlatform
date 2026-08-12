import { ratesLessons, ratesTrack } from "./rates";
import { volatilityLessons, volatilityTrack } from "./volatility";
import { advancedAcademyLessons, foundationsTrack, greeksHedgingTrack, numericalFinanceTrack, riskXvaTrack } from "./advanced";
import type { AcademyLesson, AcademyTrack } from "./types";

export const academyLessons: AcademyLesson[] = [...advancedAcademyLessons, ...volatilityLessons, ...ratesLessons];
export const academyTracks: AcademyTrack[] = [foundationsTrack, volatilityTrack, ratesTrack, numericalFinanceTrack, greeksHedgingTrack, riskXvaTrack];
export { foundationsTrack, greeksHedgingTrack, numericalFinanceTrack, ratesTrack, riskXvaTrack, volatilityTrack };

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
