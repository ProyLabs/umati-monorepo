import { PlayerAvatar } from "@/components/lobby/widgets";
import { Fbutton } from "@/components/ui/fancy-button";
import { FlipCard } from "@/components/ui/flip-card";
import { cn } from "@/lib/utils";
import { useChameleonHost } from "@/providers/games/chameleon/chameleon-host-provider";
import { useChameleonPlayer } from "@/providers/games/chameleon/chameleon-player-provider";
import { useLobbyPlayer } from "@/providers/lobby-player-provider";
import {
  ChameleonRound,
  ChameleonRoundRole,
  GameState,
  Player,
} from "@umati/ws";
import { BellRingIcon } from "lucide-react";
import Image from "next/image";
import React, { use, useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLobbyHost } from "@/providers/lobby-host-provider";
import { RiUser3Fill, RiUser3Line } from "@remixicon/react";
import { boolean } from "better-auth/*";

export const Setup = () => {
  const { state, round, startSpeakingRound, startVotingRound } =
    useChameleonHost();

  const handleClick = () => {
    if (state === GameState.ROUND_SETUP) {
      startSpeakingRound();
    } else {
      startVotingRound();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8">
      <h1 className="text-6xl font-bold mb-16 text-center max-w-4xl mx-auto w-full">
        {round?.category?.title}
      </h1>
      <div className="max-w-3xl w-full h-full max-h-100">
        <FlipCard
          front={<GridCard words={round?.category?.words!} />}
          back={<CountdownCard round={round} />}
          flipped={state === GameState.SPEAKING}
          onToggle={() => {}}
        />
      </div>
      <p className="text-xs text-center max-w-sm w-full mx-auto mb-8">
        THE CHAMELEON™ is a trademark of Big Potato Games Ltd. This generator
        is not affiliated with, sponsored by, or endorsed by Big Potato Games.
      </p>

      <Fbutton variant="secondary" onClick={handleClick}>
        {state === GameState.SPEAKING
          ? "Start Voting Round"
          : "Start Speaking Round"}
      </Fbutton>
    </div>
  );
};

export const PlayerSetup = () => {
  const { role } = useChameleonPlayer();
  return (
    <div className="flex flex-col items-center justify-center h-full gap-16 px-5">
      {role === ChameleonRoundRole.CHAMELEON && <ChameleonCard />}
      {role === ChameleonRoundRole.CIVILIAN && <CivilianCard />}
    </div>
  );
};

export const VotingRound = () => {
  const { players } = useLobbyHost();
  const { counts, state, round } = useChameleonHost();
  return (
    <div className="flex flex-col items-center justify-center h-full gap-8">
      <div className="mb-16 ">
        <h1 className="text-6xl font-bold text-center max-w-4xl mx-auto w-full">
          It's time to vote
        </h1>
        <h2 className="text-4xl font-semibold text-center">
          Who do you think is the chameleon?
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-2xl w-full">
        {players?.map((p) => {
          return (
            <VotingGridCard
              player={p}
              key={p.id}
              count={
                counts && state === GameState.ROUND_END ? counts![p.id] : 0
              }
            />
          );
        })}
      </div>

    { state === GameState.ROUND_END && <Timer variant="compact" duration={round?.timer?.duration!} startTime={round?.timer?.startedAt!} />}
    </div>
  );
};

export const GetReady = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-8">
      <div className="mb-16 ">
        <h1 className="text-6xl font-bold text-center max-w-4xl mx-auto w-full">
          Get ready for the next round
        </h1>
        <h2 className="text-4xl font-semibold text-center">
          Remeber, There's a new chameleon this round!
        </h2>
      </div>
    </div>
  );
};
export const Reveal = () => {
  const { players } = useLobbyHost();
  const { round } = useChameleonHost();

  const chameleon = useMemo(() => {
    return players.find(
      (p) => round?.roles[p.id] === ChameleonRoundRole.CHAMELEON
    );
  }, [players, round]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8">
      <div className="bg-white rounded-2xl p-4 w-full flex flex-col items-center justify-center text-center max-w-lg  h-[50dvh] max-h-80 shadow-2xl">
        <Image
          src="https://img.icons8.com/?size=400&id=iy7s412RVvVR&format=png&color=000000"
          height={150}
          width={150}
          alt={""}
        />
        <h6 className="text-lime-500 font-bold text-2xl">
          {chameleon?.displayName} is the Chameleon
        </h6>
      </div>
    </div>
  );
};

