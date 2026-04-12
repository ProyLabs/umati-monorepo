import {
  GameState,
  GameType,
  type QuizzerQuestionInput,
  type QuizzerSetupState,
  QuizzerQuestionType,
  RoomState,
  type TriviaDataItem,
  TriviaOptions,
  type TriviaRound,
  type TruviaPlayerAnswer,
  WSEvent,
} from "@umati/ws";
import { GameManager } from "../game-manager";
import { RoomManager } from "../room-manager";
import { BaseGame } from "./base";

type QuizzerOptions = {
  noOfRounds?: number;
  duration?: number;
  questions?: QuizzerQuestionInput[];
};

export class QuizzerGame extends BaseGame {
  static maxNumberOfRounds = 50;

  public noOfRounds: number;
  public data: TriviaDataItem[] = [];
  public setup: QuizzerSetupState;
  public currentRound = 0;
  private answers: Map<string, TruviaPlayerAnswer> = new Map();
  public round?: TriviaRound | null;
  private rankingsSubmitted = false;

  constructor(roomId: string, options: QuizzerOptions) {
    super(roomId, GameType.QUIZZER);
    this.roundDuration = (options.duration ?? 30) * 1000;

    const normalizedQuestions = this.normalizeQuestions(options.questions ?? []);
    this.noOfRounds = Math.min(
      normalizedQuestions.length,
      options.noOfRounds ?? normalizedQuestions.length,
      QuizzerGame.maxNumberOfRounds,
    );
    this.setup = this.buildSetupState(
      normalizedQuestions.slice(0, this.noOfRounds),
    );

    this.initPlayerScores();
    this.state = GameState.ROUND_SETUP;
    this.setRoomState(RoomState.PLAYING);
    this.sendSetupState();
  }

  private normalizeQuestions(questions: QuizzerQuestionInput[]) {
    const uniqueQuestions = new Map<string, QuizzerQuestionInput>();

    for (const question of questions) {
      const normalizedQuestion = question.question.trim();
      if (!normalizedQuestion) continue;

      if (question.type === QuizzerQuestionType.TRUE_FALSE) {
        const normalizedAnswer =
          typeof question.correctAnswer === "boolean"
            ? question.correctAnswer
            : String(question.correctAnswer).trim().toLowerCase() === "true";

        uniqueQuestions.set(normalizedQuestion.toLowerCase(), {
          question: normalizedQuestion,
          type: QuizzerQuestionType.TRUE_FALSE,
          correctAnswer: normalizedAnswer,
        });
        continue;
      }

      const options = Array.from(
        new Set(
          (question.options ?? [])
            .map((option) => option.trim())
            .filter(Boolean),
        ),
      );

      if (options.length < 2 || options.length > 4) continue;

      const correctAnswer = String(question.correctAnswer).trim();
      if (!options.includes(correctAnswer)) continue;

      uniqueQuestions.set(normalizedQuestion.toLowerCase(), {
        question: normalizedQuestion,
        type: QuizzerQuestionType.SELECTION,
        options,
        correctAnswer,
      });
    }

    return Array.from(uniqueQuestions.values());
  }

  private buildSetupState(questions: QuizzerQuestionInput[]): QuizzerSetupState {
    return {
      questions,
      totalQuestions: questions.length,
      canStart: questions.length > 0,
    };
  }

  private buildPlayableQuestion(question: QuizzerQuestionInput): TriviaDataItem {
    if (question.type === QuizzerQuestionType.TRUE_FALSE) {
      const answerLabel = question.correctAnswer === true ? "True" : "False";
      const choices = this.randomize.shuffle(["True", "False"]);

      return {
        question: question.question,
        choices,
        answer: answerLabel,
      };
    }

    const choices = this.randomize.shuffle([...(question.options ?? [])]);
    return {
      question: question.question,
      choices,
      answer: String(question.correctAnswer),
    };
  }

  private rebuildRoundData() {
    this.data = this.setup.questions
      .slice(0, QuizzerGame.maxNumberOfRounds)
      .map((question) => this.buildPlayableQuestion(question));
    this.noOfRounds = this.data.length;
  }

  private initPlayerScores() {
    const room = RoomManager.get(this.roomId);
    if (!room) return;
    room.players.forEach((player) => {
      this.addPlayer(player.id);
    });
  }

  private resetScores() {
    this.gameScore = new Map(
      Array.from(this.gameScore.entries()).map(([playerId, score]) => [
        playerId,
        { ...score, score: 0 },
      ]),
    );
  }

  override addPlayer(playerId: string) {
    super.addPlayer(playerId);

    if (this.state === GameState.ROUND_SETUP) {
      this.broadcast(WSEvent.GAME_STATE, GameManager.toGameState(this.id)!);
      return;
    }

    if (this.state === GameState.ROUND) {
      this.broadcast(WSEvent.TRIVIA_ROUND_START, {
        state: this.state,
        round: { ...this.round!, correctAnswer: null },
      });
      return;
    }

    if (this.state === GameState.ROUND_END) {
      const counts = {
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
        counts,
      });
      return;
    }

    this.broadcast(WSEvent.GAME_STATE, GameManager.toGameState(this.id)!);
  }

  public syncSetup(questions: QuizzerQuestionInput[]) {
    const normalizedQuestions = this.normalizeQuestions(questions).slice(
      0,
      QuizzerGame.maxNumberOfRounds,
    );

    this.setup = this.buildSetupState(normalizedQuestions);
    this.noOfRounds = normalizedQuestions.length;
    this.currentRound = 0;
    this.round = null;
    this.sendSetupState();
  }

  private sendSetupState() {
    this.broadcast(WSEvent.GAME_STATE, GameManager.toGameState(this.id)!);
  }

  public startGame() {
    if (!this.setup.canStart) {
      this.sendSetupState();
      return;
    }

    this.currentRound = 0;
    this.rebuildRoundData();
    this.resetScores();
    this.rankingsSubmitted = false;
    this.state = GameState.ROUND;
    this.setRoomState(RoomState.PLAYING);
    this.startRound();
  }

  private startRound() {
    this.state = GameState.ROUND;
    const question = this.data[this.currentRound];
    this.answers = new Map();
    this.roundStartTime = Date.now();

    this.round = {
      number: this.currentRound + 1,
      totalRounds: this.noOfRounds,
      question: question?.question ?? "",
      choices: question?.choices ?? [],
      duration: this.roundDuration / 1000,
      startedAt: this.roundStartTime,
      correctAnswer: question?.answer ?? null,
      answer: null,
    };

    this.roundTimer = setTimeout(() => {
      this.endRound();
    }, this.roundDuration);

    this.broadcast(WSEvent.TRIVIA_ROUND_START, {
      state: this.state,
      round: { ...this.round, correctAnswer: null },
    });
  }

  public submitAnswer(playerId: string, answer: TriviaOptions) {
    const existingAnswer = this.answers.get(playerId);
    if (existingAnswer) return;

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
    const question = this.data[this.currentRound];
    const correctIndex = question?.choices.indexOf(question.answer);
    const basePoints = 200;
    const timeBonusFactor = 0.5;

    for (const [playerId, answer] of this.answers) {
      if (answer.answer === correctIndex) {
        const bonus = Math.max(
          0,
          (1 - answer.timeTaken / this.roundDuration) *
            basePoints *
            timeBonusFactor,
        );

        this.updateScore(playerId, Math.round(basePoints + bonus));
      }
    }

    const counts = {
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
      counts,
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
