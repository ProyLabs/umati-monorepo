import {
  Games,
  GameType,
  QuestionProfile,
  QuizzerQuestionType,
  type QuizzerQuestionInput,
} from "@umati/ws";
import { useMemo, useState, type ChangeEvent } from "react";
import { useModal } from "../../providers/modal-provider";
import ButtonOptions from "../ui/button-options";
import { Fbutton } from "../ui/fancy-button";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  inferQuestionProfile,
  QUESTION_PROFILE_OPTIONS,
} from "@/lib/question-profile";
import {
  quizzerTemplate,
  validateQuizzerQuestions,
} from "@/lib/quizzer-template";

type GameConfigAction = (options: Record<string, any>) => void
type GameConfigProps = {
  game: typeof Games[0]
  action: GameConfigAction
};

function GameConfig({ game, action }: GameConfigProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-sart">{game.title}</h2>
      <p className="mb-8">Select the game configurations</p>

      {(() => {
        switch (game.id) {
          case GameType.TRIVIA:
            return <TriviaGameConfig action={action} />;
          case GameType.DRAWIT:
            return <DrawItGameConfig />;
          case GameType.OOO:
            return <OddOneOutGameConfig />;
          case GameType.HM:
            return <HMGameConfig action={action} />
          case GameType.CHAMELEON:
            return <ChameleonGameConfig action={action} />
          case GameType.QUIZZER:
            return <QuizzerGameConfig action={action} />;
          default:
            return null;
        }
      })()}
    </div>
  );
}

export default GameConfig;

