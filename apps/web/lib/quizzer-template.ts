import {
  QuizzerQuestionType,
  type QuizzerQuestionInput,
} from "@umati/ws";

export const quizzerTemplate: QuizzerQuestionInput[] = [
  {
    question: "Which planet is known as the Red Planet?",
    type: QuizzerQuestionType.SELECTION,
    options: ["Mars", "Venus", "Jupiter", "Saturn"],
    correctAnswer: "Mars",
  },
  {
    question: "The capital of Nigeria is Abuja.",
    type: QuizzerQuestionType.TRUE_FALSE,
    correctAnswer: true,
  },
  {
    question: "Which company created the iPhone?",
    type: QuizzerQuestionType.SELECTION,
    options: ["Apple", "Samsung", "Google", "Nokia"],
    correctAnswer: "Apple",
  },
];

export function validateQuizzerQuestions(input: unknown) {
  if (!Array.isArray(input)) {
    return {
      ok: false as const,
      error: "JSON must be an array of question objects.",
    };
  }

  const questions: QuizzerQuestionInput[] = [];

  for (const [index, question] of input.entries()) {
    if (!question || typeof question !== "object") {
      return {
        ok: false as const,
        error: `Question ${index + 1} is not a valid object.`,
      };
    }

    const record = question as Record<string, unknown>;
    const prompt = String(record.question ?? "").trim();
    const type = record.type;

    if (!prompt) {
      return {
        ok: false as const,
        error: `Question ${index + 1} is missing "question".`,
      };
    }

    if (
      type !== QuizzerQuestionType.SELECTION &&
      type !== QuizzerQuestionType.TRUE_FALSE
    ) {
      return {
        ok: false as const,
        error: `Question ${index + 1} has an invalid "type".`,
      };
    }

    if (type === QuizzerQuestionType.TRUE_FALSE) {
      const answer = record.correctAnswer;
      const normalizedAnswer =
        typeof answer === "boolean"
          ? answer
          : typeof answer === "string"
            ? answer.toLowerCase() === "true"
            : null;

      if (normalizedAnswer === null) {
        return {
          ok: false as const,
          error: `Question ${index + 1} must use true/false for "correctAnswer".`,
        };
      }

      questions.push({
        question: prompt,
        type,
        correctAnswer: normalizedAnswer,
      });
      continue;
    }

    const options = Array.isArray(record.options)
      ? record.options
          .map((option) => String(option).trim())
          .filter(Boolean)
      : [];

    if (options.length < 2 || options.length > 4) {
      return {
        ok: false as const,
        error: `Question ${index + 1} must have 2 to 4 options.`,
      };
    }

    const uniqueOptions = Array.from(new Set(options));
    if (uniqueOptions.length !== options.length) {
      return {
        ok: false as const,
        error: `Question ${index + 1} has duplicate options.`,
      };
    }

    const correctAnswer = String(record.correctAnswer ?? "").trim();
    if (!uniqueOptions.includes(correctAnswer)) {
      return {
        ok: false as const,
        error: `Question ${index + 1} has a correct answer not present in options.`,
      };
    }

    questions.push({
      question: prompt,
      type,
      options: uniqueOptions,
      correctAnswer,
    });
  }

  if (!questions.length) {
    return {
      ok: false as const,
      error: "Add at least one question.",
    };
  }

  return {
    ok: true as const,
    questions,
  };
}

