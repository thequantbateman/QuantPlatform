import { volatilityLessons, volatilityTrack } from "./volatility";
import type { AcademyLesson, AcademyTrack } from "./types";

export const academyLessons: AcademyLesson[] = volatilityLessons;
export const academyTracks: AcademyTrack[] = [volatilityTrack];
export { volatilityTrack };

export function findAcademyLesson(slug: string): AcademyLesson | undefined {
  return academyLessons.find((lesson) => lesson.slug === slug);
}

export function findAcademyLessonById(id: string): AcademyLesson | undefined {
  return academyLessons.find((lesson) => lesson.id === id);
}
