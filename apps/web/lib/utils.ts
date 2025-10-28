import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Randomize } from "js-randomize";
import { NormalizedPlayer } from "./types";

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