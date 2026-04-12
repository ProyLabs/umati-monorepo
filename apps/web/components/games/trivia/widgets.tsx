import {
  PlayerAvatar,
  PlayerLeaveButton,
  Reactions,
} from "@/components/lobby/widgets";
import { cn } from "../../../lib/utils";
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import React, { Fragment } from "react";
import { useEffect, useState } from "react";
import { useLobbyPlayer } from "@/providers/lobby-player-provider";
import { Fbutton } from "@/components/ui/fancy-button";
import UmatiLogo from "@/components/ui/logo";
import { useTriviaHost } from "@/providers/games/trivia/trivia-host-provider";
import { useLobbyHost } from "@/providers/lobby-host-provider";
import { useTriviaPlayer } from "@/providers/games/trivia/trivia-player-provider";
import { GameType, TriviaOptions } from "@umati/ws";
import { EndGameButton, ScoreGapHint } from "../shared";
import {
  quizzerTemplate,
  validateQuizzerQuestions,
} from "@/lib/quizzer-template";
import { QuizzerQuestionType, type QuizzerQuestionInput } from "@umati/ws";

export const Question = ({ text }: { text: string }) => {
  return (
    <h1 className="text-6xl font-bold mb-8 text-center max-w-4xl mx-auto w-full">
      {text}
    </h1>
  );
};

export type OptionLetter = "A" | "B" | "C" | "D";

