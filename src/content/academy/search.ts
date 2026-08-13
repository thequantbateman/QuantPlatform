import type { Locale } from "../../i18n";
import type { PlatformSearchItem } from "../search";
import { academyLessons, academyTracks } from "./catalog";
import { localizeAcademyLesson, localizeAcademyTrack } from "./localization";

export function createAcademySearchItems(locale: Locale): PlatformSearchItem[] {
  const lessons: PlatformSearchItem[] = academyLessons.map((lesson) => {
    const localized = localizeAcademyLesson(lesson, locale);
    return {
      id: `academy-lesson-${lesson.id}`,
      source: "academy",
      kind: "lesson",
      title: localized.title,
      description: localized.subtitle,
      meta: `ACADEMY · ${localized.level}`,
      href: `/learn/${lesson.domain}/${lesson.slug}`,
      keywords: [
        lesson.title,
        localized.title,
        lesson.subtitle,
        localized.subtitle,
        lesson.domain,
        lesson.level,
        ...lesson.tags,
        ...localized.tags,
        ...localized.learningObjectives,
      ],
    };
  });
  const tracks: PlatformSearchItem[] = academyTracks.map((track) => {
    const localized = localizeAcademyTrack(track, locale);
    return {
      id: `academy-track-${track.id}`,
      source: "academy",
      kind: "track",
      title: localized.title,
      description: localized.description,
      meta: locale === "es" ? "ACADEMY · ITINERARIO" : "ACADEMY · TRACK",
      href: `/learn#track-${track.id}`,
      keywords: [
        track.title,
        localized.title,
        track.subtitle,
        localized.subtitle,
        track.description,
        localized.description,
        ...track.nodes.map((node) => node.title),
        ...localized.nodes.map((node) => node.title),
      ],
    };
  });
  return [...lessons, ...tracks];
}
