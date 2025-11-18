import type { WebSocket } from "ws";
import { GameType, WSEvent, WSPayloads } from "@umati/ws";
import { RoomManager } from "../lib/room-manager";
import { logInfo } from "../utils/logger";
import { GameManager } from "../lib/game-manager";

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

  const game = GameManager.get(room.game.id);
  if (!game) return;

  GameManager.remove(game.id);
  RoomManager.setGame(roomId, null);
}


/** When a player answers */
export async function handleGameAnswer(ws: WebSocket, payload: WSPayloads[WSEvent.TRIVIA_ROUND_ANSWER| WSEvent.HM_ROUND_ANSWER|WSEvent.CH_ROUND_VOTE] ) {
    const {roomId, playerId, answer} = payload;
    const room = RoomManager.get(roomId);
    if(!room) return;
    if(!room.game) return;
    GameManager.submitAnswer(room.game.id, playerId, answer);
}

export async function handleGameStateChange(ws: WebSocket, payload: WSPayloads[WSEvent.GAME_STATE_CHANGE]|WSPayloads[WSEvent.CH_ROUND_STATE_CHANGE]) {
   const {roomId, state} = payload;
    const room = RoomManager.get(roomId);
    if(!room) return;
    if(!room.game) return;
    GameManager.updateState(room.game.id, state);
}