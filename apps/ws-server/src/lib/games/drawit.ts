import type { WebSocket } from "ws";
import {
  DrawItFeedItem,
  DrawItRound,
  DrawItSegment,
  DrawItSetupState,
  GameState,
  GameType,
  RoomState,
  WSEvent,
} from "@umati/ws";
import { nanoid } from "nanoid";
import { BaseGame } from "./base";
import { RoomManager } from "../room-manager";
import { GameManager } from "../game-manager";
import { drawItWords } from "./drawit-words";

type DrawItOptions = {
  noOfRounds?: number;
  duration?: number;
};

type GuessRecord = {
  guess: string;
  timeTaken: number;
  correct: boolean;
};

export class DrawItGame extends BaseGame {
  static maxRounds = 5;
  static guessBasePoints = 200;
  static drawerPointsPerCorrect = 90;

  public noOfRounds: number;
  public round?: DrawItRound | null;
  public currentTurn = 0;

  private turnOrder: string[] = [];
  private drawerId: string | null = null;
  private wordChoices: string[] = [];
  private selectedWord: string | null = null;
  private segments: DrawItSegment[] = [];
  private guesses = new Map<string, GuessRecord>();
  private feed: DrawItFeedItem[] = [];
  private rankingsSubmitted = false;

  constructor(roomId: string, options: DrawItOptions) {
    super(roomId, GameType.DRAWIT);
    this.noOfRounds = Math.min(
      Math.max(options.noOfRounds ?? 3, 1),
      DrawItGame.maxRounds,
    );
    this.roundDuration = (options.duration ?? 60) * 1000;
    this.initPlayerScores();
    this.buildTurnOrder();
  }

  private initPlayerScores() {
    const room = RoomManager.get(this.roomId);
    if (!room) return;
    room.players.forEach((player) => this.addPlayer(player.id));
  }

  private buildTurnOrder() {
    const room = RoomManager.get(this.roomId);
    if (!room) return;

    this.turnOrder = [];
    for (let roundIndex = 0; roundIndex < this.noOfRounds; roundIndex += 1) {
      this.turnOrder.push(
        ...this.randomize.shuffle(room.players.map((player) => player.id)),
      );
    }
  }

  private get totalTurns() {
    return this.turnOrder.length;
  }

  private get playersPerRound() {
    const room = RoomManager.get(this.roomId);
    return room?.players.length ?? 0;
  }

  private get currentRoundNumber() {
    return Math.floor(this.currentTurn / Math.max(this.playersPerRound, 1)) + 1;
  }

  private get currentTurnNumber() {
    return this.currentTurn + 1;
  }

  private get drawerName() {
    if (!this.drawerId) return "Unknown";
    const room = RoomManager.get(this.roomId);
    return (
      room?.players.find((player) => player.id === this.drawerId)
        ?.displayName ?? "Unknown"
    );
  }

  private maskWord(word: string) {
    return word
      .split(" ")
      .map((part) =>
        Array.from(part)
          .map(() => "_")
          .join(" "),
      )
      .join("   ");
  }

  private normalizeGuess(guess: string) {
    return guess.trim().toLowerCase();
  }

  private addFeed(
    type: DrawItFeedItem["type"],
    message: string,
    playerId?: string,
  ) {
    this.feed = [...this.feed, { id: nanoid(), type, message, playerId }].slice(
      -8,
    );
  }

  private buildSetupState(playerId?: string): DrawItSetupState {
    return {
      roundNumber: this.currentRoundNumber,
      totalRounds: this.noOfRounds,
      turnNumber: this.currentTurnNumber,
      totalTurns: this.totalTurns,
      drawerId: this.drawerId!,
      drawerName: this.drawerName,
      isDrawer: playerId === this.drawerId,
      wordChoices: playerId === this.drawerId ? this.wordChoices : undefined,
    };
  }

  private buildRound(playerId?: string): DrawItRound {
    const guessedCorrectlyIds = Array.from(this.guesses.entries())
      .filter(([, value]) => value.correct)
      .map(([id]) => id);
    const playerGuessedCorrectly = playerId
      ? this.guesses.get(playerId)?.correct === true
      : false;

    return {
      roundNumber: this.currentRoundNumber,
      totalRounds: this.noOfRounds,
      turnNumber: this.currentTurnNumber,
      totalTurns: this.totalTurns,
      drawerId: this.drawerId!,
      drawerName: this.drawerName,
      wordMask: this.selectedWord ? this.maskWord(this.selectedWord) : "",
      wordLength: this.selectedWord?.replace(/\s+/g, "").length ?? 0,
      wordLengths: this.selectedWord
        ? this.selectedWord
            .split(/\s+/)
            .filter(Boolean)
            .map((part) => part.length)
        : [],
      word:
        this.state === GameState.ROUND_END ||
        playerId === this.drawerId ||
        playerGuessedCorrectly
          ? this.selectedWord
          : null,
      duration: this.roundDuration / 1000,
      startedAt: this.roundStartTime,
      segments: this.segments,
      guessedCorrectlyIds,
      feed: this.feed,
      isDrawer: playerId === this.drawerId,
      myGuess: playerId ? (this.guesses.get(playerId)?.guess ?? null) : null,
    };
  }

