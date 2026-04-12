"use client";

import { Fbutton } from "@/components/ui/fancy-button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { PlayerAvatar } from "@/components/lobby/widgets";
import { cn } from "@/lib/utils";
import { useDrawItHost } from "@/providers/games/drawit/drawit-host-provider";
import { useDrawItPlayer } from "@/providers/games/drawit/drawit-player-provider";
import { useLobbyPlayer } from "@/providers/lobby-player-provider";
import { DrawItRound, DrawItSegment } from "@umati/ws";
import {
  Eraser,
  PaintBucket,
  Palette,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type PointerEvent,
  type ReactNode,
} from "react";
import { EndGameButton, ScoreGapHint } from "../shared";

const CANVAS_BG = "#fffdf7";
const DEFAULT_COLOR = "#141821";
const DRAW_COLORS = [
  "#141821",
  "#ffffff",
  "#63666f",
  "#d93025",
  "#f97316",
  "#facc15",
  "#66a80f",
  "#16a34a",
  "#0f766e",
  "#0ea5e9",
  "#2563eb",
  "#4f46e5",
  "#a21caf",
  "#db2777",
  "#b45309",
  "#7c4a2d",
];

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const wordLengthLabel = (length: number) =>
  `${length} ${length === 1 ? "letter" : "letters"}`;

const toWordLengthLabel = (round: DrawItRound) => {
  if (!round.wordLengths.length) return wordLengthLabel(round.wordLength);
  if (round.wordLengths.length === 1)
    return wordLengthLabel(round.wordLengths[0]);
  return round.wordLengths.join(" ");
};

const drawStroke = (
  ctx: CanvasRenderingContext2D,
  segment: DrawItSegment,
  width: number,
  height: number,
) => {
  ctx.strokeStyle = segment.mode === "erase" ? CANVAS_BG : segment.color;
  ctx.lineWidth = segment.width;
  ctx.beginPath();
  ctx.moveTo(segment.x1 * width, segment.y1 * height);
  ctx.lineTo(segment.x2 * width, segment.y2 * height);
  ctx.stroke();
};

const floodFill = (
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  fillColor: string,
  width: number,
  height: number,
) => {
  const image = ctx.getImageData(0, 0, width, height);
  const { data } = image;
  const stack = [[startX, startY]];
  const visited = new Uint8Array(width * height);

  const fillProbe = document.createElement("canvas");
  fillProbe.width = 1;
  fillProbe.height = 1;
  const fillProbeCtx = fillProbe.getContext("2d");
  if (!fillProbeCtx) return;

  fillProbeCtx.fillStyle = fillColor;
  fillProbeCtx.fillRect(0, 0, 1, 1);
  const fillPixel = fillProbeCtx.getImageData(0, 0, 1, 1).data;
  const colorTolerance = 18;

  const toIndex = (x: number, y: number) => (y * width + x) * 4;
  const colorMatches = (index: number, rgba: Uint8ClampedArray) =>
    Math.abs(data[index] - rgba[0]) <= colorTolerance &&
    Math.abs(data[index + 1] - rgba[1]) <= colorTolerance &&
    Math.abs(data[index + 2] - rgba[2]) <= colorTolerance &&
    Math.abs(data[index + 3] - rgba[3]) <= colorTolerance;

  const seedIndex = toIndex(startX, startY);
  const seed = data.slice(seedIndex, seedIndex + 4);
  if (
    seed[0] === fillPixel[0] &&
    seed[1] === fillPixel[1] &&
    seed[2] === fillPixel[2] &&
    seed[3] === fillPixel[3]
  ) {
    return;
  }

  while (stack.length) {
    const next = stack.pop();
    if (!next) continue;

    const [x, y] = next;
    if (x < 0 || x >= width || y < 0 || y >= height) continue;

    const visitIndex = y * width + x;
    if (visited[visitIndex]) continue;
    visited[visitIndex] = 1;

    const pixelIndex = toIndex(x, y);
    if (!colorMatches(pixelIndex, seed)) continue;

    data[pixelIndex] = fillPixel[0];
    data[pixelIndex + 1] = fillPixel[1];
    data[pixelIndex + 2] = fillPixel[2];
    data[pixelIndex + 3] = fillPixel[3];

    stack.push([x + 1, y]);
    stack.push([x - 1, y]);
    stack.push([x, y + 1]);
    stack.push([x, y - 1]);
  }

  ctx.putImageData(image, 0, 0);
};

