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
  poll?: LobbyPoll | null;
}

export interface LobbyFull extends Lobby {
  state: RoomState;
  players: Player[];
  rankings: Ranking[];
}

export interface Ranking {
  id: string;
  displayName: string;
  score: number;
  gold: number;
  silver: number;
  bronze: number;
}

export interface LobbyPollOption {
  id: string;
  text: string;
  votes: number;
}

export interface LobbyPoll {
  id: string;
  question: string;
  allowMultiple: boolean;
  status: "active" | "closed";
  options: LobbyPollOption[];
  totalVoters: number;
  totalPlayers: number;
  myVotes?: string[];
}

// Room-level state machine (lobby UI context)
export const RoomState = {
  INIT: "INIT",
  LOBBY: "LOBBY",
  POLL: "POLL",
  WAITING: "WAITING",
  PLAYING: "PLAYING",
  ENDED: "ENDED",
} as const;

export type RoomState = (typeof RoomState)[keyof typeof RoomState];

// Game-level state machine (handled internally by game logic)
export const GameState = {
  BEFORE: "BEFORE",
  ROUND_SETUP: "ROUND_SETUP", // 👈 New: Chameleon (setup phase)
  SPEAKING: "SPEAKING", // 👈 New: Chameleon (each player says a clue)
  VOTING: "VOTING", // 👈 New: Chameleon (players vote)
  REVEAL: "REVEAL", // 👈 New: Chameleon (players vote)
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

  poll: LobbyPoll | null;

  pollVotes: Record<string, string[]>;
}
export interface GameLobbyMeta {
  id: string;
  type: GameType;
}

export const GameType = {
  TRIVIA: "trivia",
  QUIZZER: "quizzer",
  DRAWIT: "drawit",
  OOO: "oddoneout",
  HM: "herdmentality",
  CHAMELEON: "chameleon",
  CN: "codenames",
  JL: "jaroflies",
  FF: "friendfacts",
} as const;

export type GameType = (typeof GameType)[keyof typeof GameType];

export const QuestionProfile = {
  AUTO: "auto",
  GLOBAL: "global",
  AFRICA: "africa",
  NIGERIA: "nigeria",
} as const;

export type QuestionProfile =
  (typeof QuestionProfile)[keyof typeof QuestionProfile];

export type Score = { id: string; displayName: string; score: number };
export type Scores = Score[];

export interface Game {
  roomId: string;
  noOfRounds: number;
  data: TriviaDataItem[];
  currentRound: number;
  scores: Scores;
  randomize: Randomize;
}

export interface TriviaDataItem {
  question: string;
  choices: string[];
  answer: string;
}

export const QuizzerQuestionType = {
  SELECTION: "selection",
  TRUE_FALSE: "true_false",
} as const;

export type QuizzerQuestionType =
  (typeof QuizzerQuestionType)[keyof typeof QuizzerQuestionType];

export interface QuizzerQuestionInput {
  question: string;
  type: QuizzerQuestionType;
  options?: string[];
  correctAnswer: string | boolean;
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

export type TruviaPlayerAnswer = {
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

export interface HerdMentalityRound {
  number: number;
  totalRounds: number;
  question: string;
  choices: string[];
  duration: number; // seconds
  startedAt: number; // timestamp (ms)
}

export type HerdMentalityDataItem = {
  question: string;
  choices: string[];
};

export type HerdMentalityPlayerAnswer = {
  answer: HerdMentalityOptions;
  timeTaken: number;
};

export const HerdMentalityOptions = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
} as const;

export type HerdMentalityOptions =
  (typeof HerdMentalityOptions)[keyof typeof HerdMentalityOptions];

export interface FriendFactsFact {
  id: string;
  text: string;
}

export interface FriendFactsFactInput {
  text: string;
}

export interface FriendFactsPlayerChoice {
  id: string;
  displayName: string;
}

export interface FriendFactsRound {
  number: number;
  totalRounds: number;
  fact: string;
  choices: FriendFactsPlayerChoice[];
  duration: number;
  startedAt: number;
  ownerId: string | null;
  answerPlayerId: string | null;
  isFactOwner?: boolean;
}

export interface FriendFactsSetupState {
  requiredRounds: number;
  factsPerPlayer: Record<string, number>;
  readyPlayerIds: string[];
  submittedFacts?: FriendFactsFact[];
}

export interface FriendFactsPlayerAnswer {
  playerId: string;
  guessedPlayerId: string;
  timeTaken: number;
}

export interface DrawItSetupState {
  roundNumber: number;
  totalRounds: number;
  turnNumber: number;
  totalTurns: number;
  drawerId: string;
  drawerName: string;
  isDrawer?: boolean;
  wordChoices?: string[];
}

export interface DrawItSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  width: number;
  mode?: "draw" | "erase" | "fill";
}

