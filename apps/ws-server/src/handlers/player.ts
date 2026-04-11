import type { WebSocket } from "ws";
import { GameType, WSEvent, WSPayloads } from "@umati/ws";
import { RoomManager } from "../lib/room-manager";
import { logInfo } from "../utils/logger";
import { GameManager } from "../lib/game-manager";
import { HerdMentality } from "../lib/games/herd-mentality";
import { Chameleon } from "../lib/games/chameleon";
import { FriendFactsGame } from "../lib/games/friend-facts";
import { CodenamesGame } from "../lib/games/codenames";

/** When a player connects to a room */
export async function handlePlayerConnect(
  ws: WebSocket,
  payload: { roomId: string; playerId: string }
) {
  const { roomId, playerId } = payload;
  const room = RoomManager.get(roomId);

  if (!room) {
    ws.send(
      JSON.stringify({
        event: WSEvent.NOT_FOUND,
        payload: { message: "Room not found" },
      })
    );
    return;
  }

  if(room.players.some(p=> p.id === playerId)){
  logInfo(`🔁 Player ${playerId} reconnected to room ${roomId}`);
  RoomManager.addPlayer(roomId, {
    id: playerId,
    displayName: room.players.find(p => p.id === playerId)?.displayName ?? "Unknown",
    avatar: room.players.find(p => p.id === playerId)?.avatar ?? "",
    connected: true,
  }, ws);
  }

  ws.send(
    JSON.stringify({
      event: WSEvent.ROOM_STATE,
      payload: RoomManager.toLobbyState(roomId),
    })
  );

  if (room.poll) {
    setTimeout(() => {
      ws.send(
        JSON.stringify({
          event: WSEvent.POLL_STATE,
          payload: { poll: RoomManager.toPollState(roomId, playerId) },
        })
      );
    }, 80);
  }

  if (room.game && room.players.some((p) => p.id === playerId)) {
    const game = GameManager.get(room.game.id);
    if (!game) return;

    setTimeout(() => {
      if (game.type === GameType.CHAMELEON) {
        (game as Chameleon).sendStateToSocket(ws, { playerId, isHost: false });
      } else if (game.type === GameType.FF) {
        (game as FriendFactsGame).sendStateToSocket({ isHost: false, playerId });
      } else if (game.type === GameType.CN) {
        (game as CodenamesGame).sendStateToSocket({ isHost: false, playerId });
      } else {
        ws.send(
          JSON.stringify({
            event: WSEvent.GAME_STATE,
            payload: GameManager.toGameState(game.id),
          })
        );
      }

      //game.type === GameType.TRIVIA ||

      console.log("🚀 ~ handlePlayerConnect ~ game.type :", game.type )
      if( game.type === GameType.HM){
        const myAnswer = (game as HerdMentality).myAnswer(playerId)
        if(myAnswer){
           ws.send(
        JSON.stringify({
          event: WSEvent.GAME_MY_ANSWER,
          payload: {answer: myAnswer},
        })
      );
        }
      }
      if (game.type === GameType.FF) {
        const myAnswer = (game as FriendFactsGame).myAnswer(playerId);
        if (myAnswer) {
          ws.send(
            JSON.stringify({
              event: WSEvent.FF_ROUND_ANSWERED,
              payload: { answerPlayerId: myAnswer },
            }),
          );
        }
      }

    }, 100);

    return;
  }
}

/**
 * When a player joins a room
 */
export async function handlePlayerJoin(
  ws: WebSocket,
  payload: {
    roomId: string;
    playerId: string;
    displayName: string;
    avatar: string;
  }
) {
  const { roomId, playerId, displayName, avatar } = payload;
  const room = RoomManager.get(roomId);

  if (!room) {
    ws.send(
      JSON.stringify({
        event: WSEvent.ERROR,
        payload: { message: "Room not found" },
      })
    );
    return;
  }

  if(room.players.length === room.meta.maxPlayers) {
    ws.send(
      JSON.stringify({
        event: WSEvent.ERROR,
        payload: { message: "Room is already at capacity" },
      })
    );
    return;
  }

  RoomManager.addPlayer(
    roomId,
    {
      id: playerId,
      displayName,
      avatar,
      connected: true,
    },
    ws
  );
  logInfo(`👤 Player ${displayName || playerId} joined room ${roomId}`);

  RoomManager.toHost(roomId, WSEvent.PLAYER_JOIN, {
    roomId,
    playerId,
    displayName,
    avatar,
  });
  RoomManager.broadcast(
    roomId,
    WSEvent.ROOM_STATE,
    RoomManager.toLobbyState(roomId)
  );
}

