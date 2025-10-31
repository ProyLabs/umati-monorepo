import { nanoid } from "nanoid";
import { triviaquestions } from "./trivia-questions";
import { Randomize } from "js-randomize";
import { RoomManager } from "./room-manager";

type GameType = "trivia";

interface Game {
  id: string;
  gameType: GameType;
  game: TriviaGame;
  roomId: string;
  scores: { id: string; score: number }[];
}

// interface TriviaGame {
//   id: string;
//   gameCode: string;
//   noOfRounds: number;
//   gameState: "";
//   rounds: TriviaGameRound[];
// }

// interface TriviaGameRound {
//   duration: number;
//   data: {
//     question: string;
//     choices: string[];
//     answer: string;
//   };
// }

const games = new Map<string, TriviaGame>();

export const GameManager = {
  create(roomId: string, gameType: GameType, payload: any) {
    const existing = games.get(roomId);
    if (existing) return existing;

    const game = new TriviaGame(roomId, payload);
    games.set(roomId, game);
    return game;
  },
  get(roomId: string) {
    return games.get(roomId) ?? null;
  },
  start(roomId: string) {
    const existing = games.get(roomId);
    if (!existing) return;
    existing.startGame();
    return;
  },
  submitAnswer(roomId: string, playerId: string, answer: 0|1|2|3){
    const existing = games.get(roomId);
    if (!existing) return;
    existing.submitAnswer(playerId, answer)

  }
};

export class TriviaGame {
  private roomId: string;
  static maxNumberOfRounds = 20;
  public noOfRounds: number = 10;
  private data: {
    question: string;
    choices: string[];
    answer: string;
  }[] = [];
  private currentRound = 0;
  public scores: { id: string; score: number }[] = [];
  // private timerRef:  NodeJS.Timeout;
  private answers: {playerId: string, answer: 0|1|2|3}[] =[]

  private randomize = new Randomize();

  constructor(roomId: string, options: { noOfRounds: number }) {
    this.roomId = roomId;
    this.noOfRounds = Math.min(
      options.noOfRounds,
      TriviaGame.maxNumberOfRounds
    );
    this.selectQuestions();
    this.initPlayerScores();
    this.setupGame();
  }

  private selectQuestions() {
    const questions = triviaquestions;
    const selected = this.randomize
      .sample(questions, this.noOfRounds)
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
    this.data = selected;
  }

  private initPlayerScores() {
    const room = RoomManager.get(this.roomId);
    if (!room) return;
    const players = room?.players;
    this.scores = players?.map((p) => ({
      id: p.id,
      score: 0,
    }));
  }

  private setupGame() {
    const room = RoomManager.get(this.roomId);
    if (!room) return;

    RoomManager.updateState(this.roomId, {
      uiState: "PLAYING",
      gameState: "BEFORE",
    });
  }

  public startGame() {
    const room = RoomManager.get(this.roomId);
    if (!room) return;
    RoomManager.updateState(this.roomId, {
      uiState: "PLAYING",
      gameState: "ROUND",
    });
     setTimeout(() => {
      RoomManager.updateState(this.roomId, {
        uiState: "PLAYING",
        gameState: "ROUND_END",
      });
    }, 30000);
  }

  public nextRound() {
    const room = RoomManager.get(this.roomId);
    if (!room) return;

    if (this.currentRound >= this.noOfRounds - 1) {
      RoomManager.updateState(this.roomId, {
        uiState: "PLAYING",
        gameState: "GAME_END",
      });
      setTimeout(() => {
        RoomManager.updateState(this.roomId, {
          uiState: "ENDED",
          gameState: "GAME_END",
        });
      }, 3000);
      setTimeout(() => {
        RoomManager.updateState(this.roomId, {
          uiState: "LOBBY",
          gameState: "GAME_END",
        });
      }, 3000);
      return;
    }

    this.currentRound += 1;
    RoomManager.updateState(this.roomId, {
      uiState: "PLAYING",
      gameState: "ROUND",
    });
    setTimeout(() => {
       const room = RoomManager.get(this.roomId);
      if(room?.state.gameState === 'ROUND') {
          this.endRound()
      }
    }, 30000);
  }

  public submitAnswer(playerId: string, answer: 0|1|2|3){
    const exists = this.answers.find((a)=> a.playerId === playerId);
    if(exists) return;
    this.answers.push({
      playerId,
      answer
    })

    if (this.answers.length === this.scores.length){
      this.endRound();
    }
  }

  public endRound(){

    




     RoomManager.updateState(this.roomId, {
        uiState: "PLAYING",
        gameState: "ROUND_END",
      });
    
  }
}
