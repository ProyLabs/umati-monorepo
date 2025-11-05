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

export interface LobbyFull extends Lobby {
  state: RoomState;
  players: Player[];
  rankings: Ranking[];
}

export interface Ranking {
  id: string;
  displayName: string;
  gold: number;
  silver: number;
  bronze: number;
}

// Room-level state machine (lobby UI context)
export const RoomState = {
  INIT: "INIT",
  LOBBY: "LOBBY",
  WAITING: "WAITING",
  PLAYING: "PLAYING",
  ENDED: "ENDED",
} as const;

export type RoomState = (typeof RoomState)[keyof typeof RoomState];

// Game-level state machine (handled internally by game logic)
export const GameState = {
  BEFORE: "BEFORE",
  ROUND: "ROUND",
  ROUND_END: "ROUND_END",
  LEADERBOARD: "LEADERBOARD",
  RANKING: "RANKING",
  GAME_END: "GAME_END",
} as const;

export type GameState = (typeof GameState)[keyof typeof GameState];

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

export type Score = { id: string; displayName: string; score: number };
export type Scores = Score[];

export interface Game {
  roomId: string;
  noOfRounds: number;
  data: DataItem[];
  currentRound: number;
  scores: Scores;
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
  correctAnswer: string | null;
  answer: string | null;
}

export type PlayerAnswer = {
  answer: TriviaOptions;
  timeTaken: number;
};

export const TriviaOptions = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,
} as const;

export type TriviaOptions = (typeof TriviaOptions)[keyof typeof TriviaOptions];
