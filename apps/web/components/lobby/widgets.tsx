"use client";

import { useAuth } from "@/providers/auth-provider";
import { RiGroup3Fill, RiHeart3Line } from "@remixicon/react";
import { GameType, Games, LobbyPoll, Player, RoomState } from "@umati/ws";
import { cva, VariantProps } from "class-variance-authority";
import {
  BarChart3Icon,
  BrainCircuitIcon,
  ChevronLeftIcon,
  CheckIcon,
  ListChecksIcon,
  MaximizeIcon,
  MinimizeIcon,
  PlusIcon,
  SparklesIcon,
  UserRoundX,
  WifiHighIcon,
  WifiIcon,
  WifiLowIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import useClickOutside from "../../hooks/use-click-outside";
import { useClipboard } from "../../hooks/use-clipboard";
import { cn, getRandomAvatarUrl } from "../../lib/utils";
import { useLobbyHost } from "../../providers/lobby-host-provider";
import { useLobbyPlayer } from "../../providers/lobby-player-provider";
import { useSettings } from "../../providers/settings-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Avatar,
  AvatarFallback,
  AvatarGroupCount,
  AvatarImage,
} from "../ui/avatar";
import AvatarSelect from "../ui/avatar-select";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Fbutton } from "../ui/fancy-button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import UmatiLogo, { UmatiFullLogo } from "../ui/logo";
import { Separator } from "../ui/separator";
import { QRCode } from "../ui/shadcn-io/qr-code";
import { Switch } from "../ui/switch";
import GameCarousel from "./game-carousel";

const POLL_SUGGESTIONS = [
  {
    id: "next-game",
    label: "Next Game",
    question: "What game should we play next?",
    allowMultiple: false,
    options: Games.filter((game) => game.playable)
      .slice(0, 6)
      .map((game) => game.title),
  },
  {
    id: "snack-break",
    label: "Break Plan",
    question: "What should we do after this round?",
    allowMultiple: false,
    options: ["Keep playing", "Snack break", "Music break", "Wrap up soon"],
  },
  {
    id: "multi-vote",
    label: "Top Picks",
    question: "Which games should stay in tonight's rotation?",
    allowMultiple: true,
    options: Games.filter((game) => game.playable)
      .slice(0, 6)
      .map((game) => game.title),
  },
];

export const CopyLinkButton = () => {
  const { joinUrl } = useLobbyHost();
  const { copied, copy } = useClipboard(2500);
  return (
    <motion.div whileTap={{ scale: 0.95 }} transition={{ duration: 0.15 }}>
      <Fbutton
        type="button"
        variant="outline"
        size="sm"
        className="w-full max-w-2xs"
        onClick={() => {
          copy(joinUrl);
        }}
      >
        <motion.span
          key={copied ? "copied" : "copy"}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2 }}
        >
          {copied ? "Copied" : "Copy Link"}
        </motion.span>
      </Fbutton>
    </motion.div>
  );
};

const POLL_CHART_COLORS = [
  "#5eead4",
  "#f59e0b",
  "#60a5fa",
  "#fb7185",
  "#a78bfa",
  "#34d399",
  "#f97316",
  "#facc15",
];

