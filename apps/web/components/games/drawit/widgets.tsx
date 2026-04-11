"use client";

import { Fbutton } from "@/components/ui/fancy-button";
import { cn } from "@/lib/utils";
import { EndGameButton, ScoreGapHint } from "../shared";
import { useDrawItHost } from "@/providers/games/drawit/drawit-host-provider";
import { useDrawItPlayer } from "@/providers/games/drawit/drawit-player-provider";
import { useLobbyPlayer } from "@/providers/lobby-player-provider";
import { DrawItRound, DrawItSegment } from "@umati/ws";
import { useEffect, useRef, useState } from "react";
import { PlayerAvatar } from "@/components/lobby/widgets";

const drawSegments = (canvas: HTMLCanvasElement, segments: DrawItSegment[]) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, rect.width, rect.height);
  ctx.fillStyle = "#fffdf7";
  ctx.fillRect(0, 0, rect.width, rect.height);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  segments.forEach((segment) => {
    if (segment.mode === "fill") {
      ctx.fillStyle = segment.color;
      ctx.fillRect(0, 0, rect.width, rect.height);
      return;
    }

    ctx.strokeStyle = segment.mode === "erase" ? "#fffdf7" : segment.color;
    ctx.lineWidth = segment.width;
    ctx.beginPath();
    ctx.moveTo(segment.x1 * rect.width, segment.y1 * rect.height);
    ctx.lineTo(segment.x2 * rect.width, segment.y2 * rect.height);
    ctx.stroke();
  });
};

const wordLengthLabel = (length: number) =>
  `${length} ${length === 1 ? "letter" : "letters"}`;

export const DrawItTitleScreen = () => {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 px-4 text-center">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/55">
        Draw It!
      </p>
      <h1 className="text-5xl font-black tracking-tight md:text-7xl">
        Sketch. Guess. Repeat.
      </h1>
      <p className="max-w-xl text-base font-semibold text-white/75 md:text-lg">
        One player draws. Everyone else races to guess the word.
      </p>
    </div>
  );
};

function TurnBanner({ round }: { round: DrawItRound }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.6rem] border border-white/14 bg-white/8 px-4 py-3">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">
          Round {round.roundNumber} of {round.totalRounds}
        </p>
        <p className="mt-1 text-xl font-black">{round.drawerName} is drawing</p>
      </div>
    </div>
  );
}

