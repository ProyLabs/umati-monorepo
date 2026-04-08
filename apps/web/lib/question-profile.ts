"use client";

import { QuestionProfile } from "@umati/ws";

export const QUESTION_PROFILE_OPTIONS = [
  {
    value: QuestionProfile.AUTO,
    label: "Auto",
  },
  {
    value: QuestionProfile.NIGERIA,
    label: "Nigeria",
  },
  {
    value: QuestionProfile.AFRICA,
    label: "Africa",
  },
  {
    value: QuestionProfile.GLOBAL,
    label: "Global",
  },
] as const;

const NIGERIA_TIMEZONES = new Set(["Africa/Lagos"]);

const AFRICA_TIMEZONES = [
  "Africa/",
];

export function inferQuestionProfile(): QuestionProfile {
  if (typeof window === "undefined") {
    return QuestionProfile.GLOBAL;
  }

  const languages = navigator.languages ?? [navigator.language];
  const normalizedLanguages = languages
    .filter(Boolean)
    .map((language) => language.toLowerCase());

  if (normalizedLanguages.some((language) => language.endsWith("-ng"))) {
    return QuestionProfile.NIGERIA;
  }

  if (
    normalizedLanguages.some((language) =>
      ["-gh", "-ke", "-ug", "-tz", "-za"].some((suffix) =>
        language.endsWith(suffix),
      ),
    )
  ) {
    return QuestionProfile.AFRICA;
  }

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (NIGERIA_TIMEZONES.has(timeZone)) {
    return QuestionProfile.NIGERIA;
  }

  if (AFRICA_TIMEZONES.some((prefix) => timeZone?.startsWith(prefix))) {
    return QuestionProfile.AFRICA;
  }

  return QuestionProfile.GLOBAL;
}

