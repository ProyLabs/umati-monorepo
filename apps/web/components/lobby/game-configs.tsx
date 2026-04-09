import {
  Games,
  GameType,
  QuestionProfile,
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
  const [noOfRounds, setNoOfRounds] = useState(10);
  const [jsonValue, setJsonValue] = useState(
    JSON.stringify(quizzerTemplate, null, 2),
  );
  const [error, setError] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState(quizzerTemplate.length);

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

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <Label htmlFor="quizzer-rounds">Number of Rounds</Label>
        <ButtonOptions
          value={noOfRounds}
          options={[3, 5, 10, 15, 20]}
          onChange={(val) => setNoOfRounds(val as number)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="quizzer-upload">Questions JSON</Label>
        <input
          id="quizzer-upload"
          type="file"
          accept="application/json"
          onChange={handleFileUpload}
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <Fbutton type="button" variant="outline" className="w-full" onClick={downloadTemplate}>
            Download Template
          </Fbutton>
          <Fbutton
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => handleQuestionsChange(JSON.stringify(quizzerTemplate, null, 2))}
          >
            Reset Template
          </Fbutton>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="quizzer-json">Edit Questions</Label>
        <textarea
          id="quizzer-json"
          value={jsonValue}
          onChange={(event) => handleQuestionsChange(event.target.value)}
          className="min-h-72 w-full rounded-md border bg-white/80 px-3 py-2 text-sm font-mono text-black"
          spellCheck={false}
        />
        <p className="text-sm opacity-80">
          Supports `selection` with 2-4 options and `true_false`.
        </p>
        <p className="text-sm font-medium">
          {error ? error : `${questionCount} questions ready`}
        </p>
      </div>

      <div className="grid gap-2">
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
              noOfRounds: Math.min(noOfRounds, result.questions.length),
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
  );
};