function RadialTimer({
  duration,
  startTime,
}: {
  duration: number;
  startTime: number;
}) {
  const [seconds, setSeconds] = useState(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    return Math.max(duration - elapsed, 0);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setSeconds(Math.max(duration - elapsed, 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [duration, startTime]);

  const progress = Math.max(seconds / duration, 0);
  const circumference = 2 * Math.PI * 34;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="relative flex size-20 items-center justify-center">
      <svg
        viewBox="0 0 80 80"
        className="absolute inset-0 size-full -rotate-90"
      >
        <circle
          cx="40"
          cy="40"
          r="34"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="8"
          fill="none"
        />
        <circle
          cx="40"
          cy="40"
          r="34"
          stroke="white"
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="relative text-center">
        <p className="text-2xl font-black leading-none">{seconds}</p>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
          sec
        </p>
      </div>
    </div>
  );
}

function FeedList({ round }: { round: DrawItRound }) {
  return (
    <div className="rounded-[1.5rem] border border-white/14 bg-black/12 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/55">
          Live Feed
        </p>
        <p className="text-sm font-semibold text-white/70">
          {round.guessedCorrectlyIds.length} guessed
        </p>
      </div>
      <div className="grid gap-2">
        {round.feed.slice(-6).map((item) => (
          <div
            key={item.id}
            className={cn(
              "rounded-xl px-3 py-2 text-sm font-semibold",
              item.type === "correct"
                ? "bg-green-500/40 text-white"
                : item.type === "system"
                  ? "bg-white/8 text-white/88"
                  : "bg-black/18 text-white/72",
            )}
          >
            {item.message}
          </div>
        ))}
      </div>
    </div>
  );
}

function GuessPanel({
  round,
  guessedCorrectly,
  guess,
  setGuess,
  submitGuess,
}: {
  round: DrawItRound;
  guessedCorrectly: boolean;
  guess: string;
  setGuess: (value: string) => void;
  submitGuess: (guess: string) => void;
}) {
  const lastSubmittedGuess = round.myGuess ?? "";

  return (
    <form
      className="rounded-[1.5rem] border border-white/20 bg-gradient-to-br from-white/8 to-white/4 p-6 animate-in fade-in duration-300 space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!guess.trim()) return;
        submitGuess(guess);
        setGuess("");
      }}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/50">
        🔍 Guess the Word
      </p>
      <div className="mt-4 rounded-[1.35rem] border border-white/15 bg-white/6 px-4 py-4 text-center backdrop-blur-sm hover:border-white/25 transition-colors duration-200">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45 mb-2">
          Clue
        </p>
        <p className="mt-2 text-3xl font-black tracking-[0.18em] text-white leading-tight">
          {guessedCorrectly ? (round.word ?? "").toUpperCase() : round.wordMask}
        </p>
        <p className="mt-3 text-xs font-semibold text-white/60">
          {wordLengthLabel(round.wordLength)}
        </p>
      </div>
      {guessedCorrectly ? (
        <p className="mt-4 text-sm font-bold text-white/75 text-center">
          You got it. Waiting for the rest of the room.
        </p>
      ) : (
        <>
          <input
            value={guess}
            onChange={(event) => setGuess(event.target.value.toUpperCase())}
            placeholder={
              lastSubmittedGuess
                ? `LAST: ${lastSubmittedGuess.toUpperCase()}`
                : "TYPE YOUR GUESS"
            }
            autoComplete="off"
            className="mt-4 h-12 w-full rounded-xl border border-white/15 bg-white/8 px-4 text-base font-bold uppercase text-white placeholder:text-white/40 outline-none transition-all duration-200 focus:border-white/40 focus:bg-white/12 focus:ring-2 focus:ring-white/10"
          />
          <Fbutton 
            type="submit" 
            className="w-full transition-all duration-200 active:scale-95 font-black uppercase tracking-wider" 
            variant="secondary"
          >
            Submit 🚀
          </Fbutton>
        </>
      )}
    </form>
  );
}

function DrawCanvas({
  segments,
  interactive = false,
  onSegment,
  activeColor = "#111827",
  strokeWidth = 4,
  tool = "draw",
  onFill,
}: {
  segments: DrawItSegment[];
  interactive?: boolean;
  onSegment?: (segment: DrawItSegment) => void;
  activeColor?: string;
  strokeWidth?: number;
  tool?: "draw" | "erase" | "fill";
  onFill?: (segment: DrawItSegment) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawSegments(canvas, segments);
  }, [segments]);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      drawSegments(canvas, segments);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [segments]);

  const toPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
    };
  };

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        "h-full w-full rounded-[1.75rem] bg-[#fffdf7] touch-none",
        interactive ? "cursor-crosshair" : "cursor-default",
      )}
      onPointerDown={(event) => {
        if (!interactive) return;
        if (tool === "fill") {
          onFill?.({
            x1: 0,
            y1: 0,
            x2: 1,
            y2: 1,
            color: activeColor,
            width: strokeWidth,
            mode: "fill",
          });
          return;
        }
        drawingRef.current = true;
        lastPointRef.current = toPoint(event);
      }}
      onPointerMove={(event) => {
        if (!interactive || !drawingRef.current || !lastPointRef.current)
          return;
        const point = toPoint(event);
        const segment = {
          x1: lastPointRef.current.x,
          y1: lastPointRef.current.y,
          x2: point.x,
          y2: point.y,
          color: activeColor,
          width: strokeWidth,
          mode: tool,
        };
        lastPointRef.current = point;
        onSegment?.(segment);
      }}
      onPointerUp={() => {
        drawingRef.current = false;
        lastPointRef.current = null;
      }}
      onPointerLeave={() => {
        drawingRef.current = false;
        lastPointRef.current = null;
      }}
    />
  );
}