  private sendSetupState() {
    const room = RoomManager.get(this.roomId);
    if (!room) return;

    this.toHost(WSEvent.GAME_STATE, GameManager.toGameState(this.id)!);
    this.toHost(WSEvent.DI_SETUP_UPDATE, {
      state: this.state,
      setup: this.buildSetupState(),
    });

    room.players.forEach((player) => {
      this.toPlayer(player.id, WSEvent.DI_SETUP_UPDATE, {
        state: this.state,
        setup: this.buildSetupState(player.id),
      });
    });
  }

  private sendRoundStart() {
    const room = RoomManager.get(this.roomId);
    if (!room) return;

    this.toHost(WSEvent.GAME_STATE, GameManager.toGameState(this.id)!);
    this.toHost(WSEvent.DI_ROUND_START, {
      state: this.state,
      round: this.buildRound(),
    });

    room.players.forEach((player) => {
      this.toPlayer(player.id, WSEvent.DI_ROUND_START, {
        state: this.state,
        round: this.buildRound(player.id),
      });
    });
  }

  private sendRoundUpdate() {
    const room = RoomManager.get(this.roomId);
    if (!room) return;

    this.toHost(WSEvent.DI_ROUND_UPDATE, {
      state: this.state,
      round: this.buildRound(),
      scores: this.scores.sort((a, b) => b.score - a.score),
    });

    room.players.forEach((player) => {
      this.toPlayer(player.id, WSEvent.DI_ROUND_UPDATE, {
        state: this.state,
        round: this.buildRound(player.id),
        scores: this.scores.sort((a, b) => b.score - a.score),
      });
    });
  }

  private sendRoundEnd() {
    const room = RoomManager.get(this.roomId);
    if (!room) return;

    this.toHost(WSEvent.GAME_STATE, GameManager.toGameState(this.id)!);
    this.toHost(WSEvent.DI_ROUND_END, {
      state: this.state,
      round: this.buildRound(),
      scores: this.scores.sort((a, b) => b.score - a.score),
    });

    room.players.forEach((player) => {
      this.toPlayer(player.id, WSEvent.DI_ROUND_END, {
        state: this.state,
        round: this.buildRound(player.id),
        scores: this.scores.sort((a, b) => b.score - a.score),
      });
    });
  }

  private prepareTurn() {
    this.drawerId = this.turnOrder[this.currentTurn] ?? null;
    this.wordChoices = this.randomize.sample(drawItWords, 3);
    this.selectedWord = null;
    this.segments = [];
    this.guesses = new Map();
    this.feed = [];
    this.round = null;
    this.state = GameState.ROUND_SETUP;
    this.addFeed("system", `${this.drawerName} is up to draw.`);
    this.sendSetupState();
  }

  public startGame() {
    this.setRoomState(RoomState.PLAYING);
    this.rankingsSubmitted = false;
    this.currentTurn = 0;
    this.buildTurnOrder();
    this.prepareTurn();
  }

  public pickWord(playerId: string, word: string) {
    if (this.state !== GameState.ROUND_SETUP || playerId !== this.drawerId)
      return;
    if (!this.wordChoices.includes(word)) return;

    this.selectedWord = word;
    this.state = GameState.ROUND;
    this.roundStartTime = Date.now();
    this.addFeed("system", `${this.drawerName} started drawing.`);
    this.round = this.buildRound();

    this.roundTimer = setTimeout(() => {
      this.endTurn();
    }, this.roundDuration);

    this.sendRoundStart();
  }

  public addSegment(playerId: string, segment: DrawItSegment) {
    if (this.state !== GameState.ROUND || playerId !== this.drawerId) return;

    this.segments.push(segment);
    this.broadcast(WSEvent.DI_DRAW_SEGMENT, {
      roomId: this.roomId,
      playerId,
      segment,
    });
  }

  public clearCanvas(playerId: string) {
    if (this.state !== GameState.ROUND || playerId !== this.drawerId) return;

    this.segments = [];
    this.broadcast(WSEvent.DI_CANVAS_CLEAR, {
      roomId: this.roomId,
      playerId,
    });
    this.sendRoundUpdate();
  }

