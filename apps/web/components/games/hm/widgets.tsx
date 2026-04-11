import {
  PlayerAvatar
} from "@/components/lobby/widgets";
import { useHerdMentalityHost } from "@/providers/games/herd-mentality/hm-host-provider";
import { useLobbyHost } from "@/providers/lobby-host-provider";
import { useLobbyPlayer } from "@/providers/lobby-player-provider";
import { Games, HerdMentalityOptions, TriviaOptions } from "@umati/ws";
import { CheckIcon } from "lucide-react";
import { AnimatePresence, motion, Variants } from "motion/react";
import { Fragment, useEffect, useState } from "react";
import { cn } from "../../../lib/utils";
import { useHerdMentalityPlayer } from "@/providers/games/herd-mentality/hm-player-provider";
import { Fbutton } from "@/components/ui/fancy-button";
import { EndGameButton, ScoreGapHint } from "../shared";

export const Question = ({ text }: { text: string }) => {
  return (
    <div className="relative mx-auto w-full max-w-5xl overflow-hidden text-center ">
      <div className="relative z-10">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.24em] text-white/60">
          Herd Prompt
        </p>
        <h1 className="mx-auto max-w-4xl text-4xl font-black leading-tight tracking-tight text-white md:text-6xl">
          {text}
        </h1>
      </div>
    </div>
  );
};

