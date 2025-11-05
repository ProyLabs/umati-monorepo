import {
  PlayerAvatar,
  PlayerLeaveButton,
  Reactions,
} from "@/components/lobby/widgets";
import { cn } from "../../../lib/utils";
import { CheckIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import React, { Fragment } from "react";
import { useEffect, useState } from "react";
import { useLobbyPlayer } from "@/providers/lobby-player-provider";
import { Fbutton } from "@/components/ui/fancy-button";
import UmatiLogo from "@/components/ui/logo";
import { useTriviaHost } from "@/providers/games/trivia/trivia-host-provider";
import { useLobbyHost } from "@/providers/lobby-host-provider";
import { useTriviaPlayer } from "@/providers/games/trivia/trivia-player-provider";
import { TriviaOptions } from "@umati/ws";

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

export const TriviaTitleScreen = () => {
  const { player, leaveLobby } = useLobbyPlayer();
  return (
    <div className="max-w-screen-2xl mx-auto w-full py-4 flex flex-col gap-8 px-4 items-center justify-center h-full">
      <div className="text-center">
        <p className="text-lg font-medium">Now Playing</p>
        <h3 className="text-6xl font-bold text-center ">Trivia</h3>
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

export const RoundHost = () => {
  const { lobby } = useLobbyHost();
  const { round, state, counts } = useTriviaHost();

  const letters: OptionLetter[] = ["A", "B", "C", "D"];
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
    </div>
  );
};
