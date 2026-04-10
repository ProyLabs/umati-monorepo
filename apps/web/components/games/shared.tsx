"use client";
import { useLobbyHost } from "@/providers/lobby-host-provider";
import { useLobbyPlayer } from "@/providers/lobby-player-provider";
import { useAlert } from "@/providers/modal-provider";
import { Scores } from "@umati/ws";
import confetti from "canvas-confetti";
import { LightbulbIcon } from "lucide-react";
import { AnimatePresence, motion, useAnimation } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn, formatList, rankScores } from "../../lib/utils";
import { PlayerAvatar } from "../lobby/widgets";
import { Fbutton } from "../ui/fancy-button";

export const Leaderboard = ({
  scores,
  nextRound,
}: {
  scores: Scores;
  nextRound: () => void;
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-16">
      <h2 className="text-5xl font-bold mb-4 text-center max-w-4xl mx-auto w-full">
        Leaderboard
      </h2>

      <div className="grid gap-2 max-w-4xl w-full px-4">
        <AnimatePresence>
          {scores
            .sort((a, b) => b.score - a.score)
            .slice(0, 7)
            .map((player, index) => (
              <LeaderboardItem
                key={player.id}
                position={index + 1}
                name={player.displayName}
                points={player?.score}
              />
            ))}
        </AnimatePresence>
      </div>

      <span className="text-lg font-semibold flex mb-4">
        <LightbulbIcon />
        <span>Tip: the faster you answer, the more points you score!</span>
      </span>
      <Fbutton
        className="max-w-xs mx-auto w-full"
        variant="secondary"
        onClick={nextRound}
      >
        Next
      </Fbutton>
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

export const Podium = ({
  scores,
  nextRound,
}: {
  scores: Scores;
  nextRound: () => void;
}) => {
  // Sort & slice top 3
  const topThree = rankScores(scores).slice(0, 3);

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
    .filter(Boolean);

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
    <div className="relative flex h-full flex-col items-center justify-center gap-10 overflow-hidden px-4 py-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,202,40,0.16),transparent_24%),radial-gradient(circle_at_left,rgba(77,199,255,0.14),transparent_28%),radial-gradient(circle_at_right,rgba(106,59,255,0.14),transparent_30%)]" />
      <div className="pointer-events-none absolute left-1/2 top-10 h-40 w-72 -translate-x-1/2 rounded-full bg-[var(--umati-yellow)]/10 blur-3xl" />

      <motion.div
        className="relative z-10 text-center"
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <h2 className="text-5xl font-black tracking-tight text-white md:text-6xl">
          Podium
        </h2>
      </motion.div>

      <motion.div
        className="relative z-10 flex h-[26rem] w-full max-w-5xl items-end justify-center gap-3 md:gap-6"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: { staggerChildren: 0.35, delayChildren: 0.5 },
          },
        }}
      >
        <div className="pointer-events-none absolute inset-x-8 bottom-0 h-10 rounded-full bg-black/25 blur-xl" />
        {orderedPodium.map((player) => (
          <PodiumItem
            key={player?.position}
            position={player?.position!}
            name={player?.names!}
            height={heights[player?.position!] ?? "60%"}
          />
        ))}
      </motion.div>
      <Fbutton
        className="relative z-10 mx-auto w-full max-w-xs"
        variant="secondary"
        onClick={nextRound}
      >
        Next
      </Fbutton>
    </div>
  );
};

