import { WSEvent, WSMessage, WSPayloads } from "@umati/ws";
import type { WebSocket } from "ws";
import { handlePlayerConnect, handlePlayerJoin, handlePlayerKicked, handlePlayerLeft, handlePlayerReaction, handlePollVote } from "../handlers/player";
import { handlePollEnd, handlePollStart, handleRoomClose, handleRoomInit, handleRoomStateChange } from "../handlers/room";
import { logInfo } from "../utils/logger";
import { handleCancelGame, handleFriendFactsSetupSubmit, handleGameAnswer, handleGameStateChange, handleInitGame, handleStartGame } from "../handlers/game";

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

    case WSEvent.POLL_START:
      await handlePollStart(ws, msg.payload as WSPayloads[WSEvent.POLL_START]);
      break;

    case WSEvent.POLL_VOTE:
      await handlePollVote(ws, msg.payload as WSPayloads[WSEvent.POLL_VOTE]);
      break;

    case WSEvent.POLL_END:
      await handlePollEnd(ws, msg.payload as WSPayloads[WSEvent.POLL_END]);
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

    case WSEvent.PLAYER_KICKED:
      await handlePlayerKicked(ws, msg.payload as WSPayloads[WSEvent.PLAYER_KICKED]);
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
      
    case WSEvent.GAME_CANCEL: 
      await handleCancelGame(ws, msg.payload as  WSPayloads[WSEvent.GAME_CANCEL]);
      break;

    case WSEvent.FF_SETUP_SUBMIT:
      await handleFriendFactsSetupSubmit(
        ws,
        msg.payload as WSPayloads[WSEvent.FF_SETUP_SUBMIT],
      );
      break;

    case WSEvent.GAME_ANSWER:
    case WSEvent.TRIVIA_ROUND_ANSWER:
    case WSEvent.HM_ROUND_ANSWER:
    case WSEvent.FF_ROUND_ANSWER:
    case WSEvent.CH_ROUND_VOTE:
      await handleGameAnswer(ws, msg.payload as WSPayloads[WSEvent.GAME_ANSWER]);
      break;
    
    case WSEvent.GAME_STATE_CHANGE:
      await handleGameStateChange(
        ws,
        msg.payload as WSPayloads[WSEvent.GAME_STATE_CHANGE],
      );
      break;

    case WSEvent.CH_ROUND_STATE_CHANGE: 
      await handleGameStateChange(
        ws,
        msg.payload as WSPayloads[WSEvent.CH_ROUND_STATE_CHANGE],
      );
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
