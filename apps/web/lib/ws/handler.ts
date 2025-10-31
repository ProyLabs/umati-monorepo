// // lib/ws/handler.ts
// import { WebSocket } from "ws";
// import { WSManager } from "./manager";
// import { WSEvent, WSMessage, WSPayloads } from "./events";
// import {z} from "zod"

// const ReactionSchema = z.object({ emoji: z.string().emoji() });

// /**
//  * 🔹 handleWSEvent
//  * Called whenever a WebSocket receives a message.
//  * Routes and validates events depending on role.
//  */
// export function handleWSEvent(ws: WebSocket, message: Buffer | ArrayBuffer | Buffer[]) {
//   try {
//     const data: WSMessage = JSON.parse(message.toString());
//     const { event, payload } = data;
//     const { roomId, role, playerId } = ws as any;

//     if (!roomId) {
//       console.warn("⚠️ WS message with no roomId:", data);
//       return;
//     }

//     switch (event) {
//       // 🩵 Heartbeat / Connection Lifecycle
//       case WSEvent.PING:
//         WSManager.send(ws, WSEvent.PONG, {});
//         break;

//       // 👋 Player or Host manually disconnecting
//       case WSEvent.CLOSE:
//         WSManager.leave(roomId, ws, role, playerId);
//         break;

//       // 🎉 Player → Host: Reaction
//       case WSEvent.PLAYER_REACTION: {
//          const parsed = ReactionSchema.safeParse(payload);
//         if (!parsed.success) return;
//         if (!playerId) return;
//         console.log(`💬 Reaction from ${playerId}: ${parsed.data.emoji}`);
//         WSManager.broadcastToHosts(roomId, WSEvent.PLAYER_REACTION, {
//           playerId,
//            emoji: parsed.data.emoji,
//         });
//         break;
//       }

//       case WSEvent.PLAYER_JOINED: 
//         WSManager.broadcastToHosts(roomId, WSEvent.PLAYER_JOINED, payload as WSPayloads[WSEvent.PLAYER_JOINED]);
//         break;

//        case WSEvent.PLAYER_LEFT: 
//         WSManager.broadcastToHosts(roomId, WSEvent.PLAYER_LEFT, payload as WSPayloads[WSEvent.PLAYER_LEFT]);
//         break;
        
//       // 🧍 Host → Players: Updated Room State
//       case WSEvent.ROOM_STATE:
//         WSManager.broadcastToPlayers(roomId, WSEvent.ROOM_STATE, payload as WSPayloads[WSEvent.ROOM_STATE]);
//         break;

//       // 🏁 Game Started (Host → All)
//       case WSEvent.GAME_STARTED:
//         WSManager.broadcastToAll(roomId, WSEvent.GAME_STARTED, payload as WSPayloads[WSEvent.GAME_STARTED]);
//         break;

//       // 🧩 Question sent to all players
//       case WSEvent.GAME_QUESTION:
//         WSManager.broadcastToPlayers(roomId, WSEvent.GAME_QUESTION, payload as WSPayloads[WSEvent.GAME_QUESTION]);
//         break;

//       // ✅ Player answers (Player → Host)
//       case WSEvent.GAME_ANSWER_RECEIVED: {
//         if (!playerId) return;
//         const p = payload as WSPayloads[WSEvent.GAME_ANSWER_RECEIVED];
//         console.log(`📩 Answer from ${playerId}: correct=${p.correct}`);
//         WSManager.broadcastToHosts(roomId, WSEvent.GAME_ANSWER_RECEIVED, {
//           ...p,
//           playerId,
//         });
//         break;
//       }

//       // 🏆 End of round results (Host → All)
//       case WSEvent.GAME_ROUND_ENDED:
//         WSManager.broadcastToAll(roomId, WSEvent.GAME_ROUND_ENDED, payload as WSPayloads[WSEvent.GAME_ROUND_ENDED]);
//         break;

//       // 🚪 Host closing lobby
//       case WSEvent.ROOM_CLOSED:
//         WSManager.broadcastToAll(roomId, WSEvent.ROOM_CLOSED, payload as WSPayloads[WSEvent.ROOM_CLOSED]);
//         break;

//       // 🗑️ Player kicked (Host → Specific player)
//       case WSEvent.PLAYER_KICKED: {
//         const { playerId: target, reason } =
//           payload as WSPayloads[WSEvent.PLAYER_KICKED];
//         if (!target) return;
//         console.log(`🦵 Player ${target} kicked from ${roomId}`);
//         WSManager.broadcastToPlayer(roomId, target, WSEvent.PLAYER_KICKED_ME, {
//           reason,
//         });
//         WSManager.broadcastToHosts(roomId, WSEvent.PLAYER_KICKED, { playerId: target, reason });
//         break;
//       }

//       // 💬 System announcements (Host → All)
//       case WSEvent.SYSTEM_ANNOUNCEMENT:
//         WSManager.broadcastToAll(roomId, WSEvent.SYSTEM_ANNOUNCEMENT, payload as WSPayloads[WSEvent.SYSTEM_ANNOUNCEMENT]);
//         break;

//       default:
//         console.warn("⚠️ Unhandled WS event:", event, payload);
//         break;
//     }
//   } catch (err) {
//     console.error("❌ WS message error:", err);
//   }
// }
