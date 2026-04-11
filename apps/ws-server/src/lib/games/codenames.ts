import type { WebSocket } from "ws";
import {
  CodenamesCard,
  CodenamesCardColor,
  CodenamesRole,
  CodenamesRound,
  CodenamesSetupState,
  CodenamesTeam,
  GameState,
  GameType,
  RoomState,
  WSEvent,
} from "@umati/ws";
import { nanoid } from "nanoid";
import { BaseGame } from "./base";
import { GameManager } from "../game-manager";
import { RoomManager } from "../room-manager";
import { codenamesWords } from "./codenames-words";

type CodenamesOptions = {
  duration?: number;
};

type InternalCard = CodenamesCard & {
  color: keyof typeof CodenamesCardColor;
};

type TeamState = {
  playerIds: string[];
  spymasterId: string | null;
  wordsRemaining: number;
};

const TEAM_ORDER: CodenamesTeam[] = [CodenamesTeam.RED, CodenamesTeam.BLUE];

export class CodenamesGame extends BaseGame {
  static minPlayers = 4;
  static winPoints = 120;

  public round?: CodenamesRound | null;

  private startingTeam: CodenamesTeam = CodenamesTeam.RED;
  private activeTeam: CodenamesTeam = CodenamesTeam.RED;
  private winnerTeam: CodenamesTeam | null = null;
  private board: InternalCard[] = [];
  private teams: Record<CodenamesTeam, TeamState> = {
    [CodenamesTeam.RED]: { playerIds: [], spymasterId: null, wordsRemaining: 0 },
    [CodenamesTeam.BLUE]: { playerIds: [], spymasterId: null, wordsRemaining: 0 },
  };
  private rankingsSubmitted = false;

  constructor(roomId: string, _options: CodenamesOptions) {
    super(roomId, GameType.CN);
    this.initPlayerScores();
  }

  private initPlayerScores() {
    const room = RoomManager.get(this.roomId);
    if (!room) return;
    room.players.forEach((player) => this.addPlayer(player.id));
  }

  private splitTeams() {
    const room = RoomManager.get(this.roomId);
    if (!room) return;

    const shuffledPlayers = this.randomize.shuffle([...room.players]);
    this.teams = {
      [CodenamesTeam.RED]: { playerIds: [], spymasterId: null, wordsRemaining: 0 },
      [CodenamesTeam.BLUE]: { playerIds: [], spymasterId: null, wordsRemaining: 0 },
    };

    shuffledPlayers.forEach((player, index) => {
      const team = TEAM_ORDER[index % 2]!;
      this.teams[team].playerIds.push(player.id);
    });

    this.startingTeam =
      this.randomize.sample([CodenamesTeam.RED, CodenamesTeam.BLUE], 1)[0] ??
      CodenamesTeam.RED;
    this.activeTeam = this.startingTeam;
    this.winnerTeam = null;
    this.board = [];
    this.round = null;
  }

  private getTeamForPlayer(playerId: string) {
    return TEAM_ORDER.find((team) => this.teams[team].playerIds.includes(playerId)) ?? null;
  }

  private getRoleForPlayer(playerId: string) {
    const team = this.getTeamForPlayer(playerId);
    if (!team) return undefined;
    return this.teams[team].spymasterId === playerId
      ? CodenamesRole.SPYMASTER
      : CodenamesRole.OPERATIVE;
  }

  private get canStartMatch() {
    return TEAM_ORDER.every((team) => {
      const teamState = this.teams[team];
      return (
        teamState.playerIds.length >= 2 &&
        !!teamState.spymasterId &&
        teamState.playerIds.some((playerId) => playerId !== teamState.spymasterId)
      );
    });
  }

  private buildSetupState(playerId?: string): CodenamesSetupState {
    return {
      teams: {
        [CodenamesTeam.RED]: {
          playerIds: this.teams[CodenamesTeam.RED].playerIds,
          spymasterId: this.teams[CodenamesTeam.RED].spymasterId,
        },
        [CodenamesTeam.BLUE]: {
          playerIds: this.teams[CodenamesTeam.BLUE].playerIds,
          spymasterId: this.teams[CodenamesTeam.BLUE].spymasterId,
        },
      },
      myTeam: playerId ? this.getTeamForPlayer(playerId) ?? undefined : undefined,
      myRole: playerId ? this.getRoleForPlayer(playerId) : undefined,
      startingTeam: this.startingTeam,
      canStart: this.canStartMatch,
    };
  }

