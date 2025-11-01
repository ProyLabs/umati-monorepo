// src/lib/ws/client.ts

import { WSEvent, WSPayloads, WSMessage } from "./events";

export type WSState = "connecting" | "open" | "reconnecting" | "closed" | "error";

type ConnectionListener = (state: WSState) => void;
type EventHandler<T> = (payload: T) => void;

interface QueuedMessage<T extends keyof WSPayloads = keyof WSPayloads> {
  event: T;
  payload: WSPayloads[T];
  timestamp: number;
}

/**
 * WebSocket client with:
 * ✅ Typed events
 * ✅ Auto reconnect (exp backoff + jitter)
 * ✅ Message queue with TTL
 * ✅ Heartbeat ping/pong
 * ✅ Connection + reconnection listeners
 * ✅ Session resume detection
 */
export class WSClient {
  private socket?: WebSocket;
  private readonly url: string;

  // --- reconnect config ---
  private reconnectBase = 1000; // 1s
  private reconnectMax = 10_000; // 10s
  private reconnectAttempts = 0;
  private shouldReconnect = true;

  // --- heartbeat ---
  private heartbeatMs = 30_000;
  private heartbeatTimer?: ReturnType<typeof setInterval>;

  // --- message queue ---
  private messageQueue: QueuedMessage[] = [];
  private messageTTL = 30_000; // 30s
  private cleanupTimer?: ReturnType<typeof setInterval>;

  // --- listeners ---
  private connectionListeners: ConnectionListener[] = [];
  private eventListeners: {
    [K in keyof WSPayloads]?: EventHandler<WSPayloads[K]>[];
  } = {};

  public state: WSState = "closed";

  // --- NEW ---
  public reconnected = false; // indicates a resumed session

  constructor(url: string) {
    this.url = url;
    this.connect();

    // periodic cleanup
    this.cleanupTimer = setInterval(() => this.cleanupExpiredMessages(), 10_000);

    // offline/online awareness
    if (typeof window !== "undefined") {
      window.addEventListener("offline", this.handleOffline);
      window.addEventListener("online", this.handleOnline);
    }
  }

  // ---------------------------------------------------------------------------
  // 🔌 Lifecycle
  // ---------------------------------------------------------------------------

  private connect() {
    this.setState(this.reconnectAttempts > 0 ? "reconnecting" : "connecting");

    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      this.reconnectAttempts = 0;
      this.setState("open");
      this.startHeartbeat();
      this.flushQueue();
      this.emitLocal(WSEvent.OPEN as keyof WSPayloads, {} as any);
    };

    this.socket.onclose = () => {
      this.stopHeartbeat();
      this.setState("closed");
      this.emitLocal(WSEvent.CLOSE as keyof WSPayloads, {} as any);
      if (this.shouldReconnect) this.scheduleReconnect();
    };

    this.socket.onerror = () => {
      this.setState("error");
      // browsers often fire onclose too
    };