export type OptionLetter = "A" | "B" | "C" | "D" | "E"| "F";

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
        <div className="rounded-full size-10 bg-white flex items-center justify-center text-black border border-black/10">
          <CheckIcon className="size-6" />
        </div>
      );
    } else {
      return (
        <div
          data-letter={letter}
          className="rounded-full size-10 data-[letter=A]:bg-[var(--umati-yellow)] data-[letter=B]:bg-[var(--umati-sky)] data-[letter=C]:bg-[var(--umati-purple)] data-[letter=D]:bg-[var(--umati-red)] data-[letter=E]:bg-orange-500 data-[letter=F]:bg-[var(--umati-aqua)] flex items-center justify-center text-white"
        >
          <p className="text-xl font-bold text-center w-full">{letter}</p>
        </div>
      );
    }
  };

  return (
    <motion.div
      data-letter={letter}
      className={cn(
        "group relative flex h-44 w-full flex-col justify-between overflow-hidden rounded-[1.75rem] border p-4 text-left shadow-[0_20px_40px_rgba(0,0,0,0.18)] transition-transform duration-300 ease-linear",
        "bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,255,255,0.88))] text-black hover:-translate-y-1",
        state === "wrong" && "opacity-45 grayscale-[0.2]",
        state === "correct" &&
          "data-[letter=A]:bg-[linear-gradient(180deg,var(--umati-yellow),#facc15)] data-[letter=B]:bg-[linear-gradient(180deg,var(--umati-sky),#38bdf8)] data-[letter=C]:bg-[linear-gradient(180deg,var(--umati-purple),#8b5cf6)] data-[letter=D]:bg-[linear-gradient(180deg,var(--umati-red),#fb7185)] data-[letter=E]:bg-[linear-gradient(180deg,#fb923c,#f97316)] data-[letter=F]:bg-[linear-gradient(180deg,var(--umati-aqua),#14b8a6)]",
        state === "default" && "border-white/35",
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
          className="relative z-10"
        >
          <Icon />
        </motion.span>
      </AnimatePresence>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,0,0,0.06),transparent_28%)]" />
      <p className="relative z-10 my-auto text-center text-2xl font-black leading-tight md:text-3xl">
        {text}
      </p>

      <AnimatePresence mode="wait">
        {count && (
          <motion.div
            key={`${state}-${letter}-count`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ duration: 0.15, delay: 1 }}
            className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full border-4 border-black/10 bg-white text-center font-black"
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
      data-letter={letter}
      onClick={onClick}
      className={cn(
        "group relative flex min-h-32 cursor-pointer select-none flex-col justify-between overflow-hidden rounded-[1.5rem] border p-3 text-left shadow-[0_18px_40px_rgba(0,0,0,0.18)] transition-transform duration-300 ease-linear md:min-h-40 md:rounded-[1.75rem] md:p-4",
        "bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,255,255,0.88))] text-black hover:-translate-y-1 active:scale-[0.98]",
        selected &&
          "data-[letter=A]:bg-[linear-gradient(180deg,var(--umati-yellow),#facc15)] data-[letter=B]:bg-[linear-gradient(180deg,var(--umati-sky),#38bdf8)] data-[letter=C]:bg-[linear-gradient(180deg,var(--umati-purple),#8b5cf6)] data-[letter=D]:bg-[linear-gradient(180deg,var(--umati-red),#fb7185)] data-[letter=E]:bg-[linear-gradient(180deg,#fb923c,#f97316)] data-[letter=F]:bg-[linear-gradient(180deg,var(--umati-aqua),#14b8a6)]",
        disabled && !selected && "pointer-events-none opacity-65 ",
      )}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      transition={{ duration: 0.15 }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,0,0,0.06),transparent_28%)]" />
      <div
        data-letter={letter}
        className={cn(
          "relative z-10 inline-flex w-fit items-center justify-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white",
          !selected &&
            "group-data-[letter=A]:bg-[var(--umati-yellow)] group-data-[letter=B]:bg-[var(--umati-sky)] group-data-[letter=C]:bg-[var(--umati-purple)] group-data-[letter=D]:bg-[var(--umati-red)] group-data-[letter=E]:bg-orange-500 group-data-[letter=F]:bg-[var(--umati-aqua)]",
          selected && "bg-black/15 text-black",
        )}
      >
        {selected ? <CheckIcon className="size-4" /> : `${letter}`}
      </div>
      <p className="relative z-10 my-auto text-center text-lg font-black leading-tight md:text-2xl">
        {text}
      </p>
      <div className="relative z-10 text-center text-xs font-semibold text-black/55 md:text-sm">
        {selected ? "Locked in" : "Tap to choose"}
      </div>
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
  const handleSelect = (letter: OptionLetter) => {
    if (selected) return;
    onSelect?.(letter);
  };
  

  return (
    <div className="grid w-full max-w-5xl grid-cols-2 gap-3 px-4 md:gap-4">
      {options.map((opt) => (
        <PlayerOption
          key={opt.letter}
          {...opt}
          selected={opt.letter === selected}
          disabled={!!selected}
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

  return (
    <div className="w-full max-w-3xl relative flex items-center justify-center h-16">
      {/* Left bar */}
      <div className="h-4 w-full rounded-l-full bg-white/10 relative overflow-clip flex items-center justify-end -mr-1">
        <div
          className="absolute h-full bg-white inset-y-0 origin-[right_center_0px] rounded-l-full transition-all duration-1000 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Center display */}
      <div className="rounded-full size-16 aspect-square border-6 border-white flex items-center justify-center z-10">
        <p className="text-4xl font-bold">{seconds ?? 0}</p>
      </div>

      {/* Right bar */}
      <div className="h-4 w-full rounded-r-full bg-white/10 relative overflow-clip -ml-1">
        <div
          className="absolute h-full bg-white inset-y-0 origin-left rounded-r-full transition-all duration-1000 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export const HmTitleScreen = () => {
  const { player } = useLobbyPlayer();
  return (
    <div className="max-w-screen-2xl mx-auto w-full py-4 flex flex-col gap-8 px-4 items-center justify-center h-full">
      <div className="text-center">
        <p className="text-lg font-medium">Now Playing</p>
        <h3 className="text-6xl font-bold text-center ">Herd Mentality™</h3>
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

const letters: OptionLetter[] = ["A", "B", "C", "D", "E", "F"];

export const RoundHost = () => {
  const { lobby } = useLobbyHost();
  const { round, state, counts, nextRound } = useHerdMentalityHost();



  // track a visual animation phase
  const [dealPhase, setDealPhase] = useState<"idle" | "dealing" | "dealt" | "returning">("idle");

  useEffect(() => {
    if (round && state === "ROUND") {
      setDealPhase("dealing");
      const t1 = setTimeout(() => setDealPhase("dealt"), 1500); // after all dealt
      return () => clearTimeout(t1);
    }
    if (state === "ROUND_END") {
      setDealPhase("dealt");
    }
  }, [round, state]);

  const cardVariants = {
    initial: {
      y: "100vh",
      opacity: 0,
      scale: 0.8,
      rotate: 0,
    },
    deal: (i: number) => ({
      y: 0,
      opacity: 1,
      scale: 1,
      rotate: Math.random() * 4 - 2,
      transition: {
        delay: i * 0.30,
        type: "spring",
        stiffness: 300,
        damping: 20,
      },
    }),
    exit: {
      y: "100vh",
      opacity: 0,
      scale: 0.8,
      rotate: 0,
      transition: { duration: 0.6, ease: "easeInOut" },
    },
  };
  const winningIndex =
    state === "ROUND_END" && counts
      ? Object.entries(counts).reduce<number | null>((winner, [key, value]) => {
          if (winner === null) return Number(key);
          return value > counts[winner as HerdMentalityOptions]
            ? Number(key)
            : winner;
        }, null)
      : null;

  return (
    <Fragment>
      <div className="fixed top-0 px-8 py-4 w-full">
        <div className="flex items-center justify-between w-full">
          <div className="">
            <p className="text-xl font-medium">
              <span className="font-bold ">{lobby?.name}</span> Code:{" "}
              {lobby?.code}
            </p>
            <p className="text-xl font-bold">
              Round {round?.number} of {round?.totalRounds}
            </p>
          </div>

          <div className="flex items-center gap-2">
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
        <div className="flex flex-col items-center justify-center h-full gap-12">
          <Question text={round?.question!} />

          <div className="relative z-10 grid w-full max-w-5xl grid-cols-1 gap-4 px-4 md:grid-cols-2 xl:grid-cols-3">
            {round?.choices.map((choice, index) => (
              <motion.div
                key={choice}
                custom={index}
                variants={cardVariants as Variants}
                initial="initial"
                animate={
                  dealPhase === "dealing" || dealPhase === "dealt"
                    ? "deal"
                    : dealPhase === "returning"
                      ? "exit"
                      : "initial"
                }
                className="flex justify-center"
              >
                <Option
                  letter={letters[index]}
                  text={choice}
                  state={winningIndex === index ? "correct" : "default"}
                  count={
                    state === "ROUND_END" && counts
                      ? counts![index as HerdMentalityOptions]
                      : null
                  }
                />
              </motion.div>
            ))}
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
  const { round, myAnswer, submitAnswer } = useHerdMentalityPlayer();
  console.log("🚀 ~ PlayerRound ~ myAnswer:", myAnswer)
  return (
    <div className="flex h-full flex-col items-center justify-center gap-10 px-4 py-6">
      <div className="text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/60">
          Round {round?.number!}
        </p>
        <h6 className="mt-2 text-4xl font-black tracking-tight text-white md:text-5xl">
          Pick the herd answer
        </h6>
      </div>

      <PlayerOptions
        selected={myAnswer !== null ? letters[myAnswer] : null}
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
  const { round, scores } = useHerdMentalityPlayer();
  console.log("🚀 ~ PlayerRoundEnd ~ scores:", scores);
  const playerScore = scores?.find((p) => p.id === player?.id)?.score ?? 0;
  const isFinalRound = (round?.number ?? 0) >= ((round?.totalRounds ?? 1) - 1);

  return (
    <div className="relative flex h-full flex-col items-center justify-center gap-8 overflow-hidden px-4 py-6 text-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,202,40,0.14),transparent_24%),radial-gradient(circle_at_left,rgba(77,199,255,0.14),transparent_28%),radial-gradient(circle_at_right,rgba(106,59,255,0.14),transparent_30%)]" />

      <div className="relative z-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/60">
          Round {round?.number}
        </p>
        <h6 className="mt-3 text-4xl font-black tracking-tight text-white md:text-5xl">
          Round Over
        </h6>
        <p className="mt-3 text-sm font-semibold text-white/70 md:text-base">
          {isFinalRound ? "Final round coming up" : "Next round loading"}
        </p>
      </div>

      <div className="relative z-10 w-full max-w-md rounded-[2rem] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))] px-6 py-7 shadow-[0_24px_60px_rgba(0,0,0,0.24)] backdrop-blur-md">
        <div className="mx-auto mb-5 w-fit">
          <PlayerAvatar
            displayName={player?.displayName!}
            avatar={player?.avatar!}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 text-left">
          <div className="rounded-[1.25rem] border border-white/10 bg-black/15 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/55">
              Score
            </p>
            <p className="mt-1 text-3xl font-black text-white">
              {playerScore}
            </p>
          </div>
          <div className="rounded-[1.25rem] border border-white/10 bg-black/15 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/55">
              Status
            </p>
            <p className="mt-1 text-lg font-black text-white">
              {isFinalRound ? "Finale" : "Still live"}
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-10">
        <ScoreGapHint scores={scores} />
      </div>
    </div>
  );
};