  public submitGuess(playerId: string, guess: string) {
    if (this.state !== GameState.ROUND || playerId === this.drawerId) return;
    if (this.guesses.get(playerId)?.correct) return;

    const trimmedGuess = guess.trim();
    if (!trimmedGuess || !this.selectedWord) return;

    const correct =
      this.normalizeGuess(trimmedGuess) ===
      this.normalizeGuess(this.selectedWord);
    const timeTaken = Date.now() - this.roundStartTime;

    this.guesses.set(playerId, { guess: trimmedGuess, timeTaken, correct });
    this.toPlayer(playerId, WSEvent.DI_GUESS_RESULT, {
      guess: trimmedGuess,
      correct,
    });

    const room = RoomManager.get(this.roomId);
    const displayName =
      room?.players.find((player) => player.id === playerId)?.displayName ??
      "Player";

    if (correct) {
      const bonus = Math.max(
        0,
        (1 - timeTaken / this.roundDuration) * DrawItGame.guessBasePoints * 0.5,
      );
      this.updateScore(
        playerId,
        Math.round(DrawItGame.guessBasePoints + bonus),
      );
      this.addFeed("correct", `${displayName} guessed it.`, playerId);

      const nonDrawerCount = Math.max((room?.players.length ?? 1) - 1, 1);
      const correctGuessers = Array.from(this.guesses.values()).filter(
        (entry) => entry.correct,
      ).length;
      if (correctGuessers >= nonDrawerCount) {
        if (this.roundTimer) clearTimeout(this.roundTimer);
        this.endTurn();
        return;
      }
    } else {
      this.addFeed("guess", `${displayName}: ${trimmedGuess}`, playerId);
    }

    this.sendRoundUpdate();
  }

  private endTurn() {
    this.state = GameState.ROUND_END;
    if (this.drawerId) {
      const correctGuessers = Array.from(this.guesses.values()).filter(
        (entry) => entry.correct,
      ).length;
      this.updateScore(
        this.drawerId,
        correctGuessers * DrawItGame.drawerPointsPerCorrect,
      );
    }
    this.addFeed("system", `The word was ${this.selectedWord?.toUpperCase()}.`);
    this.round = this.buildRound();
    this.sendRoundEnd();
  }

  private showLeaderboard() {
    this.state = GameState.LEADERBOARD;
    this.broadcast(WSEvent.GAME_STATE, GameManager.toGameState(this.id)!);
  }

  private showRanking() {
    this.state = GameState.RANKING;
    this.broadcast(WSEvent.GAME_STATE, GameManager.toGameState(this.id)!);

    if (this.rankingsSubmitted) return;
    this.rankingsSubmitted = true;

    const sorted = Array.from(this.gameScore.values())
      .map((entry) => ({
        id: entry.id,
        displayName: entry.displayName,
        score: entry.score,
      }))
      .sort((a, b) => b.score - a.score);

    RoomManager.submitGameResult(this.roomId, sorted);
  }

  public advanceToState(state: GameState) {
    const isFinalTurn = this.currentTurn >= this.totalTurns - 1;

    if (state === GameState.LEADERBOARD && this.state === GameState.ROUND_END) {
      this.showLeaderboard();
      return;
    }

    if (
      state === GameState.ROUND_SETUP &&
      this.state === GameState.LEADERBOARD &&
      !isFinalTurn
    ) {
      this.currentTurn += 1;
      this.prepareTurn();
      return;
    }

    if (
      state === GameState.RANKING &&
      this.state === GameState.LEADERBOARD &&
      isFinalTurn
    ) {
      this.showRanking();
    }
  }

  public sendStateToSocket(
    target:
      | { isHost: true; ws: WebSocket }
      | { isHost: false; playerId: string },
  ) {
    if (this.state === GameState.ROUND_SETUP) {
      const payload = {
        state: this.state,
        setup: this.buildSetupState(
          target.isHost ? undefined : target.playerId,
        ),
      };

      if (target.isHost) {
        target.ws.send(
          JSON.stringify({ event: WSEvent.DI_SETUP_UPDATE, payload }),
        );
      } else {
        this.toPlayer(target.playerId, WSEvent.DI_SETUP_UPDATE, payload);
      }
      return;
    }

    if (this.state === GameState.ROUND) {
      const payload = {
        state: this.state,
        round: this.buildRound(target.isHost ? undefined : target.playerId),
      };
      if (target.isHost) {
        target.ws.send(
          JSON.stringify({ event: WSEvent.DI_ROUND_START, payload }),
        );
      } else {
        this.toPlayer(target.playerId, WSEvent.DI_ROUND_START, payload);
      }
      return;
    }

    if (this.state === GameState.ROUND_END) {
      const payload = {
        state: this.state,
        round: this.buildRound(target.isHost ? undefined : target.playerId),
        scores: this.scores.sort((a, b) => b.score - a.score),
      };
      if (target.isHost) {
        target.ws.send(
          JSON.stringify({ event: WSEvent.DI_ROUND_END, payload }),
        );
      } else {
        this.toPlayer(target.playerId, WSEvent.DI_ROUND_END, payload);
      }
      return;
    }

    const payload = GameManager.toGameState(this.id);
    if (!payload) return;

    if (target.isHost) {
      target.ws.send(JSON.stringify({ event: WSEvent.GAME_STATE, payload }));
    } else {
      this.toPlayer(target.playerId, WSEvent.GAME_STATE, payload);
    }
  }
}