export const Option = ({
  letter,
  text,
  state = "default",
  count,
}: {
  letter: OptionLetter;
  text: string;
  state?: "default" | "correct" | "wrong";
  count: number | null;
}) => {
  const Icon = () => {
    if (state === "correct") {
      return (
        <div className="rounded-full size-10 bg-[var(--umati-aqua)] flex items-center justify-center text-white">
          <CheckIcon className="size-6" />
        </div>
      );
    } else {
      return (
        <div
          data-letter={letter}
          className="rounded-full size-10 data-[letter=A]:bg-[var(--umati-yellow)] data-[letter=B]:bg-[var(--umati-sky)] data-[letter=C]:bg-[var(--umati-purple)] data-[letter=D]:bg-[var(--umati-red)] flex items-center justify-center text-white"
        >
          <p className="text-xl font-bold text-center w-full">{letter}</p>
        </div>
      );
    }
  };

  return (
    <motion.div
      className={cn(
        "bg-white text-black p-4 rounded-2xl inline-flex items-center gap-4 cursor-pointer hover:scale-[1.02] transition-transform duration-300 ease-linear relative",
        state === "wrong" && "opacity-50"
      )}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      transition={{ duration: 0.15 }}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={`${state}-${letter}`}
          data-slot="copy-button-icon"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          transition={{ duration: 0.15 }}
        >
          <Icon />
        </motion.span>
      </AnimatePresence>
      <p className="text-3xl font-semibold">{text}</p>

      <AnimatePresence mode="wait">
        {count && (
          <motion.div
            key={`${state}-${letter}-count`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ duration: 0.15, delay: 1 }}
            className="aspect-square w-10 h-10 border-4 border-black bg-white flex flex-col items-center justify-center rounded-full text-center font-semibold absolute -right-1 -top-2"
          >
            {count}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const PlayerOption = ({
  letter,
  text,
  selected,
  disabled,
  onClick,
}: {
  letter: OptionLetter;
  text: string;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) => {
  return (
    <motion.div
      onClick={onClick}
      className={cn(
        "bg-white text-black p-4 h-20 rounded-2xl inline-flex items-center gap-4 cursor-pointer select-none transition-transform duration-300 ease-linear",
        "hover:scale-102 active:scale-105",
        selected && "bg-[var(--umati-blue)] text-white",
        disabled && !selected && "pointer-events-none opacity-75 "
      )}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      transition={{ duration: 0.15 }}
    >
      <span className="text-2xl md:text-3xl font-bold bg-black/10 rounded-full px-4 py-1">
        {letter}
      </span>
      <p className="text-2xl md:text-3xl font-semibold text-center w-full">
        {text}
      </p>
    </motion.div>
  );
};

export const PlayerOptions = ({
  selected = null,
  options,
  onSelect,
}: {
  selected?: OptionLetter | null;
  options: { letter: OptionLetter; text: string }[];
  onSelect?: (letter: OptionLetter) => void;
}) => {
  const [internalSelected, setSelected] = useState<OptionLetter | null>(
    selected || null
  );

  const handleSelect = (letter: OptionLetter) => {
    if (internalSelected) return;
    setSelected(letter);
    onSelect?.(letter);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl w-full mx-auto px-4">
      {options.map((opt) => (
        <PlayerOption
          key={opt.letter}
          {...opt}
          selected={opt.letter === internalSelected}
          disabled={!!internalSelected}
          onClick={() => handleSelect(opt.letter)}
        />
      ))}
    </div>
  );
};

export const Timer = ({
  duration,
  startTime,
}: {
  startTime: number | Date;
  duration: number;
}) => {
  const startTimestamp =
    startTime instanceof Date ? startTime.getTime() : startTime;

  const [seconds, setSeconds] = useState(() => {
    const elapsed = Math.floor((Date.now() - startTimestamp) / 1000);
    return Math.max(duration - elapsed, 0);
  });

  useEffect(() => {
    if (seconds <= 0) return;

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []); // run only once

  const progress = Math.max((seconds / duration) * 100, 0);
  const urgency =
    seconds <= 5 ? "critical" : seconds <= 10 ? "warning" : "steady";

  return (
    <div className="relative mx-auto flex w-full max-w-4xl flex-col gap-3 ">
      <div className="relative z-10 flex items-center justify-between gap-4">
        <div
          className={cn(
            "relative z-10 flex min-w-26 items-center justify-center rounded-[1.5rem] border px-4 py-3 text-center shadow-lg mx-auto",
            urgency === "critical" &&
              "border-red-300/40 bg-red-500/20 text-red-50",
            urgency === "warning" &&
              "border-yellow-300/40 bg-yellow-400/20 text-yellow-50",
            urgency === "steady" && "border-white/15 bg-black/20 text-white",
          )}
        >
          <div className="flex items-end gap-1">
            <p className="text-4xl font-black leading-none">{seconds ?? 0}</p>
            <span className="pb-1 text-xs font-bold uppercase tracking-[0.18em] opacity-70">
              sec
            </span>
          </div>
        </div>
      </div>

      <div className="relative z-10">
        <div className="h-4 overflow-hidden rounded-full border border-white/10 bg-black/20">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-1000 ease-linear",
              urgency === "critical" &&
                "bg-[linear-gradient(90deg,#ef4444,#fb7185)]",
              urgency === "warning" &&
                "bg-[linear-gradient(90deg,#f59e0b,#facc15)]",
              urgency === "steady" &&
                "bg-[linear-gradient(90deg,var(--umati-aqua),var(--umati-sky),var(--umati-purple))]",
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-y-4 left-1/2 z-0 hidden w-px -translate-x-1/2 bg-white/8 md:block" />
      <div
        className={cn(
          "pointer-events-none absolute right-6 top-4 size-18 rounded-full blur-3xl",
          urgency === "critical" && "bg-red-400/20",
          urgency === "warning" && "bg-yellow-300/20",
          urgency === "steady" && "bg-[var(--umati-sky)]/16",
        )}
      />
      <div
        className={cn(
          "pointer-events-none absolute bottom-2 left-6 size-20 rounded-full blur-3xl",
          urgency === "critical" && "bg-red-500/16",
          urgency === "warning" && "bg-[var(--umati-yellow)]/16",
          urgency === "steady" && "bg-[var(--umati-aqua)]/16",
        )}
      />
    </div>
  );
};

export const TriviaTitleScreen = () => {
  const { player, leaveLobby } = useLobbyPlayer();
  const { gameType } = useTriviaPlayer();
  const gameTitle = gameType === GameType.QUIZZER ? "Quizzer" : "Trivia";
  return (
    <div className="max-w-screen-2xl mx-auto w-full py-4 flex flex-col gap-8 px-4 items-center justify-center h-full">
      <div className="text-center">
        <p className="text-lg font-medium">Now Playing</p>
        <h3 className="text-6xl font-bold text-center ">{gameTitle}</h3>
        <p className="mt-6">Waiting for host to start the game...</p>
      </div>
      <div className="animate-bounce animation-duration-[5s] mt-10">
        <PlayerAvatar
          displayName={player?.displayName!}
          avatar={player?.avatar!}
        />
      </div>
    </div>
  );
};

const emptyQuizzerQuestion = (): QuizzerQuestionInput => ({
  question: "",
  type: QuizzerQuestionType.SELECTION,
  options: ["", ""],
  correctAnswer: "",
});

function QuizzerSlidePreview({
  question,
  index,
  active,
  onSelect,
}: {
  question: QuizzerQuestionInput;
  index: number;
  active?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-xl border p-3 text-left transition h-fit max-w-xs",
        active
          ? "border-white/30 bg-white/16 shadow-[0_18px_40px_rgba(0,0,0,0.18)]"
          : "border-white/10 bg-black/16 hover:border-white/20 hover:bg-white/10",
      )}
    >
      <div className="mb-3 flex flex-col">
        <div className="flex items-center gap-3 justify-between">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/45 flex-1">
            Slide {index + 1}
          </p>
          <div className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">
            {question.type === QuizzerQuestionType.SELECTION ? "Choice" : "T/F"}
          </div>
        </div>
        <p className="mt-1 text-sm font-black text-white">
          {question.question.trim() || "Untitled question"}
        </p>
      </div>
    </button>
  );
}

function QuizzerCompactStage({
  question,
  onChange,
}: {
  question: QuizzerQuestionInput;
  onChange: (question: QuizzerQuestionInput) => void;
}) {
  const previewOptions =
    question.type === QuizzerQuestionType.SELECTION
      ? (question.options ?? [])
      : ["True", "False"];

  const updateQuestion = (value: string) => {
    onChange({
      ...question,
      question: value.replace(/\n+/g, " ").trim(),
    });
  };

  const updateOption = (optionIndex: number, value: string) => {
    if (question.type !== QuizzerQuestionType.SELECTION) return;

    const nextOptions = [...(question.options ?? [])];
    nextOptions[optionIndex] = value.replace(/\n+/g, " ").trim();
    onChange({
      ...question,
      options: nextOptions,
    });
  };

  return (
    <div className="rounded-[1.8rem] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))] p-4 shadow-[0_30px_80px_rgba(0,0,0,0.2)]">
      <div className="rounded-[1.6rem] bg-[#19110d] px-4 py-5 text-white">
        <div className=" max-w-2xl mx-auto">
          <div className="mb-5 flex items-center justify-between gap-3">
            <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white/65">
              {question.type === QuizzerQuestionType.SELECTION
                ? "Multiple Choice"
                : "True / False"}
            </span>
          </div>

          <p
            className="rounded-2xl px-2 py-1 text-2xl font-black text-center leading-9 text-white outline-none transition hover:bg-white/5 focus:bg-white/8"
            contentEditable
            suppressContentEditableWarning
            onBlur={(event) => updateQuestion(event.currentTarget.innerText)}
            onInput={(event) =>
              updateQuestion(event.currentTarget.textContent || "")
            }
          >
            {question.question.trim() || "Your question will appear here."}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {previewOptions.map((option, optionIndex) => {
              const isCorrect =
                question.type === QuizzerQuestionType.SELECTION
                  ? option === question.correctAnswer
                  : (option === "True" && question.correctAnswer === true) ||
                    (option === "False" && question.correctAnswer === false);

              return (
                <div
                  key={`${option}-${optionIndex}`}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border px-4 py-3 transition",
                    isCorrect
                      ? "border-emerald-300/35 bg-emerald-400/18 text-emerald-50"
                      : "border-white/10 bg-white/8 text-white/78 hover:bg-white/12",
                  )}
                  onClick={() => {
                    if (question.type === QuizzerQuestionType.SELECTION) {
                      onChange({
                        ...question,
                        correctAnswer: option,
                      });
                      return;
                    }

                    onChange({
                      ...question,
                      correctAnswer: option === "True",
                    });
                  }}
                >
                  <span className="inline-flex size-8 items-center justify-center rounded-full bg-white/10 text-xs font-black">
                    {String.fromCharCode(65 + optionIndex)}
                  </span>
                  {question.type === QuizzerQuestionType.SELECTION ? (
                    <span
                      className="flex-1 rounded-xl px-2 py-1 text-lg font-semibold outline-none"
                      contentEditable
                      suppressContentEditableWarning
                      onClick={(event) => event.stopPropagation()}
                      onBlur={(event) =>
                        updateOption(optionIndex, event.currentTarget.innerText)
                      }
                      onInput={(event) =>
                        updateOption(
                          optionIndex,
                          event.currentTarget.textContent || "",
                        )
                      }
                    >
                      {option || `Option ${optionIndex + 1}`}
                    </span>
                  ) : (
                    <span className="text-sm font-semibold">
                      {option || `Option ${optionIndex + 1}`}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuizzerSlideEditor({
  index,
  question,
  total,
  onChange,
  onRemove,
}: {
  index: number;
  question: QuizzerQuestionInput;
  total: number;
  onChange: (question: QuizzerQuestionInput) => void;
  onRemove: () => void;
}) {
  const selectionOptions = question.options ?? ["", ""];

  return (
    <div className="grid gap-5 rounded-[2rem] border border-white/14 bg-black/18 p-5 backdrop-blur-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/50">
            Slide {index + 1} of {total}
          </p>
        </div>

        <Fbutton
          type="button"
          variant="outline"
          size="sm"
          onClick={onRemove}
          disabled={total <= 1}
        >
          <Trash2Icon className="size-4" />
          Remove Slide
        </Fbutton>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-[1.5rem] border border-white/10 bg-white/8 px-4 py-3">
        <label className="grid gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">
            Type
          </span>
          <select
            value={question.type}
            onChange={(event) => {
              const nextType = event.target.value as QuizzerQuestionType;
              if (nextType === QuizzerQuestionType.TRUE_FALSE) {
                onChange({
                  question: question.question,
                  type: nextType,
                  correctAnswer: true,
                });
                return;
              }

              onChange({
                question: question.question,
                type: nextType,
                options:
                  question.type === QuizzerQuestionType.SELECTION
                    ? selectionOptions
                    : ["", ""],
                correctAnswer:
                  question.type === QuizzerQuestionType.SELECTION
                    ? String(question.correctAnswer ?? "")
                    : "",
              });
            }}
            className="h-11 rounded-2xl border border-white/10 bg-white/95 px-4 text-sm font-semibold text-black outline-none transition focus:border-white/40"
          >
            <option value={QuizzerQuestionType.SELECTION}>
              Multiple Choice
            </option>
            <option value={QuizzerQuestionType.TRUE_FALSE}>True / False</option>
          </select>
        </label>

        {question.type === QuizzerQuestionType.SELECTION ? (
          <Fbutton
            type="button"
            variant="outline"
            size="sm"
            disabled={selectionOptions.length >= 4}
            onClick={() =>
              onChange({
                ...question,
                options: [...selectionOptions, ""],
              })
            }
          >
            <PlusIcon className="size-4" />
            Add Option
          </Fbutton>
        ) : null}

        {question.type === QuizzerQuestionType.SELECTION ? (
          <Fbutton
            type="button"
            variant="outline"
            size="sm"
            disabled={selectionOptions.length <= 2}
            onClick={() => {
              const nextOptions = selectionOptions.slice(0, -1);
              const nextAnswer = nextOptions.includes(
                String(question.correctAnswer),
              )
                ? question.correctAnswer
                : (nextOptions[0] ?? "");
              onChange({
                ...question,
                options: nextOptions,
                correctAnswer: String(nextAnswer),
              });
            }}
          >
            Remove Option
          </Fbutton>
        ) : null}

        <p className="ml-auto text-sm text-white/68">
          Edit inside the preview. Click an answer to mark it correct.
        </p>
      </div>

      <div className="grid gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/46">
          Live Editing Stage
        </p>
        <QuizzerCompactStage question={question} onChange={onChange} />
      </div>
    </div>
  );
}

export const QuizzerSetupHost = () => {
  const { setup, startGame, syncQuizzerSetup } = useTriviaHost();
  const [questions, setQuestions] = useState<QuizzerQuestionInput[]>(
    setup?.questions?.length ? setup.questions : quizzerTemplate,
  );
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (setup?.questions?.length) {
      setQuestions(setup.questions);
      return;
    }

    if (!setup?.questions) {
      setQuestions(quizzerTemplate);
    }
  }, [setup]);

  const commitQuestions = (nextQuestions: QuizzerQuestionInput[]) => {
    setQuestions(nextQuestions);
    setActiveIndex((current) =>
      Math.min(current, Math.max(nextQuestions.length - 1, 0)),
    );
    const result = validateQuizzerQuestions(nextQuestions);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setError(null);
    syncQuizzerSetup(result.questions);
  };

  const canStart = !!setup?.canStart && !error;
  const activeQuestion = questions[activeIndex] ?? emptyQuizzerQuestion();

  return (
    <div className="mx-auto flex h-full w-full max-w-screen-2xl flex-col gap-6 overflow-y-auto px-4 py-5 md:px-6 md:py-6">
      <div className="grid gap-4 rounded-[2rem] border border-white/15 bg-[linear-gradient(135deg,rgba(31,15,8,0.42),rgba(0,0,0,0.16))] p-6 backdrop-blur-sm lg:grid-cols-[1.3fr_0.9fr]">
        <div className="space-y-3">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-white/55">
            Quizzer Setup
          </p>
          <h1 className="max-w-3xl text-4xl font-black tracking-tight text-white md:text-5xl">
            Build the quiz one slide at a time.
          </h1>
          <p className="max-w-2xl text-base text-white/75 md:text-lg">
            Move through each question like a deck. Edit the current slide,
            check the side preview, then continue when the flow feels right.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 self-start">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/10 px-4 py-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">
              Questions
            </p>
            <p className="mt-2 text-3xl font-black text-white">
              {questions.length}
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-white/10 px-4 py-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">
              Status
            </p>
            <p className="mt-2 text-lg font-black text-white">
              {canStart ? "Show-ready" : "Needs edits"}
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-white/10 px-4 py-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">
              Current
            </p>
            <p className="mt-2 text-lg font-black text-white">
              Slide {activeIndex + 1}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Fbutton
          type="button"
          onClick={() => {
            const nextQuestions = [...questions, emptyQuizzerQuestion()];
            commitQuestions(nextQuestions);
            setActiveIndex(nextQuestions.length - 1);
          }}
        >
          <PlusIcon className="size-4" />
          Add Slide
        </Fbutton>
        <Fbutton
          type="button"
          variant="outline"
          onClick={() => {
            commitQuestions(quizzerTemplate);
            setActiveIndex(0);
          }}
        >
          Load Template
        </Fbutton>
        <Fbutton
          type="button"
          variant="outline"
          onClick={startGame}
          disabled={!canStart}
        >
          Start Quizzer
        </Fbutton>

        <div className="ml-auto flex items-center gap-4">
          <p className="text-sm font-semibold text-white/68">
            Editing slide {activeIndex + 1} of {questions.length}
          </p>
          <div className="flex items-center gap-2">
            <Fbutton
              type="button"
              variant="outline"
              size="sm"
              disabled={activeIndex === 0}
              onClick={() => setActiveIndex((index) => Math.max(index - 1, 0))}
            >
              <ChevronLeftIcon className="size-4" />
              Previous
            </Fbutton>
            <Fbutton
              type="button"
              variant="outline"
              size="sm"
              disabled={activeIndex >= questions.length - 1}
              onClick={() =>
                setActiveIndex((index) =>
                  Math.min(index + 1, questions.length - 1),
                )
              }
            >
              Next
              <ChevronRightIcon className="size-4" />
            </Fbutton>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-[1.5rem] border border-red-300/30 bg-red-500/15 px-4 py-3 text-sm font-medium text-red-50">
          {error}
        </div>
      )}

      <div className="grid gap-5 pb-8 xl:grid-cols-[160px_minmax(0,1fr)]">
        <div className="flex flex-col gap-3">
          {questions.map((question, index) => (
            <QuizzerSlidePreview
              key={`${index}-${question.question}`}
              index={index}
              question={question}
              active={index === activeIndex}
              onSelect={() => setActiveIndex(index)}
            />
          ))}
        </div>

        <div className="grid gap-4">
          <QuizzerSlideEditor
            index={activeIndex}
            total={questions.length}
            question={activeQuestion}
            onChange={(nextQuestion) => {
              const nextQuestions = [...questions];
              nextQuestions[activeIndex] = nextQuestion;
              commitQuestions(nextQuestions);
            }}
            onRemove={() => {
              const nextQuestions = questions.filter(
                (_, currentIndex) => currentIndex !== activeIndex,
              );
              commitQuestions(nextQuestions);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export const QuizzerSetupPlayer = () => {
  const { setup } = useTriviaPlayer();

  return (
    <div className="mx-auto flex h-full w-full max-w-4xl flex-col items-center justify-center gap-8 px-6 text-center text-white">
      <div className="space-y-4">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-white/55">
          Quizzer Setup In Progress
        </p>
        <h1 className="text-4xl font-black tracking-tight md:text-6xl">
          The host is tuning the round list.
        </h1>
        <p className="mx-auto max-w-2xl text-base text-white/75 md:text-lg">
          Sit tight while the game board gets polished. Once setup is locked,
          questions and answer positions will be shuffled for the live round.
        </p>
      </div>

      <div className="grid w-full max-w-xl grid-cols-2 gap-4">
        <div className="rounded-[1.75rem] border border-white/10 bg-black/20 px-5 py-5 backdrop-blur-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">
            Questions Ready
          </p>
          <p className="mt-2 text-4xl font-black">
            {setup?.totalQuestions ?? 0}
          </p>
        </div>
        <div className="rounded-[1.75rem] border border-white/10 bg-black/20 px-5 py-5 backdrop-blur-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">
            Status
          </p>
          <p className="mt-2 text-xl font-black">
            {setup?.canStart ? "Almost live" : "Still drafting"}
          </p>
        </div>
      </div>
    </div>
  );
};

export const RoundHost = () => {
  const { lobby } = useLobbyHost();
  const { round, state, counts, nextRound, gameType } = useTriviaHost();

  const letters: OptionLetter[] = ["A", "B", "C", "D"];
  const gameTitle = gameType === GameType.QUIZZER ? "Quizzer" : "Trivia Go";
  return (
    <Fragment>
      <div className="fixed top-0 px-8 py-4 w-full">
        <div className="flex items-center justify-between w-full">
          <div className="flex-1">
            <p className="text-xl font-medium">
              <span className="font-bold ">{lobby?.name}</span> Code:{" "}
              {lobby?.code}
            </p>
            <p className="text-xl font-bold">
              Round {round?.number} of {round?.totalRounds}
            </p>
          </div>

          <p className="text-lg font-semibold flex-1">{gameTitle}</p>

          <div className="flex items-center gap-2 ">
            {state === "ROUND_END" && (
              <Fbutton className="max-w-40 mx-auto w-full" onClick={nextRound}>
                Next
              </Fbutton>
            )}
            <EndGameButton />
          </div>
        </div>
      </div>

      {/* <Podium /> */}
      <AnimatePresence>
        <div className="flex flex-col items-center justify-center h-full gap-16">
          <Question text={round?.question!} />

          <div className="grid grid-cols-2 gap-8 max-w-4xl w-full px-4">
            {round?.choices.map((choice, index) => {
              return (
                <Option
                  key={index}
                  letter={letters[index]}
                  text={choice}
                  state={
                    state === "ROUND_END"
                      ? choice === round?.correctAnswer
                        ? "correct"
                        : "wrong"
                      : "default"
                  }
                  count={
                    state === "ROUND_END" && counts
                      ? counts![index as TriviaOptions]
                      : null
                  }
                />
              );
            })}
          </div>

          {state === "ROUND" && (
            <Timer duration={round?.duration!} startTime={round?.startedAt!} />
          )}
        </div>
      </AnimatePresence>
    </Fragment>
  );
};

export const PlayerRound = () => {
  const { round, submitAnswer } = useTriviaPlayer();
  const letters: OptionLetter[] = ["A", "B", "C", "D"];
  return (
    <div className="flex flex-col items-center justify-center h-full gap-16">
      <h6 className="text-3xl font-bold">Round {round?.number!}</h6>

      <PlayerOptions
        options={
          round?.choices.map((choice, index) => ({
            letter: letters[index],
            text: choice,
          })) ?? []
        }
        onSelect={(letter) =>
          submitAnswer(letters.indexOf(letter) as TriviaOptions)
        }
      />
    </div>
  );
};

export const PlayerRoundEnd = () => {
  const { player } = useLobbyPlayer();
  const { round, scores } = useTriviaPlayer();
  console.log("🚀 ~ PlayerRoundEnd ~ scores:", scores);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-16">
      <div className="text-center">
        <h6 className="text-3xl font-bold mb-4">Round Over</h6>
        {round?.number! < round?.totalRounds! - 1 ? (
          <p className="">Get ready for the next round</p>
        ) : (
          <p className="">Get ready for the last round</p>
        )}
      </div>

      <div className="animate-bounce animation-duration-[5s] mt-10">
        <PlayerAvatar
          displayName={player?.displayName!}
          avatar={player?.avatar!}
        />
        <p className="text-center font-semibold text-2xl">
          {scores?.find((p) => p.id === player?.id)?.score ?? 0} pts
        </p>
      </div>

      <ScoreGapHint scores={scores} />
    </div>
  );
};
