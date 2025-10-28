

export interface Ranking {
  id: string;
  name: string;
  position: number;
  gold: number;
  silver: number;
  bronze: number;
}

// 🎮 UI-level state machine for the lobby
export type LobbyUIState = "WAITING" | "LOBBY" | "GAME" | "LEADERBOARD";

// 🧍 Player identity source
export type PlayerType = "user" | "guest";

// 👥 Player representation inside any lobby
export interface Player {
  playerId: string;
  displayName: string;
  avatar?: string;
  type: PlayerType;
}

// 🏠 Lobby definition
export interface Lobby {
  id: string;
  name: string;
  code: string;
  lobbyIdentifier: string;
  private: boolean;
  maxPlayers: number;

  hostId: string;
  hostType: PlayerType;

  state: LobbyUIState;
  players: Player[];
}

