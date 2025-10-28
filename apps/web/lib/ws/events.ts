// lib/ws/events.ts

export enum WSEvent {
  // Core lifecycle
  OPEN = "open",
  CLOSE = "close",
  ERROR = "error",
  PING = "ping",
  PONG = "pong",

  // Player lifecycle
  PLAYER_JOINED = "player:joined",
  PLAYER_LEFT = "player:left",
  PLAYER_UPDATED = "player:updated",
  PLAYER_KICKED = "player:kicked",
  PLAYER_KICKED_ME = "player:kicked:me",
  PLAYER_REACTION = "player:reaction",

  // Lobby / Room
  ROOM_CREATED = "room:created",
  ROOM_STATE = "room:state",
  ROOM_UPDATED = "room:updated",
  ROOM_CLOSED = "room:closed",
  ROOM_CLOSED_ME = "room:closed-me",
  ROOM_REACTION = "room:reaction",

  // Game
  GAME_STARTED = "game:started",
  GAME_ROUND_ENDED = "game:round-ended",
  GAME_QUESTION = "game:question",
  GAME_ANSWER_RECEIVED = "game:answer-received",

  // System
  SYSTEM_ANNOUNCEMENT = "system:announcement",
}

/**
 * 🔹 Shared payload contract between server ↔ client
 * Define all expected payloads here for type-safe messaging.
 */
export interface WSPayloads {
  // --- Core ---
  [WSEvent.OPEN]: {};
  [WSEvent.CLOSE]: {};
  [WSEvent.ERROR]: { message: string };
  [WSEvent.PING]: {};
  [WSEvent.PONG]: {};

  // --- Player lifecycle ---
  [WSEvent.PLAYER_JOINED]: { playerId: string; displayName?: string; avatar?: string };
  [WSEvent.PLAYER_LEFT]: { playerId: string };
  [WSEvent.PLAYER_UPDATED]: { playerId: string; data: Record<string, any> };
  [WSEvent.PLAYER_KICKED]: { playerId: string; reason?: string };
  [WSEvent.PLAYER_KICKED_ME]: { reason?: string };
  [WSEvent.PLAYER_REACTION]: { playerId: string; emoji: string };

  // --- Lobby / Room ---
  [WSEvent.ROOM_CREATED]: { roomId: string };
  [WSEvent.ROOM_STATE]: { roomId: string; players: any[]; hostId?: string };
  [WSEvent.ROOM_UPDATED]: { roomId: string; data: Record<string, any> };
  [WSEvent.ROOM_CLOSED]: { roomId: string; reason?: string };
  [WSEvent.ROOM_CLOSED_ME]: { reason?: string };
  [WSEvent.ROOM_REACTION]: { playerId: string; emoji: string };

  // --- Game ---
  [WSEvent.GAME_STARTED]: { roomId: string; totalRounds: number };
  [WSEvent.GAME_ROUND_ENDED]: { roomId: string; round: number; results: any };
  [WSEvent.GAME_QUESTION]: {
    roomId: string;
    round: number;
    question: string;
    options: string[];
  };
  [WSEvent.GAME_ANSWER_RECEIVED]: { playerId: string; correct: boolean; score: number };

  // --- System ---
  [WSEvent.SYSTEM_ANNOUNCEMENT]: { message: string; level?: "info" | "warning" | "error" };
}

/**
 * 🔹 Typed WebSocket message structure.
 * Ensures `event` is a valid key of `WSEvent` and payload matches.
 */
export interface WSMessage<T extends keyof WSPayloads = keyof WSPayloads> {
  event: T;
  payload: WSPayloads[T];
}