export interface DrawItFeedItem {
  id: string;
  type: "system" | "guess" | "correct";
  message: string;
  playerId?: string;
}

export interface DrawItRound {
  roundNumber: number;
  totalRounds: number;
  turnNumber: number;
  totalTurns: number;
  drawerId: string;
  drawerName: string;
  wordMask: string;
  wordLength: number;
  wordLengths: number[];
  word: string | null;
  duration: number;
  startedAt: number;
  segments: DrawItSegment[];
  guessedCorrectlyIds: string[];
  feed: DrawItFeedItem[];
  isDrawer?: boolean;
  myGuess?: string | null;
}

export const CodenamesTeam = {
  RED: "RED",
  BLUE: "BLUE",
} as const;

export type CodenamesTeam = (typeof CodenamesTeam)[keyof typeof CodenamesTeam];

export const CodenamesRole = {
  SPYMASTER: "SPYMASTER",
  OPERATIVE: "OPERATIVE",
} as const;

export type CodenamesRole = (typeof CodenamesRole)[keyof typeof CodenamesRole];

export const CodenamesCardColor = {
  RED: "RED",
  BLUE: "BLUE",
  NEUTRAL: "NEUTRAL",
  ASSASSIN: "ASSASSIN",
} as const;

export type CodenamesCardColor =
  (typeof CodenamesCardColor)[keyof typeof CodenamesCardColor];

export interface CodenamesSetupTeamState {
  playerIds: string[];
  spymasterId: string | null;
}

export interface CodenamesSetupState {
  teams: Record<CodenamesTeam, CodenamesSetupTeamState>;
  myTeam?: CodenamesTeam;
  myRole?: CodenamesRole;
  startingTeam: CodenamesTeam;
  canStart: boolean;
}

export interface CodenamesCard {
  id: string;
  word: string;
  color: CodenamesCardColor | null;
  revealed: boolean;
}

export interface CodenamesTeamStatus {
  spymasterId: string | null;
  playerIds: string[];
  wordsRemaining: number;
}

export interface CodenamesRound {
  board: CodenamesCard[];
  activeTeam: CodenamesTeam;
  startingTeam: CodenamesTeam;
  winnerTeam: CodenamesTeam | null;
  teams: Record<CodenamesTeam, CodenamesTeamStatus>;
  myTeam?: CodenamesTeam;
  myRole?: CodenamesRole;
}

export const ChameleonRoundRole = {
  HOST: "HOST",
  CIVILIAN: "CIVILIAN",
  CHAMELEON: "CHAMELEON",
} as const;
export type ChameleonRoundRole =
  (typeof ChameleonRoundRole)[keyof typeof ChameleonRoundRole];

export type ChameleonRound = {
  number: number;
  totalRounds: number;
  category: ChameleonCategory;
  roles: Record<string, ChameleonRoundRole>;
  myRole?: ChameleonRoundRole;
  roll: string;
  speakingOrder?: { starter: Player; direction: "CLOCKWISE" | "ANTICLOCKWISE" };
  timer: {
    duration: number; // seconds
    startedAt: number; // timestamp (ms)
  };
  votes: Record<string, string>;
  counts?: Record<string, number>;
  votedCount?: number;
  totalVoters?: number;
};

export type ChameleonCategory = {
  title: string;
  words: string[];
};

export type ChameleonCategories = ChameleonCategory[];
