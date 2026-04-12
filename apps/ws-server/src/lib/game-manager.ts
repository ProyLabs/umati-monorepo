import type { WebSocket } from "ws";
import {
  HerdMentalityOptions,
  TriviaOptions,
  GameType,
  GameState,
} from "@umati/ws";
import { BaseGame } from "./games/base";
import { TriviaGame } from "./games/trivia-game";
import { HerdMentality } from "./games/herd-mentality";
import { Chameleon } from "./games/chameleon";
import { QuizzerGame } from "./games/quizzer-game";
import { FriendFactsGame } from "./games/friend-facts";
import { CodenamesGame } from "./games/codenames";
import { DrawItGame } from "./games/drawit";

const games = new Map<string, BaseGame>();

export const GameManager = {
  create(roomId: string, type: GameType, options: any) {
    let game: BaseGame;
    switch (type) {
      case GameType.TRIVIA:
        game = new TriviaGame(roomId, options);
        break;
      case GameType.QUIZZER:
        game = new QuizzerGame(roomId, options);
        break;
      case GameType.HM:
        game = new HerdMentality(roomId, options);
        break;
      case GameType.CHAMELEON:
        game = new Chameleon(roomId, options);
        break;
      case GameType.FF:
        game = new FriendFactsGame(roomId, options);
        break;
      case GameType.DRAWIT:
        game = new DrawItGame(roomId, options);
        break;
      case GameType.CN:
        game = new CodenamesGame(roomId, options);
        break;
      // case "emojiRace": game = new EmojiRaceGame(roomId, options); break;
      default:
        throw new Error(`Unsupported game type: ${type}`);
    }
    games.set(game.id, game);
    return game;
  },

  get(gameId: string) {
    return games.get(gameId) ?? null;
  },

  remove(gameId: string) {
    games.delete(gameId);
  },

  toGameState(gameId: string) {
    const game = games.get(gameId);
    if (!game) return null;
    return {
      id: game.id,
      type: game.type,
      state: game.state,
      round: (game as TriviaGame | HerdMentality | Chameleon | QuizzerGame | FriendFactsGame | CodenamesGame | DrawItGame).round,
      setup: (game as QuizzerGame & { setup?: unknown }).setup ?? undefined,
      scores: game.scores,
    };
  },

  submitAnswer(
    gameId: string,
    playerId: string,
    answer: TriviaOptions | HerdMentalityOptions | string
  ) {
    const game = games.get(gameId);
    if (!game) return;

    if (game.type === GameType.TRIVIA || game.type === GameType.QUIZZER) {
      const triviaGame = game as TriviaGame | QuizzerGame;
      triviaGame.submitAnswer(playerId, answer as TriviaOptions);
    } else if (game.type === GameType.FF) {
      const friendFactsGame = game as FriendFactsGame;
      friendFactsGame.submitAnswer(playerId, answer as string);
    } else if (game.type === GameType.DRAWIT) {
      const drawItGame = game as DrawItGame;
      drawItGame.submitGuess(playerId, answer as string);
    } else if (game.type === GameType.CN) {
      const codenamesGame = game as CodenamesGame;
      codenamesGame.pickCard(playerId, answer as string);
    } else if (game.type === GameType.HM) {
      const herdMentalityGame = game as HerdMentality;
      herdMentalityGame.submitAnswer(playerId, answer as HerdMentalityOptions);
    } else if (game.type === GameType.CHAMELEON){
      const chameleonGame = game as Chameleon;
      chameleonGame.castVote(playerId, answer as string);
    }
  },

  updateState(gameId: string, state: GameState, hostWs?: WebSocket) {
    const game = games.get(gameId);
    if (!game) return;

    if (
      game.type === GameType.TRIVIA ||
      game.type === GameType.QUIZZER ||
      game.type === GameType.FF
      || game.type === GameType.DRAWIT
      || game.type === GameType.CN
    ) {
      const roundGame = game as
        | TriviaGame
        | QuizzerGame
        | FriendFactsGame
        | DrawItGame
        | CodenamesGame;
      if (game.type === GameType.CN) {
        (roundGame as CodenamesGame).advanceToState(state, hostWs);
      } else if (game.type === GameType.DRAWIT) {
        (roundGame as DrawItGame).advanceToState(state);
      } else {
        roundGame.advanceToState(state);
      }
      return;
    }

    if (game.type === GameType.HM) {
      const herdMentalityGame = game as HerdMentality & { advanceToState: (state: GameState) => void };
      herdMentalityGame.advanceToState(state);
      return;
    }

    if (game.type === GameType.CHAMELEON) {
      const chameleonGame = game as Chameleon;
        switch (state) {
          case GameState.SPEAKING:
            chameleonGame.startSpeaking()
            break;
          case GameState.VOTING:
            chameleonGame.startVoting()
          default:
            break;
        }
     }

  },
};

// export const GameManager = {
//   create(roomId: string, gameType: GameType, payload: any) {
//     const existing = games.get(roomId);
//     if (existing) return existing;

//     const game = new TriviaGame(roomId, payload);
//     games.set(roomId, game);
//     return game;
//   },
//   get(roomId: string) {
//     return games.get(roomId) ?? null;
//   },
//   start(roomId: string) {
//     const existing = games.get(roomId);
//     if (!existing) return;
//     existing.startGame();
//     return;
//   },
//   submitAnswer(roomId: string, playerId: string, answer: 0|1|2|3){
//     const existing = games.get(roomId);
//     if (!existing) return;
//     existing.submitAnswer(playerId, answer)

//   }
// };