    this.socket.onmessage = (e) => this.handleMessage(e.data);
  }

  private scheduleReconnect() {
    this.reconnectAttempts += 1;
    const exp = Math.min(this.reconnectMax, this.reconnectBase * 2 ** (this.reconnectAttempts - 1));
    const jitter = Math.floor(Math.random() * 400); // up to 400ms jitter
    const delay = exp + jitter;
    setTimeout(() => this.connect(), delay);
  }

  public close() {
    this.shouldReconnect = false;
    this.stopHeartbeat();
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
    if (typeof window !== "undefined") {
      window.removeEventListener("offline", this.handleOffline);
      window.removeEventListener("online", this.handleOnline);
    }
    this.socket?.close();
    this.setState("closed");
  }

  // ---------------------------------------------------------------------------
  // 💬 Messaging
  // ---------------------------------------------------------------------------

  private handleMessage(raw: string) {
    // raw ping (non-JSON heartbeat)
    if (raw === "ping") {
      this.sendRaw("pong");
      this.emitLocal(WSEvent.PING as keyof WSPayloads, {} as any);
      return;
    }

    try {
      const msg: WSMessage<keyof WSPayloads> = JSON.parse(raw);

      // server -> typed PING
      if (msg.event === (WSEvent.PING as any)) {
        this.send(WSEvent.PONG as keyof WSPayloads, {} as any);
      }

      // ✅ session reconnection detection
      if (msg.event === (WSEvent.OPEN as any) && (msg.payload as any)?.reconnected) {
        this.reconnected = true;
        console.log("🔁 Session reconnected to existing player");
        this.emitLocal(WSEvent.OPEN as keyof WSPayloads, msg.payload as any);
        return;
      }

      const handlers = this.eventListeners[msg.event];
      if (handlers && handlers.length) {
        handlers.forEach((fn) => fn(msg.payload as any));
      }
    } catch {
      // ignore non-JSON messages
    }
  }

  public send<T extends keyof WSPayloads>(event: T, payload: WSPayloads[T]) {
    const message: WSMessage<T> = { event, payload };
    const data = JSON.stringify(message);

    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.enqueueMessage(event, payload);
      return;
    }
    this.sendRaw(data);
  }

  private sendRaw(data: string) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(data);
    }
  }

  // ---------------------------------------------------------------------------
  // 📦 Queue
  // ---------------------------------------------------------------------------

  private enqueueMessage<T extends keyof WSPayloads>(event: T, payload: WSPayloads[T]) {
    this.messageQueue.push({ event, payload, timestamp: Date.now() });
  }

  private flushQueue() {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

    const now = Date.now();
    const valid = this.messageQueue.filter((m) => now - m.timestamp < this.messageTTL);

    for (const msg of valid) {
      try {
        const data = JSON.stringify({ event: msg.event, payload: msg.payload });
        this.sendRaw(data);
      } catch {
        // ignore
      }
    }

    this.messageQueue = [];
  }

  private cleanupExpiredMessages() {
    const now = Date.now();
    this.messageQueue = this.messageQueue.filter((m) => now - m.timestamp < this.messageTTL);
  }

  // ---------------------------------------------------------------------------
  // ❤️ Heartbeat
  // ---------------------------------------------------------------------------

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.send(WSEvent.PING, {});
    }, this.heartbeatMs);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }

  // ---------------------------------------------------------------------------
  // 🎧 Event system
  // ---------------------------------------------------------------------------

  public on<T extends keyof WSPayloads>(event: T, handler: EventHandler<WSPayloads[T]>) {
    if (!this.eventListeners[event]) this.eventListeners[event] = [];
    this.eventListeners[event]!.push(handler);
  }

  public off<T extends keyof WSPayloads>(event: T, handler: EventHandler<WSPayloads[T]>) {
    const arr = this.eventListeners[event];
    if (!arr) return;
    this.eventListeners[event] = arr.filter((fn) => fn !== handler) as any;
  }

  private emitLocal<T extends keyof WSPayloads>(event: T, payload: WSPayloads[T]) {
    const handlers = this.eventListeners[event];
    if (handlers && handlers.length) handlers.forEach((fn) => fn(payload));
  }

  // ---------------------------------------------------------------------------
  // 🔄 Connection state
  // ---------------------------------------------------------------------------

  public onConnectionChange(listener: ConnectionListener) {
    this.connectionListeners.push(listener);
  }

  public offConnectionChange(listener: ConnectionListener) {
    this.connectionListeners = this.connectionListeners.filter((fn) => fn !== listener);
  }

  private setState(state: WSState) {
    if (this.state === state) return;
    this.state = state;
    this.connectionListeners.forEach((fn) => fn(state));
    if (state === "open") this.flushQueue();
  }

  // ---------------------------------------------------------------------------
  // 🧭 Utilities
  // ---------------------------------------------------------------------------

  /** Resolves when the socket reaches "open". */
  public async ready(): Promise<void> {
    if (this.state === "open") return;
    return new Promise((resolve) => {
      const listener = (s: WSState) => {
        if (s === "open") {
          this.offConnectionChange(listener);
          resolve();
        }
      };
      this.onConnectionChange(listener);
    });
  }

  private handleOffline = () => {
    this.shouldReconnect = false;
    this.socket?.close();
  };

  private handleOnline = () => {
    if (this.state !== "open") {
      this.shouldReconnect = true;
      this.scheduleReconnect();
    }
  };

  // ---------------------------------------------------------------------------
  // 🔁 Convenience listener for resumed sessions
  // ---------------------------------------------------------------------------

  public onReconnect(handler: () => void) {
    this.on(WSEvent.OPEN as keyof WSPayloads, (payload: any) => {
      if (payload?.reconnected) handler();
    });
  }
}

// ---------------------------------------------------------------------------
// 🔗 Helper to build WS URL
// ---------------------------------------------------------------------------

// export function getWsUrl(identifier: string, role: "host" | "player", id?: string) {
//   const protocol = location.protocol === "https:" ? "wss" : "ws";
//   const host = location.host;
//   const params = new URLSearchParams({ role });
//   if (id) params.set("playerId", id);
//   return `${protocol}://${host.replace(/:\d+$/, "")}:4000/ws/${identifier}?${params.toString()}`;
// }

export function getWsUrl() {
  // const protocol = location.protocol === "https:" ? "wss" : "ws";
  const host = process.env.WS_SERVER_URL ?? 'ws://192.168.1.247:4000';
  //'wss://umati-ws.onrender.com'
  return `${host}/ws`;
} 

export default WSClient;
