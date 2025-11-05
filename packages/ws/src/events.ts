/**
 * 🎮 @umati/ws — Shared WebSocket Events & Payload Contracts
 *
 * This file defines all valid WebSocket events exchanged between
 * the Umati WebSocket server and clients (host + players).
 *
 * It provides:
 *  - 🔹 WSEvent: all valid event names
 *  - 🔹 WSPayloads: type-safe payloads for each event
 *  - 🔹 WSMessage: full message shape { event, payload }
 */

import { Game, GameState, Lobby, LobbyFull, Player, Ranking, RoomState, Scores, TriviaOptions, TriviaRound } from "./types";

export enum WSEvent {
  // --- Core lifecycle ---
  OPEN = "OPEN",
  CLOSE = "CLOSE",
  ERROR = "ERROR",
  PING = "PING",
  PONG = "PONG",

  // --- Lobby / Room ---
  ROOM_INIT = "ROOM:HOST:INIT",
  ROOM_CREATED = "ROOM:created",
  ROOM_STATE = "ROOM:STATE",
  ROOM_STATE_CHANGE = "ROOM:STATE:CHANGE",
  ROOM_UPDATED = "ROOM:updated",
  ROOM_CLOSED = "ROOM:closed",
  ROOM_CLOSED_ME = "ROOM:closed-me",
  ROOM_REACTION = "ROOM:reaction",

  // --- Player lifecycle ---
  PLAYER_CONNECT = "PLAYER:CONNECT",
  PLAYER_JOIN = "PLAYER:JOIN",
  PLAYER_LEAVE = "PLAYER:LEAVE",

  PLAYER_CONNECTED = "PLAYER:connected",
  PLAYER_UPDATED = "PLAYER:updated",
  PLAYER_KICKED = "PLAYER:kicked",
  PLAYER_KICKED_ME = "PLAYER:kicked-me",
  PLAYER_REACTION = "PLAYER:reaction",

  // --- Game lifecycle ---
  GAME_INIT = "GAME:INIT",
  GAME_STATE = "GAME:STATE",
  GAME_START = "GAME:START",
  GAME_CANCEL = "GAME:CANCEL",
  GAME_ROUND_START = "GAME:ROUND:START",

  GAME_STARTED = "GAME:started",
  GAME_ROUND_ENDED = "GAME:round-ended",
  GAME_QUESTION = "GAME:question",
  GAME_ANSWER = "GAME:ANSWER",
  GAME_ANSWER_RECEIVED = "GAME:answer-received",
  GAME_END="GAME:END",


  //Trivia
  TRIVIA_ROUND_START="GAME:TRIVIA:ROUND:START",
  TRIVIA_ROUND_ANSWER="GAME:TRIVIA:ROUND:ANSWER",
  TRIVIA_ROUND_ANSWERED="GAME:TRIVIA:ROUND:ANSWERED",
  TRIVIA_ROUND_END="GAME:TRIVIA:ROUND:END",

  // --- System ---
  SYSTEM_ANNOUNCEMENT = "SYSTEM:announcement",
}

/**
 * 🔹 Type-safe payloads for each WebSocket event.
 */
export interface WSPayloads {
  // --- Core ---
  [WSEvent.OPEN]: { sid: string };
  [WSEvent.CLOSE]: {};
  [WSEvent.ERROR]: { message: string };
  [WSEvent.PING]: {};
  [WSEvent.PONG]: {};

  // --- Player lifecycle ---
  [WSEvent.PLAYER_CONNECT]: { roomId: string; playerId: string };
  [WSEvent.PLAYER_JOIN]: {
    roomId: string;
    playerId: string;
    displayName: string;
    avatar: string;
  };
  [WSEvent.PLAYER_LEAVE]: { roomId: string; playerId: string };
  [WSEvent.PLAYER_UPDATED]: {
    playerId: string;
    data: Record<string, any>;
  };
  [WSEvent.PLAYER_KICKED]: {
    playerId: string;
    reason?: string;
  };
  [WSEvent.PLAYER_KICKED_ME]: { reason?: string };
  [WSEvent.PLAYER_REACTION]: {
    roomId: string;
    playerId: string;
    emoji: string;
    displayName: string;
  };

  // --- Lobby / Room ---
  [WSEvent.ROOM_INIT]: {
    roomId: string;
  };

  [WSEvent.ROOM_CREATED]: { roomId: string };
  [WSEvent.ROOM_STATE]: LobbyFull | null;
  [WSEvent.ROOM_STATE_CHANGE]: { roomId: string; state: RoomState };
  [WSEvent.ROOM_UPDATED]: {
    roomId: string;
    data: Record<string, any>;
  };
  [WSEvent.ROOM_CLOSED]: { roomId: string; reason?: string };
  [WSEvent.ROOM_CLOSED_ME]: { roomId: string; reason?: string };
  [WSEvent.ROOM_REACTION]: {
    playerId: string;
    emoji: string;
  };

  // --- Game lifecycle ---
  [WSEvent.GAME_INIT]: {
    roomId: string;
     options: {
    type: "trivia" | "emojiRace" | "bibleQuest";
    config: Record<string, any>; // e.g. { noOfRounds: 10, duration: 30 }
  };
  };
  [WSEvent.GAME_START]: {roomId: string};
  [WSEvent.GAME_CANCEL]: {roomId: string};


  [WSEvent.GAME_STATE]: Record<string, any> &{
    id: string;
    type: string;
    state: GameState
  };



  //Trivia actions
  [WSEvent.TRIVIA_ROUND_START]: {state: GameState, round: TriviaRound}
  [WSEvent.TRIVIA_ROUND_ANSWER]: {roomId: string;playerId: string;answer: TriviaOptions};
  [WSEvent.TRIVIA_ROUND_ANSWERED]: { answer: TriviaOptions| null};
  [WSEvent.TRIVIA_ROUND_END]: {state: GameState, round: TriviaRound, scores: Scores, counts: Record<TriviaOptions, number>}

  

  [WSEvent.GAME_STARTED]: {
    roomId: string;
    options: any;
  };


  [WSEvent.GAME_ANSWER]: {
    roomId: string;
    playerId: string;
    answer: TriviaOptions;
  };
  [WSEvent.GAME_ROUND_ENDED]: {
    roomId: string;
    round: number;
    results: any;
  };
  [WSEvent.GAME_QUESTION]: {
    roomId: string;
    round: number;
    question: string;
    options: string[];
  };
  [WSEvent.GAME_ANSWER_RECEIVED]: {
    playerId: string;
    correct: boolean;
    score: number;
  };
  [WSEvent.GAME_END]: {}





  // --- System ---
  [WSEvent.SYSTEM_ANNOUNCEMENT]: {
    message: string;
    level?: "info" | "warning" | "error";
  };
}

/**
 * 🔹 Unified WebSocket message structure.
 * Every message must have an `event` and a matching `payload`.
 */
export interface WSMessage<T extends keyof WSPayloads = keyof WSPayloads> {
  event: T;
  payload: WSPayloads[T];
}
