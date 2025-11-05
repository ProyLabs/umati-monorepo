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
      roomId,
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
    if (room.host.sockets.size === 0 && room.playerSockets.size ==0) {
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
    const game = GameManager.get(room.game?.id!);
    if(!game) return;
    game.addPlayer(player.id)

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

  broadcast<E extends WSEvent>(roomId: string, event: E, payload: WSPayloads[E & keyof WSPayloads]) {
    console.log("🚀 ~ event:", event);
    const room = rooms.get(roomId);
    if (!room) return;
    const data = JSON.stringify({ event, payload });
    
    console.log("🚀 ~ playerSockets Count:", room.playerSockets.size);
    for (const ws of room.playerSockets.values()) ws.send(data);
    for (const ws of room.host.sockets.values()) ws.send(data);
  },

  toHost<E extends WSEvent>(roomId: string, event: E, payload: WSPayloads[E & keyof WSPayloads]) {
    const room = rooms.get(roomId);
    if (!room) return;
    const data = JSON.stringify({ event, payload });
    for (const ws of room.host.sockets.values()) ws.send(data);
  },

   toPlayer<E extends WSEvent>(roomId: string, playerId: string, event: E, payload: WSPayloads[E & keyof WSPayloads]) {
    const room = rooms.get(roomId);
    if (!room) return;
    const data = JSON.stringify({ event, payload });
    const ws = room.playerSockets.get(playerId)
    if(ws) ws.send(data);
  },

  toPlayers<E extends WSEvent>(roomId: string, event: E, payload: WSPayloads[E & keyof WSPayloads]) {
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
  },
  submitGameResult(roomId:string, result: Scores) {
    const room = rooms.get(roomId);
    if (!room) return null;

  // Ensure all top players exist in rankings
  for (const player of result) {
    addNewRankings(room.rankings, player);
  }

  // Award medals based on placement
  if (result[0]) {
    const first = room.rankings.find((r) => r.id === result[0]!.id);
    if (first) first.gold++;
  }

  if (result[1]) {
    const second = room.rankings.find((r) => r.id === result[1]!.id);
    if (second) second.silver++;
  }

  if (result[2]) {
    const third = room.rankings.find((r) => r.id === result[2]!.id);
    if (third) third.bronze++;
  }

  console.log("Updated rankings:", room.rankings);
  RoomManager.broadcast(
    roomId,
    WSEvent.ROOM_STATE,
    RoomManager.toLobbyState(roomId)
  );
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