const TriviaGameConfig = ({action}: { action: GameConfigAction}) => {
  const { closeModal } = useModal();
  const [noOfRounds, setNoOfRounds] = useState(10);
  const inferredQuestionProfile = useMemo(() => inferQuestionProfile(), []);
  const [questionProfile, setQuestionProfile] = useState<QuestionProfile>(
    QuestionProfile.AUTO,
  );

  const resolvedQuestionProfile =
    questionProfile === QuestionProfile.AUTO
      ? inferredQuestionProfile
      : questionProfile;

  return (
    <div className="grid gap-8">
      <div className="grid gap-2">
        <Label htmlFor="lobby-code">Number of Rounds</Label>
        <ButtonOptions
          value={noOfRounds}
          options={[3, 5, 10, 15, 20]}
          onChange={(val) => setNoOfRounds(val as number)}
        />
      </div>
      <div className="grid gap-2">
        <Label>Question Region</Label>
        <Select
          value={questionProfile}
          onValueChange={(value) => setQuestionProfile(value as QuestionProfile)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select question region" />
          </SelectTrigger>
          <SelectContent>
            {QUESTION_PROFILE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.value === QuestionProfile.AUTO
                  ? `${option.label} (${resolvedQuestionProfile})`
                  : option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Fbutton
          type="submit"
          variant="secondary"
          className="w-full"
          onClick={async () => {
            await action({
              noOfRounds,
              questionProfile: resolvedQuestionProfile,
            });
          }}
        >
          Start Game
        </Fbutton>
        <Fbutton variant="outline" className="w-full" onClick={closeModal}>
          Cancel
        </Fbutton>
      </div>
    </div>
  );
};

const DrawItGameConfig = () => {
  const { closeModal } = useModal();
  return (
    <div className="grid gap-8">
      <div className="grid gap-2">
        <Label htmlFor="lobby-code">Number of Rounds</Label>
        <ButtonOptions value={3} options={[1, 2, 3, 5, 10]} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="lobby-code">Word Count</Label>
        <ButtonOptions value={3} options={[2, 3, 4, 5]} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="lobby-code">Drawtime</Label>
        <ButtonOptions value={60} options={[30, 60, 80]} />
      </div>
      <div className="grid gap-2">
        <Fbutton
          type="submit"
          variant="secondary"
          className="w-full"
          onClick={async () => {}}
        >
          Start Game
        </Fbutton>
        <Fbutton variant="outline" className="w-full" onClick={closeModal}>
          Cancel
        </Fbutton>
      </div>
    </div>
  );
};

const HMGameConfig = ({action}: { action: GameConfigAction}) => {
  const { closeModal } = useModal();
  const [noOfRounds, setNoOfRounds] = useState(10);
  const inferredQuestionProfile = useMemo(() => inferQuestionProfile(), []);
  const [questionProfile, setQuestionProfile] = useState<QuestionProfile>(
    QuestionProfile.AUTO,
  );

  const resolvedQuestionProfile =
    questionProfile === QuestionProfile.AUTO
      ? inferredQuestionProfile
      : questionProfile;

  return (
    <div className="grid gap-8">
      <div className="grid gap-2">
        <Label htmlFor="lobby-code">Number of Rounds</Label>
        <ButtonOptions
          value={noOfRounds}
          options={[3, 5, 10, 15, 20]}
          onChange={(val) => setNoOfRounds(val as number)}
          variant="dark-outline"
        />
      </div>
      <div className="grid gap-2">
        <Label>Question Region</Label>
        <Select
          value={questionProfile}
          onValueChange={(value) => setQuestionProfile(value as QuestionProfile)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select question region" />
          </SelectTrigger>
          <SelectContent>
            {QUESTION_PROFILE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.value === QuestionProfile.AUTO
                  ? `${option.label} (${resolvedQuestionProfile})`
                  : option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Fbutton
          type="submit"
          variant="secondary"
          className="w-full"
          onClick={async () => {
            await action({
              noOfRounds,
              questionProfile: resolvedQuestionProfile,
            });
          }}
        >
          Start Game
        </Fbutton>
        <Fbutton variant="dark-outline" className="w-full" onClick={closeModal}>
          Cancel
        </Fbutton>
      </div>
    </div>
  );
};

const OddOneOutGameConfig = () => {
  return <div>Odd One Out Game Config</div>;
};



const ChameleonGameConfig = ({action}: { action: GameConfigAction}) => {
  const { closeModal } = useModal();
  const [noOfRounds, setNoOfRounds] = useState(8);
  return (
    <div className="grid gap-8">
      <div className="grid gap-2">
        <Label htmlFor="lobby-code">Number of Rounds</Label>
        <ButtonOptions
          value={noOfRounds}
          options={[3, 5, 8, 10, 12]}
          onChange={(val) => setNoOfRounds(val as number)}
        />
      </div>
      <div className="grid gap-2">
        <Fbutton
          type="submit"
          variant="secondary"
          className="w-full"
          onClick={async () => {
            await action({
              noOfRounds,
            });
          }}
        >
          Start Game
        </Fbutton>
        <Fbutton variant="outline"  className="w-full" onClick={closeModal}>
          Cancel
        </Fbutton>
      </div>
    </div>
  );
};

const QuizzerGameConfig = ({ action }: { action: GameConfigAction }) => {
  const { closeModal } = useModal();
  const [activeTab, setActiveTab] = useState<"preview" | "edit">("preview");
  const [jsonValue, setJsonValue] = useState(
    JSON.stringify(quizzerTemplate, null, 2),
  );
  const [error, setError] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState(quizzerTemplate.length);
  const [questions, setQuestions] =
    useState<QuizzerQuestionInput[]>(quizzerTemplate);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleQuestionsChange = (value: string) => {
    setJsonValue(value);

    try {
      const parsed = JSON.parse(value);
      const result = validateQuizzerQuestions(parsed);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      setQuestionCount(result.questions.length);
      setQuestions(result.questions);
      setActiveIndex((currentIndex) =>
        Math.min(currentIndex, result.questions.length - 1),
      );
      setError(null);
    } catch {
      setError("JSON is not valid yet.");
    }
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    handleQuestionsChange(text);
  };

  const downloadTemplate = () => {
    const blob = new Blob([JSON.stringify(quizzerTemplate, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "quizzer-template.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const activeQuestion = questions[activeIndex];

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="flex flex-col gap-4">
        <div className="rounded-[1.5rem] border border-black/10 bg-black/10 p-4 backdrop-blur-sm">
          <div className="mb-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-black/55">
              Quiz Builder
            </p>
            <h3 className="mt-2 text-2xl font-black tracking-tight">Quizzer</h3>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-black/10 bg-white/30 px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/50">
                Questions
              </p>
              <p className="mt-1 text-2xl font-black">{questionCount}</p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white/30 px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/50">
                Format
              </p>
              <p className="mt-1 text-2xl font-black">JSON</p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 rounded-[1.5rem] border border-black/10 bg-white/25 p-4">
          <div className="grid gap-2">
            <Label htmlFor="quizzer-upload">Upload Questions</Label>
            <input
              id="quizzer-upload"
              type="file"
              accept="application/json"
              onChange={handleFileUpload}
              className="w-full rounded-xl border border-black/10 bg-white/80 px-3 py-2 text-sm text-black file:mr-3 file:rounded-lg file:border-0 file:bg-black/90 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Fbutton
              type="button"
              variant="outline"
              className="w-full"
              onClick={downloadTemplate}
            >
              Template
            </Fbutton>
            <Fbutton
              type="button"
              variant="outline"
              className="w-full"
              onClick={() =>
                handleQuestionsChange(JSON.stringify(quizzerTemplate, null, 2))
              }
            >
              Reset
            </Fbutton>
          </div>
        </div>

        <div className="mt-auto grid gap-2">
          <Fbutton
            type="button"
            variant="secondary"
            className="w-full"
            onClick={async () => {
              let parsed: unknown;

              try {
                parsed = JSON.parse(jsonValue);
              } catch {
                setError("JSON is not valid.");
                return;
              }

              const result = validateQuizzerQuestions(parsed);
              if (!result.ok) {
                setError(result.error);
                return;
              }

              await action({
                questions: result.questions as QuizzerQuestionInput[],
              });
            }}
          >
            Start Game
          </Fbutton>
          <Fbutton variant="outline" className="w-full" onClick={closeModal}>
            Cancel
          </Fbutton>
        </div>
      </div>

      <div className="grid gap-3">
        <div className="rounded-[1.5rem] border border-black/10 bg-white/30 p-4">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Label className="text-base font-bold">Questions</Label>
            </div>
            <div className="rounded-full border border-black/10 bg-black/5 px-3 py-1 text-sm font-semibold text-black/70">
              {activeTab === "preview"
                ? error
                  ? "Needs attention"
                  : `Slide ${activeIndex + 1} of ${questionCount}`
                : `${questionCount} questions`}
            </div>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-2">
            <Fbutton
              type="button"
              variant={activeTab === "preview" ? "secondary" : "outline"}
              className="w-full"
              onClick={() => setActiveTab("preview")}
            >
              Preview
            </Fbutton>
            <Fbutton
              type="button"
              variant={activeTab === "edit" ? "secondary" : "outline"}
              className="w-full"
              onClick={() => setActiveTab("edit")}
            >
              Edit
            </Fbutton>
          </div>

          {activeTab === "preview" ? (
            activeQuestion ? (
            <div className="grid gap-4">
              <div className="rounded-[1.5rem] border border-black/10 bg-white/85 p-5 shadow-inner">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <span className="rounded-full border border-black/10 bg-black/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-black/60">
                    {activeQuestion.type === QuizzerQuestionType.SELECTION
                      ? "Selection"
                      : "True / False"}
                  </span>
                  <span className="text-sm font-semibold text-black/55">
                    Question {activeIndex + 1}
                  </span>
                </div>

                <div className="rounded-[1.25rem] bg-gradient-to-br from-black to-black/85 px-5 py-6 text-white shadow-lg">
                  <p className="text-lg font-bold leading-8 md:text-2xl">
                    {activeQuestion.question}
                  </p>

                  {activeQuestion.type === QuizzerQuestionType.SELECTION ? (
                    <div className="mt-6 grid gap-3">
                      {activeQuestion.options?.map((option, index) => (
                        <div
                          key={option}
                          className={`rounded-2xl border px-4 py-3 text-sm font-semibold md:text-base ${
                            option === activeQuestion.correctAnswer
                              ? "border-emerald-300/40 bg-emerald-400/15 text-emerald-50"
                              : "border-white/10 bg-white/8 text-white/80"
                          }`}
                        >
                          <span className="mr-3 inline-flex size-7 items-center justify-center rounded-full bg-white/10 text-xs font-black">
                            {String.fromCharCode(65 + index)}
                          </span>
                          {option}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-6 grid grid-cols-2 gap-3">
                      {[
                        { label: "True", value: true },
                        { label: "False", value: false },
                      ].map((option) => (
                        <div
                          key={option.label}
                          className={`rounded-2xl border px-4 py-4 text-center text-base font-bold ${
                            option.value === activeQuestion.correctAnswer
                              ? "border-emerald-300/40 bg-emerald-400/15 text-emerald-50"
                              : "border-white/10 bg-white/8 text-white/80"
                          }`}
                        >
                          {option.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <Fbutton
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={activeIndex === 0}
                  onClick={() =>
                    setActiveIndex((index) => Math.max(index - 1, 0))
                  }
                >
                  Previous
                </Fbutton>
                <Fbutton
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={activeIndex === questionCount - 1}
                  onClick={() =>
                    setActiveIndex((index) =>
                      Math.min(index + 1, questionCount - 1),
                    )
                  }
                >
                  Next
                </Fbutton>
              </div>
            </div>
            ) : (
            <div className="rounded-[1.25rem] border border-dashed border-black/15 bg-black/5 px-4 py-10 text-center text-black/60">
              Upload or reset a valid question set to preview it slide by slide.
            </div>
            )
          ) : (
            <textarea
              value={jsonValue}
              onChange={(event) => handleQuestionsChange(event.target.value)}
              className="min-h-[30rem] w-full rounded-[1.25rem] border border-black/10 bg-white/85 px-4 py-3 font-mono text-sm text-black shadow-inner outline-none focus:border-black/30"
              spellCheck={false}
            />
          )}
        </div>

        <div
          className={`rounded-[1.25rem] border px-4 py-3 text-sm ${
            error
              ? "border-red-500/30 bg-red-500/10 text-red-900"
              : "border-emerald-500/20 bg-emerald-500/10 text-emerald-950"
          }`}
        >
          {error
            ? error
            : `Validation passed. ${questionCount} questions are ready for game time.`}
        </div>
      </div>
    </div>
  );
};
