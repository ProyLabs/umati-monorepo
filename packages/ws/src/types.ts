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
}


export interface Ranking {
  id: string;
  displayName: string;
  gold: number;
  silver: number;
  bronze: number;
}

export interface RoomState {
  uiState: "INIT" | "LOBBY" | "WAITING" | "PLAYING" | "ENDED";
  gameState?: "BEFORE" | "ROUND" | "ROUND_END" | "LEADERBOARD" | "GAME_END"
}

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

  rankings: Ranking[],


  game: Game|null;


}


export interface Game {
    roomId: string;
    noOfRounds: number;
    data: DataItem[];
    currentRound: number;
    scores: {id: string, displayName: string, score: number}[];
    randomize: Randomize;
}
export interface DataItem {
    question: string;
    choices: string[];
    answer: string;
}
interface Randomize {
}