  private buildRound(playerId?: string): CodenamesRound {
    return {
      board: this.board.map((card) => ({
        id: card.id,
        word: card.word,
        color:
          card.revealed || this.getRoleForPlayer(playerId ?? "") === CodenamesRole.SPYMASTER
            ? card.color
            : null,
        revealed: card.revealed,
      })),
      activeTeam: this.activeTeam,
      startingTeam: this.startingTeam,
      winnerTeam: this.winnerTeam,
      teams: {
        [CodenamesTeam.RED]: {
          playerIds: this.teams[CodenamesTeam.RED].playerIds,
          spymasterId: this.teams[CodenamesTeam.RED].spymasterId,
          wordsRemaining: this.teams[CodenamesTeam.RED].wordsRemaining,
        },
        [CodenamesTeam.BLUE]: {
          playerIds: this.teams[CodenamesTeam.BLUE].playerIds,
          spymasterId: this.teams[CodenamesTeam.BLUE].spymasterId,
          wordsRemaining: this.teams[CodenamesTeam.BLUE].wordsRemaining,
        },
      },
      myTeam: playerId ? this.getTeamForPlayer(playerId) ?? undefined : undefined,
      myRole: playerId ? this.getRoleForPlayer(playerId) : undefined,
    };
  }

  private sendSetupState() {
    const room = RoomManager.get(this.roomId);
    if (!room) return;

    this.toHost(WSEvent.GAME_STATE, GameManager.toGameState(this.id)!);

    this.toHost(WSEvent.CN_SETUP_UPDATE, {
      state: this.state,
      setup: this.buildSetupState(),
    });

    room.players.forEach((player) => {
      this.toPlayer(player.id, WSEvent.CN_SETUP_UPDATE, {
        state: this.state,
        setup: this.buildSetupState(player.id),
      });
    });
  }

  private sendStateUpdate() {
    const room = RoomManager.get(this.roomId);
    if (!room) return;

    this.toHost(WSEvent.GAME_STATE, GameManager.toGameState(this.id)!);

    this.toHost(WSEvent.CN_STATE_UPDATE, {
      state: this.state,
      round: this.buildRound(),
      scores: this.scores.sort((a, b) => b.score - a.score),
    });

    room.players.forEach((player) => {
      this.toPlayer(player.id, WSEvent.CN_STATE_UPDATE, {
        state: this.state,
        round: this.buildRound(player.id),
        scores: this.scores.sort((a, b) => b.score - a.score),
      });
    });
  }

  public sendStateToSocket(
    target: { isHost: true; ws: WebSocket } | { isHost: false; playerId: string },
  ) {
    if (this.state === GameState.BEFORE) {
      const payload = GameManager.toGameState(this.id);
      if (!payload) return;

      if (target.isHost) {
        target.ws.send(JSON.stringify({ event: WSEvent.GAME_STATE, payload }));
      } else {
        this.toPlayer(target.playerId, WSEvent.GAME_STATE, payload);
      }
      return;
    }

    if (this.state === GameState.ROUND_SETUP) {
      const payload = {
        state: this.state,
        setup: this.buildSetupState(target.isHost ? undefined : target.playerId),
      };

      if (target.isHost) {
        target.ws.send(JSON.stringify({ event: WSEvent.CN_SETUP_UPDATE, payload }));
      } else {
        this.toPlayer(target.playerId, WSEvent.CN_SETUP_UPDATE, payload);
      }
      return;
    }

    const payload = {
      state: this.state,
      round: this.buildRound(target.isHost ? undefined : target.playerId),
      scores: this.scores.sort((a, b) => b.score - a.score),
    };

    if (target.isHost) {
      target.ws.send(JSON.stringify({ event: WSEvent.CN_STATE_UPDATE, payload }));
      return;
    }

    this.toPlayer(target.playerId, WSEvent.CN_STATE_UPDATE, payload);
  }

  override addPlayer(playerId: string) {
    super.addPlayer(playerId);

    if (this.state === GameState.ROUND_SETUP) {
      this.sendSetupState();
      return;
    }

    if (this.state === GameState.ROUND || this.state === GameState.RANKING) {
      this.sendStateUpdate();
      return;
    }

    this.toHost(WSEvent.GAME_STATE, GameManager.toGameState(this.id)!);
  }

  public startGame() {
    this.state = GameState.ROUND_SETUP;
    this.setRoomState(RoomState.PLAYING);
    this.rankingsSubmitted = false;
    this.splitTeams();
    this.sendSetupState();
  }

  public toggleSpymaster(playerId: string): { success: boolean; error?: string } {
    if (this.state !== GameState.ROUND_SETUP) {
      return { success: false, error: "Spymaster selection is only available during team setup" };
    }

    const team = this.getTeamForPlayer(playerId);
    if (!team) {
      return { success: false, error: "Player not found in any team" };
    }

    const current = this.teams[team].spymasterId;
    if (current === playerId) {
      this.teams[team].spymasterId = null;
    } else if (!current) {
      this.teams[team].spymasterId = playerId;
    } else {
      return { success: false, error: "Your team already has a spymaster assigned" };
    }

    this.sendSetupState();
    return { success: true };
  }

