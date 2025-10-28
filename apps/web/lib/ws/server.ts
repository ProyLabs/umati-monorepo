import { WebSocketServer, WebSocket } from "ws";
import { WSEvent } from "./events";

type Room = {
  players: Map<string, WebSocket>; // playerId → socket
  hosts: Set<WebSocket>;           // host sockets (usually 1)
};

class WSServer {
  private static instance: WSServer;
  private wss: WebSocketServer | null = null;
  private rooms: Map<string, Room> = new Map();
  private reactionTimestamps = new Map<string, number>();

  // 🧠 Singleton
  static getInstance(): WSServer {
    if (!this.instance) this.instance = new WSServer();
    return this.instance;
  }

  // --------------------------------------------------------------------------
  // 🛰️ Core Server + Room Management
  // --------------------------------------------------------------------------

  /** Get or create the global WebSocket server */
  getServer() {
    if (!this.wss) this.wss = new WebSocketServer({ noServer: true });
    return this.wss;
  }

  /** Ensure a room exists (creates it if not found) */
  ensureRoom(roomId: string): Room {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, { players: new Map(), hosts: new Set() });
    }
    return this.rooms.get(roomId)!;
  }

  /** Add a player to a room */
/** Add or reattach a player to a room */
joinPlayer(roomId: string, playerId: string, socket: WebSocket) {
  const room = this.ensureRoom(roomId);

  const existing = room.players.get(playerId);

  // 🔁 Reconnection path
  if (existing) {
    console.log(`🔄 Player ${playerId} reconnected to ${roomId}`);
    try {
      // Close old socket (optional if multi-device not allowed)
      if (existing.readyState === WebSocket.OPEN) {
        existing.close(4000, "Reconnected elsewhere");
      }
    } catch {}
    room.players.set(playerId, socket);

    // Notify only the host(s)
    this.sendToHosts(roomId, WSEvent.PLAYER_UPDATED, {
      playerId,
      status: "reconnected",
    });
  } else {
    // 🆕 New player joining
    room.players.set(playerId, socket);
    console.log(`🎮 Player ${playerId} joined ${roomId}`);
    this.broadcast(roomId, WSEvent.PLAYER_JOINED, { playerId }, playerId);
  }
}


  /** Add a host to a room */
  joinHost(roomId: string, socket: WebSocket) {
    const room = this.ensureRoom(roomId);
    room.hosts.add(socket);
    console.log(`👑 Host connected to ${roomId}`);
  }

  /** Remove player or host from a room */
  leave(roomId: string, socket: WebSocket, playerId?: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    if (playerId) {
      room.players.delete(playerId);
      this.broadcast(roomId, WSEvent.PLAYER_LEFT, { playerId });
      console.log(`🚪 Player ${playerId} left ${roomId}`);
    } else {
      room.hosts.delete(socket);
      console.log(`👑 Host disconnected from ${roomId}`);
    }

    // cleanup if empty
    if (room.players.size === 0 && room.hosts.size === 0) {
      this.rooms.delete(roomId);
      console.log(`🧹 Room ${roomId} deleted (empty)`);
    }
  }

  /** Close all sockets and delete room */
  closeRoom(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const msg = JSON.stringify({ event: WSEvent.ROOM_CLOSED, payload: { roomId } });
    for (const [, ws] of room.players) {
      try { ws.send(msg); ws.close(); } catch {}
    }
    for (const ws of room.hosts) {
      try { ws.send(msg); ws.close(); } catch {}
    }
    this.rooms.delete(roomId);
    console.log(`🧹 Room ${roomId} closed.`);
  }

  // --------------------------------------------------------------------------
  // 📢 Messaging
  // --------------------------------------------------------------------------

  /** Broadcast message to all players + hosts (optionally exclude a player) */
  broadcast(roomId: string, event: string, payload: any, excludeId?: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const msg = JSON.stringify({ event, payload });

    for (const [pid, ws] of room.players) {
      if (pid === excludeId) continue;
      if (ws.readyState === WebSocket.OPEN) ws.send(msg);
    }
    for (const ws of room.hosts) {
      if (ws.readyState === WebSocket.OPEN) ws.send(msg);
    }
  }

  /** Emit an event globally to all sockets across all rooms */
  emit(event: string, payload: any) {
    const msg = JSON.stringify({ event, payload });
    for (const [, room] of this.rooms) {
      for (const [, ws] of room.players) {
        if (ws.readyState === WebSocket.OPEN) ws.send(msg);
      }
      for (const ws of room.hosts) {
        if (ws.readyState === WebSocket.OPEN) ws.send(msg);
      }
    }
  }

  /** Send to a specific player */
  sendToPlayer(roomId: string, playerId: string, event: string, payload: any): boolean {
    const room = this.rooms.get(roomId);
    const socket = room?.players.get(playerId);
    if (!socket || socket.readyState !== WebSocket.OPEN) return false;
    socket.send(JSON.stringify({ event, payload }));
    return true;
  }

  /** Send to all hosts in a room */
  sendToHosts(roomId: string, event: string, payload: any) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const msg = JSON.stringify({ event, payload });
    for (const ws of room.hosts) {
      if (ws.readyState === WebSocket.OPEN) ws.send(msg);
    }
  }

  /** Kick a player (notify + close socket) */
  kickPlayer(roomId: string, playerId: string, reason = "Kicked by host") {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    const socket = room.players.get(playerId);
    if (!socket) return false;

    try {
      socket.send(JSON.stringify({ event: WSEvent.PLAYER_KICKED_ME, payload: { reason } }));
      socket.close();
      room.players.delete(playerId);
      this.broadcast(roomId, WSEvent.PLAYER_KICKED, { playerId });
      console.log(`🦶 Player ${playerId} kicked from ${roomId}`);
      return true;
    } catch (err) {
      console.error("Failed to kick player:", err);
      return false;
    }
  }

  /** Rate-limited reaction broadcast (player → hosts) */
    handleLobbyReaction(roomId: string, playerId: string, emoji: string) {
    const key = `${roomId}:${playerId}`;
    const now = Date.now();

    const last = this.reactionTimestamps.get(key) ?? 0;
    if (now - last < 500) {
        // ⏱️ too fast — ignore
        return false;
    }

    this.reactionTimestamps.set(key, now);

    // Send only to hosts (not all players)
    this.sendToHosts(roomId, WSEvent.ROOM_REACTION, { playerId, emoji });
    return true;
    }

  // --------------------------------------------------------------------------
  // 🧾 Debug & Info
  // --------------------------------------------------------------------------

  /** Get details of a specific room */
  getRoomInfo(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    return {
      playerCount: room.players.size,
      hostCount: room.hosts.size,
      players: Array.from(room.players.keys()),
    };
  }

  /** Get all rooms */
  getRooms() {
    return Array.from(this.rooms.keys());
  }
}

export const wsServer = WSServer.getInstance();
