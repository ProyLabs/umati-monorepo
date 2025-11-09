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
  static basePoints = 100;
  public noOfRounds: number;

  public data: HerdMentalityDataItem[] = [];
  public currentRound = 0;
  private answers: Map<string, HerdMentalityPlayerAnswer> = new Map();
  public round?: HerdMentalityRound | null;

  constructor(
    roomId: string,
    options: { noOfRounds: number; duration?: number }
  ) {
    super(roomId, GameType.HM);
    this.noOfRounds = Math.min(
      options.noOfRounds,
      HerdMentality.maxNumberOfRounds
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
    this.answers.set(playerId, { answer });
    this.toPlayer(playerId, WSEvent.HM_ROUND_ANSWERED, {
      answer: this.answers.get(playerId)?.answer ?? null,
    });

    if (this.answers.size === this.scores.length) {
      if (this.roundTimer) clearTimeout(this.roundTimer);
      setTimeout(() => {
        this.endRound();
      }, 1500);
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
        this.updateScore(playerId, HerdMentality.basePoints);
      }
    }

    // 5. Broadcast end of round with updated scores
    this.broadcast(WSEvent.HM_ROUND_END, {
      state: this.state,
      round: this.round!,
      scores: this.scores.sort((a, b) => b.score - a.score),
      counts: counts,
    });

    // 6. Move to leaderboard after short delay
    setTimeout(() => this.showLeaderboard(), 5000);
  }


   private showLeaderboard() {
    if (++this.currentRound >= this.noOfRounds) {
      this.state = GameState.LEADERBOARD;
      this.broadcast(WSEvent.GAME_STATE, GameManager.toGameState(this.id)!);

      setTimeout(() => {
        this.state = GameState.RANKING;
        this.broadcast(WSEvent.GAME_STATE, GameManager.toGameState(this.id)!);

        const sorted = Array.from(this.gameScore.entries())
          .map(([id, data]) => ({
            id,
            displayName: data.displayName,
            score: data.score,
          }))
          .sort((a, b) => b.score - a.score);

        // Get top 3 (pad with empty entries if less than 3 players)
        const top3 = sorted.slice(0, 3);
        while (top3.length < 3) {
          top3.push({ id: "", displayName: "", score: 0 });
        }

        RoomManager.submitGameResult(this.roomId, top3);

        setTimeout(() => {
          this.endGame();
        }, 10000);
      }, 5000);
    } else {
      this.state = GameState.LEADERBOARD;
      this.broadcast(WSEvent.GAME_STATE, GameManager.toGameState(this.id)!);

      setTimeout(() => {
        this.startRound();
      }, 5000);
    }
  }


  public myAnswer(playerId: string): HerdMentalityOptions | undefined {
    return this.answers.get(playerId)?.answer;
  }

}
