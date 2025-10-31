import { WSEvent, WSMessage, WSPayloads } from "@umati/ws";
import type { WebSocket } from "ws";
import { handlePlayerConnect, handlePlayerJoin, handlePlayerLeft, handlePlayerReaction } from "../handlers/player";
import { handleRoomClose, handleRoomInit, handleRoomStateChange } from "../handlers/room";
import { logInfo } from "../utils/logger";
import { handleGameAnswer, handleInitGame, handleStartGame } from "../handlers/game";

export async function handleMessage(ws: WebSocket, msg: WSMessage, sid: string) {
  logInfo("🔻", msg.event, msg.payload)
  switch (msg.event) {
    // --- Ping ---
    case WSEvent.PING:
      ws.send(JSON.stringify({ event: WSEvent.PONG, payload: {} }));
      break;

    // --- Room events ---
    case WSEvent.ROOM_INIT:
      await handleRoomInit(ws, msg.payload as WSPayloads[WSEvent.ROOM_INIT], sid);
      break;

    case WSEvent.ROOM_STATE_CHANGE:
      await handleRoomStateChange(ws, msg.payload as WSPayloads[WSEvent.ROOM_STATE_CHANGE]);
      break;
    case WSEvent.ROOM_CLOSED_ME:
      await handleRoomClose(ws, msg.payload as WSPayloads[WSEvent.ROOM_CLOSED_ME], sid);
      break;

    
    case WSEvent.PLAYER_CONNECT:
      await handlePlayerConnect(ws, msg.payload as WSPayloads[WSEvent.PLAYER_CONNECT]);
      break;

    case WSEvent.PLAYER_JOIN: 
     await handlePlayerJoin(ws, msg.payload as WSPayloads[WSEvent.PLAYER_JOIN]);
     break;

    case WSEvent.PLAYER_LEAVE:
      await handlePlayerLeft(ws, msg.payload as WSPayloads[WSEvent.PLAYER_LEAVE]);
      break;

    case WSEvent.PLAYER_REACTION:
      await handlePlayerReaction(ws, msg.payload as WSPayloads[WSEvent.PLAYER_REACTION]);
      break;

    case WSEvent.GAME_INIT: 
      await handleInitGame(ws, msg.payload as  WSPayloads[WSEvent.GAME_INIT]);
      break;

    case WSEvent.GAME_START: 
      await handleStartGame(ws, msg.payload as  WSPayloads[WSEvent.GAME_START]);
      break;

    case WSEvent.GAME_ANSWER:
      await handleGameAnswer(ws, msg.payload as WSPayloads[WSEvent.GAME_ANSWER]);
      break;

    // // --- Player events ---
    // case WSEvent.PLAYER_JOINED:
    //   await handlePlayerJoin(ws, msg.payload);
    //   break;
    // case WSEvent.PLAYER_CONNECTED:
    //   await handlePlayerConnected(ws, msg.payload);
    //   break;
    // case WSEvent.PLAYER_LEFT:
    //   await handlePlayerLeft(ws, msg.payload);
    //   break;

    default:
      console.warn("⚠️ Unknown event:", msg.event);
  }
}