export const VotingRoundPlayer = () => {
  const { players, player } = useLobbyPlayer();
  const { submitVote, myVote } = useChameleonPlayer();
  const [vote, setVote] = useState<string | null>(myVote);

  const handleVote = (id: string) => {
    // console.log("🚀 ~ handleVote ~ id:", id)
    if (vote) return;
    setVote(id);
    submitVote(id);
    return;
  };

  // const selectedPlayer = useMemo(() => {
  //   console.log("🚀 ~ VotingRoundPlayer ~ vote:", vote);
  //   return players.find((p) => {
  //     return p.id === vote;
  //   });
  // }, [vote]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 px-5 max-w-md mx-auto w-full">
      <div className="">
        <h2 className="text-3xl font-bold text-center max-w-4xl mx-auto w-full">
          {vote
            ? "You have cast your vote."
            : "Who do you think is the chameleon?"}
        </h2>
        {vote && (
          <p className="text-center animate-pulse">Waiting for others...</p>
        )}
      </div>
      <div className="grid grid-cols-3 gap-4 max-w-2xl w-full">
        {players
          ?.filter((p) => p.id !== player?.id)
          ?.map((p) => {
            return (
              <VotingGridPlayerCard
                key={p.id}
                player={p}
                selected={vote === p.id}
                disabled={!!vote}
                onClick={() => handleVote(p.id)}
              />
            );
          })}
      </div>
    </div>
  );
};

export const VotingGridCard = ({
  player,
  count,
}: {
  player: Player;
  count: number;
}) => {
  return (
    <div className="flex gap-4 bg-white/20 border-2 border-white/50 rounded-xl w-full p-3">
      <motion.div className="flex flex-col items-center">
        <Avatar
          className={cn(
            "size-12 ring-2 ring-foreground shadow-md hover:scale-110 transition-transform relative"
          )}
        >
          <AvatarImage src={player?.avatar} alt={player?.displayName} />
          <AvatarFallback>{player.displayName?.[0]}</AvatarFallback>
        </Avatar>
      </motion.div>
      <div className="flex-1 flex flex-col">
        <p className="text-xl font-semibold">{player.displayName}</p>
        {count > 0 && <Votes count={count} />}
      </div>
    </div>
  );
};

export const VotingGridPlayerCard = ({
  player,
  selected,
  disabled,
  onClick,
}: {
  player: Player;
  selected?: boolean;
  disabled?: boolean;
  onClick?: VoidFunction;
}) => {
  const handleClick = () => {
    if (disabled || selected) return;
    if (onClick) {
      onClick();
    }
  };
  return (
    <div
      className={cn(
        "flex flex-col gap-2 bg-white/20 hover:bg-white/30 cursor-pointer border-2 border-white/50 rounded-xl w-full p-3 select-none",
        {
          "bg-white/20": selected,
          "opacity-20 cursor-not-allowed hover:bg-white/20":
            disabled && !selected,
        }
      )}
      onClick={handleClick}
    >
      <motion.div className="flex flex-col items-center">
        <Avatar
          className={cn(
            "size-12 ring-2 ring-foreground shadow-md hover:scale-110 transition-transform relative"
          )}
        >
          <AvatarImage src={player?.avatar} alt={player?.displayName} />
          <AvatarFallback>{player.displayName?.[0]}</AvatarFallback>
        </Avatar>
      </motion.div>
      <p className="text-sm text-center font-semibold">{player.displayName}</p>
    </div>
  );
};

export const Votes = ({ count }: { count: number }) => {
  const icons = Array.from({ length: count });

  const container = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.1, // delay between icons
        duration: 4,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, x: 20 },
    show: { opacity: 1, x: 0 },
  };

  return (
    <motion.div
      className="flex items-center -space-x-1"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {icons.map((_, i) => (
        <motion.div key={i} variants={item}>
          <RiUser3Fill size={18} />
        </motion.div>
      ))}
    </motion.div>
  );
};

