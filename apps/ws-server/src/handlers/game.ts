import type { WebSocket } from "ws";
import { WSEvent, WSPayloads } from "@umati/ws";
import { RoomManager } from "../lib/room-manager";
import { logInfo } from "../utils/logger";
import { GameManager } from "../lib/game-manager";

/** When host setup a new game */
export async function handleInitGame(
  ws: WebSocket,
  payload: { roomId: string; options: any }
) {
  const { roomId, options } = payload;
  GameManager.create(roomId, "trivia", options);

  ws.send(
    JSON.stringify({
      event: WSEvent.ROOM_STATE,
      payload: RoomManager.toLobbyState(roomId),
    })
  );

  return;
}

/** When host starts a new game */
export async function handleStartGame(
  ws: WebSocket,
  payload: { roomId: string }
) {
  const { roomId } = payload;
  GameManager.start(roomId);

  ws.send(
    JSON.stringify({
      event: WSEvent.ROOM_STATE,
      payload: RoomManager.toLobbyState(roomId),
    })
  );

  return;
}

/** When a player answers */
export async function handleGameAnswer(ws: WebSocket, payload: WSPayloads[WSEvent.GAME_ANSWER]) {
    const {roomId, playerId, answer} = payload;
    GameManager.submitAnswer(roomId, playerId, answer);
}