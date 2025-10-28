"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type WSStatus = "idle" | "connecting" | "open" | "closed" | "error";

interface UseWebSocketOptions {
  auto?: boolean; // automatically connect on mount (default: true)
  reconnect?: boolean; // auto reconnect
  reconnectAttempts?: number; // max attempts
  reconnectInterval?: number; // initial retry interval (ms)
  onOpen?: (ws: WebSocket) => void;
  onClose?: (ev: CloseEvent) => void;
  onError?: (ev: Event) => void;
  onMessage?: (msg: MessageEvent) => void;
}

/**
 * Robust WebSocket hook with:
 * - Optional auto-connect
 * - Manual connect() function
 * - Reconnect with exponential backoff
 * - Message queuing when disconnected
 */
export function useWebSocket(url: string, options: UseWebSocketOptions = {}) {
  const {
    auto = true,
    reconnect = true,
    reconnectAttempts = 5,
    reconnectInterval = 2000,
    onOpen,
    onClose,
    onError,
    onMessage,
  } = options;

  const [status, setStatus] = useState<WSStatus>("idle");
  const wsRef = useRef<WebSocket | null>(null);
  const queueRef = useRef<string[]>([]);
  const reconnectCount = useRef(0);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!url) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    setStatus("connecting");

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("open");
      reconnectCount.current = 0;

      // Flush queued messages
      while (queueRef.current.length > 0) {
        const message = queueRef.current.shift();
        if (message) ws.send(message);
      }

      onOpen?.(ws);
    };

    ws.onclose = (ev) => {
      setStatus("closed");
      onClose?.(ev);

      if (reconnect && reconnectCount.current < reconnectAttempts) {
        const delay = reconnectInterval * 2 ** reconnectCount.current;
        reconnectCount.current += 1;
        reconnectTimeout.current = setTimeout(connect, delay);
      }
    };

    ws.onerror = (ev) => {
      setStatus("error");
      onError?.(ev);
    };

    ws.onmessage = (msg) => {
      onMessage?.(msg);
    };
  }, [
    url,
    reconnect,
    reconnectAttempts,
    reconnectInterval,
    onOpen,
    onClose,
    onError,
    onMessage,
  ]);

  // Auto connect only if enabled
  useEffect(() => {
    if (auto && url) connect();
    return () => {
      reconnectTimeout.current && clearTimeout(reconnectTimeout.current);
      wsRef.current?.close();
    };
  }, [auto, connect, url]);

  const send = useCallback((data: any) => {
    const json = typeof data === "string" ? data : JSON.stringify(data);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(json);
    } else {
      queueRef.current.push(json);
    }
  }, []);

  const close = useCallback(() => {
    reconnectTimeout.current && clearTimeout(reconnectTimeout.current);
    reconnectCount.current = reconnectAttempts; // stop further reconnects
    wsRef.current?.close();
    setStatus("closed");
  }, [reconnectAttempts]);

  const reconnectNow = useCallback(() => {
    reconnectTimeout.current && clearTimeout(reconnectTimeout.current);
    reconnectCount.current = 0;
    connect();
  }, [connect]);

  return {
    socket: wsRef.current,
    status,
    connect, // 👈 manual connect
    send,
    reconnect: reconnectNow,
    close,
    isOpen: status === "open",
    isConnecting: status === "connecting",
    isClosed: status === "closed",
  };
}
