import type { WebSocket } from "ws";
import { WSEvent, WSPayloads } from "@umati/ws";
import { RoomManager } from "../lib/room-manager";
import { logInfo } from "../utils/logger";

/** When a player connects to a room */
export async function handlePlayerConnect(
  ws: WebSocket,
  payload: { roomId: string; playerId: string }
) {
  const { roomId, playerId } = payload;
  const room = RoomManager.get(roomId);

  if (!room) {
    ws.send(
      JSON.stringify({
        event: WSEvent.ERROR,
        payload: { message: "Room not found" },
      })
    );
    return;
  }

  ws.send(
    JSON.stringify({
      event: WSEvent.ROOM_STATE,
      payload: RoomManager.toLobbyState(roomId),
    })
  );

  return;
}

/**
 * When a player joins a room
 */
export async function handlePlayerJoin(
  ws: WebSocket,
  payload: {
    roomId: string;
    playerId: string;
    displayName: string;
    avatar: string;
  }
) {
  const { roomId, playerId, displayName, avatar } = payload;
  const room = RoomManager.get(roomId);

  if (!room) {
    ws.send(
      JSON.stringify({
        event: WSEvent.ERROR,
        payload: { message: "Room not found" },
      })
    );
    return;
  }

  RoomManager.addPlayer(
    roomId,
    {
      id: playerId,
      displayName,
      avatar,
      connected: true,
    },
    ws
  );
  logInfo(`👤 Player ${displayName || playerId} joined room ${roomId}`);

  RoomManager.toHost(roomId, WSEvent.PLAYER_JOIN, {
    playerId,
    displayName,
    avatar,
  });
  RoomManager.broadcast(
    roomId,
    WSEvent.ROOM_STATE,
    RoomManager.toLobbyState(roomId)
  );
}

// /**
//  * Player reconnects (e.g., refresh)
//  */
// export async function handlePlayerConnected(
//   ws: WebSocket,
//   payload: { roomId: string; playerId: string }
// ) {
//   const { roomId, playerId } = payload;
//   const room = RoomManager.get(roomId);
//   if (!room) return;

//   RoomManager.addPlayer(roomId, playerId, ws);
//   logInfo(`🔁 Player ${playerId} reconnected to room ${roomId}`);

//   ws.send(
//     JSON.stringify({ event: WSEvent.PLAYER_CONNECTED, payload: { playerId } })
//   );
// }

/**
 * When a player leaves
 */
export async function handlePlayerLeft(
  ws: WebSocket,
  payload: { roomId: string; playerId: string }
) {
  const { roomId, playerId } = payload;
  const room = RoomManager.get(roomId);
  if (!room) return;

  RoomManager.removePlayer(roomId, playerId, true);
  logInfo(`🚪 Player ${playerId} left room ${roomId}`);

  RoomManager.broadcast(roomId, WSEvent.ROOM_STATE, RoomManager.toLobbyState(roomId));
  ws.send(
      JSON.stringify({
        event: WSEvent.ROOM_STATE,
        payload: RoomManager.toLobbyState(roomId)
      })
    );
}


/** When a player sends a reaction */
export async function handlePlayerReaction(ws: WebSocket, payload: WSPayloads[WSEvent.PLAYER_REACTION]){
  const {roomId, playerId, emoji } = payload;
    const room = RoomManager.get(roomId);
  if (!room) return;
  logInfo(`🚪 Player ${playerId} reacted ${emoji}`);

  RoomManager.toHost(roomId, WSEvent.PLAYER_REACTION, payload)

}