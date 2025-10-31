"use client";
import { LightbulbIcon } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useAnimation } from "motion/react";
import confetti from "canvas-confetti";
import { cn } from "../../lib/utils";
import { useLobbyHost } from "@/providers/lobby-host-provider";

export const Leaderboard = () => {
  const {game} = useLobbyHost();
  const scores = game?.scores;
  const players = [
    { name: "Alice", points: 1500 },
    { name: "Bob", points: 1200 },
    { name: "Charlie", points: 1900 },
    { name: "David", points: 1800 },
    { name: "Eve", points: 1700 },
    { name: "Frank", points: 1600 },
    { name: "Grace", points: 1100 },
    { name: "Heidi", points: 1400 },
    { name: "Ivan", points: 1300 },
    { name: "Judy", points: 2000 },
  ];
  return (
    <div className="flex flex-col items-center justify-center h-full gap-16">
      <h2 className="text-5xl font-bold mb-4 text-center max-w-4xl mx-auto w-full">
        Leaderboard
      </h2>

      <div className="grid gap-2 max-w-4xl w-full px-4">
        <AnimatePresence>
          {players
            .sort((a, b) => b.points - a.points)
            .map((player, index) => (
              <LeaderboardItem
                key={player.name}
                position={index + 1}
                {...player}
              />
            ))}
        </AnimatePresence>
      </div>

      <span className="text-lg font-semibold flex">
        <LightbulbIcon />
        <span>Tip: the faster you answer, the more points you score!</span>
      </span>
    </div>
  );
};

export const LeaderboardItem = ({
  position = 0,
  name = "Anonymous",
  points = 0,
}: {
  position?: number;
  name?: string;
  points?: number;
}) => {
  const controls = useAnimation();
  const prevPosition = useRef<number | null>(null);

  // Base background color (gold/silver/bronze/default)
  const baseColors: Record<number, string> = {
    1: "#FFC827",
    2: "#E0E0E0",
    3: "#FFA751",
  };

  const bgColor = baseColors[position] ?? "white";

  // Detect if the player moved up or down in rank
  useEffect(() => {
    if (prevPosition.current !== null && prevPosition.current !== position) {
      const rising = position < (prevPosition.current ?? Infinity);
      const flashColor = rising ? "#C8E6C9" : "#FFCDD2"; // green / red tint

      controls
        .start({
          backgroundColor: flashColor,
          transition: { duration: 0.2 },
        })
        .then(() => {
          controls.start({
            backgroundColor: bgColor,
            transition: { duration: 0.4 },
          });
        });
    }

    prevPosition.current = position;
  }, [position, controls, bgColor]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="text-black p-4 rounded-2xl inline-flex items-center justify-between w-full shadow-sm"
      style={{ backgroundColor: bgColor }}
      data-position={position}
    >
      <div className="flex items-center gap-4">
        <span className="text-2xl font-bold bg-black/10 rounded-full p-1 aspect-square flex items-center justify-center text-center h-10">
          {position}
        </span>
        <span className="text-2xl font-semibold">{name}</span>
      </div>
      <span className="text-xl font-bold">{points} pts</span>
    </motion.div>
  );
};

type Player = {
  name: string;
  position: number;
  points: number;
};

export const Podium = () => {
  const players: Player[] = [
    { position: 1, name: "Alice", points: 1500 },
    { position: 2, name: "Bob", points: 1200 },
    { position: 3, name: "Charlie", points: 900 },
  ];

  // Sort & slice top 3
  const topThree = [...players]
    .sort((a, b) => a.position - b.position)
    .slice(0, 3);

  // Determine heights
  const heights: Record<number, string> = {
    1: "100%",
    2: "85%",
    3: "70%",
  };

  // Arrange display order (3rd left → 1st middle → 2nd right)
  const displayOrder = [3, 1, 2];
  const orderedPodium = displayOrder
    .map((pos) => topThree.find((p) => p.position === pos))
    .filter(Boolean) as Player[];

  const [showConfetti, setShowConfetti] = useState(false);

  // Trigger confetti slightly after first place is revealed
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(true);
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.8 },
      });
    }, 3000); // after podium animation
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-16">
      {/* Title comes in first */}
      <motion.h2
        className="text-5xl font-bold mb-4 text-center max-w-4xl mx-auto w-full"
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        Podium
      </motion.h2>

      {/* Staggered bars rising */}
      <motion.div
        className="flex items-end justify-center h-1/2 w-full max-w-4xl px-4"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: { staggerChildren: 0.8, delayChildren: 0.8 }, // after title
          },
        }}
      >
        {orderedPodium.map((player) => (
          <PodiumItem
            key={player.position}
            position={player.position}
            name={player.name}
            height={heights[player.position] ?? "60%"}
          />
        ))}
      </motion.div>
    </div>
  );
};

