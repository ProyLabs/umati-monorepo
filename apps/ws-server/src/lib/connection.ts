import type { WebSocket } from "ws";
import { parseWSMessage, WSEvent } from "@umati/ws";
import { handleMessage } from "./router";
import { logInfo } from "../utils/logger";
import { generateSid } from "../utils/sid";
import { RoomManager } from "./room-manager";

interface SocketContext {
  sid: string;
  ws: WebSocket;
}

// Keep track of all active sockets if needed later
const activeSockets = new Map<string, SocketContext>();

export function handleConnection(ws: WebSocket) {
  const sid = generateSid();

  const ctx: SocketContext = { sid, ws };
  activeSockets.set(sid, ctx);

  logInfo(`🔌 Client connected [sid=${sid}]`);

  // ✅ Send the SID to the client immediately
  ws.send(
    JSON.stringify({
      event: WSEvent.OPEN,
      payload: { sid },
    })
  );


  ws.on("message", async (raw) => {
    const msg = parseWSMessage(raw.toString());
    if (!msg) return;

    await handleMessage(ws, msg, sid);
  });

  // ws.on("close", () => {
    //   logInfo(`❌ Client disconnected [sid=${sid}]`);
    //   activeSockets.delete(sid);
    // });
    
  // Handle close
  ws.on("close", () => {
  logInfo(`❌ Disconnected [sid=${sid}]`);
  activeSockets.delete(sid);

// Clean up from any room
  for (const [roomId, room] of RoomManager.getAllRooms()) {
    // 🧹 Remove host socket if applicable
    if (room.host.sockets.has(sid)) {
      RoomManager.removeHostSocket(roomId, sid);
      logInfo(`🧹 Removed host sid=${sid} from room ${roomId}`);
    }

    // 🧹 Remove player socket if this sid matches one
    for (const [playerId, playerWs] of room.playerSockets.entries()) {
      if (playerWs === ws) {
        RoomManager.removePlayer(roomId, playerId);
        logInfo(`🧹 Removed player ${playerId} from room ${roomId}`);
        break;
      }
    }
  }
});
}
