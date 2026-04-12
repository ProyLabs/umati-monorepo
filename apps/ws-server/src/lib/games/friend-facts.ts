import type { WebSocket } from "ws";
import {
  FriendFactsFact,
  FriendFactsFactInput,
  FriendFactsPlayerAnswer,
  FriendFactsRound,
  FriendFactsSetupState,
  GameState,
  GameType,
  RoomState,
  WSEvent,
} from "@umati/ws";
import { nanoid } from "nanoid";
import { BaseGame } from "./base";
import { GameManager } from "../game-manager";
import { RoomManager } from "../room-manager";

type FriendFactsOptions = {
  noOfRounds?: number;
  duration?: number;
};

type FactEntry = FriendFactsFact & {
  ownerId: string;
  ownerName: string;
};

const targetPlayerSetupState = (
  playerId: string,
  setupState: FriendFactsSetupState,
  factsByPlayer: Map<string, FriendFactsFact[]>,
): FriendFactsSetupState => ({
  ...setupState,
  submittedFacts: factsByPlayer.get(playerId) ?? [],
});

export class FriendFactsGame extends BaseGame {
  static maxNumberOfRounds = 20;
  static maxFactsPerPlayer = 3;
  static basePoints = 200;
  static timeBonusFactor = 0.5;

  public noOfRounds: number;
  public round?: FriendFactsRound | null;
  public currentRound = 0;

  private factsByPlayer = new Map<string, FriendFactsFact[]>();
  private selectedFacts: FactEntry[] = [];
  private currentFact?: FactEntry;
  private answers = new Map<string, FriendFactsPlayerAnswer>();
  private rankingsSubmitted = false;
  private gameStarted = false;

  constructor(roomId: string, options: FriendFactsOptions) {
    super(roomId, GameType.FF);
    this.noOfRounds = Math.min(
      options.noOfRounds ?? 5,
      FriendFactsGame.maxNumberOfRounds,
    );
    this.roundDuration = (options.duration ?? 20) * 1000;
    this.initPlayerScores();
  }

  private initPlayerScores() {
    const room = RoomManager.get(this.roomId);
    if (!room) return;
    room.players.forEach((player) => this.addPlayer(player.id));
  }

  private get setupState(): FriendFactsSetupState {
    return {
      requiredRounds: this.noOfRounds,
      factsPerPlayer: Object.fromEntries(
        Array.from(this.factsByPlayer.entries()).map(([playerId, facts]) => [
          playerId,
          facts.length,
        ]),
      ),
      readyPlayerIds: Array.from(this.factsByPlayer.entries())
        .filter(([, facts]) => facts.length > 0)
        .map(([playerId]) => playerId),
    };
  }

  private get totalFactCount() {
    return Array.from(this.factsByPlayer.values()).reduce(
      (sum, facts) => sum + facts.length,
      0,
    );
  }

  private get canStartRounds() {
    const room = RoomManager.get(this.roomId);
    if (!room || room.players.length === 0) return false;
    const everyPlayerReady = room.players.every(
      (player) => (this.factsByPlayer.get(player.id)?.length ?? 0) > 0,
    );
    return everyPlayerReady && this.totalFactCount >= this.noOfRounds;
  }

  private buildRoundPayload(playerId?: string): FriendFactsRound | null {
    if (!this.round) return null;

    return {
      ...this.round,
      ownerId: this.state === GameState.ROUND_END ? this.round.ownerId : null,
      answerPlayerId:
        this.state === GameState.ROUND_END ? this.round.answerPlayerId : null,
      isFactOwner: playerId ? this.round.ownerId === playerId : false,
    };
  }

  private sendSetupState() {
    const room = RoomManager.get(this.roomId);
    if (!room) return;

    this.toHost(WSEvent.FF_SETUP_UPDATE, {
      state: this.state,
      setup: this.setupState,
    });

    room.players.forEach((player) => {
      this.toPlayer(player.id, WSEvent.FF_SETUP_UPDATE, {
        state: this.state,
        setup: {
          ...this.setupState,
          submittedFacts: this.factsByPlayer.get(player.id) ?? [],
        },
      });
    });
  }