export const PodiumItem = ({
  position,
  name,
  height,
}: {
  position: number;
  name: string;
  height: string;
}) => {
  const colors: Record<number, string> = {
    1: "#FFC827", // gold
    2: "#E0E0E0", // silver
    3: "#FFA751", // bronze
  };

  const bgColor = colors[position] ?? "white";
  const [showName, setShowName] = useState(false);

  return (
    <motion.div
      className="flex flex-col items-center w-1/3 h-full group"
      initial={{ y: 200, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 120,
        damping: 12,
      }}
      style={{ height }}
    >
      {/* Player name appears AFTER bar rise completes */}
      <motion.p
        className="text-2xl font-bold mb-4 text-white drop-shadow"
        initial={{ opacity: 0, y: 10 }}
        animate={showName ? { opacity: 1, y: 0 } : { opacity: 0 }}
        transition={{ duration: 0.4 }}
      >
        {name}
      </motion.p>

      <motion.div
        className="origin-bottom group-first-of-type:rounded-tr-none group-last-of-type:rounded-tl-none rounded-t-3xl w-full p-4 flex flex-col items-center justify-start pt-8 text-center shadow-lg h-full"
        style={{ backgroundColor: bgColor }}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        onAnimationComplete={() => setShowName(true)} // reveal name after rise
      >
        <span className="text-6xl font-bold bg-white/30 rounded-full p-1 aspect-square flex items-center justify-center text-center h-24 mx-auto">
          {position}
        </span>
      </motion.div>
    </motion.div>
  );
};

export const Rankings = () => {
const {rankings} = useLobbyHost();

  // Sort by gold > silver > bronze
  const sortedRankings = useMemo(() => {
    return [...rankings].sort((a, b) => {
      if (b.gold !== a.gold) return b.gold - a.gold;
      if (b.silver !== a.silver) return b.silver - a.silver;
      return b.bronze - a.bronze;
    });
  }, [rankings]);

  return (
    <div className="flex flex-col items-center w-full h-full max-h-70">
      <h2 className="text-2xl font-bold text-left w-full">🏅 Rankings</h2>

     {rankings.length > 0 ? <div className="relative w-full max-w-5xl overflow-x-auto scrollbar-thin scrollbar-thumb-foreground/30 scrollbar-track-transparent">
        <RankingHeader className="rounded-none" />

        <div className="flex flex-col gap-2 pb-4">
          <AnimatePresence>
            {sortedRankings.map((rankings, index) => (
              <RankingRow key={rankings.id} position={index + 1} name={rankings.displayName} {...rankings} />
            ))}
          </AnimatePresence>
        </div>
      </div> :  
        <p className="m-auto">
                No Rankings yet
        </p>
            
      }
    </div>
  );
};

export const RankingHeader = ({className}: {className?: string}) => {
  return (
    <div className={cn(" grid grid-cols-[1fr_2fr_repeat(3,1fr)] gap-4 px-6 py-3 bg-[#18161A] backdrop-blur-sm rounded-xl mb-2 font-semibold text-lg text-center sticky top-0", className)}>
      <span>#</span>
      <span>Player</span>
      <span>🥇</span>
      <span>🥈</span>
      <span>🥉</span>
    </div>
  );
};
export const RankingRow = ({
  position,
  name,
  gold,
  silver,
  bronze,
  variant = "default",
}: {
  position: number;
  name: string;
  gold: number;
  silver: number;
  bronze: number;
  variant?: "default" | "single";
}) => {
  const colors: Record<number, string> = {
    1: "#FFC827", // gold
    2: "#E0E0E0", // silver
    3: "#FFA751", // bronze
  };

  const bgColor = colors[position] ?? "white";

  const bg = variant === "single" ? "white" : bgColor;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className={cn(`grid grid-cols-[1fr_2fr_repeat(3,1fr)] gap-4 px-6 py-3 rounded-xl text-center items-center shadow-sm text-black`, variant == 'single' && "rounded-t-none opacity-10")}
      style={{
        backgroundColor: bg,
      }}
    >
      <span className="font-bold text-lg">{position}</span>
      <span className="font-semibold text-lg">{name}</span>
      <span className="font-medium text-yellow-700">{gold}</span>
      <span className="font-medium text-gray-500">{silver}</span>
      <span className="font-medium text-amber-700">{bronze}</span>
    </motion.div>
  );
};
