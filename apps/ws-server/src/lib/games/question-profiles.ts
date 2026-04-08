import { QuestionProfile } from "@umati/ws";

type CategorizedQuestion = {
  question: string;
  category?: string;
};

const PROFILE_CATEGORY_MATCHERS: Record<
  Exclude<QuestionProfile, "auto">,
  string[]
> = {
  [QuestionProfile.GLOBAL]: [],
  [QuestionProfile.AFRICA]: ["africa", "nigeria", "football", "music", "everyday life"],
  [QuestionProfile.NIGERIA]: ["nigeria", "africa", "football", "music", "food", "everyday life"],
};

export function normalizeQuestionProfile(
  profile?: QuestionProfile,
): Exclude<QuestionProfile, "auto"> {
  if (!profile || profile === QuestionProfile.AUTO) {
    return QuestionProfile.GLOBAL;
  }

  return profile;
}

function byProfile<T extends CategorizedQuestion>(
  questions: T[],
  profile: Exclude<QuestionProfile, "auto">,
) {
  if (profile === QuestionProfile.GLOBAL) {
    return questions;
  }

  const matchers = PROFILE_CATEGORY_MATCHERS[profile];

  return questions.filter((question) =>
    matchers.some((matcher) =>
      question.category?.toLowerCase().includes(matcher),
    ),
  );
}

export function getTriviaQuestionPool<T extends CategorizedQuestion>(
  questions: T[],
  profile?: QuestionProfile,
) {
  const normalizedProfile = normalizeQuestionProfile(profile);
  const primaryQuestions = byProfile(questions, normalizedProfile);

  return primaryQuestions.length >= 12 ? primaryQuestions : questions;
}

export function getHerdMentalityQuestionPool<T extends CategorizedQuestion>(
  questions: T[],
  profile?: QuestionProfile,
) {
  const normalizedProfile = normalizeQuestionProfile(profile);
  const primaryQuestions = byProfile(questions, normalizedProfile);

  return primaryQuestions.length >= 10 ? primaryQuestions : questions;
}
