import {
  Games,
  GameType,
  QuestionProfile,
  QuizzerQuestionType,
} from "@umati/ws";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import Image from "next/image";
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
import { quizzerTemplate } from "@/lib/quizzer-template";

type GameConfigAction = (options: Record<string, any>) => void
type GameConfigProps = {
  game: typeof Games[0]
  action: GameConfigAction
};

function GameConfig({ game, action }: GameConfigProps) {
  const usesDarkText = game.color === "aqua" || game.color === "yellow";

  return (
    <div className="grid gap-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.28),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(0,0,0,0.18),transparent_35%)]" />
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border  p-5 backdrop-blur-md",
          usesDarkText
            ? "bg-black/5 border-black/5"
            : "bg-white/10 border-white/15",
        )}
      >
        <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            {game.src ? (
              <div className="relative flex size-20 shrink-0 items-center justify-center rounded-[1.6rem] border border-white/20 bg-white/15 shadow-lg backdrop-blur-md">
                <div className="absolute inset-0 rounded-[1.6rem] bg-white/10" />
                <Image
                  src={game.src}
                  alt={game.title}
                  width={88}
                  height={88}
                  className="relative z-10 size-14 object-contain drop-shadow-[0_10px_18px_rgba(0,0,0,0.22)]"
                />
              </div>
            ) : null}

            <div className="space-y-3">
              <h2 className="text-3xl font-black tracking-tight">
                {game.title}
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                {game.min ? (
                  <span
                    className={cn(
                      "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
                      usesDarkText
                        ? "border-black/10 bg-white/35 text-black/70"
                        : "border-white/15 bg-black/20 text-white/80",
                    )}
                  >
                    {game.min}+ players
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        {(() => {
          switch (game.id) {
            case GameType.TRIVIA:
              return <TriviaGameConfig action={action} />;
            case GameType.DRAWIT:
              return <DrawItGameConfig action={action} />;
            case GameType.OOO:
              return <OddOneOutGameConfig />;
            case GameType.HM:
              return <HMGameConfig action={action} />;
            case GameType.CHAMELEON:
              return <ChameleonGameConfig action={action} />;
            case GameType.CN:
              return <CodenamesGameConfig action={action} />;
            case GameType.QUIZZER:
              return <QuizzerGameConfig action={action} />;
            case GameType.FF:
              return <FriendFactsGameConfig action={action} />;
            default:
              return null;
          }
        })()}
      </div>
    </div>
  );
}

export default GameConfig;

function ConfigStatCard({
  label,
  value,
  usesDarkText,
}: {
  label: string;
  value: string;
  usesDarkText: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-3 py-3",
        usesDarkText
          ? "border-black/10 bg-white/30"
          : "border-white/15 bg-black/15",
      )}
    >
      <p
        className={cn(
          "text-[11px] font-bold uppercase tracking-[0.16em]",
          usesDarkText ? "text-black/55" : "text-white/55",
        )}
      >
        {label}
      </p>
      <p className="mt-1 text-base font-black leading-tight">{value}</p>
    </div>
  );
}

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
          onValueChange={(value) =>
            setQuestionProfile(value as QuestionProfile)
          }
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

const DrawItGameConfig = ({ action }: { action: GameConfigAction }) => {
  const { closeModal } = useModal();
  const [noOfRounds, setNoOfRounds] = useState(3);
  return (
    <div className="grid gap-8">
      <div className="grid gap-2">
        <Label htmlFor="lobby-code">Number of Rounds</Label>
        <ButtonOptions
          value={noOfRounds}
          options={[1, 2, 3, 4, 5]}
          onChange={(val) => setNoOfRounds(val as number)}
        />
      </div>
      <div className="grid gap-2">
        <Fbutton
          type="submit"
          className="w-full"
          onClick={async () => {
            await action({
              noOfRounds,
              duration: 60,
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
          dark
        />
      </div>
      <div className="grid gap-2">
        <Label>Question Region</Label>
        <Select
          value={questionProfile}
          onValueChange={(value) =>
            setQuestionProfile(value as QuestionProfile)
          }
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
        <Fbutton variant="outline" dark className="w-full" onClick={closeModal}>
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
          className="w-full"
          onClick={async () => {
            await action({
              noOfRounds,
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

const QuizzerGameConfig = ({ action }: { action: GameConfigAction }) => {
  const { closeModal } = useModal();

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
    <div className="grid gap-5">
      <div className="flex flex-col gap-4">
        <div className="rounded-[1.5rem] border border-black/10 bg-black/10 p-4 backdrop-blur-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-black/55">
            Quiz Builder
          </p>
          <p className="text-sm leading-6 text-black/70 mb-3">
            Download the JSON template if you want a head start. Once Quizzer
            opens, the host edits the questions inside the game with live slide
            setup.
          </p>

          <Fbutton
            type="button"
            variant="outline"
            className="w-full"
            onClick={downloadTemplate}
          >
            Download Template
          </Fbutton>
        </div>

        <div className="mt-auto grid gap-2">
          <Fbutton
            type="button"
            className="w-full"
            onClick={async () => {
              await action({});
            }}
          >
            Start Setup
          </Fbutton>
          <Fbutton variant="outline" className="w-full" onClick={closeModal}>
            Cancel
          </Fbutton>
        </div>
      </div>
    </div>
  );
};

const FriendFactsGameConfig = ({ action }: { action: GameConfigAction }) => {
  const { closeModal } = useModal();
  const [noOfRounds, setNoOfRounds] = useState(5);

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <Label>Rounds</Label>
        <ButtonOptions
          value={noOfRounds}
          options={[3, 5, 8, 10]}
          onChange={(value) => setNoOfRounds(value as number)}
        />
      </div>
      <div className="grid gap-2">
        <Fbutton
          type="button"
          className="w-full"
          onClick={async () => {
            await action({ noOfRounds });
          }}
        >
          Start Setup
        </Fbutton>
        <Fbutton variant="outline" className="w-full" onClick={closeModal}>
          Cancel
        </Fbutton>
      </div>
    </div>
  );
};

const CodenamesGameConfig = ({ action }: { action: GameConfigAction }) => {
  const { closeModal } = useModal();

  return (
    <div className="grid gap-6">
      <div className="rounded-[1.5rem] border border-black/10 bg-black/5 px-4 py-4 text-sm text-black/70">
        Teams are split randomly in setup. Players claim spymaster spots from
        their own devices.
      </div>
      <div className="grid gap-2">
        <Fbutton
          type="button"
          className="w-full"
          onClick={async () => {
            await action({});
          }}
        >
          Start Setup
        </Fbutton>
        <Fbutton variant="outline" className="w-full" onClick={closeModal}>
          Cancel
        </Fbutton>
      </div>
    </div>
  );
};
