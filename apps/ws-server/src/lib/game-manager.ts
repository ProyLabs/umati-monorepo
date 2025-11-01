
export type GameType = "trivia" | "emojiRace" | "bibleQuest";

import { BaseGame } from "./games/base";
import { TriviaGame } from "./games/trivia-game";


const games = new Map<string, BaseGame>();

export const GameManager = {
  create(roomId: string, type: GameType, options: any) {
    let game: BaseGame;
    switch (type) {
      case "trivia":
        game = new TriviaGame(roomId, options);
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

