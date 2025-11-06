import type { WebSocket } from "ws";
import { GameLobbyMeta, Lobby, Player, Ranking, Room, RoomState, Scores, WSEvent, WSPayloads } from "@umati/ws";
import { GameManager } from "./game-manager";

const rooms = new Map<string, Room>();

export const RoomManager = {
  /** Create or re-init a room */
  create(lobby: Lobby, sid: string, ws: WebSocket) {
    const existing = rooms.get(lobby.id);

    if (existing) {
      existing.host.sockets.set(sid, ws);
      return existing;
    }

    const hostSockets = new Map<string, WebSocket>();
    hostSockets.set(sid, ws);

    const room: Room = {
      meta: lobby,
      state: "INIT",
      players: [],
      host: { sockets: hostSockets },
      playerSockets: new Map(),
      rankings: [],
      game: null,
    };

    rooms.set(lobby.id, room);
    return room;
  },

  get(roomId: string) {
    return rooms.get(roomId);
  },

  has(roomId: string) {
    return rooms.has(roomId);
  },

  close(roomId: string, sid: string) {
    const room = rooms.get(roomId);
    if (!room) return;
    const hosts = room.host.sockets;
    const host = hosts.get(sid);
    if (!host) return;
    RoomManager.broadcast(roomId, WSEvent.ROOM_CLOSED, {
      roomId,
      reason: "Host closed the room",
    });
    rooms.delete(roomId);
  },

  isHostSocket(roomId: string, ws: WebSocket) {
    const room = rooms.get(roomId);
    if (!room) return false;
    return Array.from(room.host.sockets.values()).includes(ws);
  },

  addHostSocket(roomId: string, sid: string, ws: WebSocket) {
    const room = rooms.get(roomId);
    if (!room) return;
    room.host.sockets.set(sid, ws);
  },

  removeHostSocket(roomId: string, sid: string) {
    const room = rooms.get(roomId);
    if (!room) return;
    room.host.sockets.delete(sid);
    if (room.host.sockets.size === 0 && room.playerSockets.size === 0) {
      rooms.delete(roomId);
    }
  },

  addPlayer(roomId: string, player: Player, ws: WebSocket) {
    const room = rooms.get(roomId);
    if (!room) return;

    const existing = room.players.find((p) => p.id === player.id);
    if (existing) {
      existing.connected = true;
      existing.avatar = player.avatar ?? existing.avatar;
      existing.displayName = player.displayName ?? existing.displayName;
    } else {
      room.players.push(player);
      addNewRankings(room.rankings, player);
    }

    // 🛠️ FIX: Always replace player's socket (handles reconnections)
    room.playerSockets.set(player.id, ws);

    const game = GameManager.get(room.game?.id!);
    if (game) {
      game.addPlayer(player.id);
    }
  },

  removePlayer(roomId: string, playerId: string, full = false) {
    const room = rooms.get(roomId);
    if (!room) return;
    const player = room.players.find((p) => p.id === playerId);
    if (player && !full) {
      player.connected = false;
    } else {
      room.players = room.players.filter((p) => p.id !== playerId);
    }
    room.playerSockets.delete(playerId);
  },

  // 🛠️ FIX: Safe broadcast with cleanup
  broadcast<E extends WSEvent>(
    roomId: string,
    event: E,
    payload: WSPayloads[E & keyof WSPayloads]
  ) {
    const room = rooms.get(roomId);
    if (!room) return;
    const data = JSON.stringify({ event, payload });

    const pruneClosed = <T extends Map<any, WebSocket>>(map: T) => {
      for (const [key, ws] of map.entries()) {
        if (ws.readyState === ws.OPEN) {
          try {
            ws.send(data);
          } catch (err) {
            console.warn(`⚠️ Send failed to ${key}:`, err);
          }
        } else {
          console.log(`🧹 Removing closed socket ${key}`);
          map.delete(key);
        }
      }
    };

    pruneClosed(room.playerSockets);
    pruneClosed(room.host.sockets);
  },

  toHost<E extends WSEvent>(
    roomId: string,
    event: E,
    payload: WSPayloads[E & keyof WSPayloads]
  ) {
    const room = rooms.get(roomId);
    if (!room) return;
    const data = JSON.stringify({ event, payload });
    for (const [sid, ws] of room.host.sockets) {
      if (ws.readyState === ws.OPEN) {
        ws.send(data);
      }
    }
  },

  toPlayer<E extends WSEvent>(
    roomId: string,
    playerId: string,
    event: E,
    payload: WSPayloads[E & keyof WSPayloads]
  ) {
    const room = rooms.get(roomId);
    if (!room) return;
    const ws = room.playerSockets.get(playerId);
    if (ws && ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ event, payload }));
    } else {
      // 🛠️ FIX: cleanup stale socket
      room.playerSockets.delete(playerId);
    }
  },

  toPlayers<E extends WSEvent>(
    roomId: string,
    event: E,
    payload: WSPayloads[E & keyof WSPayloads]
  ) {
    const room = rooms.get(roomId);
    if (!room) return;
    const data = JSON.stringify({ event, payload });
    for (const [id, ws] of room.playerSockets) {
      if (ws.readyState === ws.OPEN) {
        ws.send(data);
      } else {
        room.playerSockets.delete(id);
      }
    }
  },

  toLobbyState(roomId: string) {
    const room = rooms.get(roomId);
    if (!room) return null;
    return {
      ...room.meta,
      state: room.state,
      players: room.players,
      rankings: room.rankings.filter((r) =>
        room.players.some((p) => p.id === r.id)
      ),
      game: room.game,
    };
  },

  getAllRooms() {
    return rooms.entries();
  },

  updateState(roomId: string, state: RoomState) {
    const room = rooms.get(roomId);
    if (!room) return;
    room.state = state;
    RoomManager.broadcast(roomId, WSEvent.ROOM_STATE, RoomManager.toLobbyState(roomId));
    return room;
  },

  setGame(roomId: string, meta: GameLobbyMeta | null) {
    const room = rooms.get(roomId);
    if (!room) return;
    if (meta) {
      room.game = meta;
      room.state = "PLAYING";
    } else {
      room.game = null;
      room.state = "LOBBY";
    }
    RoomManager.broadcast(roomId, WSEvent.ROOM_STATE, RoomManager.toLobbyState(roomId));
  },

  submitGameResult(roomId: string, result: Scores) {
    const room = rooms.get(roomId);
    if (!room) return null;

    for (const player of result) addNewRankings(room.rankings, player);

    if (result[0]) room.rankings.find((r) => r.id === result[0]!.id)!.gold++;
    if (result[1]) room.rankings.find((r) => r.id === result[1]!.id)!.silver++;
    if (result[2]) room.rankings.find((r) => r.id === result[2]!.id)!.bronze++;

    RoomManager.broadcast(roomId, WSEvent.ROOM_STATE, RoomManager.toLobbyState(roomId));
  },
};

const addNewRankings = (rankings: Ranking[], player: { id: string; displayName: string }) => {
  const exists = rankings.find((r) => r.id === player.id);
  if (exists) return;
  rankings.push({ id: player.id, displayName: player.displayName, gold: 0, silver: 0, bronze: 0 });
};
