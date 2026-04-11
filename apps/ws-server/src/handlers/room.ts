import type { WebSocket } from "ws";
import { GameType, WSEvent, WSPayloads } from "@umati/ws";
import { prisma } from "@umati/prisma";
import { RoomManager } from "../lib/room-manager";
import { logInfo, logError } from "../utils/logger";
import { GameManager } from "../lib/game-manager";
import { Chameleon } from "../lib/games/chameleon";
import { FriendFactsGame } from "../lib/games/friend-facts";
import { CodenamesGame } from "../lib/games/codenames";

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
          if (game.type === GameType.CHAMELEON) {
            (game as Chameleon).sendStateToSocket(ws, { isHost: true });
          } else if (game.type === GameType.FF) {
            (game as FriendFactsGame).sendStateToSocket({ isHost: true, ws });
          } else if (game.type === GameType.CN) {
            (game as CodenamesGame).sendStateToSocket({ isHost: true, ws });
          } else {
            ws.send(
              JSON.stringify({
                event: WSEvent.GAME_STATE,
                payload: GameManager.toGameState(game.id),
              })
            );
          }
        }, 200);
      }

      if (room.poll) {
        setTimeout(() => {
          ws.send(
            JSON.stringify({
              event: WSEvent.POLL_STATE,
              payload: { poll: RoomManager.toPollState(roomId) },
            })
          );
        }, 150);
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

export async function handlePollStart(
  ws: WebSocket,
  payload: WSPayloads[WSEvent.POLL_START]
) {
  const { roomId, question, options, allowMultiple } = payload;

  if (!RoomManager.isHostSocket(roomId, ws)) {
    ws.send(
      JSON.stringify({
        event: WSEvent.ERROR,
        payload: { message: "Only the host can start a poll." },
      })
    );
    return;
  }

  const poll = RoomManager.startPoll(roomId, question, options, allowMultiple);
  if (!poll) {
    ws.send(
      JSON.stringify({
        event: WSEvent.ERROR,
        payload: { message: "Poll needs one question and at least two options." },
      })
    );
    return;
  }
}

export async function handlePollEnd(
  ws: WebSocket,
  payload: WSPayloads[WSEvent.POLL_END]
) {
  const { roomId } = payload;

  if (!RoomManager.isHostSocket(roomId, ws)) {
    ws.send(
      JSON.stringify({
        event: WSEvent.ERROR,
        payload: { message: "Only the host can end a poll." },
      })
    );
    return;
  }

  RoomManager.endPoll(roomId);
}