export const PodiumItem = ({
  position,
  name,
  height,
}: {
  position: number;
  name: string[];
  height: string;
}) => {
  const colors: Record<number, string> = {
    1: "#FFC827", // gold
    2: "#E0E0E0", // silver
    3: "#FFA751", // bronze
  };

  const bgColor = colors[position] ?? "white";
  const [showName, setShowName] = useState(false);
  const labels: Record<number, string> = {
    1: "Crowd champion",
    2: "Right on the heels",
    3: "Still on the board",
  };

  return (
    <motion.div
      className="group flex h-full w-1/3 max-w-[15rem] flex-col items-center justify-end"
      initial={{ y: 200, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 120,
        damping: 12,
      }}
      style={{ height }}
    >
      <motion.p
        className="mb-3 text-center text-xl font-black text-white drop-shadow md:text-2xl"
        initial={{ opacity: 0, y: 10 }}
        animate={showName ? { opacity: 1, y: 0 } : { opacity: 0 }}
        transition={{ duration: 0.4 }}
      >
        {formatList(name)}
      </motion.p>

      <motion.div
        className="relative flex h-full w-full origin-bottom flex-col items-center justify-between overflow-hidden rounded-t-[2rem] border border-white/20 px-4 pb-5 pt-6 text-center shadow-[0_24px_48px_rgba(0,0,0,0.28)]"
        style={{ backgroundColor: bgColor }}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{
          duration: 0.8,
          ease: "easeOut",
          delay: position === 3 ? 0.8 : position === 2 ? 1.1 : 1.4,
        }}
        onAnimationComplete={() => setShowName(true)} // reveal name after rise
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.28),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.06),transparent_40%)]" />
        <div className="relative z-10 flex flex-col items-center">
          <span className="inline-flex size-20 items-center justify-center rounded-full border border-black/10 bg-white/30 text-4xl font-black shadow-sm">
            {position}
          </span>
          <div className="mt-4 rounded-full border border-black/10 bg-black/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-black/70">
            {position === 1
              ? "MVP"
              : position === 2
                ? "Runner-up"
                : "Third place"}
          </div>
        </div>

        <div className="relative z-10 mt-auto text-center">
          <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-black/12" />
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-black/60">
            Place {position}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export const Rankings = () => {
  const { rankings } = useLobbyHost();

  // Sort by gold > silver > bronze
  const sortedRankings = useMemo(() => {
    return [...rankings].sort((a, b) => {
      if (b.gold !== a.gold) return b.gold - a.gold;
      if (b.silver !== a.silver) return b.silver - a.silver;
      if (b.bronze !== a.bronze) return b.bronze - a.bronze;

      return a.displayName.localeCompare(b.displayName);
    });
  }, [rankings]);

  return (
    <div className="relative flex h-full w-full flex-col overflow-clip rounded-[1.75rem] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.24)] lg:w-3/5 min-h-72">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,200,39,0.14),transparent_24%),radial-gradient(circle_at_top_right,rgba(77,199,255,0.14),transparent_30%),radial-gradient(circle_at_bottom,rgba(239,62,70,0.12),transparent_34%)]" />
      <div className="relative z-10 mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div>
            <h2 className="text-xl font-black tracking-tight text-white md:text-2xl">
              Leaderboard
            </h2>
            <p className="text-sm leading-6 text-white/70 md:text-[15px]">
              Track who is heating up, who is holding ground, and who needs a
              comeback round.
            </p>
          </div>
        </div>
      </div>

      {rankings.length > 0 ? (
        <div className="relative z-10 w-full overflow-x-auto scrollbar-hide">
          <RankingHeader />

          <div className="flex flex-col gap-2 pb-1">
            <AnimatePresence>
              {sortedRankings.map((rankings, index) => (
                <RankingRow
                  key={rankings.id}
                  position={index + 1}
                  name={rankings.displayName}
                  {...rankings}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <div className="relative z-10 m-auto flex min-h-56 w-full max-w-xl flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-white/15 bg-black/15 px-6 text-center">
          <div className="mb-3 inline-flex size-14 items-center justify-center rounded-2xl bg-white/10 text-2xl">
            🎊
          </div>
          <p className="text-xl font-bold text-white">No rankings yet</p>
          <p className="mt-2 max-w-sm text-sm leading-6 text-white/65">
            Start a round and this board will light up with medals, movement,
            and bragging rights.
          </p>
        </div>
      )}
    </div>
  );
};

export const RankingHeader = ({ className }: { className?: string }) => {
  return (
    <div className="sticky top-0 z-10 mb-2 rounded-md border border-white/12 bg-black/25 backdrop-blur-md">
      <div
        className={cn(
          "grid grid-cols-[0.8fr_2.2fr_repeat(3,0.9fr)] gap-3 px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.18em] text-white/65 md:px-5",
          className,
        )}
      >
        <span>#</span>
        <span>Player</span>
        <span>🥇</span>
        <span>🥈</span>
        <span>🥉</span>
      </div>
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
  const totalMedals = gold + silver + bronze;
  const isPodium = position <= 3 && totalMedals > 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "grid grid-cols-[0.8fr_2.2fr_repeat(3,0.9fr)] items-center gap-3 rounded-md border px-1 py-2 text-center shadow-sm md:px-5",
        isPodium
          ? "border-white/20 text-black"
          : "border-white/10 bg-white/8 text-white backdrop-blur-sm",
        variant == "single" && "rounded-t-none opacity-10",
      )}
      style={{
        backgroundColor: isPodium ? bg : undefined,
      }}
    >
      <div className="flex justify-center">
        <span
          className={cn(
            "inline-flex size-7 items-center justify-center rounded-2xl text-sm font-black shadow-sm",
            isPodium ? "bg-black/10 text-black" : "bg-white/10 text-white",
          )}
        >
          {position}
        </span>
      </div>
      <div className="min-w-0 text-left">
        <p
          className={cn(
            "truncate text-base font-bold md:text-lg",
            isPodium ? "text-black" : "text-white",
          )}
        >
          {name}
        </p>
        {/* <p
          className={cn(
            "text-[11px] font-semibold uppercase tracking-[0.16em]",
            isPodium ? "text-black/55" : "text-white/50",
          )}
        >
          {position === 1
            ? "Crowd favorite"
            : position === 2
              ? "On the chase"
              : position === 3
                ? "Still in it"
                : "Party contender"}
        </p> */}
      </div>
      <span
        className={cn(
          "text-base font-black",
          isPodium ? "text-yellow-800" : "text-yellow-300",
        )}
      >
        {gold}
      </span>
      <span
        className={cn(
          "text-base font-black",
          isPodium ? "text-slate-500" : "text-slate-200",
        )}
      >
        {silver}
      </span>
      <span
        className={cn(
          "text-base font-black",
          isPodium ? "text-amber-800" : "text-amber-300",
        )}
      >
        {bronze}
      </span>
    </motion.div>
  );
};

