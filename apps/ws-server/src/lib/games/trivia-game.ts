import {
  GameState,
  QuestionProfile,
  TruviaPlayerAnswer,
  RoomState,
  TriviaOptions,
  TriviaRound,
  WSEvent,
  type TriviaDataItem
} from "@umati/ws";
import { GameManager } from "../game-manager";
import { RoomManager } from "../room-manager";
import { BaseGame } from "./base";
import { triviaquestions } from "./trivia-questions";
import { getTriviaQuestionPool } from "./question-profiles";

export class TriviaGame extends BaseGame {
  static maxNumberOfRounds = 20;
  private static recentQuestionKeys: string[] = [];

  public noOfRounds: number;
  public data: TriviaDataItem[] = [];
  public currentRound = 0;
  private answers: Map<string, TruviaPlayerAnswer> = new Map();
  public round?: TriviaRound | null;
  private rankingsSubmitted = false;
  public questionProfile: QuestionProfile;

 

  constructor(
    roomId: string,
    options: {
      noOfRounds: number;
      duration?: number;
      questionProfile?: QuestionProfile;
    }
  ) {
    super(roomId, "trivia");
    this.noOfRounds = Math.min(
      options.noOfRounds,
      TriviaGame.maxNumberOfRounds
    );
    this.roundDuration = (options.duration ?? 30) * 1000;
    this.questionProfile = options.questionProfile ?? QuestionProfile.GLOBAL;
    this.init();
  }

  private init() {
    this.selectQuestions();
    this.initPlayerScores();
  }

  private static normalizeQuestion(question: string) {
    return question.trim().toLowerCase();
  }

  private selectQuestions() {
    const questionPool = getTriviaQuestionPool(
      triviaquestions,
      this.questionProfile,
    );

    const uniqueQuestions = Array.from(
      new Map(
        questionPool.map((question) => [
          TriviaGame.normalizeQuestion(question.question),
          question,
        ]),
      ).values(),
    );

    const roundCount = Math.min(this.noOfRounds, uniqueQuestions.length);
    const recentQuestionKeys = new Set(TriviaGame.recentQuestionKeys);
    const freshQuestions = uniqueQuestions.filter(
      (question) =>
        !recentQuestionKeys.has(
          TriviaGame.normalizeQuestion(question.question),
        ),
    );

    const selectedQuestions = [
      ...this.randomize.sample(
        freshQuestions,
        Math.min(roundCount, freshQuestions.length),
      ),
    ];

    if (selectedQuestions.length < roundCount) {
      const selectedKeys = new Set(
        selectedQuestions.map((question) =>
          TriviaGame.normalizeQuestion(question.question),
        ),
      );
      const fallbackPool = uniqueQuestions.filter(
        (question) =>
          !selectedKeys.has(TriviaGame.normalizeQuestion(question.question)),
      );

      selectedQuestions.push(
        ...this.randomize.sample(
          fallbackPool,
          roundCount - selectedQuestions.length,
        ),
      );
    }

    this.noOfRounds = selectedQuestions.length;
    this.data = selectedQuestions.map((question) => {
      const wrongAnswers = Array.from(
        new Set(question.options.filter((option) => option !== question.correctAnswer)),
      );
      const options = [
        ...this.randomize.sample(wrongAnswers, Math.min(3, wrongAnswers.length)),
        question.correctAnswer,
      ];

      return {
        question: question.question,
        choices: this.randomize.shuffle(options),
        answer: question.correctAnswer,
      };
    });

    TriviaGame.recentQuestionKeys.push(
      ...selectedQuestions.map((question) =>
        TriviaGame.normalizeQuestion(question.question),
      ),
    );

    if (TriviaGame.recentQuestionKeys.length > uniqueQuestions.length) {
      TriviaGame.recentQuestionKeys = TriviaGame.recentQuestionKeys.slice(
        -uniqueQuestions.length,
      );
    }
  }

  private initPlayerScores() {
    const room = RoomManager.get(this.roomId);
    if (!room) return;
    room.players.forEach((p) => {
      this.addPlayer(p.id);
    });
  }

  override addPlayer(playerId: string) {
    super.addPlayer(playerId);

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
      this.endRound();
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

        this.updateScore(playerId, points)
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

    RoomManager.submitGameResult(this.roomId, sorted);
  }
}
