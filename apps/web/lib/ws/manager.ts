import { WebSocket } from "ws";
import { WSEvent } from "./events";

export type ClientRole = "host" | "player";

interface PlayerSession {
  id: string;
  socket: WebSocket;
  displayName?: string;
  avatar?: string;
  connected: boolean;
  lastSeen: number;
}

interface Room {
  hosts: Set<WebSocket>;
  players: Map<string, PlayerSession>; // playerId → session
}

export class WSManager {
  private static rooms: Map<string, Room> = new Map();

  // --------------------------------------------------------------------------
  // 🏠 Ensure room exists
  // --------------------------------------------------------------------------
  private static ensureRoom(roomId: string): Room {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, { hosts: new Set(), players: new Map() });
    }
    return this.rooms.get(roomId)!;
  }

  // --------------------------------------------------------------------------
  // 🙋 Join (or reconnect)
  // --------------------------------------------------------------------------
  static join(roomId: string, ws: WebSocket, role: ClientRole, playerId?: string) {
    const room = this.ensureRoom(roomId);

    if (role === "host") {
      room.hosts.add(ws);
      console.log(`👑 Host joined room: ${roomId}`);
      return;
    }

    if (!playerId) {
      console.warn(`⚠️ Missing playerId for room ${roomId}`);
      ws.close(1008, "Missing playerId");
      return;
    }

    const existingSession = room.players.get(playerId);

    if (existingSession) {
      // 🧠 Reconnection
      console.log(`🔁 Player ${playerId} reconnected to room: ${roomId}`);
      existingSession.socket = ws;
      existingSession.connected = true;
      existingSession.lastSeen = Date.now();

      // Notify only the reconnected player (not hosts)
      this.send(ws, WSEvent.OPEN, { reconnected: true });
    } else {
      // 🆕 New connection
      const session: PlayerSession = {
        id: playerId,
        socket: ws,
        connected: true,
        lastSeen: Date.now(),
      };
      room.players.set(playerId, session);

      console.log(`🙋 Player ${playerId} joined room: ${roomId}`);
      this.broadcastToHosts(roomId, WSEvent.PLAYER_JOINED, { playerId });
    }
  }

  // --------------------------------------------------------------------------
  // 👋 Leave (temporary or permanent)
  // --------------------------------------------------------------------------
  static leave(roomId: string, ws: WebSocket, role: ClientRole, playerId?: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    if (role === "host") {
      room.hosts.delete(ws);
      console.log(`👋 Host left room: ${roomId}`);
    } else if (playerId) {
      const session = room.players.get(playerId);
      if (!session) return;

      // Mark as temporarily disconnected (grace period)
      session.connected = false;
      session.lastSeen = Date.now();

      console.log(`⚠️ Player ${playerId} disconnected from room: ${roomId}`);

      // Delay removal to allow reconnection
      setTimeout(() => {
        const now = Date.now();
        const stale = !session.connected && now - session.lastSeen > 10_000; // 10s grace
        if (stale) {
          console.log(`🧹 Player ${playerId} removed from room ${roomId}`);
          room.players.delete(playerId);
          this.broadcastToHosts(roomId, WSEvent.PLAYER_LEFT, { playerId });
        }
      }, 10_000);
    }

    // Cleanup empty rooms
    if (room.hosts.size === 0 && room.players.size === 0) {
      this.rooms.delete(roomId);
      console.log(`🧹 Room deleted: ${roomId}`);
    }
  }

  // --------------------------------------------------------------------------
  // 📨 Send to specific socket
  // --------------------------------------------------------------------------
  static send(ws: WebSocket, event: string, payload: any) {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ event, payload }));
  }

  // --------------------------------------------------------------------------
  // 📣 Broadcast helpers
  // --------------------------------------------------------------------------
  static broadcastToHosts(roomId: string, event: string, payload: any) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const msg = JSON.stringify({ event, payload });
    for (const host of room.hosts)
      if (host.readyState === host.OPEN) host.send(msg);
  }

  static broadcastToAll(roomId: string, event: string, payload: any) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const msg = JSON.stringify({ event, payload });
    for (const host of room.hosts)
      if (host.readyState === host.OPEN) host.send(msg);
    for (const { socket } of room.players.values())
      if (socket.readyState === socket.OPEN) socket.send(msg);
  }

  // --------------------------------------------------------------------------
  // ❤️ Heartbeat
  // --------------------------------------------------------------------------
  static heartbeat() {
    for (const [roomId, room] of this.rooms.entries()) {
      for (const session of room.players.values()) {
        const ws = session.socket as any;
        if (!ws.isAlive) {
          session.connected = false;
          continue;
        }
        ws.isAlive = false;
        ws.ping();
      }

      // Cleanup empty rooms
      if (room.hosts.size === 0 && room.players.size === 0) {
        this.rooms.delete(roomId);
        console.log(`🧹 Cleaned empty room: ${roomId}`);
      }
    }
  }
}