export const DrawItHostSetup = () => {
  const { setup } = useDrawItHost();
  if (!setup) return null;

  return (
    <div className="mx-auto flex h-full w-full max-w-5xl flex-col items-center justify-center gap-5 px-4 py-6 text-center">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/55">
        Draw It!
      </p>
      <h2 className="text-5xl font-black tracking-tight">
        {setup.drawerName} is choosing a word
      </h2>
      <p className="max-w-xl text-lg font-semibold text-white/75">
        Turn {setup.turnNumber} of {setup.totalTurns}. The room will see the
        drawing as soon as the word is locked in.
      </p>
    </div>
  );
};

function HostRoundHeader({
  round,
  state,
  nextRound,
}: {
  round: DrawItRound;
  state: string;
  nextRound: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <p className="text-xl font-medium flex gap-4 items-center text-white/75">
          <span>
            {" "}
            Round {round.roundNumber} of {round.totalRounds}
          </span>{" "}
          |
          <span className="text-sm font-semibold  uppercase">
            {" "}
            Turn {round.turnNumber} of {round.totalTurns}
          </span>
        </p>
        <p className="mt-0.5 text-lg font-bold text-white">
          {round.drawerName} is drawing
        </p>
      </div>
      <div className="flex-1">
        <div className="relative rounded-lg border border-white/14 bg-black/15 px-4 py-2 text-base font-bold uppercase  text-white/85 w-fit mx-auto flex items-start">
          <span className="tracking-[0.18em] uppercase text-lg">
            {state === "ROUND_END"
              ? round.word?.toUpperCase()
              : round.wordMask?.toUpperCase()}
          </span>
          <span className="text-sm -mt-2">{round.wordLength}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-1 justify-end">
        {state === "ROUND" ? (
          <RadialTimer duration={round.duration} startTime={round.startedAt} />
        ) : null}
        {state === "ROUND_END" ? (
          <Fbutton type="button" variant="secondary" onClick={nextRound}>
            Next
          </Fbutton>
        ) : null}
        <EndGameButton />
      </div>
    </div>
  );
}

function HostRoundShell({
  round,
  state,
  nextRound,
  footer,
}: {
  round: DrawItRound;
  state: string;
  nextRound: () => void;
  footer?: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-4 px-4 py-5 md:px-8">
      <HostRoundHeader round={round} state={state} nextRound={nextRound} />
      <div className="grid flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="rounded-[2rem] border border-white/14 bg-white/8 p-3 shadow-[0_24px_80px_rgba(0,0,0,0.2)]">
          <div className="h-full min-h-[24rem] overflow-hidden rounded-[1.75rem] relative">
            <DrawCanvas segments={round.segments} />
          </div>
        </div>
        <FeedList round={round} />
      </div>
      {footer}
    </div>
  );
}

export const DrawItHostRound = () => {
  const { round, state, nextRound } = useDrawItHost();
  if (!round) return null;

  return <HostRoundShell round={round} state={state} nextRound={nextRound} />;
};

