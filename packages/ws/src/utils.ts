import type { WSMessage, WSPayloads } from "./events";

/**
 * Safely parse incoming WS message
 */
export function parseWSMessage(raw: string): WSMessage | null {
  try {
    const msg = JSON.parse(raw);
    if (msg?.event && "payload" in msg) return msg as WSMessage;
    return null;
  } catch {
    return null;
  }
}

/**
 * Serialize + send typed WS message
 */
export function sendWSMessage<T extends keyof WSPayloads>(
  ws: WebSocket,
  event: T,
  payload: WSPayloads[T]
) {
  ws.send(JSON.stringify({ event, payload }));
}