export const GridCard = ({ words }: { words: string[] }) => {
  const letters = ["A", "B", "C", "D"];
  const numbers = [1, 2, 3, 4];

  const validIndices = useMemo(() => new Set([0, 2, 5, 7, 8, 10, 13, 15]), []);

  const isValidIndex = useCallback(
    (index: number) => validIndices.has(index),
    [validIndices]
  );

  return (
    <div className="relative">
      <div className="absolute -top-8 md:-top-12 left-0 right-0 flex justify-between">
        {letters.map((letter, index) => {
          return (
            <div
              key={index}
              className="flex-1 flex items-center justify-center"
            >
              <span className="text-white text-xl sm:text-2xl md:text-3xl font-black">
                {letter}
              </span>
            </div>
          );
        })}
      </div>
      <div className="absolute -left-8 md:-left-12 top-1/2 transform -translate-y-1/2 grid grid-rows-4 gap-0">
        {numbers.map((number, index) => {
          return (
            <div
              key={index}
              className="w-6 h-18 flex items-center justify-center"
            >
              <span className=" text-white text-xl sm:text-2xl md:text-3xl font-black">
                {number}
              </span>
            </div>
          );
        })}
      </div>
      <div className="bg-white rounded-2xl p-4 h-80.25 max-w-3xl w-full shadow-2xl">
        <div className="grid grid-cols-4 grid-rows-4 rounded-lg overflow-clip border-[0.5px] border-lime-950">
          {words.map((word, i) => {
            return (
              <div
                data-even={isValidIndex(i)}
                className="text-black h-18 aspect-video flex flex-col items-center justify-center text-center p-2 w-full  data-[even=true]:bg-lime-800 data-[even=true]:text-white"
                key={i}
              >
                <p className="font-semibold text-base">{word}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const ChameleonCard = () => {
  return (
    <div className="bg-white rounded-2xl p-4 w-full flex flex-col items-center justify-center text-center max-w-lg  h-[50dvh] max-h-80 shadow-2xl">
      <Image
        src="https://img.icons8.com/?size=400&id=iy7s412RVvVR&format=png&color=000000"
        height={150}
        width={150}
        alt={""}
      />
      <h6 className="text-lime-500 font-bold text-2xl">
        You are the Chameleon
      </h6>
      <p className="text-black max-w-4/5 mx-auto">
        Try to bluff your way through the speaking round and don't get caught!
      </p>
    </div>
  );
};

export const CivilianCard = () => {
  const { round } = useChameleonPlayer();
  return (
    <div className="bg-white rounded-2xl p-4 w-full flex flex-col items-center justify-center text-center max-w-lg  h-[50dvh] max-h-80 shadow-2xl">
      <p className="text-black max-w-4/5 mx-auto">The word is in position:</p>
      <div className="h-37.5 w-37.5 flex flex-col items-center justify-center">
        <p className="text-green-600 text-5xl font-bold text-center">
          {round?.roll}
        </p>
      </div>
      <h6 className="text-lime-500 font-bold text-2xl">Catch the Chameleon</h6>
      <p className="text-black max-w-4/5 mx-auto">
        Try to bluff your way through the speaking round and don't get caught!
      </p>
    </div>
  );
};

export const CountdownCard = ({ round }: { round?: ChameleonRound }) => {
  const starter = round?.speakingOrder?.starter;
  return (
    <>
      <div className="max-w-136.25  bg-white w-full mx-auto p-4 flex flex-col items-center justify-center gap-6 rounded-2xl text-black">
        Start the speaking round from:
        <PlayerAvatar
          displayName={starter?.displayName!}
          avatar={starter?.avatar!}
          className="size-20"
        />
        <Timer
          duration={round?.timer.duration!}
          startTime={round?.timer?.startedAt!}
        />
        <p className="text-2xl font-semibold animate-bounce mt-4">
          Speaking Round
        </p>
      </div>
    </>
  );
};

export const SpeakingCard = () => {
  return (
    <>
      <div className="max-w-136.25 h-80.25 bg-white w-full mx-auto p-4 flex flex-col items-center justify-center rounded-2xl text-black">
        <PlayerAvatar displayName={""} avatar={""} />
        <p className="text-2xl font-semibold animate-bounce mt-4">
          Player 1's Turn
        </p>
      </div>
      <Timer duration={15} startTime={new Date()} />
    </>
  );
};

export const Timer = ({
  duration,
  startTime,
  variant = "default",
}: {
  startTime: number | Date;
  duration: number;
  variant?: "default" | "compact";
}) => {
  const startTimestamp =
    startTime instanceof Date ? startTime.getTime() : startTime;

  // --- REFACTOR START: Logic for calculating initial seconds moved to a helper function ---
  const calculateInitialSeconds = (
    currentDuration: number,
    currentStartTime: number
  ) => {
    const elapsed = Math.floor((Date.now() - currentStartTime) / 1000);
    return Math.max(currentDuration - elapsed, 0);
  };
  // --- REFACTOR END ---

  const [seconds, setSeconds] = useState(() =>
    calculateInitialSeconds(duration, startTimestamp)
  );

  // 1. EFFECT TO HANDLE PROP CHANGES (The Fix)
  useEffect(() => {
    // Recalculate and reset the seconds state whenever duration or startTime changes.
    // This is crucial for correctly resetting the timer when the parent component changes its props.
    setSeconds(calculateInitialSeconds(duration, startTimestamp));
    // The dependency array ensures this runs when 'duration' or 'startTime' changes.
  }, [duration, startTimestamp]); // Note: Using startTimestamp as it's the derived value used in calculation

  // 2. EFFECT TO HANDLE THE COUNTDOWN LOGIC
  useEffect(() => {
    // Only start the interval if the current seconds value is greater than 0
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

    // Cleanup function: This stops the *previous* interval whenever
    // the dependencies change (which happens when seconds changes
    // due to the prop reset, or when the component unmounts).
    return () => clearInterval(interval);
  }, [seconds]); // Dependency array: seconds is used here to re-run the effect if it hits 0

  // The rest of your component logic remains the same
  const progress = Math.max(seconds / duration, 0); // 0 → 1
  const size = 140;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // ... (SVG and return statement)

  if (variant === "compact") {
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
  }
  return (
    <div className="w-full max-w-3xl relative flex items-center justify-center h-30">
      {/* PROGRESS RING */}
      <svg
        width={size}
        height={size}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      >
        {/* background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* animated progress ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={seconds <= 10 ? "#EF4444" : "#84CC16"} // red or lime
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          initial={false}
          animate={{
            strokeDashoffset: circumference * (1 - progress),
          }}
          transition={{
            duration: 1,
            ease: "linear",
          }}
          style={{
            transform: "rotate(-90deg)",
            transformOrigin: "50% 50%",
          }}
        />
      </svg>

      {/* CENTER CONTENT */}
      <div
        className={cn(
          "rounded-full size-28 aspect-square flex items-center justify-center z-10 bg-white"
        )}
      >
        {seconds > 0 ? ( // Changed to seconds > 0 for consistency
          <p className="text-5xl font-bold">{seconds}</p>
        ) : (
          <BellRingIcon size={30} />
        )}
      </div>
    </div>
  );
};

interface D6DiceProps {
  value: number; // final rolled value (1–6)
  trigger?: number; // re-trigger flicker when this changes
  duration?: number; // ms for flicker
  color?: string; // Tailwind color
}

export const D6Dice: React.FC<D6DiceProps> = ({
  value,
  trigger = 0,
  duration = 800,
  color = "bg-gray-800",
}) => {
  const [face, setFace] = useState(value);

  useEffect(() => {
    // Flicker animation by changing the face rapidly
    const interval = setInterval(() => {
      const random = Math.floor(Math.random() * 6) + 1;
      setFace(random);
    }, 80);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      setFace(value);
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [value, trigger, duration]);

  // Tailwind layout for each face
  const renderPips = () => {
    const pip = <span className="w-3 h-3 bg-white rounded-full"></span>;

    switch (face) {
      case 1:
        return (
          <div className="flex items-center justify-center h-full w-full">
            {pip}
          </div>
        );

      case 2:
        return (
          <div className="flex flex-col justify-between h-full p-2 w-full">
            <div className="flex justify-start">{pip}</div>
            <div className="flex justify-end">{pip}</div>
          </div>
        );

      case 3:
        return (
          <div className="flex flex-col justify-between h-full p-2 w-full">
            <div className="flex justify-start">{pip}</div>
            <div className="flex justify-center">{pip}</div>
            <div className="flex justify-end">{pip}</div>
          </div>
        );

      case 4:
        return (
          <div className="flex flex-col justify-between h-full p-2 w-full">
            <div className="flex justify-between">
              {pip}
              {pip}
            </div>
            <div className="flex justify-between">
              {pip}
              {pip}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="flex flex-col justify-between h-full p-2 w-full">
            <div className="flex justify-between">
              {pip}
              {pip}
            </div>
            <div className="flex justify-center">{pip}</div>
            <div className="flex justify-between">
              {pip}
              {pip}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="flex flex-col justify-between h-full p-2 w-full">
            <div className="flex justify-between">
              {pip}
              {pip}
            </div>
            <div className="flex justify-between">
              {pip}
              {pip}
            </div>
            <div className="flex justify-between">
              {pip}
              {pip}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`${color} w-16 h-16 rounded-lg shadow-lg flex items-center justify-center`}
    >
      {renderPips()}
    </div>
  );
};

interface D9DiceProps {
  value: number; // final rolled value (1–9)
  trigger?: number; // change to re-trigger flicker
  duration?: number; // ms for flicker
  color?: string; // Tailwind background
}

export const D9Dice: React.FC<D9DiceProps> = ({
  value,
  trigger = 0,
  duration = 800,
  color = "bg-yellow-600",
}) => {
  const [face, setFace] = useState(value);

  useEffect(() => {
    const interval = setInterval(() => {
      const random = Math.floor(Math.random() * 9) + 1;
      setFace(random);
    }, 80);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      setFace(value);
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [value, trigger, duration]);

  return (
    <div
      className={`${color} w-16 h-16 rounded-lg shadow-lg flex items-center justify-center text-white text-3xl font-bold`}
    >
      {face}
    </div>
  );
};

export const ChameleonTitleScreen = () => {
  const { player } = useLobbyPlayer();
  return (
    <div className="max-w-screen-2xl mx-auto w-full py-4 flex flex-col gap-8 px-4 items-center justify-center h-full">
      <div className="text-center">
        <p className="text-lg font-medium">Now Playing</p>
        <h3 className="text-6xl font-bold text-center ">Chameleon™</h3>
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