const getCanvasMetrics = (canvas: HTMLCanvasElement) => {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  return {
    dpr,
    width: Math.max(rect.width, 0),
    height: Math.max(rect.height, 0),
  };
};

const prepareCanvas = (
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  dpr: number,
) => {
  canvas.width = width * dpr;
  canvas.height = height * dpr;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = CANVAS_BG;
  ctx.fillRect(0, 0, width, height);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
};

const drawSegmentToCanvas = (
  ctx: CanvasRenderingContext2D,
  segment: DrawItSegment,
  width: number,
  height: number,
) => {
  if (segment.mode === "fill") {
    floodFill(
      ctx,
      clamp(Math.round(segment.x1 * (width - 1)), 0, Math.max(width - 1, 0)),
      clamp(Math.round(segment.y1 * (height - 1)), 0, Math.max(height - 1, 0)),
      segment.color,
      Math.max(Math.round(width), 1),
      Math.max(Math.round(height), 1),
    );
    return;
  }

  drawStroke(ctx, segment, width, height);
};

const drawSegments = (canvas: HTMLCanvasElement, segments: DrawItSegment[]) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const { dpr, width, height } = getCanvasMetrics(canvas);
  prepareCanvas(canvas, ctx, width, height, dpr);

  segments.forEach((segment) => {
    drawSegmentToCanvas(ctx, segment, width, height);
  });
};

const drawLatestSegments = (
  canvas: HTMLCanvasElement,
  segments: DrawItSegment[],
  startIndex: number,
) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const { width, height } = getCanvasMetrics(canvas);
  if (width === 0 || height === 0) return;

  segments.slice(startIndex).forEach((segment) => {
    drawSegmentToCanvas(ctx, segment, width, height);
  });
};

const ToolButton = ({
  active,
  label,
  icon: Icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: ComponentType<{ className?: string }>;
  onClick: () => void;
}) => (
  <button
    type="button"
    aria-label={label}
    aria-pressed={active}
    onClick={onClick}
    className={cn(
      "flex h-13 min-w-13 items-center justify-center rounded-[1.1rem] border transition-all duration-150",
      active
        ? "border-white/70 bg-[#9c69f5] text-white shadow-[0_12px_24px_rgba(70,26,150,0.28)]"
        : "border-[#d9e1ff] bg-white text-[#3656aa]",
    )}
  >
    <Icon className="size-5" />
  </button>
);