  private generateBoard() {
    const selectedWords = this.randomize.sample(codenamesWords, 25);
    const colors: InternalCard["color"][] = [
      ...Array.from({ length: this.startingTeam === CodenamesTeam.RED ? 9 : 8 }, () =>
        CodenamesCardColor.RED,
      ),
      ...Array.from({ length: this.startingTeam === CodenamesTeam.BLUE ? 9 : 8 }, () =>
        CodenamesCardColor.BLUE,
      ),
      ...Array.from({ length: 7 }, () => CodenamesCardColor.NEUTRAL),
      CodenamesCardColor.ASSASSIN,
    ];

    const shuffledColors = this.randomize.shuffle(colors);
    this.board = selectedWords.map((word, index) => ({
      id: nanoid(),
      word,
      color: shuffledColors[index]!,
      revealed: false,
    }));

    this.teams[CodenamesTeam.RED].wordsRemaining =
      this.startingTeam === CodenamesTeam.RED ? 9 : 8;
    this.teams[CodenamesTeam.BLUE].wordsRemaining =
      this.startingTeam === CodenamesTeam.BLUE ? 9 : 8;
    this.activeTeam = this.startingTeam;
    this.round = this.buildRound();
  }

  public pickCard(playerId: string, cardId: string) {
    if (this.state !== GameState.ROUND) return;

    const team = this.getTeamForPlayer(playerId);
    const role = this.getRoleForPlayer(playerId);
    if (!team || team !== this.activeTeam || role !== CodenamesRole.OPERATIVE) return;

    const card = this.board.find((entry) => entry.id === cardId);
    if (!card || card.revealed) return;

    card.revealed = true;

    if (card.color === CodenamesCardColor.ASSASSIN) {
      this.finishGame(team === CodenamesTeam.RED ? CodenamesTeam.BLUE : CodenamesTeam.RED);
      return;
    }

    if (card.color === CodenamesCardColor.RED || card.color === CodenamesCardColor.BLUE) {
      const revealedTeam = card.color as CodenamesTeam;
      this.teams[revealedTeam].wordsRemaining = Math.max(
        0,
        this.teams[revealedTeam].wordsRemaining - 1,
      );

      if (this.teams[revealedTeam].wordsRemaining === 0) {
        this.finishGame(revealedTeam);
        return;
      }

      if (revealedTeam !== this.activeTeam) {
        this.passTurnToOtherTeam();
      }
    } else {
      this.passTurnToOtherTeam();
    }

    this.round = this.buildRound();
    this.sendStateUpdate();
  }

  public passTurn(playerId: string, team: CodenamesTeam) {
    if (this.state !== GameState.ROUND || team !== this.activeTeam) return;
    const playerTeam = this.getTeamForPlayer(playerId);
    const role = this.getRoleForPlayer(playerId);
    if (playerTeam !== team || role !== CodenamesRole.OPERATIVE) return;

    this.passTurnToOtherTeam();
    this.round = this.buildRound();
    this.sendStateUpdate();
  }

  private passTurnToOtherTeam() {
    this.activeTeam =
      this.activeTeam === CodenamesTeam.RED ? CodenamesTeam.BLUE : CodenamesTeam.RED;
  }

  public advanceToState(state: GameState, hostWs?: WebSocket) {
    if (state === GameState.ROUND && this.state === GameState.ROUND_SETUP) {
      if (!this.canStartMatch) {
        // Send error feedback to host instead of silently failing
        if (hostWs) {
          hostWs.send(
            JSON.stringify({
              event: WSEvent.ERROR,
              payload: { 
                message: "Cannot start match: each team needs 2+ players, a spymaster, and at least one operative" 
              },
            })
          );
        }
        return;
      }
      this.generateBoard();
      this.state = GameState.ROUND;
      this.sendStateUpdate();
      return;
    }
  }

  private finishGame(winnerTeam: CodenamesTeam) {
    this.winnerTeam = winnerTeam;
    this.state = GameState.RANKING;
    this.round = this.buildRound();
    this.awardWinningTeam(winnerTeam);
    this.sendStateUpdate();
    this.submitRankings();
  }

  private awardWinningTeam(winnerTeam: CodenamesTeam) {
    this.teams[winnerTeam].playerIds.forEach((playerId) => {
      this.updateScore(playerId, CodenamesGame.winPoints);
    });
  }

  private submitRankings() {
    if (this.rankingsSubmitted) return;
    this.rankingsSubmitted = true;

    const winners = this.teams[this.winnerTeam!].playerIds;
    const losers = this.teams[
      this.winnerTeam === CodenamesTeam.RED ? CodenamesTeam.BLUE : CodenamesTeam.RED
    ].playerIds;

    const sorted = [...winners, ...losers]
      .map((playerId) => this.gameScore.get(playerId))
      .filter(Boolean)
      .map((entry) => ({
        id: entry!.id,
        displayName: entry!.displayName,
        score: entry!.score,
      }));

    RoomManager.submitGameResult(this.roomId, sorted);
  }
}