// /**
//  * Player reconnects (e.g., refresh)
//  */
// export async function handlePlayerConnected(
//   ws: WebSocket,
//   payload: { roomId: string; playerId: string }
// ) {
//   const { roomId, playerId } = payload;
//   const room = RoomManager.get(roomId);
//   if (!room) return;

//   RoomManager.addPlayer(roomId, playerId, ws);
//   logInfo(`🔁 Player ${playerId} reconnected to room ${roomId}`);

//   ws.send(
//     JSON.stringify({ event: WSEvent.PLAYER_CONNECTED, payload: { playerId } })
//   );
// }

/**
 * When a player leaves
 */
export async function handlePlayerLeft(
  ws: WebSocket,
  payload: { roomId: string; playerId: string }
) {
  const { roomId, playerId } = payload;
  const room = RoomManager.get(roomId);
  if (!room) return;

  const player = room.players.find((p) => p.id === playerId);
  if (!player) return;

  RoomManager.removePlayer(roomId, playerId, true);
  logInfo(`🚪 Player ${playerId} left room ${roomId}`);

  RoomManager.broadcast(
    roomId,
    WSEvent.ROOM_STATE,
    RoomManager.toLobbyState(roomId)
  );
  
  ws.send(
    JSON.stringify({
      event: WSEvent.ROOM_STATE,
      payload: RoomManager.toLobbyState(roomId),
    })
  );

  RoomManager.toHost(roomId, WSEvent.PLAYER_LEAVE, {
    roomId,
    playerId: player.id,
    displayName: player.displayName,
    avatar: player.avatar!,
  });
}

/** When the host kicks a player */
export async function handlePlayerKicked(
  ws: WebSocket,
  payload: WSPayloads[WSEvent.PLAYER_KICKED]
) {
  const { roomId, playerId, reason } = payload;
  const room = RoomManager.get(roomId);
  if (!room) return;

  if (!RoomManager.isHostSocket(roomId, ws)) {
    ws.send(
      JSON.stringify({
        event: WSEvent.ERROR,
        payload: { message: "Only the host can kick players." },
      })
    );
    return;
  }

  const player = room.players.find((p) => p.id === playerId);
  if (!player) {
    ws.send(
      JSON.stringify({
        event: WSEvent.ERROR,
        payload: { message: "Player not found in room." },
      })
    );
    return;
  }

  RoomManager.toPlayer(roomId, playerId, WSEvent.PLAYER_KICKED_ME, {
    reason: reason ?? "You were removed from the lobby by the host.",
  });
  RoomManager.removePlayer(roomId, playerId, true);
  logInfo(`🥾 Host kicked player ${playerId} from room ${roomId}`);

  RoomManager.toHost(roomId, WSEvent.PLAYER_KICKED, {
    roomId,
    playerId,
    reason,
  });
  RoomManager.broadcast(
    roomId,
    WSEvent.ROOM_STATE,
    RoomManager.toLobbyState(roomId)
  );
}

export async function handlePollVote(
  ws: WebSocket,
  payload: WSPayloads[WSEvent.POLL_VOTE]
) {
  const { roomId, playerId, optionIds } = payload;
  const room = RoomManager.get(roomId);
  if (!room || !room.players.some((player) => player.id === playerId)) {
    ws.send(
      JSON.stringify({
        event: WSEvent.ERROR,
        payload: { message: "Player not found in room." },
      })
    );
    return;
  }

  const poll = RoomManager.votePoll(roomId, playerId, optionIds);
  if (!poll) {
    ws.send(
      JSON.stringify({
        event: WSEvent.ERROR,
        payload: { message: "Unable to cast vote for this poll." },
      })
    );
  }
}

/** When a player sends a reaction */
export async function handlePlayerReaction(
  ws: WebSocket,
  payload: WSPayloads[WSEvent.PLAYER_REACTION]
) {
  const { roomId, playerId, emoji } = payload;
  const room = RoomManager.get(roomId);
  if (!room) return;
  logInfo(`🚪 Player ${playerId} reacted ${emoji}`);

  RoomManager.toHost(roomId, WSEvent.PLAYER_REACTION, payload);
}
