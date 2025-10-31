// import { createServer, IncomingMessage, ServerResponse } from "http";
// import { WebSocketServer } from "ws";
// import os from "node:os";
// import { WSManager } from "./lib/ws/manager";
// import { handleWSEvent } from "./lib/ws/handler";
// import { WSEvent } from "./lib/ws/events";

// const PORT = Number(process.env.WS_PORT) || 4000;

// function getLocalIp() {
//   const nets = os.networkInterfaces();
//   for (const name of Object.keys(nets)) {
//     for (const net of nets[name]!) {
//       if (net.family === "IPv4" && !net.internal) return net.address;
//     }
//   }
//   return "localhost";
// }

// const server = createServer();
// const wss = new WebSocketServer({ noServer: true });

// server.on("upgrade", (req, socket, head) => {
//   const match = req.url?.match(/^\/ws\/([^?]+)/);
//   if (!match) return socket.destroy();

//   const roomId = match[1];
//   const url = new URL(req.url ?? "", `http://${req.headers.host}`);
//   const role = (url.searchParams.get("role") as "host" | "player") ?? "player";
//   const playerId = url.searchParams.get("playerId") ?? undefined;

//   if (role === "player" && !playerId) {
//     console.warn(`⚠️ Player connection rejected (missing playerId)`);
//     socket.destroy();
//     return;
//   }

//   wss.handleUpgrade(req, socket, head, (ws) => {
//     (ws as any).roomId = roomId;
//     (ws as any).role = role;
//     (ws as any).playerId = role === "player" ? playerId : null;
//     (ws as any).isAlive = true;
//     wss.emit("connection", ws);
//   });
// });

// wss.on("connection", (ws) => {
//   const { roomId, role, playerId } = ws as any;

//   ws.on("pong", () => ((ws as any).isAlive = true));

//   WSManager.join(roomId, ws, role, playerId);
//   WSManager.send(ws, WSEvent.OPEN, {});

//   ws.on("message", (msg) => handleWSEvent(ws, msg));
//   ws.on("close", () => WSManager.leave(roomId, ws, role, playerId));
//   ws.on("error", (err) => console.error("⚠️ WS Error:", err));
// });

// setInterval(() => WSManager.heartbeat(), 30_000);

// server.on("request", async (req: IncomingMessage, res: ServerResponse) => {
//   if (req.method === "POST" && req.url === "/internal/broadcast") {
//     let body = "";
//     req.on("data", (chunk) => (body += chunk));
//     req.on("end", () => {
//       try {
//         const { roomId, event, payload, secret } = JSON.parse(body);
//         if (secret !== process.env.INTERNAL_WS_SECRET) {
//           res.statusCode = 401;
//           res.end("Unauthorized");
//           return;
//         }
//         WSManager.broadcastToAll(roomId, event, payload);
//         res.statusCode = 200;
//         res.end("OK");
//       } catch (err) {
//         console.error("Broadcast error", err);
//         res.statusCode = 500;
//         res.end("Error");
//       }
//     });
//   }
// });

// server.listen(PORT, () => {
//   const local = getLocalIp();
//   console.log(`🚀 WebSocket Server running:`);
//   console.log(`   ws://localhost:${PORT}/ws/:roomId`);
//   console.log(`   ws://${local}:${PORT}/ws/:roomId`);
// });