function BrushSizePopover({
  strokeWidth,
  onChange,
}: {
  strokeWidth: number;
  onChange: (value: number) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Brush size"
          className="flex h-13 min-w-13 items-center justify-center rounded-[1.1rem] border border-[#d9e1ff] bg-white text-[#3656aa] transition-transform duration-150 active:scale-95"
        >
          <div
            className="rounded-full bg-[#141821]"
            style={{
              width: Math.max(strokeWidth * 1.8, 8),
              height: Math.max(strokeWidth * 1.8, 8),
            }}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[17rem] rounded-[1.5rem] bg-[#254ca7] p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
              Brush Size
            </p>
            <p className="text-sm font-bold text-white">{strokeWidth}px</p>
          </div>
          <div className="flex h-16 items-center justify-center rounded-[1.15rem] bg-white">
            <div
              className="rounded-full bg-[#141821]"
              style={{
                width: Math.max(strokeWidth * 2.8, 10),
                height: Math.max(strokeWidth * 2.8, 10),
              }}
            />
          </div>
          <Slider
            min={2}
            max={24}
            step={1}
            value={[strokeWidth]}
            onValueChange={(value) => onChange(value[0] ?? strokeWidth)}
          />
          <div className="flex items-center justify-between text-xs font-semibold text-white/72">
            <span>Thin</span>
            <span>Thick</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ClueChip({
  round,
  revealWord = false,
}: {
  round: DrawItRound;
  revealWord?: boolean;
}) {
  const clue = revealWord
    ? round.word?.toUpperCase()
    : round.wordMask?.toUpperCase();

  return (
    <div className="relative mx-auto w-fit rounded-[1.1rem] border border-[#d7def8] bg-[#fffdf8] px-4 py-2 text-[#11131a] shadow-[0_10px_30px_rgba(13,22,51,0.16)]">
      <div className="flex items-start gap-3">
        <span className="text-[clamp(1.15rem,2vw,1.9rem)] font-black tracking-[0.18em]">
          {clue}
        </span>
        {round.wordLengths.length ? (
          <span className="pt-0.5 text-xs font-black tracking-[0.22em] text-[#23397a]">
            {round.wordLengths.join(" ")}
          </span>
        ) : null}
      </div>
    </div>
  );
}

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
      className="rounded-[1.5rem] border border-white/14 bg-black/12 p-4 animate-in fade-in duration-300"
      onSubmit={(event) => {
        event.preventDefault();
        if (!guess.trim()) return;
        submitGuess(guess);
        setGuess("");
      }}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/55">
        Guess the word
      </p>
      <div className="mt-3 rounded-[1.35rem] border border-white/12 bg-white/8 px-4 py-4 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
          Clue
        </p>
        <div className="mt-2">
          <ClueChip round={round} revealWord={guessedCorrectly} />
        </div>
        <p className="mt-2 text-sm font-semibold text-white/68">
          {toWordLengthLabel(round)}
        </p>
      </div>
      {guessedCorrectly ? (
        <p className="mt-4 text-base font-semibold text-white/78">
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
            className="mt-3 h-12 w-full rounded-xl border border-white/12 bg-white/12 px-4 text-base font-semibold uppercase text-white placeholder:text-white/40 outline-none transition-colors duration-200 focus:border-white/40 focus:bg-white/14"
          />
          <Fbutton
            type="submit"
            className="mt-3 w-full transition-all duration-150 active:scale-95"
          >
            Submit Guess
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
  activeColor = DEFAULT_COLOR,
  strokeWidth = 4,
  tool = "draw",
}: {
  segments: DrawItSegment[];
  interactive?: boolean;
  onSegment?: (segment: DrawItSegment) => void;
  activeColor?: string;
  strokeWidth?: number;
  tool?: "draw" | "erase" | "fill";
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const movedRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const segmentCountRef = useRef(0);
  const lastSegmentsRef = useRef<DrawItSegment[] | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const previousSegments = lastSegmentsRef.current;
    const previousCount = segmentCountRef.current;
    const appendedSegments =
      previousSegments &&
      previousSegments !== segments &&
      segments.length > previousCount &&
      segments
        .slice(0, previousCount)
        .every((segment, index) => segment === previousSegments[index]);

    if (!initializedRef.current) {
      drawSegments(canvas, segments);
      initializedRef.current = true;
    } else if (segments.length === 0 || !appendedSegments) {
      drawSegments(canvas, segments);
    } else {
      drawLatestSegments(canvas, segments, previousCount);
    }

    segmentCountRef.current = segments.length;
    lastSegmentsRef.current = segments;
  }, [segments]);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      drawSegments(canvas, segments);
      segmentCountRef.current = segments.length;
      lastSegmentsRef.current = segments;
      initializedRef.current = true;
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [segments]);

  const toPoint = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: clamp((event.clientX - rect.left) / rect.width, 0, 1),
      y: clamp((event.clientY - rect.top) / rect.height, 0, 1),
    };
  };

  const submitDot = (point: { x: number; y: number }) => {
    onSegment?.({
      x1: point.x,
      y1: point.y,
      x2: point.x,
      y2: point.y,
      color: activeColor,
      width: strokeWidth,
      mode: tool,
    });
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
        const point = toPoint(event);

        if (tool === "fill") {
          onSegment?.({
            x1: point.x,
            y1: point.y,
            x2: point.x,
            y2: point.y,
            color: activeColor,
            width: strokeWidth,
            mode: "fill",
          });
          return;
        }

        event.currentTarget.setPointerCapture(event.pointerId);
        drawingRef.current = true;
        movedRef.current = false;
        lastPointRef.current = point;
      }}
      onPointerMove={(event) => {
        if (!interactive || !drawingRef.current || !lastPointRef.current)
          return;

        const point = toPoint(event);
        movedRef.current = true;
        onSegment?.({
          x1: lastPointRef.current.x,
          y1: lastPointRef.current.y,
          x2: point.x,
          y2: point.y,
          color: activeColor,
          width: strokeWidth,
          mode: tool,
        });
        lastPointRef.current = point;
      }}
      onPointerUp={(event) => {
        if (!interactive || !drawingRef.current || !lastPointRef.current)
          return;
        if (!movedRef.current) {
          submitDot(lastPointRef.current);
        }
        drawingRef.current = false;
        movedRef.current = false;
        lastPointRef.current = null;
        event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerLeave={() => {
        drawingRef.current = false;
        movedRef.current = false;
        lastPointRef.current = null;
      }}
    />
  );
}