export const DrawItPlayerSetup = () => {
  const { setup, pickWord } = useDrawItPlayer();
  if (!setup) return null;

  if (setup.isDrawer) {
    return (
      <div className="mx-auto flex h-full w-full max-w-2xl flex-col items-center justify-center gap-5 px-4 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/55">
          Your Turn
        </p>
        <h2 className="text-4xl font-black tracking-tight">
          Pick a word to draw
        </h2>
        <div className="grid grid-cols-3 w-full gap-3">
          {setup.wordChoices?.map((word) => (
            <Fbutton
              key={word}
              type="button"
              className="w-full"
              variant="secondary"
              onClick={() => pickWord(word)}
            >
              {word.toUpperCase()}
            </Fbutton>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/55">
        Draw It!
      </p>
      <h2 className="text-5xl font-black tracking-tight">
        {setup.drawerName} is choosing a word
      </h2>
      <p className="max-w-xl text-lg font-semibold text-white/75">
        Get ready to guess. Turn {setup.turnNumber} of {setup.totalTurns} starts
        in a moment.
      </p>
    </div>
  );
};

export const DrawItPlayerRound = () => {
  const { round, submitSegment, clearCanvas, submitGuess } = useDrawItPlayer();
  const { player } = useLobbyPlayer();
  const [guess, setGuess] = useState("");
  const [tool, setTool] = useState<"draw" | "erase" | "fill">("draw");
  const [activeColor, setActiveColor] = useState("#111827");
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [isCanvasCleared, setIsCanvasCleared] = useState(false);

  useEffect(() => {
    setGuess("");
  }, [round?.turnNumber]);

  const handleClearCanvas = () => {
    clearCanvas();
    setIsCanvasCleared(true);
    setTimeout(() => setIsCanvasCleared(false), 300);
  };

  if (!round) return null;

  const isDrawer = !!round.isDrawer;
  const guessedCorrectly =
    !!player && round.guessedCorrectlyIds.includes(player.id);
  const colors = [
    "#111827",
    "#ef4444",
    "#f59e0b",
    "#22c55e",
    "#2563eb",
    "#a855f7",
  ];

  return (
    <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-4 px-4 py-5 md:px-8">
      {isDrawer ? (
        <div className="grid flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_min(100%,380px)]">
          <div className="rounded-[2rem] border border-white/14 bg-white/8 p-3 shadow-[0_24px_80px_rgba(0,0,0,0.2)]">
            <div className="h-full min-h-[24rem] overflow-hidden rounded-[1.75rem]">
              <DrawCanvas
                segments={round.segments}
                interactive
                onSegment={submitSegment}
                onFill={submitSegment}
                activeColor={activeColor}
                strokeWidth={strokeWidth}
                tool={tool}
              />
            </div>
          </div>
          <div className="flex flex-col gap-6">
            {/* Word Info Section - Prominent, Energetic */}
            <div className="group rounded-[1.5rem] border border-white/20 bg-gradient-to-br from-white/8 to-white/4 p-5 animate-in fade-in hover:border-white/30 hover:bg-gradient-to-br hover:from-white/12 hover:to-white/6 transition-colors duration-200">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/50 mb-3">
                📝 Your Word
              </p>
              <p className="text-4xl font-black leading-tight tracking-tight text-white">
                {round.word?.toUpperCase()}
              </p>
              <p className="mt-3 text-xs font-medium text-white/60 leading-relaxed">
                Draw it bold. Precision wins points. ✨
              </p>
            </div>

            {/* Tool Selection Group - Clear, Scannable */}
            <div className="flex flex-col gap-3">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/50">
                🎨 Tools
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTool("draw")}
                  className={cn(
                    "group relative rounded-xl border px-3 py-3 transition-all duration-200 active:scale-95 hover:scale-105 overflow-hidden",
                    tool === "draw"
                      ? "border-white/70 bg-white/14 shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                      : "border-white/12 bg-white/6 hover:bg-white/10 hover:border-white/20",
                  )}
                >
                  <span className="text-[11px] font-black uppercase tracking-[0.18em]">
                    ✏️ Brush
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setTool("erase")}
                  className={cn(
                    "group relative rounded-xl border px-3 py-3 transition-all duration-200 active:scale-95 hover:scale-105 overflow-hidden",
                    tool === "erase"
                      ? "border-white/70 bg-white/14 shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                      : "border-white/12 bg-white/6 hover:bg-white/10 hover:border-white/20",
                  )}
                >
                  <span className="text-[11px] font-black uppercase tracking-[0.18em]">
                    🗑️ Erase
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setTool("fill")}
                  className={cn(
                    "group relative rounded-xl border px-3 py-3 transition-all duration-200 active:scale-95 hover:scale-105 overflow-hidden",
                    tool === "fill"
                      ? "border-white/70 bg-white/14 shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                      : "border-white/12 bg-white/6 hover:bg-white/10 hover:border-white/20",
                  )}
                >
                  <span className="text-[11px] font-black uppercase tracking-[0.18em]">
                    🪣 Fill
                  </span>
                </button>
              </div>
            </div>

            {/* Color Palette Section - Visual, Expressive */}
            <div className="flex flex-col gap-3">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/50">
                🌈 Color
              </p>
              <div className="flex flex-wrap gap-2">
                {colors.map((color, idx) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setActiveColor(color)}
                    className={cn(
                      "size-9 rounded-full border-2 transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm",
                      activeColor === color
                        ? "border-white shadow-[0_0_16px_rgba(255,255,255,0.5)] animate-pulse scale-110"
                        : "border-white/30 hover:border-white/50 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)]",
                    )}
                    style={{ 
                      backgroundColor: color,
                      transition: "all 200ms cubic-bezier(0.34, 1.56, 0.64, 1)"
                    }}
                    title={`Color ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Stroke Width Section - Interactive Feedback */}
            <div className="flex flex-col gap-3">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/50">
                📏 Brush Size
              </p>
              <div className="space-y-2">
                <input
                  type="range"
                  min="2"
                  max="14"
                  value={strokeWidth}
                  onChange={(event) =>
                    setStrokeWidth(Number(event.target.value))
                  }
                  className="w-full accent-white transition-all duration-150 cursor-pointer"
                />
                <div className="flex items-center justify-between px-1">
                  <p className="text-xs font-semibold text-white/70">{strokeWidth}px</p>
                  <div className="flex items-center gap-3">
                    <div
                      className="rounded-full bg-gradient-to-br from-white to-white/60 transition-all duration-200 shadow-sm"
                      style={{
                        width: `${Math.max(strokeWidth * 1.8, 10)}px`,
                        height: `${Math.max(strokeWidth * 1.8, 10)}px`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Button - Prominent, Intentional */}
            <Fbutton
              type="button"
              className="w-full transition-all duration-200 active:scale-95 hover:shadow-lg font-bold uppercase tracking-wider"
              variant="outline"
              onClick={handleClearCanvas}
            >
              {isCanvasCleared ? "✓ Cleared" : "🧹 Clear Canvas"}
            </Fbutton>
          </div>
        </div>
      ) : (
        <div className="mx-auto flex h-full w-full max-w-md flex-1 flex-col justify-center">
          {guessedCorrectly ? (
            <div className="rounded-[1.5rem] border border-white/20 bg-gradient-to-br from-green-500/20 to-green-500/5 p-6 text-center animate-in fade-in zoom-in duration-300 shadow-[0_0_32px_rgba(34,197,94,0.2)]">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-green-400 mb-2">
                ✓ Correct
              </p>
              <div className="mt-4 rounded-[1.35rem] border border-green-400/30 bg-green-500/10 px-4 py-4 text-center backdrop-blur-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-green-300 mb-1">
                  Word
                </p>
                <p className="mt-2 text-3xl font-black tracking-[0.18em] text-white">
                  {round.word?.toUpperCase()}
                </p>
              </div>
              <p className="mt-5 text-sm font-bold text-white/75">
                Well done! Waiting for others... 🎯
              </p>
            </div>
          ) : (
            <div className="animate-in fade-in duration-300">
              <GuessPanel
                round={round}
                guessedCorrectly={guessedCorrectly}
                guess={guess}
                setGuess={setGuess}
                submitGuess={submitGuess}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const DrawItPlayerTurnEnd = () => {
  const { round, scores } = useDrawItPlayer();
  const { player } = useLobbyPlayer();
  if (!round) return null;

  return (
    <div className="mx-auto flex h-full w-full max-w-4xl flex-col items-center justify-center gap-5 px-4 text-center">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/55">
        Turn Over
      </p>
      <h2 className="text-5xl font-black tracking-tight">
        {round.word?.toUpperCase()}
      </h2>
      <p className="text-lg font-semibold text-white/75">
        {round.drawerName} was drawing. {round.guessedCorrectlyIds.length}{" "}
        players got it.
      </p>
      <div className="animate-bounce animation-duration-[5s] mt-4">
        <PlayerAvatar
          displayName={player?.displayName!}
          avatar={player?.avatar!}
        />
        <p className="mt-3 text-center text-2xl font-semibold">
          {scores?.find((p) => p.id === player?.id)?.score ?? 0} pts
        </p>
      </div>
      <ScoreGapHint scores={scores} />
    </div>
  );
};
