import type { WebSocket } from "ws";
import { WSEvent, WSPayloads } from "@umati/ws";
import { prisma } from "@umati/prisma";
import { RoomManager } from "../lib/room-manager";
import { logInfo, logError } from "../utils/logger";
import { GameManager } from "../lib/game-manager";

export async function handleRoomInit(
  ws: WebSocket,
  payload: WSPayloads[WSEvent.ROOM_INIT],
  sid: string
) {
  const { roomId } = payload;

  try {
    // First check if the room already exists in memory
    if (RoomManager.has(roomId)) {
      const room = RoomManager.get(roomId)!;
      RoomManager.addHostSocket(roomId, sid, ws);
      logInfo(`🔁 Host reconnected to room ${roomId}`);

      // Send the latest room state back to host
      ws.send(
        JSON.stringify({
          event: WSEvent.ROOM_STATE,
          payload: RoomManager.toLobbyState(roomId),
        })
      );

      if (room.game) {
        const game = GameManager.get(room.game.id);
        if (!game) return;

        setTimeout(() => {
          ws.send(
            JSON.stringify({
              event: WSEvent.GAME_STATE,
              payload: GameManager.toGameState(game.id),
            })
          );
        }, 200);
      }
      return;
    }

    const lobby = await prisma.lobby.findUnique({
      where: { lobbyIdentifier: roomId },
      select: {
        id: true,
        name: true,
        code: true,
        lobbyIdentifier: true,
        maxPlayers: true,
        private: true,
        pin: true,
        createdAt: true,
      },
    });

    if (!lobby) {
      ws.send(
        JSON.stringify({
          event: WSEvent.NOT_FOUND,
          payload: { message: "Lobby not found" },
        })
      );
      return;
    }

    // Normalize meta shape for RoomManager
    const meta = {
      id: lobby.lobbyIdentifier,
      name: lobby.name,
      code: lobby.code,
      maxPlayers: lobby.maxPlayers,
      private: lobby.private,
      pin: lobby.pin,
      createdAt: lobby.createdAt,
      game: null, // Initialize game as null
    };

    const room = RoomManager.create(meta as any, sid, ws);

    logInfo(`🏠 Room ${room.meta.name} (${roomId}) initialized`);

    ws.send(
      JSON.stringify({
        event: WSEvent.ROOM_STATE,
        payload: RoomManager.toLobbyState(roomId),
      })
    );
  } catch (err) {
    logError("❌ Failed to init room", err);
    ws.send(
      JSON.stringify({
        event: WSEvent.ERROR,
        payload: { message: "Database error" },
      })
    );
  }
}

export async function handleRoomStateChange(
  ws: WebSocket,
  payload: WSPayloads[WSEvent.ROOM_STATE_CHANGE]
) {
  const { roomId, state } = payload;
  const room = RoomManager.updateState(roomId, state);
  if (!room) {
    logError("❌ Failed to update room state");
    ws.send(
      JSON.stringify({
        event: WSEvent.ERROR,
        payload: { message: "Room not found" },
      })
    );
    return;
  }
}

export async function handleRoomClose(
  ws: WebSocket,
  payload: WSPayloads[WSEvent.ROOM_CLOSED_ME],
  sid: string
) {
  const { roomId } = payload;
  await RoomManager.close(roomId, sid);
}
