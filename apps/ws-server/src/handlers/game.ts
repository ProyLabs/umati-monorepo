import type { WebSocket } from "ws";
import { WSEvent, WSPayloads } from "@umati/ws";
import { RoomManager } from "../lib/room-manager";
import { logInfo } from "../utils/logger";
import { GameManager } from "../lib/game-manager";

/** When host setup a new game */
export async function handleInitGame(
  ws: WebSocket,
  payload: { roomId: string; options: {
    type: "trivia" | "emojiRace" | "bibleQuest";
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


  const game = GameManager.create(roomId, options.type, options.config);
  if(!game) return;

  RoomManager.setGame(roomId, {id: game.id, type: options.type})
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
export function handleStartGame(ws: WebSocket, payload: { roomId: string }) {
  const { roomId } = payload;
  const room = RoomManager.get(roomId);
  if (!room?.game) return;

  const game = GameManager.get(room.game.id);
  if (!game) return;

  game.startGame();
  RoomManager.broadcast(roomId, WSEvent.GAME_STARTED, {
    roomId,
    game: room.game,
  });
}


/** When a player answers */
export async function handleGameAnswer(ws: WebSocket, payload: WSPayloads[WSEvent.GAME_ANSWER]) {
    const {roomId, playerId, answer} = payload;
    // GameManager.submitAnswer(roomId, playerId, answer);
}