const PollResultsChart = ({ poll }: { poll: LobbyPoll }) => {
  const totalSelections = poll.options.reduce(
    (sum, option) => sum + option.votes,
    0,
  );
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:items-center">
      <div className="relative mx-auto flex size-[220px] items-center justify-center">
        <svg
          viewBox="0 0 180 180"
          className="size-full -rotate-90 overflow-visible"
        >
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="20"
          />
          {totalSelections > 0 ? (
            poll.options.map((option, index) => {
              const segment = (option.votes / totalSelections) * circumference;
              const circle = (
                <circle
                  key={option.id}
                  cx="90"
                  cy="90"
                  r={radius}
                  fill="none"
                  stroke={POLL_CHART_COLORS[index % POLL_CHART_COLORS.length]}
                  strokeWidth="20"
                  strokeLinecap="round"
                  strokeDasharray={`${segment} ${circumference - segment}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += segment;
              return circle;
            })
          ) : (
            <circle
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="20"
              strokeDasharray="10 10"
            />
          )}
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/55">
            {poll.allowMultiple ? "Selections" : "Votes"}
          </p>
          <p className="mt-2 text-4xl font-black text-white">
            {totalSelections}
          </p>
          <p className="mt-1 text-xs text-white/60">
            {poll.totalVoters}/{poll.totalPlayers} responses
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {poll.options.map((option, index) => {
          const ratio =
            totalSelections > 0 ? option.votes / totalSelections : 0;
          return (
            <div
              key={option.id}
              className="rounded-[1.35rem] border border-white/10 bg-white/6 p-3 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between gap-3 text-sm font-semibold text-white">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="size-3 rounded-full"
                    style={{
                      backgroundColor:
                        POLL_CHART_COLORS[index % POLL_CHART_COLORS.length],
                    }}
                  />
                  <span className="truncate">{option.text}</span>
                </div>
                <span className="shrink-0 text-white/70">
                  {option.votes} {option.votes === 1 ? "vote" : "votes"}
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    backgroundColor:
                      POLL_CHART_COLORS[index % POLL_CHART_COLORS.length],
                  }}
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.max(ratio * 100, totalSelections > 0 ? 6 : 0)}%`,
                  }}
                  transition={{ type: "spring", stiffness: 140, damping: 20 }}
                />
              </div>
              <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-white/45">
                {Math.round(ratio * 100)}% share
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const HostPollComposer = ({
  onSubmit,
  initialPreset,
}: {
  onSubmit: (
    question: string,
    options: string[],
    allowMultiple: boolean,
  ) => void;
  initialPreset?: {
    question: string;
    options: string[];
    allowMultiple: boolean;
  } | null;
}) => {
  const [question, setQuestion] = useState(initialPreset?.question ?? "");
  const [options, setOptions] = useState<string[]>(
    initialPreset?.options?.length ? initialPreset.options : ["", ""],
  );
  const [allowMultiple, setAllowMultiple] = useState(
    initialPreset?.allowMultiple ?? false,
  );

  useEffect(() => {
    setQuestion(initialPreset?.question ?? "");
    setOptions(
      initialPreset?.options?.length ? initialPreset.options : ["", ""],
    );
    setAllowMultiple(initialPreset?.allowMultiple ?? false);
  }, [initialPreset]);

  const normalizedOptions = options
    .map((option) => option.trim())
    .filter(Boolean);
  const canSubmit = question.trim().length > 0 && normalizedOptions.length >= 2;

  const updateOption = (index: number, value: string) => {
    setOptions((current) =>
      current.map((option, optionIndex) =>
        optionIndex === index ? value : option,
      ),
    );
  };

  const addOption = () => {
    if (options.length >= 6) return;
    setOptions((current) => [...current, ""]);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="space-y-4">
        <div className="rounded-[1.6rem] border border-white/10 bg-white/6 p-5 backdrop-blur-xl">
          <div className="flex items-start gap-3">
            <div className="flex size-11 items-center justify-center rounded-[1rem] border border-white/10 bg-white/10 text-white">
              <SparklesIcon className="size-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/55">
                Suggestions
              </p>
              <p className="mt-2 text-lg font-black text-white">
                Start with a room-ready poll
              </p>
              <p className="mt-2 max-w-md text-sm leading-6 text-white/65">
                Quick presets for the common decisions hosts usually need before
                the next game.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {POLL_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion.id}
                type="button"
                onClick={() => {
                  setQuestion(suggestion.question);
                  setOptions(suggestion.options);
                  setAllowMultiple(suggestion.allowMultiple);
                }}
                className="rounded-[1.35rem] border border-white/10 bg-black/22 p-4 text-left transition hover:border-white/18 hover:bg-white/8"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-[0.95rem] bg-white/10 text-white">
                      {suggestion.allowMultiple ? (
                        <ListChecksIcon className="size-4" />
                      ) : (
                        <BrainCircuitIcon className="size-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">
                        {suggestion.label}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45">
                        {suggestion.allowMultiple
                          ? "Multi-select"
                          : "Single pick"}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/6 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/58">
                    {suggestion.options.length} options
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold text-white/78">
                  {suggestion.question}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <form
        className="space-y-5 rounded-[1.8rem] border border-white/10 bg-white/6 p-5 backdrop-blur-xl"
        onSubmit={(event) => {
          event.preventDefault();
          if (!canSubmit) return;
          onSubmit(question.trim(), normalizedOptions, allowMultiple);
          setQuestion("");
          setOptions(["", ""]);
          setAllowMultiple(false);
        }}
      >
        <div className="space-y-2">
          <Label className="text-white">Question</Label>
          <Input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="What should we order after game night?"
            className="border-white/12 bg-white/8 text-white placeholder:text-white/35"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <Label className="text-white">Options</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-white/75 hover:bg-white/10 hover:text-white"
              onClick={addOption}
              disabled={options.length >= 6}
            >
              <PlusIcon className="size-4" />
              Add Option
            </Button>
          </div>
          <div className="space-y-2">
            {options.map((option, index) => (
              <Input
                key={`poll-option-${index}`}
                value={option}
                onChange={(event) => updateOption(index, event.target.value)}
                placeholder={`Option ${index + 1}`}
                className="border-white/12 bg-white/8 text-white placeholder:text-white/35"
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-[1.35rem] border border-white/10 bg-black/22 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-white">
              Allow multiple answers
            </p>
            <p className="text-xs text-white/55">
              Turn this on for checkbox-style voting.
            </p>
          </div>
          <Switch checked={allowMultiple} onCheckedChange={setAllowMultiple} />
        </div>

        <div className="flex items-center justify-end gap-3">
          <Fbutton type="submit" disabled={!canSubmit}>
            Launch Poll
          </Fbutton>
        </div>
      </form>
    </div>
  );
};

const LobbyPollControl = () => {
  const { poll, changeUiState } = useLobbyHost();

  const buttonLabel = poll ? "View Poll" : "Start a Poll";

  return (
    <Fbutton
      size="sm"
      variant="outline"
      className="w-full sm:w-auto"
      onClick={() => changeUiState(RoomState.POLL)}
    >
      <BarChart3Icon className="size-4" />
      {buttonLabel}
    </Fbutton>
  );
};

export const HostPollStage = () => {
  const { poll, startPoll, endPoll, changeUiState } = useLobbyHost();
  const [showComposer, setShowComposer] = useState(false);
  const [preset, setPreset] = useState<{
    question: string;
    options: string[];
    allowMultiple: boolean;
  } | null>(null);

  useEffect(() => {
    setShowComposer(!poll);
  }, [poll?.id]);

  const closeStage = () => {
    if (poll) {
      endPoll();
    }
    changeUiState(RoomState.LOBBY);
  };

  return (
    <div className="relative min-h-dvh overflow-x-hidden overflow-y-auto bg-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(70,115,255,0.2),transparent_28%),radial-gradient(circle_at_78%_18%,rgba(255,255,255,0.1),transparent_18%),radial-gradient(circle_at_bottom_right,rgba(48,216,200,0.16),transparent_28%),linear-gradient(180deg,#030507,#070d17_42%,#05070d)]" />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.04),transparent_28%,transparent_72%,rgba(255,255,255,0.03))]" />

      <div className="relative flex min-h-dvh flex-col">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between md:px-8 md:py-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/45">
              Poll Control
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-white md:text-5xl">
              {showComposer ? "Start a Poll" : "Live Poll Results"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/62 md:text-[15px]">
              {showComposer
                ? "Ask one room question, collect votes in real time, and keep the crowd aligned before the next game starts."
                : "Results update live as players vote."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!showComposer && poll ? (
              <Fbutton
                size="sm"
                onClick={() => {
                  setPreset(null);
                  setShowComposer(true);
                }}
              >
                <PlusIcon className="size-4" />
                Start Another Poll
              </Fbutton>
            ) : null}
            <Fbutton size="sm" variant="outline" onClick={closeStage}>
              <ChevronLeftIcon className="size-4" />
              Back
            </Fbutton>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-7xl flex-1 px-4 pb-6 md:px-8 md:pb-8">
          <div className="relative w-full h-fit rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-[0_30px_120px_rgba(0,0,0,0.42)] backdrop-blur-2xl md:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(94,234,212,0.1),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.12),transparent_28%)]" />
            <div className="relative z-10">
              {showComposer || !poll ? (
                <HostPollComposer
                  initialPreset={preset}
                  onSubmit={(question, options, allowMultiple) => {
                    startPoll(question, options, allowMultiple);
                    setPreset(null);
                    setShowComposer(false);
                  }}
                />
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-start justify-between gap-4 rounded-[1.6rem] border border-white/10 bg-black/22 p-5">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/55">
                        Active prompt
                      </p>
                      <h3 className="mt-2 text-xl font-black text-white md:text-3xl">
                        {poll.question}
                      </h3>
                      <p className="mt-2 text-sm text-white/62">
                        {poll.allowMultiple
                          ? "Players can choose more than one option."
                          : "Players can choose one option only."}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-white/12 bg-green/25 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-green/70">
                        Live
                      </span>
                    </div>
                  </div>

                  <PollResultsChart poll={poll} />

                  <div className="flex flex-wrap items-center justify-end gap-3">
                    <Fbutton variant="outline" onClick={closeStage}>
                      Close Poll
                    </Fbutton>
                    <Fbutton
                      onClick={() => {
                        setPreset(null);
                        setShowComposer(true);
                      }}
                    >
                      <PlusIcon className="size-4" />
                      Start Another
                    </Fbutton>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const PlayerPollCard = () => {
  const { poll, votePoll } = useLobbyPlayer();
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    setSelected(poll?.myVotes ?? []);
  }, [poll?.id, poll?.myVotes]);

  if (!poll) return null;

  const totalSelections = poll.options.reduce(
    (sum, option) => sum + option.votes,
    0,
  );
  const leadingOption = [...poll.options].sort(
    (left, right) => right.votes - left.votes,
  )[0];

  return (
    <Card className="w-full max-w-2xl border-white/12 bg-white/6 py-0 text-white shadow-[0_20px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl">
      <CardHeader className="gap-3 border-b border-white/10 px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">
              {poll.status === "active" ? "Live Poll" : "Poll Results"}
            </p>
            <CardTitle className="mt-2 text-xl font-black text-white md:text-2xl">
              {poll.question}
            </CardTitle>
            <span className="mt-1 rounded-full border border-white/12 bg-black/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
              {poll.allowMultiple ? "Multi-select" : "Single pick"}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-5 py-5">
        {poll.status === "active" ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              {poll.options.map((option) => {
                const isSelected = selected.includes(option.id);
                return (
                  <motion.button
                    key={option.id}
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (!poll.allowMultiple) {
                        setSelected([option.id]);
                        votePoll([option.id]);
                        return;
                      }

                      setSelected((current) =>
                        current.includes(option.id)
                          ? current.filter((id) => id !== option.id)
                          : [...current, option.id],
                      );
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-[1.35rem] border px-4 py-4 text-left transition",
                      isSelected
                        ? "border-teal-300/60 bg-teal-300/12 shadow-[0_18px_40px_rgba(45,212,191,0.12)]"
                        : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8",
                    )}
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {option.text}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "flex size-8 items-center justify-center rounded-full border transition",
                        isSelected
                          ? "border-teal-300/60 bg-teal-300 text-slate-950"
                          : "border-white/12 bg-black/15 text-white/35",
                      )}
                    >
                      <CheckIcon className="size-4" />
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {poll.allowMultiple ? (
              <div className="flex items-center justify-between gap-3 rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-sm text-white/70">
                  {selected.length > 0
                    ? `${selected.length} option${selected.length === 1 ? "" : "s"} selected`
                    : "Choose one or more options before submitting."}
                </p>
                <Fbutton
                  size="sm"
                  onClick={() => votePoll(selected)}
                  disabled={selected.length === 0}
                >
                  Submit Vote
                </Fbutton>
              </div>
            ) : null}
          </>
        ) : (
          <div className="space-y-4">
            <div className="rounded-[1.35rem] border border-white/10 bg-white/6 p-4">
              <p className="text-sm font-semibold text-white/70">Top choice</p>
              <p className="mt-2 text-2xl font-black text-white">
                {leadingOption?.text ?? "No votes yet"}
              </p>
              <p className="mt-2 text-sm text-white/55">
                {totalSelections > 0
                  ? `${leadingOption?.votes ?? 0} of ${totalSelections} selections`
                  : "Nobody voted before the poll closed."}
              </p>
            </div>
            <PollResultsChart poll={poll} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const SettingsBar = () => {
  const { fullscreen, toggleFullscreen } = useSettings();

  return (
    <div className="flex items-center gap-2 p-2 rounded-2xl bg-foreground/5 w-fit relative h-12">
      <Button
        variant="ghost"
        onClick={toggleFullscreen}
        className="hidden md:inline-flex"
      >
        {fullscreen ? (
          <MinimizeIcon className="size-5" />
        ) : (
          <MaximizeIcon className="size-5" />
        )}
      </Button>
    </div>
  );
};

export const TryIceBreakers = () => {
  return <Fbutton variant="outline">Try Icebreakers</Fbutton>;
};

export const LobbySection = ({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "bg-foreground/5 w-full rounded-2xl p-4 flex flex-col",
        className,
      )}
    >
      <p className="text-2xl font-bold mb-4">{title}</p>
      {children}
    </div>
  );
};

export const Latency = ({ ms }: { ms: number }) => {
  let Icon = WifiIcon;

  if (ms > 150) Icon = WifiLowIcon;
  else if (ms > 60) Icon = WifiHighIcon;
  else Icon = WifiIcon;

  return (
    <div className="flex items-center gap-2 p-2 px-3 rounded-2xl bg-foreground/5 w-fit text-sm h-12">
      <Icon className="size-5 text-foreground" />
      <span className="whitespace-nowrap">{ms} ms</span>
    </div>
  );
};

export const BeforeWeBegin = ({ dark }: { dark?: boolean }) => {
  const { startGame, cancelGame, game } = useLobbyHost();
  const [stepIndex, setStepIndex] = useState(0);
  const activeGame = useMemo(
    () => Games.find((entry) => entry.id === game?.type),
    [game?.type],
  );

  const instructionFlow = useMemo(() => {
    switch (game?.type) {
      case GameType.TRIVIA:
        return {
          eyebrow: "Trivia Go",
          title: "Race the clock",
          tone: "red",
          example: { kind: "card", value: "A", label: "Answer choice" },
          steps: [
            {
              label: "Show question",
              role: "Host",
              body: "Put this screen on the TV or share it on the call.",
            },
            {
              label: "Read choices",
              role: "Players",
              body: "Players look at the question and answer choices on the main screen.",
            },
            {
              label: "Pick fast",
              role: "Players",
              body: "Everyone locks in an answer from their phone before time runs out.",
            },
            {
              label: "Reveal",
              role: "Host",
              body: "The correct answer and vote counts appear after the timer ends.",
            },
            {
              label: "Score",
              role: "Scoring",
              body: "Correct answers score more when they come in quickly.",
            },
          ],
        };
      case GameType.DRAWIT:
        return {
          eyebrow: "Draw It!",
          title: "Draw fast, guess faster",
          tone: "sky",
          example: { kind: "card", value: "_ _ _ _ _", label: "5 letter word" },
          steps: [
            {
              label: "One player draws",
              role: "Game",
              body: "Each turn picks one player to draw while everyone else guesses.",
            },
            {
              label: "Choose a word",
              role: "Drawer",
              body: "The drawer gets 3 word choices and picks 1 in secret.",
            },
            {
              label: "Watch the canvas",
              role: "Room",
              body: "The drawing appears live on the main screen and on player phones.",
            },
            {
              label: "Guess quickly",
              role: "Guessers",
              body: "Submit guesses while the timer runs. Faster correct guesses score more.",
            },
            {
              label: "Help the drawer",
              role: "Scoring",
              body: "The drawer also scores when more players guess the word correctly.",
            },
            {
              label: "Everyone gets a turn",
              role: "Rounds",
              body: "One round means every player draws once before the leaderboard.",
            },
          ],
        };
      case GameType.HM:
        return {
          eyebrow: "Herd Mentality",
          title: "Think like everyone else",
          tone: "aqua",
          darkText: true,
          example: { kind: "card", value: "A", label: "Top herd pick" },
          steps: [
            {
              label: "Prompt drops",
              role: "Host",
              body: "The room sees one prompt on this screen.",
            },
            {
              label: "Pick an answer",
              role: "Players",
              body: "Everyone chooses the answer they think most people will pick.",
            },
            {
              label: "Lock in",
              role: "Players",
              body: "Answers are submitted privately from each phone.",
            },
            {
              label: "Reveal votes",
              role: "Host",
              body: "The host screen shows which option got the most people behind it.",
            },
            {
              label: "Join the herd",
              role: "Scoring",
              body: "Majority answers score. Odd ones out don’t.",
            },
          ],
        };
      case GameType.QUIZZER:
        return {
          eyebrow: "Quizzer",
          title: "Load your own quiz",
          tone: "orange",
          example: { kind: "code", value: "B", label: "Answer choice" },
          steps: [
            {
              label: "Upload pack",
              role: "Host",
              body: "Bring a valid question JSON before the round starts.",
            },
            {
              label: "Use your set",
              role: "Game",
              body: "Quizzer runs only the questions you uploaded.",
            },
            {
              label: "Show question",
              role: "Host",
              body: "Questions appear on this shared screen one by one.",
            },
            {
              label: "Players answer",
              role: "Players",
              body: "Everyone responds from their own device.",
            },
            {
              label: "Supported types",
              role: "Format",
              body: "Use `selection` or `true_false` questions.",
            },
          ],
        };
      case GameType.FF:
        return {
          eyebrow: "Friend Facts",
          title: "Guess who the fact belongs to",
          tone: "neutral",
          example: {
            kind: "card",
            value: "Loves pineapple on pizza",
            label: "Fact prompt",
          },
          steps: [
            {
              label: "Collect facts",
              role: "Players",
              body: "Each player submits at least one fact about themselves.",
            },
            {
              label: "Build the round",
              role: "Game",
              body: "The game randomly picks facts from the submitted pool.",
            },
            {
              label: "Show one fact",
              role: "Host",
              body: "One fact appears on the main screen per round.",
            },
            {
              label: "Guess the owner",
              role: "Players",
              body: "Everyone else guesses which player the fact belongs to.",
            },
            {
              label: "Owner sits out",
              role: "Rule",
              body: "The fact owner does not answer that round.",
            },
            {
              label: "Score it",
              role: "Scoring",
              body: "Correct guesses earn time-based points, and the fact owner gets the top correct score.",
            },
          ],
        };
      case GameType.CHAMELEON:
        return {
          eyebrow: "Chameleon",
          title: "Spot the fake",
          tone: "lime",
          example: { kind: "code", value: "D2", label: "Word card code" },
          steps: [
            {
              label: "Category appears",
              role: "Host",
              body: "The shared screen reveals the category and the secret word.",
            },
            {
              label: "One player is blind",
              role: "Secret",
              body: "The Chameleon does not know the secret word.",
            },
            {
              label: "Check your card",
              role: "Players",
              body: "Players use their card code, like D2, to find the secret word.",
            },
            {
              label: "Give clues",
              role: "Players",
              body: "Each player submits a one-word clue from their phone.",
            },
            {
              label: "Blend in",
              role: "Chameleon",
              body: "The Chameleon tries to sound believable without knowing the word.",
            },
            {
              label: "Discuss",
              role: "Room",
              body: "The group compares clues and decides who feels suspicious.",
            },
            {
              label: "Vote",
              role: "Room",
              body: "Vote for who you think the Chameleon is.",
            },
          ],
        };
      case GameType.CN:
        return {
          eyebrow: "Codenames",
          title: "Clue, guess, repeat",
          tone: "yellow",
          darkText: true,
          example: { kind: "card", value: "TREE", label: "Word card" },
          steps: [
            {
              label: "Split teams",
              role: "Game",
              body: "The room is split into red and blue teams automatically.",
            },
            {
              label: "Claim spymaster",
              role: "Players",
              body: "One player on each team claims the spymaster role first.",
            },
            {
              label: "Board appears",
              role: "Game",
              body: "A 5x5 word grid is dealt once setup is ready.",
            },
            {
              label: "See the key",
              role: "Spymasters",
              body: "Only spymasters can see which cards are red, blue, neutral, or assassin.",
            },
            {
              label: "Give a clue",
              role: "Spymasters",
              body: "Say one word and one number out loud to guide your operatives.",
            },
            {
              label: "Tap cards",
              role: "Operatives",
              body: "Operatives tap cards on their phone while it is their team's turn.",
            },
            {
              label: "Avoid assassin",
              role: "Rule",
              body: "Wrong color or neutral ends the turn. The assassin ends the game instantly.",
            },
          ],
        };
      default:
        return {
          eyebrow: game?.type ?? "Game",
          title: "Get the room ready",
          tone: "neutral",
          example: { kind: "code", value: "A1", label: "Example pick" },
          steps: [
            {
              label: "Share screen",
              role: "Host",
              body: "Put the game where everyone can see it.",
            },
            {
              label: "Join in",
              role: "Players",
              body: "Players use their own devices.",
            },
            {
              label: "Start",
              role: "Host",
              body: "Launch when the room is ready.",
            },
          ],
        };
    }
  }, [game]);

  useEffect(() => {
    setStepIndex(0);
  }, [game?.type]);

  const usesDarkText = instructionFlow?.darkText;
  const activeStep = instructionFlow.steps[stepIndex];
  const toneClass =
    instructionFlow.tone === "red"
      ? "bg-[var(--umati-red)] text-white"
      : instructionFlow.tone === "aqua"
        ? "bg-[var(--umati-aqua)] text-black"
        : instructionFlow.tone === "orange"
          ? "bg-orange-500 text-white"
          : instructionFlow.tone === "sky"
            ? "bg-[var(--umati-sky)] text-white"
            : instructionFlow.tone === "lime"
              ? "bg-lime-500 text-black"
              : "bg-white/10 text-white";

  return (
    <div className="mx-auto flex h-full w-full max-w-screen-2xl flex-col items-center justify-center gap-6 px-4 py-4">
      <div className="text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/60">
          How to Play
        </p>
        <h3 className="mt-3 text-5xl font-black tracking-tight text-white md:text-6xl">
          {activeGame?.title}
        </h3>
      </div>

      <div className="w-full max-w-5xl rounded-[2rem] border border-white/12 bg-black/20 p-4 backdrop-blur-xl md:p-5">
        <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-3">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/55">
                Steps
              </p>
              <p className="text-sm font-semibold text-white/65">
                {stepIndex + 1}/{instructionFlow.steps.length}
              </p>
            </div>

            <div className="grid gap-2">
              {instructionFlow.steps.map((step, index) => (
                <button
                  key={step.label}
                  type="button"
                  onClick={() => setStepIndex(index)}
                  className={cn(
                    "rounded-[1.25rem] border px-3 py-3 text-left transition",
                    stepIndex === index
                      ? "border-white/25 bg-white/14"
                      : "border-white/8 bg-white/4 hover:bg-white/8",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex size-8 items-center justify-center rounded-full text-sm font-black",
                        stepIndex === index
                          ? toneClass
                          : "bg-white/10 text-white",
                      )}
                    >
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white">
                        {step.label}
                      </p>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                        {step.role}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <Fbutton
                type="button"
                variant="outline"
                className="w-full"
                disabled={stepIndex === 0}
                onClick={() => setStepIndex((index) => Math.max(index - 1, 0))}
              >
                Previous
              </Fbutton>
              <Fbutton
                type="button"
                variant="outline"
                className="w-full"
                disabled={stepIndex === instructionFlow.steps.length - 1}
                onClick={() =>
                  setStepIndex((index) =>
                    Math.min(index + 1, instructionFlow.steps.length - 1),
                  )
                }
              >
                Next
              </Fbutton>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[1.5rem] border border-white/10 bg-white p-5 text-black">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-black/45">
                    {instructionFlow.eyebrow}
                  </p>
                  <h4 className="mt-2 text-3xl font-black tracking-tight">
                    {instructionFlow.title}
                  </h4>
                </div>
                <div
                  className={cn(
                    "rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]",
                    toneClass,
                  )}
                >
                  {activeStep.role}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-black/10 bg-black/3 p-5">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-black/45">
                  Current step
                </p>
                <p className="mt-3 text-3xl font-black tracking-tight">
                  {activeStep.label}
                </p>
                <p className="mt-4 text-lg leading-8 text-black/72">
                  {activeStep.body}
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
                  Host
                </p>
                <p className="mt-2 text-sm font-semibold text-white">
                  Shared screen
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
                  Players
                </p>
                <p className="mt-2 text-sm font-semibold text-white">
                  Phones in lobby
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
                  Example
                </p>
                <div className="mt-2 flex items-center gap-3">
                  {instructionFlow.example.kind === "card" ? (
                    <div
                      className={cn(
                        "rounded-2xl px-3 py-2 text-sm font-black",
                        toneClass,
                      )}
                    >
                      {instructionFlow.example.value}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-white/12 bg-black/20 px-3 py-2 text-base font-black text-white">
                      {instructionFlow.example.value}
                    </div>
                  )}
                  <p className="text-sm font-semibold text-white">
                    {instructionFlow.example.label}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-20 flex w-full max-w-md flex-col gap-2">
        <Fbutton type="button" className="w-full" dark onClick={startGame}>
          Let's Play
        </Fbutton>
        <Fbutton
          type="button"
          size="sm"
          variant="outline"
          dark
          className="w-full"
          onClick={cancelGame}
        >
          Back to Lobby
        </Fbutton>
      </div>
    </div>
  );
};

export const HostLobbyFooter = () => {
  return (
    <div className="fixed bottom-0 px-4 md:px-8 py-4 w-screen">
      <div className="flex items-center justify-between w-full gap-3">
        <div className="flex-1 flex items-center justify-start gap-3 md:gap-4 min-w-0">
          <SettingsBar />
        </div>
        <div className="flex items-center justify-end gap-2 md:gap-4">
          <UmatiFullLogo className="w-24 text-foreground hidden md:block" />
          <UmatiLogo className="w-8 text-foreground block md:hidden" />
        </div>
      </div>
    </div>
  );
};

export const LobbyTitle = () => {
  const { lobby, joinUrl, closeLobby } = useLobbyHost();
  const [scanExpanded, setScanExpanded] = useState(false);
  return (
    <>
      <section className="relative isolate w-full overflow-hidden">
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="max-w-4xl text-4xl font-black tracking-tight text-white md:text-6xl">
              {lobby?.name}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70 md:text-[15px]">
              Your party room is live. Share the code, fill the room, and kick
              off the next crowd favorite.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <LobbyPollControl />
              <Fbutton
                size="sm"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={closeLobby}
              >
                Close Lobby
              </Fbutton>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <div className="rounded-[1.5rem] border border-white/12 bg-black/20 px-4 py-4 backdrop-blur-md">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">
                Join by code
              </p>
              <p className="mt-2 text-4xl font-black tracking-[0.08em] text-white md:text-5xl">
                {lobby?.code}
              </p>
              <p className="mt-2 text-sm font-semibold text-white/65">
                Fastest way into the room
              </p>
            </div>

            <div className="relative flex items-center gap-3 rounded-[1.5rem] border border-white/12 bg-white/8 px-4 py-4 backdrop-blur-md">
              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="absolute right-3 top-3 inline-flex items-center justify-center rounded-xl border border-white/12 bg-black/20 p-2 text-white/75 transition hover:bg-white/10 hover:text-white"
                onClick={() => setScanExpanded(true)}
                aria-label="Expand scan to join"
              >
                <MaximizeIcon className="size-4" />
              </motion.button>
              <div className="rounded-[1.25rem] border border-white/12 bg-white p-2 shadow-sm">
                <QRCode
                  className="size-22 rounded-lg bg-white p-1"
                  data={joinUrl}
                />
              </div>
              <div className="max-w-36 pr-8">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">
                  Scan to join
                </p>
                <p className="mt-2 text-sm font-semibold text-white">
                  Let guests hop in with their phone camera.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Dialog open={scanExpanded} onOpenChange={setScanExpanded}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-hidden border-white/12 bg-[linear-gradient(180deg,rgba(14,25,53,0.98),rgba(10,18,38,0.98))] p-0 text-white shadow-[0_32px_120px_rgba(0,0,0,0.5)] sm:max-w-2xl">
          <div className="relative min-h-0 overflow-y-auto rounded-[inherit] p-6 md:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(77,199,255,0.18),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_36%)]" />
            <DialogHeader className="relative z-10 border-b border-white/10 pb-5">
              <DialogTitle className="text-2xl font-black tracking-tight text-white md:text-3xl">
                Scan To Join
              </DialogTitle>
              <DialogDescription className="max-w-xl text-sm leading-6 text-white/68">
                Open your camera, scan the code, or share the room code below
                for a faster join flow.
              </DialogDescription>
            </DialogHeader>

            <div className="relative z-10 mt-6 flex flex-col items-center gap-6 text-center">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1">
                  <div className="rounded-[2rem] border border-white/12 bg-white p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] w-fit mx-auto">
                    <QRCode
                      className="size-32 rounded-[1.25rem] bg-white p-1 md:size-40"
                      data={joinUrl}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/60">
                    Join by code
                  </p>
                  <p className="mt-2 text-5xl font-black tracking-[0.12em] text-white md:text-6xl">
                    {lobby?.code}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-white/68">
                    Best for big screens, shared links, and quick room entry.
                  </p>
                </div>
              </div>
              <div className="w-full max-w-xs">
                <CopyLinkButton />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export const JoinLobbyCode = ({
  className,
  vertical,
}: {
  className?: string;
  vertical?: boolean;
}) => {
  const { lobby, joinUrl, changeUiState } = useLobbyHost();
  return (
    <div
      className={cn(
        "bg-foreground/5 w-full  rounded-2xl flex flex-col items-center p-4 h-full group relative",
        className,
      )}
    >
      <p className="text-2xl font-bold mb-4 w-full">🔗 Join the party!</p>

      <div className="flex flex-col gap-4 items-center w-full mb-8">
        <div className="flex flex-col items-center gap-2 flex-1 w-full">
          <p className="text-sm font-semibold">Scan to join</p>
          <QRCode
            className="size-36 md:size-48 rounded border bg-white p-4 shadow-xs"
            data={joinUrl}
          />
        </div>

        <Separator orientation="horizontal" />

        <div className="flex flex-col gap-2 flex-1 items-center">
          <p className="text-lg font-semibold">Or Join by Code</p>
          <p className="text-5xl md:text-6xl font-bold">{lobby?.code}</p>
        </div>
      </div>
      <CopyLinkButton />
    </div>
  );
};

export const WaitingForPlayers = ({ className }: { className?: string }) => {
  const { players, lobby, uiState, kickPlayer } = useLobbyHost();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const lobbyReady = players.length === lobby?.maxPlayers;
  const waitingForMorePlayers = players.length < (lobby?.maxPlayers ?? 0) / 2;

  return (
    <>
      <motion.div
        className={cn(
          "relative isolate flex h-full w-full flex-1 flex-col overflow-hidden rounded-[1.75rem] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.24)]",
          className,
        )}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(77,199,255,0.14),transparent_26%),radial-gradient(circle_at_top_right,rgba(255,202,40,0.14),transparent_28%),radial-gradient(circle_at_bottom,rgba(106,59,255,0.14),transparent_34%)]" />

        <motion.div
          className="relative z-10 mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <div className="space-y-2">
            <div>
              <h3 className="text-lg font-black tracking-tight text-white md:text-xl">
                Players
              </h3>
            </div>
          </div>

          <motion.div
            className="flex items-center gap-3 self-start rounded-[1.25rem] border border-white/12 bg-white/6 px-3 py-2 md:self-auto"
            animate={
              lobbyReady ? { boxShadow: "0 0 20px rgba(255,202,40,0.3)" } : {}
            }
            transition={{
              duration: 0.6,
              repeat: lobbyReady ? Infinity : 0,
              repeatType: "reverse",
            }}
          >
            <div className="leading-tight">
              <motion.p
                className="text-lg font-black text-white flex-1 whitespace-nowrap"
                key={players.length}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
              >
                {players.length} / {lobby?.maxPlayers}
              </motion.p>
            </div>
          </motion.div>
        </motion.div>

        <div className="relative z-10 flex-1 overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/15 p-4">
          <div className="relative flex h-full w-full flex-wrap content-start justify-center gap-3 overflow-y-auto rounded-xl scrollbar-hide">
            <AnimatePresence mode="popLayout">
              {players.slice(0, 24).map((player, idx) => (
                <motion.div
                  key={player.id}
                  className="flex flex-col w-fit items-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{
                    duration: 0.3,
                    delay: Math.min(idx * 0.08, 0.6),
                    ease: [0.25, 1, 0.5, 1],
                  }}
                >
                  <motion.button
                    type="button"
                    className="group/player relative rounded-full outline-hidden"
                    aria-label={`Manage ${player.displayName}`}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
                    onClick={() => setSelectedPlayer(player)}
                  >
                    <Avatar
                      className={cn("ring-2 ring-foreground shadow-md size-10")}
                    >
                      <AvatarImage
                        src={player.avatar}
                        alt={player.displayName}
                      />
                      <AvatarFallback>{player.displayName?.[0]}</AvatarFallback>
                    </Avatar>
                    <span className="pointer-events-none absolute -right-1 -bottom-1 inline-flex size-7 items-center justify-center rounded-full border border-white/15 bg-black/70 text-white opacity-0 shadow-lg backdrop-blur-sm transition group-hover/player:opacity-100 group-focus-visible/player:opacity-100">
                      <UserRoundX className="size-3.5" />
                    </span>
                  </motion.button>
                  <motion.p
                    className={cn("text-center font-semibold", {
                      "mt-1 text-sm": uiState === RoomState.INIT,
                      "mt-0.5 text-xs": uiState === RoomState.LOBBY,
                    })}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      delay: Math.min(idx * 0.08 + 0.15, 0.75),
                      duration: 0.2,
                    }}
                  >
                    {player.displayName}
                  </motion.p>
                </motion.div>
              ))}
            </AnimatePresence>
            {players.length > 24 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.3,
                  delay: Math.min(24 * 0.08, 0.6),
                  ease: [0.25, 1, 0.5, 1],
                }}
              >
                <AvatarGroupCount
                  className={cn("ring-2 ring-background shadow-md", {
                    "size-16": uiState === RoomState.INIT,
                    "size-12": uiState === RoomState.LOBBY,
                  })}
                >
                  +{Math.max(players.length - 24, 0)}
                </AvatarGroupCount>
              </motion.div>
            )}

           
          </div>
           <motion.div
              className="px-4 py-3 text-center"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <p className="font-semibold text-white/75">
                Waiting for more{" "}
                {Math.max((lobby?.maxPlayers ?? 0) - players.length, 0) === 1
                  ? "player"
                  : "players"}
                ...
              </p>
            </motion.div>
        </div>
      </motion.div>
      <Dialog
        open={!!selectedPlayer}
        onOpenChange={(open) => {
          if (!open) setSelectedPlayer(null);
        }}
      >
        <DialogContent className="h-fit max-w-sm! sm:max-w-sm overflow-hidden border-white/12 0 p-0 text-white shadow-[0_32px_120px_rgba(0,0,0,0.5)] bg-[linear-gradient(135deg,rgba(255,255,255,0.09),rgba(255,255,255,0.03))]">
          <div className="h-full w-full absolute inset-0 ">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,202,40,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(77,199,255,0.16),transparent_32%),radial-gradient(circle_at_bottom,rgba(106,59,255,0.16),transparent_34%)]" />
            <div className="absolute -left-10 top-8 h-28 w-28 rounded-full bg-[var(--umati-yellow)]/12 blur-3xl" />
            <div className="absolute right-0 top-0 h-36 w-36 translate-x-1/4 -translate-y-1/4 rounded-full bg-[var(--umati-sky)]/12 blur-3xl" />
          </div>
          {selectedPlayer ? (
            <div className="relative overflow-hidden rounded-[inherit] p-6">
              <DialogHeader className="relative z-10 border-b border-white/10 pb-5">
                <DialogTitle className="text-2xl font-black tracking-tight text-white">
                  Manage Player
                </DialogTitle>
                <DialogDescription className="text-sm leading-6 text-white/68">
                  Remove this player from the lobby if needed.
                </DialogDescription>
              </DialogHeader>

              <div className="relative z-10 mt-5 space-y-5">
                <div className="flex items-center gap-4 rounded-[1.5rem] border border-white/10 bg-white/6 p-4">
                  <Avatar className="size-16 ring-2 ring-white/15 shadow-md">
                    <AvatarImage
                      src={selectedPlayer.avatar}
                      alt={selectedPlayer.displayName}
                    />
                    <AvatarFallback>
                      {selectedPlayer.displayName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">
                      Player
                    </p>
                    <p className="mt-1 truncate text-lg font-black text-white">
                      {selectedPlayer.displayName}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3">
                  <Fbutton
                    variant="destructive"
                    className="w-full"
                    onClick={() => {
                      kickPlayer(
                        selectedPlayer.id,
                        "The host removed you from the lobby.",
                      );
                      setSelectedPlayer(null);
                    }}
                  >
                    <UserRoundX className="size-4" />
                    Kick Player
                  </Fbutton>
                  <Fbutton
                    variant="outline"
                    className="w-full"
                    onClick={() => setSelectedPlayer(null)}
                  >
                    Cancel
                  </Fbutton>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
};

const gameCardVariants = cva(
  "group border border-white/20 rounded-[2rem] p-5 bg-gradient-to-b flex flex-col shadow-xl size-48 transition-all duration-300 ease-out relative overflow-hidden cursor-pointer text-white hover:-translate-y-1 hover:shadow-2xl active:scale-[0.99]",
  {
    variants: {
      variant: {
        sky: "from-[var(--umati-sky)] to-[#3A6EE4]",
        aqua: "from-[var(--umati-aqua)] to-[#00D9D5] text-black",
        blue: "from-[var(--umati-blue)] to-[#446BF5]",
        red: "from-[#FE566B] to-[var(--umati-red)] ",
        purple: "from-[#9856FE] to-[var(--umati-purple)] ",
        lime: "from-lime-500 to-green-600",
        orange: "from-orange-400 to-orange-600",
        yellow: "from-yellow-300 to-yellow-400 text-black",
      },
    },
  },
);

export function GameCard({
  className,
  variant,
  game,
  onClick,
}: VariantProps<typeof gameCardVariants> & {
  className?: string;
  game: (typeof Games)[0];
  onClick?: () => void;
}) {
  const usesDarkText = variant === "aqua" || variant === "yellow";

  return (
    <motion.div
      className={cn(gameCardVariants({ variant, className }))}
      whileHover={{ y: -4, boxShadow: "0 24px 48px rgba(0,0,0,0.32)" }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.3),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(0,0,0,0.18),transparent_30%)]" />
      <motion.div
        className="absolute inset-x-5 top-4 flex items-center justify-between gap-3 z-10"
        initial={{ opacity: 0.8 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <span
          className={cn(
            "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] backdrop-blur-sm",
            usesDarkText
              ? "border border-black/15 bg-black/10 text-black"
              : "border border-white/25 bg-white/15 text-white",
          )}
        >
          {game.playable ? "Ready to play" : "Coming soon"}
        </span>
      </motion.div>

      <div className="relative z-10 mt-11 flex h-full flex-col">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="max-w-[11rem]">
            <h2 className="text-2xl font-black leading-tight tracking-tight">
              {game.title}
            </h2>
            <p
              className={cn(
                "mt-2 text-sm leading-5",
                usesDarkText ? "text-black/75" : "text-white/80",
              )}
            >
              {game?.description ??
                "Fast-paced party game built for shared screens and loud rooms."}
            </p>
          </div>

          {game?.src && (
            <motion.div
              className="relative shrink-0"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                className="absolute inset-0 scale-110 rounded-full bg-white/25 blur-2xl"
                initial={{ opacity: 0.6 }}
                whileHover={{ opacity: 0.9 }}
                transition={{ duration: 0.3 }}
              />
              <div className="relative flex size-22 items-center justify-center rounded-[1.75rem] border border-white/20 bg-white/12 backdrop-blur-md shadow-lg">
                <Image
                  src={game.src}
                  alt={game.title}
                  width={96}
                  height={96}
                  className="size-16 object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.28)]"
                />
              </div>
            </motion.div>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between gap-3">
          <div
            className={cn(
              "rounded-2xl px-3 py-2 backdrop-blur-sm",
              usesDarkText
                ? "border border-black/15 bg-black/10 text-black"
                : "border border-white/15 bg-black/20 text-white",
            )}
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              <RiGroup3Fill size={16} />
              <span>{game?.min}+ players</span>
            </div>
          </div>

          {game.playable && (
            <motion.div
              className="text-right"
              initial={{ opacity: 0.7 }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <p
                className={cn(
                  "text-sm font-semibold",
                  usesDarkText ? "text-black/85" : "text-white/90",
                )}
              >
                Tap to play
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export const PlayerAvatar = ({
  displayName,
  avatar,
  className,
  showName = true,
}: {
  displayName: string;
  avatar: string;
  className?: string;
  showName?: boolean;
}) => {
  return (
    <motion.div className="flex flex-col items-center">
      <Avatar
        className={cn(
          "size-30 ring-2 ring-foreground shadow-md hover:scale-110 transition-transform mb-2 relative",
          className,
        )}
      >
        <AvatarImage src={avatar} alt={displayName} />
        <AvatarFallback>{displayName?.[0]}</AvatarFallback>
      </Avatar>
      {showName && (
        <p className="text-center text-2xl font-semibold">{displayName}</p>
      )}
    </motion.div>
  );
};

export const PlayerJoinLobby = () => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [avatar, setAvatar] = useState<string>(
    user?.avatar ?? getRandomAvatarUrl(),
  );
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { joinLobby } = useLobbyPlayer();

  const handleJoinLobby = async () => {
    setLoading(true);
    try {
      joinLobby(displayName, avatar);
    } catch (error) {
      console.log("🚀 ~ handleJoinLobby ~ error:", error);
    } finally {
      setLoading(false);
    }
  };

  const MAX_DISPLAY_NAME_LENGTH = 15;

  return (
    <div className="max-w-screen-2xl mx-auto w-full md:py-8 flex flex-col gap-8 px-5 items-center justify-center md:justify-center h-dvh">
      <UmatiFullLogo className="w-32 text-foreground " />
      <Card className="z-50 rounded-2xl max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl text-center">
            Join the Lobby
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <AvatarSelect
              id="avatar"
              value={avatar}
              onChange={setAvatar}
              className="mx-auto"
            />
            <div className="grid gap-2">
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                placeholder="Enter Name"
                required
                maxLength={MAX_DISPLAY_NAME_LENGTH}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                }}
                value={displayName}
              />
              <div className="flex items-center justify-end">
                <span className="text-xs opacity-55">
                  {displayName.length}/{MAX_DISPLAY_NAME_LENGTH}
                </span>
              </div>
            </div>

            <Fbutton
              type="submit"
              className="w-full"
              disabled={loading}
              onClick={handleJoinLobby}
            >
              Join
            </Fbutton>
          </div>
        </CardContent>
      </Card>

      <Link
        href="/"
        className="text-center text-white font-medium hover:underline"
      >
        Back to Homepage
      </Link>
    </div>
  );
};

export const PlayerLeaveButton = () => {
  const { leaveLobby } = useLobbyPlayer();
  return (
    <Fbutton className="w-full flex-1 mt-auto" onClick={leaveLobby}>
      Leave Room
    </Fbutton>
  );
};

export const Reactions = () => {
  const [showTray, setShowTray] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const trayRef = useRef<HTMLDivElement>(null);
  const emojis = ["❤️", "💔", "😭", "😂", "👍", "👎"];
  const { sendReaction } = useLobbyPlayer();

  useClickOutside(trayRef, () => setShowTray(false));

  const handleSendReaction = (emoji: string) => {
    if (isRateLimited) return;
    sendReaction(emoji);
    setIsRateLimited(true);
    window.setTimeout(() => setIsRateLimited(false), 800);
  };

  return (
    <div className="relative" ref={trayRef}>
      <Fbutton
        variant={showTray ? "secondary" : "outline"}
        className="min-w-12"
        onClick={() => setShowTray(!showTray)}
      >
        <RiHeart3Line />
      </Fbutton>

      <AnimatePresence>
        {showTray && (
          <motion.div
            key="tray"
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="absolute bottom-[calc(100%+10px)] right-0 z-40 w-max max-w-[calc(100vw-2rem)] rounded-[1.5rem] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.05))] p-3 shadow-[0_24px_60px_rgba(0,0,0,0.26)] backdrop-blur-xl"
          >
            <div className="mb-2 flex items-center justify-between gap-4 px-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">
                React
              </p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                Tap fast, not spam
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {emojis.map((emoji) => (
                <motion.button
                  key={emoji}
                  type="button"
                  whileHover={{ y: -2, scale: 1.04 }}
                  whileTap={{ scale: 0.94 }}
                  transition={{ type: "spring", stiffness: 320, damping: 18 }}
                  className="flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-white/8 text-3xl shadow-sm disabled:opacity-45"
                  disabled={isRateLimited}
                  onClick={() => handleSendReaction(emoji)}
                >
                  {emoji}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const PlayerReactionLayer = () => {
  const { reactions } = useLobbyHost();
  const [activeReactions, setActiveReactions] = useState<
    {
      id: string;
      playerId: string;
      emoji: string;
      xOffset: number;
      drift: number;
    }[]
  >([]);

  // Whenever reactions change, spawn new emoji reactions
  useEffect(() => {
    const newReactions: {
      id: string;
      playerId: string;
      emoji: string;
      xOffset: number;
      drift: number;
    }[] = [];

    Object.entries(reactions).forEach(([playerId, emoji]) => {
      if (!emoji) return;
      newReactions.push({
        id: `${playerId}-${emoji}-${Date.now()}`,
        playerId,
        emoji,
        xOffset: Math.random() * window.innerWidth - window.innerWidth / 2,
        drift: Math.random() * 80 - 40, // side drift distance
      });
    });

    setActiveReactions((prev) => [...prev, ...newReactions] as any);
  }, [reactions]);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-50">
      <AnimatePresence>
        {activeReactions.map((r) => (
          <motion.div
            key={r.id}
            initial={{
              opacity: 0,
              y: window.innerHeight, // start fully at the bottom of the viewport
              x: r.xOffset,
              scale: 0.8,
            }}
            animate={{
              opacity: [0, 1, 1, 0], // fade in then fade out at top
              y: -500, // travel off the top smoothly
              x: [r.xOffset, r.xOffset + r.drift, r.xOffset - r.drift / 2],
              scale: [0.8, 1.1, 1],
            }}
            transition={{
              duration: 3.5,
              ease: "easeOut",
            }}
            className="absolute text-6xl select-none"
            style={{
              left: "50%",
              bottom: "0px",
            }}
            onAnimationComplete={() => {
              // remove emoji after animation completes
              setActiveReactions((prev) => prev.filter((x) => x.id !== r.id));
            }}
          >
            {r.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export const PlayerJoinAnimationLayer = () => {
  const { players, uiState } = useLobbyHost();
  const [activeReactions, setActiveReactions] = useState<
    {
      id: string;
      player: Player;
      xOffset: number;
      drift: number;
    }[]
  >([]);

  const prevPlayersRef = useRef<Player[]>([]);

  useEffect(() => {
    const prevPlayers = prevPlayersRef.current;
    const newJoins: Player[] = [];

    players.forEach((p) => {
      const prev = prevPlayers.find((pp) => pp.id === p.id);

      if ((!prev && p.connected) || (prev && !prev.connected && p.connected)) {
        newJoins.push(p);
      }
    });

    prevPlayersRef.current = players;

    if (newJoins.length === 0) return;

    const reactions = newJoins.map((player) => ({
      id: `join-${player.id}-${Date.now()}`,
      player,
      xOffset: Math.random() * window.innerWidth - window.innerWidth / 2,
      drift: Math.random() * 80 - 40,
    }));

    setActiveReactions((prev) => [...prev, ...reactions]);
  }, [players]);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-50">
      <AnimatePresence>
        {activeReactions.map((r) => (
          <motion.div
            key={r.id}
            initial={{
              opacity: 0,
              y: window.innerHeight,
              x: r.xOffset,
              scale: 0.8,
            }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: -500,
              x: [r.xOffset, r.xOffset + r.drift, r.xOffset - r.drift / 2],
              scale: [0.8, 1.1, 1],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 3.5,
              ease: "easeOut",
            }}
            className="absolute select-none flex flex-col items-center justify-center"
            style={{
              left: "50%",
              bottom: "0px",
            }}
            onAnimationComplete={() => {
              setActiveReactions((prev) => prev.filter((x) => x.id !== r.id));
            }}
          >
            {/* Replace emoji with avatar */}
            <Avatar
              className={cn(
                "ring-2 ring-background shadow-md transition-transform",
                {
                  "size-16": uiState === RoomState.INIT,
                  "size-12": uiState === RoomState.LOBBY,
                },
              )}
            >
              <AvatarImage src={r.player.avatar} alt={r.player.displayName} />
              <AvatarFallback>{r.player.displayName?.[0]}</AvatarFallback>
            </Avatar>
            <p className="text-sm font-semibold text-center">
              {r.player.displayName} Joined!
            </p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export const Reconnecting = () => {
  const { reconnecting } = useLobbyPlayer();

  return (
    <AnimatePresence>
      {reconnecting && (
        <div className="w-full h-full absolute z-10 bg-black/40 inset-0 flex flex-col items-center justify-center">
          <p className="font-semibold text-xl">Reconnecting...</p>
        </div>
      )}
    </AnimatePresence>
  );
};

export const DesktopOnly = () => {
  return (
    <div className="flex flex-col items-center justify-center h-dvh bg-black text-white text-center p-6">
      <UmatiLogo className="w-8 text-foreground block md:hidden" />
      <div className="my-auto">
        <h1 className="text-3xl font-bold mb-4">Desktop Only</h1>
        <p className="text-lg max-w-md mb-6 w-full mx-auto">
          Hosting is only supported on desktop devices. Please use a laptop or
          desktop computer to access the host dashboard.
        </p>
        <Link href="/">
          <Fbutton className="w-full max-w-xs">Go Back</Fbutton>
        </Link>
      </div>
    </div>
  );
};

export const GameShelf = ({ className }: { className?: string }) => {
  return (
    <section
      className={cn(
        "relative isolate h-full w-full overflow-clip overflow-x-visible rounded-[2rem] border border-white/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.09),rgba(255,255,255,0.03))] p-4 md:p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl",
        className,
      )}
    >
      <div className="h-full w-full absolute inset-0 overflow-clip rounded-[2rem] ">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,202,40,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(77,199,255,0.16),transparent_32%),radial-gradient(circle_at_bottom,rgba(106,59,255,0.16),transparent_34%)]" />
        <div className="absolute -left-10 top-8 h-28 w-28 rounded-full bg-[var(--umati-yellow)]/12 blur-3xl" />
        <div className="absolute right-0 top-0 h-36 w-36 translate-x-1/4 -translate-y-1/4 rounded-full bg-[var(--umati-sky)]/12 blur-3xl" />
      </div>
      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="space-y-1">
              <h2 className="text-2xl font-black tracking-tight text-white md:text-3xl">
                Game Shelf
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-white/70 md:text-[15px]">
                Queue up the next crowd-pleaser and keep the room moving.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start rounded-2xl border border-white/12 bg-white/6 px-3 py-2 text-xs font-semibold text-white/75 md:self-auto">
            <span className="inline-flex size-8 items-center justify-center rounded-xl bg-white/10 text-base">
              🎉
            </span>
            <span>Pick a game to start the party</span>
          </div>
        </div>

        <GameCarousel />
      </div>
    </section>
  );
};
