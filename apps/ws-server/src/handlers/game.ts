import type { WebSocket } from "ws";
import { GameType, WSEvent, WSPayloads } from "@umati/ws";
import { RoomManager } from "../lib/room-manager";
import { logInfo } from "../utils/logger";
import { GameManager } from "../lib/game-manager";
import { FriendFactsGame } from "../lib/games/friend-facts";
import { CodenamesGame } from "../lib/games/codenames";
import { DrawItGame } from "../lib/games/drawit";
import { QuizzerGame } from "../lib/games/quizzer-game";

/** When host setup a new game */
export async function handleInitGame(
  ws: WebSocket,
  payload: { roomId: string; options: {
    type: GameType;
    config: Record<string, any>; // e.g. { noOfRounds: 10, duration: 30 }
  }; }
) {
  const { roomId, options } = payload;
const room = RoomManager.get(roomId);
  if (!room) return;

   // ensure only host can init the game
  if (!RoomManager.isHostSocket(roomId, ws)) {
    return ws.send(
      JSON.stringify({
        event: WSEvent.ERROR,
        payload: { message: "Only the host can initialize a game." },
      })
    );
  }
  try {
    

  const game = GameManager.create(roomId, options.type, options.config);
  if(!game) return;

  RoomManager.setGame(roomId, {id: game.id, type: options.type})
  } catch (error) {
    console.log("🚀 ~ handleInitGame ~ error:", error)
    
  }
  return;
}

/** When host starts a new game */
// export async function handleStartGame(
//   ws: WebSocket,
//   payload: { roomId: string }
// ) {
//   const { roomId } = payload;
//   GameManager.start(roomId);

//   ws.send(
//     JSON.stringify({
//       event: WSEvent.ROOM_STATE,
//       payload: RoomManager.toLobbyState(roomId),
//     })
//   );

//   return;
// }
export function handleStartGame(ws: WebSocket,  payload: WSPayloads[WSEvent.GAME_START]) {
  const { roomId } = payload;
  const room = RoomManager.get(roomId);
  if (!room?.game) return;

  if (!RoomManager.isHostSocket(roomId, ws)) {
    ws.send(
      JSON.stringify({
        event: WSEvent.ERROR,
        payload: { message: "Only the host can start the game." },
      })
    );
    return;
  }

  const game = GameManager.get(room.game.id);
  if (!game) return;

  game.startGame();
  // RoomManager.broadcast(roomId, WSEvent.GAME_STARTED, {
  //   roomId,
  //   game: room.game,
  // });
}

export function handleCancelGame(ws: WebSocket, payload: WSPayloads[WSEvent.GAME_CANCEL]) {
  const { roomId } = payload;
  const room = RoomManager.get(roomId);
  if (!room?.game) return;

  if (!RoomManager.isHostSocket(roomId, ws)) {
    ws.send(
      JSON.stringify({
        event: WSEvent.ERROR,
        payload: { message: "Only the host can end the game." },
      })
    );
    return;
  }

  const game = GameManager.get(room.game.id);
  if (!game) return;

  GameManager.remove(game.id);
  RoomManager.setGame(roomId, null);
}


/** When a player answers */
export async function handleGameAnswer(
  ws: WebSocket,
  payload: WSPayloads[
    | WSEvent.TRIVIA_ROUND_ANSWER
    | WSEvent.HM_ROUND_ANSWER
    | WSEvent.CH_ROUND_VOTE
    | WSEvent.FF_ROUND_ANSWER
    | WSEvent.CN_CARD_PICK
    | WSEvent.DI_GUESS
  ],
) {
    const roomId = payload.roomId;
    const playerId = payload.playerId;
    const answer = "answerPlayerId" in payload
      ? payload.answerPlayerId
      : "guess" in payload
        ? payload.guess
      : "cardId" in payload
        ? payload.cardId
        : payload.answer;
    const room = RoomManager.get(roomId);
    if(!room) return;
    if(!room.game) return;
    GameManager.submitAnswer(room.game.id, playerId, answer);
}

