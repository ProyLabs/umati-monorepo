import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Randomize } from "js-randomize";
import { NormalizedPlayer } from "./types";
import { Scores } from "@umati/ws";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
const randomize = new Randomize();

/**
 * Returns a randomized avatar URL with a number between 1 and 10.
 * 
 * Example:
 * https://cdn.jsdelivr.net/gh/alohe/avatars/png/toon_7.png
 */
export function getRandomAvatarUrl(): string {
  const randomNum = randomize.integer(1, 22);
  const baseUrl = "https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_";
  return `${baseUrl}${randomNum}.png`;
}


export function normalizePlayer(p: any): NormalizedPlayer {
  const isUser = !!p.userId;
  return {
    ...p,
    playerId: p.userId ?? p.guestId,
    type: isUser ? "user" : "guest",
  };
}

export function normalizePlayers(players: any[] = []): NormalizedPlayer[] {
  return players.map(normalizePlayer);
}

export function rankScores(entries: Scores) {
  // 1. Group by score
  const scoreMap = new Map<number, string[]>();

  for (const e of entries) {
    if (!scoreMap.has(e.score)) scoreMap.set(e.score, []);
    scoreMap.get(e.score)!.push(e.displayName);
  }

  // 2. Sort scores (descending)
  const sortedScores = [...scoreMap.keys()].sort((a, b) => b - a);

  // 3. Build ranked output with alphabetical tie ordering
  return sortedScores.map((score, index) => ({
    position: index + 1,
    names: scoreMap.get(score)!.sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    )
  }));
}


export function formatList(items: string[]): string {
  const len = items.length;
  
  if (len === 0) return "";
  if (len === 1) return items[0];
  if (len === 2) return `${items[0]} & ${items[1]}`;

  // 3 or more
  return `${items.slice(0, -1).join(", ")} & ${items[len - 1]}`;
}
