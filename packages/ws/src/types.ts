import type { WebSocket } from "ws";

export interface Player {
  id: string;
  displayName: string;
  avatar?: string;
  connected: boolean;
}

export interface Lobby {
  id: string;
  name: string;
  code: string;
  maxPlayers: number;
  private: boolean;
  pin?: string | null;
  createdAt: Date;
  game: GameLobbyMeta | null;
}

export interface Ranking {
  id: string;
  displayName: string;
  gold: number;
  silver: number;
  bronze: number;
}

// Room-level state machine (lobby UI context)
export type RoomState = "INIT" | "LOBBY" | "WAITING" | "PLAYING" | "ENDED";

// Game-level state machine (handled internally by game logic)
export type GameState =
  | "BEFORE"
  | "ROUND"
  | "ROUND_END"
  | "LEADERBOARD"
  | "GAME_END";

export interface HostConnection {
  sockets: Map<string, WebSocket>; // allows multiple connections under same host
}

export interface PlayerConnection extends Player {
  socket: WebSocket;
}

/**
 * Represents a live, in-memory room.
 */
export interface Room {
  /** Static room info from DB */
  meta: Lobby;

  /** Dynamic state info (UI, gameplay, etc.) */
  state: RoomState;

  /** Active players */
  players: Player[];

  /** Host collective */
  host: HostConnection;

  /** Player sockets (id → ws) */
  playerSockets: Map<string, WebSocket>;

  rankings: Ranking[];

  game: GameLobbyMeta | null;
}
export interface GameLobbyMeta {
  id: string;
  type: "trivia" | "emojiRace" | "bibleQuest";
}

export interface Game {
  roomId: string;
  noOfRounds: number;
  data: DataItem[];
  currentRound: number;
  scores: { id: string; displayName: string; score: number }[];
  randomize: Randomize;
}

export interface DataItem {
  question: string;
  choices: string[];
  answer: string;
}
interface Randomize {}


export interface TriviaRound {
  number: number;
  totalRounds: number;
  question: string;
  choices: string[];
  duration: number; // seconds
  startedAt: number; // timestamp (ms)
}