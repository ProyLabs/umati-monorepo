import { BaseGame } from "./base";
import { triviaquestions } from "./trivia-questions";
import { Randomize } from "js-randomize";
import { RoomManager } from "../room-manager";
import {
  Scores,
  TriviaRound,
  WSEvent,
  type DataItem,
  GameState,
  RoomState,
  TriviaOptions,
  PlayerAnswer,
  Score,
} from "@umati/ws";
import { GameManager } from "../game-manager";

export class TriviaGame extends BaseGame {
  static maxNumberOfRounds = 20;

  public noOfRounds: number;
  public data: DataItem[] = [];
  public currentRound = 0;
  private _scores: Map<string, Score> = new Map();

  private randomize = new Randomize();
  private roundDuration: number;
  private answers: Map<string, PlayerAnswer> = new Map();
  private roundStartTime = 0;
  private roundTimer?: NodeJS.Timeout;
  public round?: TriviaRound | null;

  public get scores(): Scores {
    return Array.from(this._scores.values());
  }

  constructor(
    roomId: string,
    options: { noOfRounds: number; duration?: number }
  ) {
    super(roomId, "trivia");
    this.noOfRounds = Math.min(
      options.noOfRounds,
      TriviaGame.maxNumberOfRounds
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
      .sample(triviaquestions, this.noOfRounds)
      .map((s) => {
        const options = [
          ...this.randomize.sample(
            s.options.filter((o) => o !== s.correctAnswer),
            3
          ),
          s.correctAnswer,
        ];
        return {
          question: s.question,
          choices: this.randomize.shuffle(options),
          answer: s.correctAnswer,
        };
      });
  }

  private initPlayerScores() {
    const room = RoomManager.get(this.roomId);
    if (!room) return;
    room.players.forEach((p) => {
      this._scores.set(p.id, {
        id: p.id,
        displayName: p.displayName,
        score: 0,
      });
    });
  }

  addPlayer(playerId: string) {
    const room = RoomManager.get(this.roomId);
    if (!room) return;

    const player = room.players.find((p) => p.id === playerId);
    if (!player) return;

    const score = this._scores.get(playerId);
    if (score) return;

    this._scores.set(player.id, {
      id: player.id,
      displayName: player.displayName,
      score: 0,
    });

    if (this.state === GameState.ROUND) {
      this.broadcast(WSEvent.TRIVIA_ROUND_START, {
        state: this.state,
        round: { ...this.round!, correctAnswer: null },
      });
    } else if (this.state === GameState.ROUND_END) {
      let counts = {
        0: 0,
        1: 0,
        2: 0,
        3: 0,
      };

      for (const { answer } of this.answers.values()) {
        counts[answer]++;
      }

      this.broadcast(WSEvent.TRIVIA_ROUND_END, {
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

  // -- Required override --
  public startGame() {
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
      correctAnswer: q?.answer!,
      answer: null,
    };
    this.roundTimer = setTimeout(() => {
      this.endRound();
    }, this.roundDuration);
    console.log("🚀 ~ TriviaGame ~ startRound ~ this.state:", this.state);

    this.broadcast(WSEvent.TRIVIA_ROUND_START, {
      state: this.state,
      round: { ...this.round, correctAnswer: null },
    });
  }

  public submitAnswer(playerId: string, answer: TriviaOptions) {
    const exists = this.answers.get(playerId);
    if (exists) return;
    const timeTaken = Date.now() - this.roundStartTime;
    this.answers.set(playerId, { answer, timeTaken });
    this.toPlayer(playerId, WSEvent.TRIVIA_ROUND_ANSWERED, {
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
    const correctIndex = q?.choices.indexOf(q.answer);
    const basePoints = 200;
    const timeBonusFactor = 0.5;

    for (const [playerId, answer] of this.answers) {
      if (answer.answer === correctIndex) {
        const bonus = Math.max(
          0,
          (1 - answer.timeTaken / this.roundDuration) *
            basePoints *
            timeBonusFactor
        );

        // Round to whole number
        const points = Math.round(basePoints + bonus);

        const currentScore = this._scores.get(playerId);
        if (!currentScore) continue;

        this._scores.set(playerId, {
          ...currentScore,
          score: currentScore.score + points,
        });
      }
    }

    let counts = {
      0: 0,
      1: 0,
      2: 0,
      3: 0,
    };

    for (const { answer } of this.answers.values()) {
      counts[answer]++;
    }

    this.broadcast(WSEvent.TRIVIA_ROUND_END, {
      state: this.state,
      round: this.round!,
      scores: this.scores.sort((a, b) => b.score - a.score),
      counts: counts,
    });

    setTimeout(() => this.showLeaderboard(), 5000);
  }

  private showLeaderboard() {
    if (++this.currentRound >= this.noOfRounds) {
      this.state = GameState.LEADERBOARD;
      this.broadcast(WSEvent.GAME_STATE, GameManager.toGameState(this.id)!);

      setTimeout(() => {
        this.state = GameState.RANKING;
        this.broadcast(WSEvent.GAME_STATE, GameManager.toGameState(this.id)!);

        const sorted = Array.from(this._scores.entries())
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
}

// export class TriviaGame {
//   private roomId: string;
//   static maxNumberOfRounds = 20;

//   public noOfRounds: number;
//   public data: DataItem[] = [];
//   public currentRound = 0;

//   private answers: {
//     playerId: string;
//     answer: 0 | 1 | 2 | 3;
//     timeTaken: number; // ms since round start
//   }[] = [];

//   private roundDuration: number; // milliseconds
//   private randomize = new Randomize();
//   private roundStartTime = 0;
//   private roundTimer?: NodeJS.Timeout;

//   public scores: { id: string; displayName: string; score: number }[] = [];

//   constructor(
//     roomId: string,
//     options: { noOfRounds: number; duration?: number } // duration in seconds
//   ) {
//     this.roomId = roomId;
//     this.noOfRounds = Math.min(options.noOfRounds, TriviaGame.maxNumberOfRounds);
//     this.roundDuration = (options.duration ?? 30) * 1000; // default 30s
//     this.selectQuestions();
//     this.initPlayerScores();
//     this.setupGame();
//   }

//   /** Randomly select and shuffle questions */
//   private selectQuestions() {
//     const selected = this.randomize
//       .sample(triviaquestions, this.noOfRounds)
//       .map((s) => {
//         const options = [
//           ...this.randomize.sample(
//             s.options.filter((o) => o !== s.correctAnswer),
//             3
//           ),
//           s.correctAnswer,
//         ];
//         return {
//           question: s.question,
//           choices: this.randomize.shuffle(options),
//           answer: s.correctAnswer,
//         };
//       });
//     this.data = selected;
//   }

//   /** Initialize player scores from active room */
//   private initPlayerScores() {
//     const room = RoomManager.get(this.roomId);
//     if (!room) return;

//     this.scores = room.players.map((p) => ({
//       id: p.id,
//       displayName: p.displayName,
//       score: 0,
//     }));
//   }

//   /** Prepare room UI state before the game begins */
//   private setupGame() {
//     RoomManager.updateState(this.roomId, {
//       uiState: "PLAYING",
//       gameState: "BEFORE",
//     });

//     const room = RoomManager.get(this.roomId);
//     if (room) room.game = this.toGame();
//   }

//   /** Start the game */
//   public startGame() {
//     this.currentRound = 0;
//     this.startRound();
//   }

//   /** Begin a round and broadcast the question */
//   private startRound() {
//     const q = this.data[this.currentRound];
//     this.answers = [];
//     this.roundStartTime = Date.now();

//     RoomManager.updateState(this.roomId, {
//       uiState: "PLAYING",
//       gameState: "ROUND",
//     });

//     const room = RoomManager.get(this.roomId);
//     if (room) {
//       room.game = this.toGame();
//       RoomManager.broadcast(this.roomId, "GAME_ROUND_STARTED", {
//         round: {
//           number: this.currentRound + 1,
//           totalRounds: this.noOfRounds,
//           question: q.question,
//           choices: q.choices,
//           duration: this.roundDuration / 1000,
//           startedAt: this.roundStartTime,
//         },
//       });
//     }

//     // Auto-end round when time runs out
//     this.roundTimer = setTimeout(() => {
//       if (RoomManager.get(this.roomId)?.state.gameState === "ROUND") {
//         this.endRound();
//       }
//     }, this.roundDuration);
//   }

//   /** Player submits answer */
//   public submitAnswer(playerId: string, answer: 0 | 1 | 2 | 3) {
//     const existing = this.answers.find((a) => a.playerId === playerId);
//     if (existing) return;

//     const timeTaken = Date.now() - this.roundStartTime;
//     this.answers.push({ playerId, answer, timeTaken });

//     if (this.answers.length === this.scores.length) {
//       if (this.roundTimer) clearTimeout(this.roundTimer);
//       this.endRound();
//     }
//   }

//   /** End current round, calculate scores, broadcast results */
//   private endRound() {
//     const q = this.data[this.currentRound];
//     const correctIndex = q.choices.indexOf(q.answer);

//     const basePoints = 1000;
//     const timeBonusFactor = 0.5; // 50% based on speed

//     for (const ans of this.answers) {
//       const player = this.scores.find((s) => s.id === ans.playerId);
//       if (!player) continue;

//       if (ans.answer === correctIndex) {
//         const timeScore =
//           Math.max(
//             0,
//             (1 - ans.timeTaken / this.roundDuration) * basePoints * timeBonusFactor
//           ) | 0;
//         player.score += basePoints + timeScore;
//       }
//     }

//     RoomManager.updateState(this.roomId, {
//       uiState: "PLAYING",
//       gameState: "ROUND_END",
//     });

//     RoomManager.broadcastToAll(this.roomId, "GAME_ROUND_ENDED", {
//       correctAnswer: q.answer,
//       scores: this.scores.sort((a, b) => b.score - a.score),
//     });

//     // Move to next round after short delay
//     setTimeout(() => this.nextRound(), 5000);
//   }

//   /** Proceed to next round or end the game */
//   private nextRound() {
//     this.currentRound += 1;

//     if (this.currentRound >= this.noOfRounds) {
//       return this.endGame();
//     }

//     this.startRound();
//   }

//   /** End game and broadcast final results */
//   private endGame() {
//     RoomManager.updateState(this.roomId, {
//       uiState: "ENDED",
//       gameState: "GAME_END",
//     });

//     RoomManager.broadcastToAll(this.roomId, "GAME_ENDED", {
//       finalScores: this.scores.sort((a, b) => b.score - a.score),
//     });

//     const room = RoomManager.get(this.roomId);
//     if (room) {
//       room.game = null;
//     }
//   }

//   /** Helper: Convert current state into `Game` object for Room */
//   private toGame(): Room["game"] {
//     return {
//       roomId: this.roomId,
//       noOfRounds: this.noOfRounds,
//       data: this.data,
//       currentRound: this.currentRound,
//       scores: this.scores,
//       randomize: this.randomize,
//     };
//   }
// }