function DrawToolbar({
  tool,
  setTool,
  activeColor,
  setActiveColor,
  strokeWidth,
  setStrokeWidth,
  clearCanvas,
}: {
  tool: "draw" | "erase" | "fill";
  setTool: (tool: "draw" | "erase" | "fill") => void;
  activeColor: string;
  setActiveColor: (color: string) => void;
  strokeWidth: number;
  setStrokeWidth: (width: number) => void;
  clearCanvas: () => void;
}) {
  return (
    <div className="rounded-[1.6rem] border border-[#88a6ff]/35 bg-[#3157b7]/92 p-3 shadow-[0_18px_48px_rgba(11,26,70,0.32)]">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-2 rounded-[1.25rem] bg-[#294da8] p-2">
          {DRAW_COLORS.map((color) => {
            const isWhite = color === "#ffffff";
            const isActive = activeColor === color;

            return (
              <button
                key={color}
                type="button"
                aria-label={`Select ${color} color`}
                aria-pressed={isActive}
                onClick={() => setActiveColor(color)}
                className={cn(
                  "size-8 rounded-[0.7rem] border transition-transform duration-150 active:scale-95",
                  isWhite ? "border-[#cad5ff]" : "border-transparent",
                  isActive &&
                    "scale-105 ring-2 ring-white ring-offset-2 ring-offset-[#294da8]",
                )}
                style={{ backgroundColor: color }}
              />
            );
          })}
        </div>

        <BrushSizePopover strokeWidth={strokeWidth} onChange={setStrokeWidth} />

        <div className="ml-auto flex items-center gap-2">
          <ToolButton
            active={tool === "draw"}
            label="Brush"
            icon={Pencil}
            onClick={() => setTool("draw")}
          />
          <ToolButton
            active={tool === "fill"}
            label="Fill"
            icon={PaintBucket}
            onClick={() => setTool("fill")}
          />
          <ToolButton
            active={tool === "erase"}
            label="Erase"
            icon={Eraser}
            onClick={() => setTool("erase")}
          />
          <button
            type="button"
            aria-label="Clear canvas"
            onClick={clearCanvas}
            className="flex h-13 min-w-13 items-center justify-center rounded-[1.1rem] border border-[#d9e1ff] bg-white text-[#3656aa] transition-transform duration-150 active:scale-95"
          >
            <Trash2 className="size-5" />
          </button>
        </div>
      </div>
    </div>
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
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex-1">
        <p className="flex items-center gap-4 text-xl font-medium text-white/75">
          <span>
            Turn {round.turnNumber} of {round.totalTurns}
          </span>
        </p>
        <p className="mt-0.5 text-lg font-bold text-white">
          {round.drawerName} is drawing
        </p>
      </div>
      <div className="flex-1">
        <ClueChip round={round} revealWord={state === "ROUND_END"} />
      </div>
      <div className="flex flex-1 items-center justify-start gap-2 lg:justify-end">
        {state === "ROUND" ? (
          <RadialTimer duration={round.duration} startTime={round.startedAt} />
        ) : null}
        {state === "ROUND_END" ? (
          <Fbutton type="button" onClick={nextRound}>
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
  footer?: ReactNode;
}) {
  return (
    <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-4 px-4 py-5 md:px-8">
      <HostRoundHeader round={round} state={state} nextRound={nextRound} />
      <div className="grid flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="rounded-[2rem] border border-white/14 bg-white/8 p-3 shadow-[0_24px_80px_rgba(0,0,0,0.2)]">
          <div className="relative h-full min-h-[24rem] overflow-hidden rounded-[1.75rem]">
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
      <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col items-center justify-center gap-5 px-4 py-6 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/55">
          Your Turn
        </p>
        <h2 className="text-4xl font-black tracking-tight">
          Pick a word to draw
        </h2>
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
          {setup.wordChoices?.map((word) => (
            <Fbutton
              key={word}
              type="button"
              className="w-full"
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
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-center justify-center gap-4 px-4 py-6 text-center">
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
  const [activeColor, setActiveColor] = useState(DEFAULT_COLOR);
  const [strokeWidth, setStrokeWidth] = useState(6);

  useEffect(() => {
    setGuess("");
  }, [round?.turnNumber]);

  if (!round) return null;

  const isDrawer = !!round.isDrawer;
  const guessedCorrectly =
    !!player && round.guessedCorrectlyIds.includes(player.id);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-4 px-4 py-5 md:px-8">
      {isDrawer ? (
        <div className="grid flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_min(100%,360px)]">
          <div className="flex min-h-0 flex-col gap-3">
            <div className="rounded-[1.5rem] border border-white/14 bg-black/12 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/55">
                Your word
              </p>
              <div className="mt-3">
                <ClueChip round={round} revealWord />
              </div>
              <p className="mt-2 text-sm font-semibold text-white/68">
                Draw clearly. More correct guessers means more points for you.
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/14 bg-white/8 p-3 shadow-[0_24px_80px_rgba(0,0,0,0.2)]">
              <div className="relative h-[min(52vh,28rem)] min-h-[22rem] overflow-hidden rounded-[1.75rem]">
                <DrawCanvas
                  segments={round.segments}
                  interactive
                  onSegment={submitSegment}
                  activeColor={tool === "erase" ? CANVAS_BG : activeColor}
                  strokeWidth={strokeWidth}
                  tool={tool}
                />
                <div className="pointer-events-none absolute right-4 top-4 rounded-full border border-[#d7def8] bg-white/96 px-3 py-2 text-[#11131a] shadow-[0_12px_28px_rgba(13,22,51,0.15)]">
                  <div className="flex items-center gap-2">
                    <div
                      className="rounded-full border border-black/10"
                      style={{
                        width: Math.max(strokeWidth * 1.7, 8),
                        height: Math.max(strokeWidth * 1.7, 8),
                        backgroundColor:
                          tool === "erase" ? CANVAS_BG : activeColor,
                      }}
                    />
                    <span className="text-xs font-black tracking-[0.14em] text-[#26345c]">
                      {strokeWidth}px
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <DrawToolbar
              tool={tool}
              setTool={setTool}
              activeColor={activeColor}
              setActiveColor={setActiveColor}
              strokeWidth={strokeWidth}
              setStrokeWidth={setStrokeWidth}
              clearCanvas={clearCanvas}
            />
          </div>
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center pb-6">
          {guessedCorrectly ? (
            <div className="rounded-[1.5rem] border border-white/14 bg-black/12 p-4 text-center animate-in fade-in zoom-in duration-300">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/55">
                Correct
              </p>
              <div className="mt-3 rounded-[1.35rem] border border-white/12 bg-white/8 px-4 py-4 text-center">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
                  Word
                </p>
                <div className="mt-2">
                  <ClueChip round={round} revealWord />
                </div>
              </div>
              <p className="mt-4 text-base font-semibold text-white/75">
                Sit tight while the others keep guessing.
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
    <div className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col items-center justify-center gap-5 px-4 py-6 text-center">
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
      <div className="mt-4 animate-bounce animation-duration-[5s]">
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