  private sendGameState() {
    const room = RoomManager.get(this.roomId);
    if (!room) return;

    this.toHost(WSEvent.GAME_STATE, GameManager.toGameState(this.id)!);
    room.players.forEach((player) => {
      this.toPlayer(player.id, WSEvent.GAME_STATE, {
        ...GameManager.toGameState(this.id)!,
        round: this.buildRoundPayload(player.id),
      });
    });
  }

  public sendStateToSocket(
    target: { isHost: true; ws: WebSocket } | { isHost: false; playerId: string },
  ) {
    if (this.state === GameState.ROUND_SETUP) {
      if (target.isHost) {
        target.ws.send(
          JSON.stringify({
            event: WSEvent.FF_SETUP_UPDATE,
            payload: { state: this.state, setup: this.setupState },
          }),
        );
      } else {
        this.toPlayer(target.playerId, WSEvent.FF_SETUP_UPDATE, {
          state: this.state,
          setup: targetPlayerSetupState(
            target.playerId,
            this.setupState,
            this.factsByPlayer,
          ),
        });
      }
      return;
    }

    if (target.isHost) {
      target.ws.send(
        JSON.stringify({
          event: WSEvent.GAME_STATE,
          payload: GameManager.toGameState(this.id),
        }),
      );
      return;
    }

    this.toPlayer(target.playerId, WSEvent.GAME_STATE, {
      ...GameManager.toGameState(this.id)!,
      round: this.buildRoundPayload(target.playerId),
    });
  }

  override addPlayer(playerId: string) {
    super.addPlayer(playerId);

    if (this.state === GameState.ROUND_SETUP) {
      this.sendSetupState();
      return;
    }

    if (this.state === GameState.ROUND) {
      const round = this.buildRoundPayload(playerId);
      if (!round) return;
      this.toPlayer(playerId, WSEvent.FF_ROUND_START, {
        state: this.state,
        round,
      });
      return;
    }

    if (this.state === GameState.ROUND_END) {
      const round = this.buildRoundPayload(playerId);
      if (!round) return;
      this.toPlayer(playerId, WSEvent.FF_ROUND_END, {
        state: this.state,
        round,
        scores: this.scores.sort((a, b) => b.score - a.score),
        counts: this.answerCounts(),
      });
      return;
    }

    this.sendGameState();
  }

  public startGame() {
    this.state = GameState.ROUND_SETUP;
    this.setRoomState(RoomState.PLAYING);
    this.rankingsSubmitted = false;
    this.gameStarted = false;
    this.factsByPlayer.clear();
    this.selectedFacts = [];
    this.answers.clear();
    this.round = null;
    this.sendSetupState();
  }

  public submitFacts(playerId: string, facts: FriendFactsFactInput[]) {
    const sanitized = facts
      .map((fact) => fact.text.trim())
      .filter(Boolean)
      .slice(0, FriendFactsGame.maxFactsPerPlayer)
      .map((text) => ({ id: nanoid(), text }));

    this.factsByPlayer.set(playerId, sanitized);
    this.sendSetupState();
  }

  private prepareRounds() {
    const room = RoomManager.get(this.roomId);
    if (!room) return;

    const factPool: FactEntry[] = [];
    room.players.forEach((player) => {
      const facts = this.factsByPlayer.get(player.id) ?? [];
      facts.forEach((fact) => {
        factPool.push({
          ...fact,
          ownerId: player.id,
          ownerName: player.displayName,
        });
      });
    });

    this.selectedFacts = this.randomize.sample(
      factPool,
      Math.min(this.noOfRounds, factPool.length),
    );
    this.noOfRounds = this.selectedFacts.length;
  }

  private startRound() {
    this.state = GameState.ROUND;
    this.answers.clear();
    this.roundStartTime = Date.now();
    this.currentFact = this.selectedFacts[this.currentRound];
    if (!this.currentFact) return;

    const room = RoomManager.get(this.roomId);
    const choices =
      room?.players.map((player) => ({
        id: player.id,
        displayName: player.displayName,
      })) ?? [];

    this.round = {
      number: this.currentRound + 1,
      totalRounds: this.noOfRounds,
      fact: this.currentFact.text,
      choices,
      duration: this.roundDuration / 1000,
      startedAt: this.roundStartTime,
      ownerId: this.currentFact.ownerId,
      answerPlayerId: this.currentFact.ownerId,
    };

    this.roundTimer = setTimeout(() => this.endRound(), this.roundDuration);

    if (!room) return;
    this.toHost(WSEvent.FF_ROUND_START, {
      state: this.state,
      round: this.buildRoundPayload()!,
    });
    room.players.forEach((player) => {
      this.toPlayer(player.id, WSEvent.FF_ROUND_START, {
        state: this.state,
        round: this.buildRoundPayload(player.id)!,
      });
    });
  }

