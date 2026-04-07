import { Randomize } from "js-randomize";
import { BaseGame } from "./base";

import { herdmentalityquestions } from "./herd-mentality-questions";
import { RoomManager } from "../room-manager";
import {
  GameState,
  GameType,
  HerdMentalityDataItem,
  HerdMentalityOptions,
  HerdMentalityPlayerAnswer,
  HerdMentalityRound,
  RoomState,
  TruviaPlayerAnswer,
  WSEvent,
} from "@umati/ws";
import { GameManager } from "../game-manager";

export class HerdMentality extends BaseGame {
  static maxNumberOfRounds = 20;
  static basePoints = 50;
  static timeBonusFactor = 0.5;
  public noOfRounds: number;

  public data: HerdMentalityDataItem[] = [];
  public currentRound = 0;
  private answers: Map<string, HerdMentalityPlayerAnswer> = new Map();
  public round?: HerdMentalityRound | null;
  private rankingsSubmitted = false;

  constructor(
    roomId: string,
    options: { noOfRounds: number; duration?: number },
  ) {
    super(roomId, GameType.HM);
    this.noOfRounds = Math.min(
      options.noOfRounds,
      HerdMentality.maxNumberOfRounds,
    );
    this.roundDuration = (options.duration ?? 30) * 1000;
    this.init();
  }

  private init() {
    this.selectQuestions();
    this.initPlayerScores();
  }

  private selectQuestions() {
    this.data = this.randomize
      .sample(herdmentalityquestions, this.noOfRounds)
      .map((s) => {
        return {
          question: s.question,
          choices: this.randomize.shuffle(s.options),
        };
      });
  }

  private initPlayerScores() {
    const room = RoomManager.get(this.roomId);
    if (!room) return;
    room.players.forEach((p) => {
      this.gameScore.set(p.id, {
        id: p.id,
        displayName: p.displayName,
        score: 0,
      });
    });
  }

  override addPlayer(playerId: string) {
    super.addPlayer(playerId);

    if (this.state === GameState.ROUND) {
      this.broadcast(WSEvent.HM_ROUND_START, {
        state: this.state,
        round: this.round!,
      });
    } else if (this.state === GameState.ROUND_END) {
      let counts = {
        0: 0,
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      };

      for (const { answer } of this.answers.values()) {
        counts[answer]++;
      }

      this.broadcast(WSEvent.HM_ROUND_END, {
        state: this.state,
        round: this.round!,
        scores: this.scores.sort((a, b) => b.score - a.score),
        counts: counts,
      });
    } else if (this.state === GameState.LEADERBOARD) {
      this.broadcast(WSEvent.GAME_STATE, GameManager.toGameState(this.id)!);
    } else {
      this.broadcast(WSEvent.GAME_STATE, GameManager.toGameState(this.id)!);
    }
  }

  public startGame(): void {
    this.state = GameState.ROUND;
    this.setRoomState(RoomState.PLAYING);
    this.rankingsSubmitted = false;
    this.startRound();
  }

  private startRound() {
    this.state = GameState.ROUND;
    const q = this.data[this.currentRound];
    this.answers = new Map();
    this.roundStartTime = Date.now();

    this.round = {
      number: this.currentRound + 1,
      totalRounds: this.noOfRounds,
      question: q?.question!,
      choices: q?.choices!,
      duration: this.roundDuration / 1000,
      startedAt: this.roundStartTime,
    };
    this.roundTimer = setTimeout(() => {
      this.endRound();
    }, this.roundDuration);

    this.broadcast(WSEvent.HM_ROUND_START, {
      state: this.state,
      round: this.round!,
    });
  }

  public submitAnswer(playerId: string, answer: HerdMentalityOptions) {
    const exists = this.answers.get(playerId);
    if (exists) return;
    const timeTaken = Date.now() - this.roundStartTime;
    this.answers.set(playerId, { answer, timeTaken });
    this.toPlayer(playerId, WSEvent.HM_ROUND_ANSWERED, {
      answer: this.answers.get(playerId)?.answer ?? null,
    });

    if (this.answers.size === this.scores.length) {
      if (this.roundTimer) clearTimeout(this.roundTimer);
      this.endRound();
    }
  }

  private endRound() {
    this.state = GameState.ROUND_END;

    const q = this.data[this.currentRound];
    if (!q) return;

    // 1. Count how many players picked each answer option
    const counts: Record<HerdMentalityOptions, number> = {
      0: 0,
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    for (const { answer } of this.answers.values()) {
      counts[answer]++;
    }

    // 2. Find the highest vote count
    const maxVotes = Math.max(...Object.values(counts));

    // 3. Get the option(s) with the highest votes
    const mostVotedAnswers = Object.entries(counts)
      .filter(([_, count]) => count === maxVotes)
      .map(([index]) => Number(index));

    // 4. Award points to players who picked one of the most-voted options

    for (const [playerId, playerAnswer] of this.answers) {
      if (mostVotedAnswers.includes(playerAnswer.answer)) {
        const bonus = Math.max(
          0,
          (1 - playerAnswer.timeTaken / this.roundDuration) *
            HerdMentality.basePoints *
            HerdMentality.timeBonusFactor,
        );
        const points = Math.round(HerdMentality.basePoints + bonus);
        this.updateScore(playerId, points);
      }
    }

    // 5. Broadcast end of round with updated scores
    this.broadcast(WSEvent.HM_ROUND_END, {
      state: this.state,
      round: this.round!,
      scores: this.scores.sort((a, b) => b.score - a.score),
      counts: counts,
    });
  }

  public advanceToState(state: GameState) {
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
    this.broadcast(WSEvent.GAME_STATE, GameManager.toGameState(this.id)!);
  }

  private showRanking() {
    this.state = GameState.RANKING;
    this.broadcast(WSEvent.GAME_STATE, GameManager.toGameState(this.id)!);

    if (this.rankingsSubmitted) return;
    this.rankingsSubmitted = true;

    const sorted = Array.from(this.gameScore.entries())
      .map(([id, data]) => ({
        id,
        displayName: data.displayName,
        score: data.score,
      }))
      .sort((a, b) => b.score - a.score);

    const top3 = sorted.slice(0, 3);
    while (top3.length < 3) {
      top3.push({ id: "", displayName: "", score: 0 });
    }

    RoomManager.submitGameResult(this.roomId, top3);
  }

  public myAnswer(playerId: string): HerdMentalityOptions | undefined {
    return this.answers.get(playerId)?.answer;
  }
}
