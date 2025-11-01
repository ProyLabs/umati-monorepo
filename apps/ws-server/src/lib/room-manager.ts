import type { WebSocket } from "ws";
import { GameLobbyMeta, Lobby, Player, Ranking, Room, RoomState, WSEvent } from "@umati/ws";
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
      game: null
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
      reason: "Host closed the room",
    });
    rooms.delete(roomId);
  },

  /** Returns whether this socket belongs to a host */
  isHostSocket(roomId: string, ws: WebSocket) {
    const room = rooms.get(roomId);
    if (!room) return false;
    return Array.from(room.host.sockets.values()).includes(ws);
  },

  /** Attach an additional host socket (for reconnection or multi-screen host) */
  addHostSocket(roomId: string, sid: string, ws: WebSocket) {
    const room = rooms.get(roomId);
    if (!room) return;
    room.host.sockets.set(sid, ws);
  },

  /** Remove host socket on disconnect */
  removeHostSocket(roomId: string, sid: string) {
    const room = rooms.get(roomId);
    if (!room) return;
    room.host.sockets.delete(sid);

    // Optionally remove the room entirely if no hosts remain
    if (room.host.sockets.size === 0) {
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
      addNewRankings(room.rankings, player)
    }

    room.playerSockets.set(player.id, ws);
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

  broadcast(roomId: string, event: WSEvent, payload: any) {
    console.log("🚀 ~ event:", event);
    const room = rooms.get(roomId);
    if (!room) return;
    const data = JSON.stringify({ event, payload });

    for (const ws of room.playerSockets.values()) ws.send(data);
    for (const ws of room.host.sockets.values()) ws.send(data);
  },

  toHost(roomId: string, event: WSEvent, payload: any) {
    const room = rooms.get(roomId);
    if (!room) return;
    const data = JSON.stringify({ event, payload });
    for (const ws of room.host.sockets.values()) ws.send(data);
  },

  toPlayers(roomId: string, event: WSEvent, payload: any) {
    const room = rooms.get(roomId);
    if (!room) return;
    const data = JSON.stringify({ event, payload });
    for (const ws of room.playerSockets.values()) ws.send(data);
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
      game: room.game
    };
  },
  getAllRooms() {
    return rooms.entries();
  },
  updateState(roomId: string, state: RoomState) {
    const room = rooms.get(roomId);
    if (!room) return;

    room.state = state;

    RoomManager.broadcast(
      roomId,
      WSEvent.ROOM_STATE,
      RoomManager.toLobbyState(roomId)
    );

    return room;
  },
  setGame(roomId: string, meta: GameLobbyMeta | null){
    const room = rooms.get(roomId);
    if (!room) return;
    if(meta){
      room.game = meta;
      room.state = 'PLAYING';
    } else {
      room.game = null;
      room.state = 'LOBBY'
    }
   RoomManager.broadcast(roomId, WSEvent.ROOM_STATE, RoomManager.toLobbyState(roomId))
  }
};

const addNewRankings = (
  rankings: Ranking[],
  player: { id: string; displayName: string }
) => {
  const exists = rankings.find((r) => r.id === player.id);
  if (exists) return;

  rankings.push({
    id: player.id,
    displayName: player.displayName,
    gold: 0,
    silver: 0,
    bronze: 0,
  });
};