  public submitAnswer(playerId: string, answerPlayerId: string) {
    if (!this.currentFact || this.state !== GameState.ROUND) return;
    if (playerId === this.currentFact.ownerId) return;
    if (this.answers.has(playerId)) return;

    this.answers.set(playerId, {
      playerId,
      guessedPlayerId: answerPlayerId,
      timeTaken: Date.now() - this.roundStartTime,
    });
    this.toPlayer(playerId, WSEvent.FF_ROUND_ANSWERED, { answerPlayerId });

    const room = RoomManager.get(this.roomId);
    const eligibleGuessers =
      room?.players.filter((player) => player.id !== this.currentFact?.ownerId)
        .length ?? 0;

    if (this.answers.size >= eligibleGuessers) {
      if (this.roundTimer) clearTimeout(this.roundTimer);
      this.endRound();
    }
  }

  public myAnswer(playerId: string) {
    return this.answers.get(playerId)?.guessedPlayerId ?? null;
  }

  private answerCounts() {
    const counts: Record<string, number> = {};
    this.answers.forEach(({ guessedPlayerId }) => {
      counts[guessedPlayerId] = (counts[guessedPlayerId] ?? 0) + 1;
    });
    return counts;
  }

  private endRound() {
    if (!this.currentFact || !this.round) return;
    this.state = GameState.ROUND_END;

    let highestAwardedPoints = 0;
    for (const [playerId, answer] of this.answers.entries()) {
      if (answer.guessedPlayerId !== this.currentFact.ownerId) continue;

      const bonus = Math.max(
        0,
        (1 - answer.timeTaken / this.roundDuration) *
          FriendFactsGame.basePoints *
          FriendFactsGame.timeBonusFactor,
      );
      const points = Math.round(FriendFactsGame.basePoints + bonus);
      highestAwardedPoints = Math.max(highestAwardedPoints, points);
      this.updateScore(playerId, points);
    }

    if (highestAwardedPoints > 0) {
      this.updateScore(this.currentFact.ownerId, highestAwardedPoints);
    }

    const room = RoomManager.get(this.roomId);
    if (!room) return;

    this.toHost(WSEvent.FF_ROUND_END, {
      state: this.state,
      round: this.buildRoundPayload()!,
      scores: this.scores.sort((a, b) => b.score - a.score),
      counts: this.answerCounts(),
    });
    room.players.forEach((player) => {
      this.toPlayer(player.id, WSEvent.FF_ROUND_END, {
        state: this.state,
        round: this.buildRoundPayload(player.id)!,
        scores: this.scores.sort((a, b) => b.score - a.score),
        counts: this.answerCounts(),
      });
    });
  }

  public advanceToState(state: GameState) {
    if (state === GameState.ROUND && this.state === GameState.ROUND_SETUP) {
      if (!this.canStartRounds || this.gameStarted) return;
      this.gameStarted = true;
      this.prepareRounds();
      this.startRound();
      return;
    }

    if (state === GameState.LEADERBOARD && this.state === GameState.ROUND_END) {
      this.showLeaderboard();
      return;
    }

    if (state === GameState.ROUND && this.state === GameState.LEADERBOARD) {
      if (this.currentRound >= this.noOfRounds - 1) return;
      this.currentRound += 1;
      this.startRound();
      return;
    }

    if (state === GameState.RANKING && this.state === GameState.LEADERBOARD) {
      if (this.currentRound !== this.noOfRounds - 1) return;
      this.showRanking();
    }
  }

  private showLeaderboard() {
    this.state = GameState.LEADERBOARD;
    this.sendGameState();
  }

  private showRanking() {
    this.state = GameState.RANKING;
    this.sendGameState();

    if (this.rankingsSubmitted) return;
    this.rankingsSubmitted = true;

    const sorted = Array.from(this.gameScore.entries())
      .map(([id, data]) => ({
        id,
        displayName: data.displayName,
        score: data.score,
      }))
      .sort((a, b) => b.score - a.score);

    RoomManager.submitGameResult(this.roomId, sorted);
  }
}