export async function handleFriendFactsSetupSubmit(
  ws: WebSocket,
  payload: WSPayloads[WSEvent.FF_SETUP_SUBMIT],
) {
  const { roomId, playerId, facts } = payload;
  const room = RoomManager.get(roomId);
  if (!room?.game) return;

  const game = GameManager.get(room.game.id);
  if (!game || game.type !== GameType.FF) return;

  (game as FriendFactsGame).submitFacts(playerId, facts);
}

export async function handleQuizzerSetupSync(
  ws: WebSocket,
  payload: WSPayloads[WSEvent.QZ_SETUP_SYNC],
) {
  const { roomId, questions } = payload;
  const room = RoomManager.get(roomId);
  if (!room?.game) return;

  if (!RoomManager.isHostSocket(roomId, ws)) {
    ws.send(
      JSON.stringify({
        event: WSEvent.ERROR,
        payload: { message: "Only the host can edit Quizzer setup." },
      }),
    );
    return;
  }

  const game = GameManager.get(room.game.id);
  if (!game || game.type !== GameType.QUIZZER) return;

  (game as QuizzerGame).syncSetup(questions);
}

export async function handleCodenamesSetSpymaster(
  ws: WebSocket,
  payload: WSPayloads[WSEvent.CN_SET_SPYMASTER],
) {
  const { roomId, playerId } = payload;
  const room = RoomManager.get(roomId);
  if (!room?.game) return;

  const game = GameManager.get(room.game.id);
  if (!game || game.type !== GameType.CN) return;

  const result = (game as CodenamesGame).toggleSpymaster(playerId);
  if (!result.success && result.error) {
    ws.send(
      JSON.stringify({
        event: WSEvent.ERROR,
        payload: { message: result.error },
      })
    );
  }
}

export async function handleCodenamesPassTurn(
  ws: WebSocket,
  payload: WSPayloads[WSEvent.CN_PASS_TURN],
) {
  const { roomId, playerId, team } = payload;
  const room = RoomManager.get(roomId);
  if (!room?.game) return;

  const game = GameManager.get(room.game.id);
  if (!game || game.type !== GameType.CN) return;

  (game as CodenamesGame).passTurn(playerId, team);
}

export async function handleDrawItWordPick(
  ws: WebSocket,
  payload: WSPayloads[WSEvent.DI_WORD_PICK],
) {
  const { roomId, playerId, word } = payload;
  const room = RoomManager.get(roomId);
  if (!room?.game) return;

  const game = GameManager.get(room.game.id);
  if (!game || game.type !== GameType.DRAWIT) return;

  (game as DrawItGame).pickWord(playerId, word);
}

export async function handleDrawItSegment(
  ws: WebSocket,
  payload: WSPayloads[WSEvent.DI_DRAW_SEGMENT],
) {
  const { roomId, playerId, segment } = payload;
  const room = RoomManager.get(roomId);
  if (!room?.game) return;

  const game = GameManager.get(room.game.id);
  if (!game || game.type !== GameType.DRAWIT) return;

  (game as DrawItGame).addSegment(playerId, segment);
}

export async function handleDrawItCanvasClear(
  ws: WebSocket,
  payload: WSPayloads[WSEvent.DI_CANVAS_CLEAR],
) {
  const { roomId, playerId } = payload;
  const room = RoomManager.get(roomId);
  if (!room?.game) return;

  const game = GameManager.get(room.game.id);
  if (!game || game.type !== GameType.DRAWIT) return;

  (game as DrawItGame).clearCanvas(playerId);
}

export async function handleGameStateChange(ws: WebSocket, payload: WSPayloads[WSEvent.GAME_STATE_CHANGE]|WSPayloads[WSEvent.CH_ROUND_STATE_CHANGE]) {
   const {roomId, state} = payload;
    const room = RoomManager.get(roomId);
    if(!room) return;
    if(!room.game) return;
    if (!RoomManager.isHostSocket(roomId, ws)) {
      ws.send(
        JSON.stringify({
          event: WSEvent.ERROR,
          payload: { message: "Only the host can change game state." },
        })
      );
      return;
    }
    GameManager.updateState(room.game.id, state, ws);
}