export const PlayerPodium = ({ scores }: { scores: Scores }) => {
  const { player } = useLobbyPlayer();
  const order = [...scores]
    .sort((a, b) => b.score - a.score)
    .map((p, i) => {
      return { ...p, position: i + 1 };
    });

  const playerPosition = order.find((p) => p.id === player?.id);

  const [showConfetti, setShowConfetti] = useState(false);
  const playerFinish = playerPosition?.position ?? null;
  const placementClass =
    playerFinish === 1
      ? "border-yellow-300/50 bg-[linear-gradient(180deg,#facc15,#eab308)] text-black"
      : playerFinish === 2
        ? "border-slate-200/50 bg-[linear-gradient(180deg,#e5e7eb,#cbd5e1)] text-black"
        : playerFinish === 3
          ? "border-orange-300/50 bg-[linear-gradient(180deg,#fdba74,#f97316)] text-black"
          : "border-white/15 bg-black/15 text-white/80";
  const containerClass =
    playerFinish === 1
      ? "border-yellow-300/35 bg-[linear-gradient(180deg,rgba(250,204,21),rgba(234,179,8))]"
      : playerFinish === 2
        ? "border-slate-200/35 bg-[linear-gradient(180deg,rgba(229,231,235),rgba(203,213,225))]"
        : playerFinish === 3
          ? "border-orange-300/35 bg-[linear-gradient(180deg,rgba(253,186,116),rgba(249,115,22))]"
          : "border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))]";

  // Trigger confetti slightly after first place is revealed
  useEffect(() => {
    const timer = setTimeout(() => {
      if (playerPosition?.position! > 3) return;
      setShowConfetti(true);
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.8 },
      });
    }, 3000); // after podium animation
    return () => clearTimeout(timer);
  }, []);

  function getOrdinal(n?: number): string {
    if (n == null) return "";
    const suffixes = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
  }

  return (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden px-4 py-8 text-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,202,40,0.18),transparent_22%),radial-gradient(circle_at_left,rgba(77,199,255,0.14),transparent_28%),radial-gradient(circle_at_right,rgba(106,59,255,0.16),transparent_30%)]" />

      <motion.div
        className="relative z-10"
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-white/75">
          <span className="inline-block size-2 rounded-full bg-[var(--umati-yellow)] shadow-[0_0_18px_var(--umati-yellow)]" />
          Final Result
        </div>
        <motion.h2
          className="text-5xl font-black tracking-tight text-white md:text-7xl"
          initial={{ scale: 0.94 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.35, duration: 0.45 }}
        >
          Game Over
        </motion.h2>
      </motion.div>

      <motion.div
        className="relative z-10 mt-8 w-full max-w-3xl"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.55 }}
      >
        <div
          className={cn(
            "relative overflow-hidden rounded-[2.25rem] border px-6 py-8 backdrop-blur-md",
            containerClass,
          )}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_28%),linear-gradient(180deg,transparent,rgba(0,0,0,0.08))]" />

          <div className="relative z-10 flex flex-col items-center gap-6">
            <div
              className={cn(
                "rounded-full px-4 py-2 text-sm font-bold uppercase tracking-[0.18em]",
                placementClass,
              )}
            >
              {getOrdinal(playerPosition?.position)} place
            </div>

            <div className="relative">
              <div className="absolute inset-0 scale-110 rounded-full bg-[var(--umati-yellow)]/14 blur-3xl" />
              <div className="relative">
                <PlayerAvatar
                  displayName={player?.displayName!}
                  avatar={player?.avatar!}
                />
              </div>
            </div>

            <div className="grid w-full max-w-xl grid-cols-2 gap-3">
              <motion.div
                className="rounded-[1.5rem] border border-white/12 bg-black/20 p-2"
                whileHover={{ y: -2 }}
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/55">
                  Score
                </p>
                <p className="mt-2 text-2xl font-black text-white">
                  {scores?.find((p) => p.id === player?.id)?.score ?? 0}
                </p>
              </motion.div>
              <motion.div
                className="rounded-[1.5rem] border border-white/12 bg-black/20 p-2"
                whileHover={{ y: -2 }}
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/55">
                  Finish
                </p>
                <p className="mt-2 text-2xl font-black text-white">
                  {getOrdinal(playerPosition?.position)}
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export const ScoreGapHint = ({ scores }: { scores: Scores }) => {
  const { player } = useLobbyPlayer();

  const hint = useMemo(() => {
    if (!player) return null;

    const orderedScores = [...scores].sort((a, b) => b.score - a.score);
    const playerIndex = orderedScores.findIndex((entry) => entry.id === player.id);
    if (playerIndex === -1) return null;

    const playerScore = orderedScores[playerIndex]?.score ?? 0;

    const nextAhead = orderedScores
      .slice(0, playerIndex)
      .find((entry) => entry.score > playerScore);

    if (nextAhead) {
      return {
        type: "behind" as const,
        gap: nextAhead.score - playerScore,
        name: nextAhead.displayName,
      };
    }

    const nextBehind = orderedScores
      .slice(playerIndex + 1)
      .find((entry) => entry.score < playerScore);

    if (nextBehind) {
      return {
        type: "ahead" as const,
        gap: playerScore - nextBehind.score,
        name: nextBehind.displayName,
      };
    }

    return null;
  }, [player, scores]);

  if (!hint) return null;

  return (
    <p className="text-center text-lg font-medium text-white/85">
      {hint.type === "behind"
        ? `You're ${hint.gap} pts behind ${hint.name}`
        : `You're ${hint.gap} pts ahead of ${hint.name}`}
    </p>
  );
};

export const EndGameButton = () => {
  const { lobby, cancelGame } = useLobbyHost();
  const { showAlert } = useAlert();

  return (
    <Fbutton
      variant="secondary"
      onClick={() =>
        showAlert({
          title: "End game now?",
          description: `The current game in ${lobby?.name ?? "this lobby"} will end immediately and everyone will return to the lobby.`,
          confirmText: "End Game",
          closeText: "Keep playing",
          onConfirm: cancelGame,
        })
      }
    >
      End Game
    </Fbutton>
  );
};
