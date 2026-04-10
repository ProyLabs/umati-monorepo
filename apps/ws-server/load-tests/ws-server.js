import exec from "k6/execution";
import http from "k6/http";
import ws from "k6/ws";
import { check, fail, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

const wsUrl = __ENV.WS_URL || "ws://localhost:4000/ws";
const apiBaseUrl = (__ENV.API_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

const TOTAL_PLAYERS = Number(__ENV.TOTAL_PLAYERS || 50);
const MAX_PLAYERS = Number(__ENV.MAX_PLAYERS || TOTAL_PLAYERS);
const TRIVIA_ROUNDS = Number(__ENV.TRIVIA_ROUNDS || 20);
const HM_ROUNDS = Number(__ENV.HM_ROUNDS || 20);
const ROUND_DURATION_SECONDS = Number(__ENV.ROUND_DURATION_SECONDS || 1);
const PRE_GAME_SETTLE_MS = Number(__ENV.PRE_GAME_SETTLE_MS || 1500);
const STATE_TRANSITION_DELAY_MS = Number(__ENV.STATE_TRANSITION_DELAY_MS || 250);
const PLAYER_REACTION_DELAY_MS = Number(__ENV.PLAYER_REACTION_DELAY_MS || 500);
const PLAYER_JOIN_STAGGER_MS = Number(__ENV.PLAYER_JOIN_STAGGER_MS || 25);
const HOST_MAX_DURATION = __ENV.HOST_MAX_DURATION || "5m";
const PLAYER_MAX_DURATION = __ENV.PLAYER_MAX_DURATION || "5m";

const hostDisplayName = __ENV.HOST_DISPLAY_NAME || "k6 Host";
const hostAvatar =
  __ENV.HOST_AVATAR ||
  "https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_1.png";
const reactionEmoji = __ENV.REACTION_EMOJI || "🔥";

const lobbyCreateDuration = new Trend("http_lobby_create_duration", true);
const guestCreateDuration = new Trend("http_guest_create_duration", true);
const handshakeLatency = new Trend("ws_handshake_latency", true);
const sessionDuration = new Trend("ws_session_duration", true);

const websocketUpgradeRate = new Rate("ws_upgrade_rate");
const openAckRate = new Rate("ws_open_ack_rate");
const roomStateRate = new Rate("ws_room_state_rate");
const reactionSentRate = new Rate("reaction_sent_rate");
const triviaAnswerRate = new Rate("trivia_answer_rate");
const hmAnswerRate = new Rate("hm_answer_rate");
const lobbyClosedRate = new Rate("lobby_closed_rate");
const socketErrorRate = new Rate("socket_error_rate");

const hostRoundEndCount = new Counter("host_round_end_count");
const hostLeaderboardCount = new Counter("host_leaderboard_count");
const hostRankingCount = new Counter("host_ranking_count");
const unexpectedMessageCount = new Counter("ws_unexpected_message_count");

const GAME_TYPE = {
  TRIVIA: "trivia",
  HM: "herdmentality",
};

const GAME_STATE = {
  ROUND: "ROUND",
  ROUND_END: "ROUND_END",
  LEADERBOARD: "LEADERBOARD",
  RANKING: "RANKING",
};

const EVENT = {
  OPEN: "OPEN",
  ERROR: "ERROR",
  NOT_FOUND: "NOT_FOUND",
  ROOM_INIT: "ROOM:HOST:INIT",
  ROOM_STATE: "ROOM:STATE",
  ROOM_CLOSED: "ROOM:closed",
  ROOM_CLOSED_ME: "ROOM:closed-me",
  PLAYER_JOIN: "PLAYER:JOIN",
  PLAYER_LEAVE: "PLAYER:LEAVE",
  PLAYER_REACTION: "PLAYER:reaction",
  GAME_INIT: "GAME:INIT",
  GAME_START: "GAME:START",
  GAME_CANCEL: "GAME:CANCEL",
  GAME_STATE: "GAME:STATE",
  GAME_STATE_CHANGE: "GAME:STATE:CHANGE",
  TRIVIA_ROUND_START: "GAME:TRIVIA:ROUND:START",
  TRIVIA_ROUND_ANSWER: "GAME:TRIVIA:ROUND:ANSWER",
  TRIVIA_ROUND_END: "GAME:TRIVIA:ROUND:END",
  HM_ROUND_START: "GAME:HM:ROUND:START",
  HM_ROUND_ANSWER: "GAME:HM:ROUND:ANSWER",
  HM_ROUND_END: "GAME:HM:ROUND:END",
};

export const options = {
  scenarios: {
    host: {
      executor: "per-vu-iterations",
      exec: "hostSession",
      vus: 1,
      iterations: 1,
      maxDuration: HOST_MAX_DURATION,
      tags: { role: "host" },
    },
    players: {
      executor: "per-vu-iterations",
      exec: "playerSession",
      vus: TOTAL_PLAYERS,
      iterations: 1,
      startTime: "1s",
      maxDuration: PLAYER_MAX_DURATION,
      tags: { role: "player" },
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.05"],
    ws_upgrade_rate: ["rate>0.99"],
    ws_open_ack_rate: ["rate>0.99"],
    ws_room_state_rate: ["rate>0.99"],
    reaction_sent_rate: ["rate>0.99"],
    trivia_answer_rate: ["rate>0.99"],
    hm_answer_rate: ["rate>0.99"],
    lobby_closed_rate: ["rate>0.99"],
    socket_error_rate: ["rate<0.05"],
  },
};

function encodeMessage(event, payload) {
  return JSON.stringify({ event, payload });
}

function parseMessage(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    unexpectedMessageCount.add(1);
    return null;
  }
}

function randomInt(maxExclusive) {
  return Math.floor(Math.random() * maxExclusive);
}

function createGuest(displayName, avatar) {
  const response = http.post(
    `${apiBaseUrl}/api/guests`,
    JSON.stringify({ displayName, avatar }),
    {
      headers: { "Content-Type": "application/json" },
      tags: { endpoint: "create-guest" },
    },
  );

  guestCreateDuration.add(response.timings.duration);
  check(response, {
    "guest create returned 200": (res) => res.status === 200,
  });

  const body = response.json();
  if (!body?.id) {
    fail(`Guest creation failed: ${response.status} ${response.body}`);
  }

  return body;
}

function createLobby(hostGuestId) {
  const response = http.post(
    `${apiBaseUrl}/api/lobbies`,
    JSON.stringify({
      name: __ENV.LOBBY_NAME || `k6 Load Test ${Date.now()}`,
      maxPlayers: MAX_PLAYERS,
      hostGuestId,
      private: false,
    }),
    {
      headers: { "Content-Type": "application/json" },
      tags: { endpoint: "create-lobby" },
    },
  );

  lobbyCreateDuration.add(response.timings.duration);
  check(response, {
    "lobby create returned 200": (res) => res.status === 200,
  });

  const body = response.json();
  if (!body?.lobby?.lobbyIdentifier) {
    fail(`Lobby creation failed: ${response.status} ${response.body}`);
  }

  return body.lobby;
}

export function setup() {
  const hostGuest = createGuest(hostDisplayName, hostAvatar);
  const lobby = createLobby(hostGuest.id);

  return {
    roomId: lobby.lobbyIdentifier,
    lobbyCode: lobby.code,
    hostGuestId: hostGuest.id,
  };
}

function schedule(socket, delayMs, fn) {
  socket.setTimeout(fn, Math.max(1, Math.round(delayMs)));
}

function configureGame(socket, roomId, type, noOfRounds) {
  socket.send(
    encodeMessage(EVENT.GAME_INIT, {
      roomId,
      options: {
        type,
        config: {
          noOfRounds,
          duration: ROUND_DURATION_SECONDS,
        },
      },
    }),
  );
}

function beginGame(socket, roomId) {
  socket.send(encodeMessage(EVENT.GAME_START, { roomId }));
}

function advanceGame(socket, roomId, state) {
  socket.send(encodeMessage(EVENT.GAME_STATE_CHANGE, { roomId, state }));
}

function closeLobby(socket, roomId) {
  socket.send(
    encodeMessage(EVENT.ROOM_CLOSED_ME, {
      roomId,
      reason: "k6 host completed load test",
    }),
  );
}

export function hostSession(data) {
  const roomId = data.roomId;
  const sessionStartedAt = Date.now();

  const response = ws.connect(wsUrl, {}, (socket) => {
    let openAcked = false;
    let roomStateSeen = false;
    let handshakeStartedAt = 0;
    let hadSocketError = false;
    let gameSequenceStarted = false;
    let activeGame = null;
    let triviaRoundsSeen = 0;
    let hmRoundsSeen = 0;
    let playersReady = false;
    let shutdownRequested = false;

    socket.on("open", () => {
      handshakeStartedAt = Date.now();
    });

    socket.on("message", (raw) => {
      const msg = parseMessage(raw);
      if (!msg) return;

      switch (msg.event) {
        case EVENT.OPEN:
          openAcked = true;
          socket.send(encodeMessage(EVENT.ROOM_INIT, { roomId }));
          return;

        case EVENT.ROOM_STATE: {
          roomStateSeen = true;
          if (handshakeStartedAt) {
            handshakeLatency.add(Date.now() - handshakeStartedAt);
            handshakeStartedAt = 0;
          }

          const state = msg.payload || {};
          const players = state.players || [];
          const roomGame = state.game || null;

          if (!playersReady && players.length >= TOTAL_PLAYERS) {
            playersReady = true;
            schedule(socket, PRE_GAME_SETTLE_MS, () => {
              configureGame(socket, roomId, GAME_TYPE.TRIVIA, TRIVIA_ROUNDS);
            });
          }

          if (playersReady && roomGame && !gameSequenceStarted) {
            gameSequenceStarted = true;
            activeGame = roomGame.type;
            schedule(socket, STATE_TRANSITION_DELAY_MS, () => beginGame(socket, roomId));
          }

          if (
            playersReady &&
            activeGame === GAME_TYPE.HM &&
            !roomGame &&
            players.length === 0 &&
            !shutdownRequested
          ) {
            shutdownRequested = true;
            schedule(socket, STATE_TRANSITION_DELAY_MS, () => closeLobby(socket, roomId));
          }

          return;
        }

        case EVENT.TRIVIA_ROUND_END:
          hostRoundEndCount.add(1);
          triviaRoundsSeen += 1;
          schedule(socket, STATE_TRANSITION_DELAY_MS, () =>
            advanceGame(socket, roomId, GAME_STATE.LEADERBOARD),
          );
          return;

        case EVENT.HM_ROUND_END:
          hostRoundEndCount.add(1);
          hmRoundsSeen += 1;
          schedule(socket, STATE_TRANSITION_DELAY_MS, () =>
            advanceGame(socket, roomId, GAME_STATE.LEADERBOARD),
          );
          return;

        case EVENT.GAME_STATE: {
          const payload = msg.payload || {};
          if (payload.state === GAME_STATE.LEADERBOARD) {
            hostLeaderboardCount.add(1);

            if (payload.type === GAME_TYPE.TRIVIA) {
              if (triviaRoundsSeen >= TRIVIA_ROUNDS) {
                schedule(socket, STATE_TRANSITION_DELAY_MS, () =>
                  advanceGame(socket, roomId, GAME_STATE.RANKING),
                );
              } else {
                schedule(socket, STATE_TRANSITION_DELAY_MS, () =>
                  advanceGame(socket, roomId, GAME_STATE.ROUND),
                );
              }
            }

            if (payload.type === GAME_TYPE.HM) {
              if (hmRoundsSeen >= HM_ROUNDS) {
                schedule(socket, STATE_TRANSITION_DELAY_MS, () =>
                  advanceGame(socket, roomId, GAME_STATE.RANKING),
                );
              } else {
                schedule(socket, STATE_TRANSITION_DELAY_MS, () =>
                  advanceGame(socket, roomId, GAME_STATE.ROUND),
                );
              }
            }

            return;
          }

          if (payload.state === GAME_STATE.RANKING) {
            hostRankingCount.add(1);

            if (payload.type === GAME_TYPE.TRIVIA) {
              schedule(socket, STATE_TRANSITION_DELAY_MS, () =>
                socket.send(encodeMessage(EVENT.GAME_CANCEL, { roomId })),
              );
              schedule(socket, STATE_TRANSITION_DELAY_MS * 3, () => {
                activeGame = GAME_TYPE.HM;
                configureGame(socket, roomId, GAME_TYPE.HM, HM_ROUNDS);
              });
              schedule(socket, STATE_TRANSITION_DELAY_MS * 5, () => beginGame(socket, roomId));
            }

            if (payload.type === GAME_TYPE.HM) {
              schedule(socket, STATE_TRANSITION_DELAY_MS, () =>
                socket.send(encodeMessage(EVENT.GAME_CANCEL, { roomId })),
              );
            }
            return;
          }

          return;
        }

        case EVENT.ROOM_CLOSED:
          lobbyClosedRate.add(true);
          socket.close();
          return;

        case EVENT.ERROR:
        case EVENT.NOT_FOUND:
          hadSocketError = true;
          socket.close();
          return;

        default:
          return;
      }
    });

    socket.on("error", () => {
      hadSocketError = true;
    });

    socket.on("close", () => {
      check(
        {
          openAcked,
          roomStateSeen,
          triviaRoundsSeen,
          hmRoundsSeen,
        },
        {
          "host received open ack": (state) => state.openAcked === true,
          "host received room state": (state) => state.roomStateSeen === true,
          "host saw all trivia rounds": (state) => state.triviaRoundsSeen >= TRIVIA_ROUNDS,
          "host saw all hm rounds": (state) => state.hmRoundsSeen >= HM_ROUNDS,
        },
      );

      openAckRate.add(openAcked);
      roomStateRate.add(roomStateSeen);
      socketErrorRate.add(hadSocketError);
      sessionDuration.add(Date.now() - sessionStartedAt);
    });
  });

  websocketUpgradeRate.add(response && response.status === 101);
  check(response, {
    "host websocket upgrade succeeded": (res) => res && res.status === 101,
  });
}

export function playerSession(data) {
  const roomId = data.roomId;
  const sessionStartedAt = Date.now();
  const vuId = exec.vu.idInTest;
  const playerId = `k6-player-${vuId}`;
  const displayName = `k6 Player ${vuId}`;
  const avatar = `https://api.dicebear.com/9.x/glass/svg?seed=${vuId}`;

  sleep((vuId - 1) * PLAYER_JOIN_STAGGER_MS / 1000);

  const response = ws.connect(wsUrl, {}, (socket) => {
    let openAcked = false;
    let roomStateSeen = false;
    let handshakeStartedAt = 0;
    let hadSocketError = false;
    let reactionSent = false;
    let hmRoundsAnswered = 0;
    let leaveRequested = false;
    const answeredRounds = new Set();

    socket.on("open", () => {
      handshakeStartedAt = Date.now();
    });

    socket.on("message", (raw) => {
      const msg = parseMessage(raw);
      if (!msg) return;

      switch (msg.event) {
        case EVENT.OPEN:
          openAcked = true;
          socket.send(
            encodeMessage(EVENT.PLAYER_JOIN, {
              roomId,
              playerId,
              displayName,
              avatar,
            }),
          );
          return;

        case EVENT.ROOM_STATE:
          if (!roomStateSeen) {
            roomStateSeen = true;
            if (handshakeStartedAt) {
              handshakeLatency.add(Date.now() - handshakeStartedAt);
              handshakeStartedAt = 0;
            }
          }

          if (!reactionSent) {
            reactionSent = true;
            schedule(socket, PLAYER_REACTION_DELAY_MS, () => {
              socket.send(
                encodeMessage(EVENT.PLAYER_REACTION, {
                  roomId,
                  playerId,
                  displayName,
                  emoji: reactionEmoji,
                }),
              );
              reactionSentRate.add(true);
            });
          }

          if (!msg.payload?.game && hmRoundsAnswered > 0 && !leaveRequested) {
            leaveRequested = true;
            socket.send(encodeMessage(EVENT.PLAYER_LEAVE, { roomId, playerId }));
            schedule(socket, 50, () => socket.close());
          }
          return;

        case EVENT.TRIVIA_ROUND_START: {
          const roundId = `trivia-${msg.payload?.round?.number}`;
          if (answeredRounds.has(roundId)) return;
          answeredRounds.add(roundId);

          schedule(socket, randomInt(250), () => {
            socket.send(
              encodeMessage(EVENT.TRIVIA_ROUND_ANSWER, {
                roomId,
                playerId,
                answer: randomInt(4),
              }),
            );
            triviaAnswerRate.add(true);
          });
          return;
        }

        case EVENT.HM_ROUND_START: {
          const roundId = `hm-${msg.payload?.round?.number}`;
          if (answeredRounds.has(roundId)) return;
          answeredRounds.add(roundId);
          hmRoundsAnswered += 1;

          schedule(socket, randomInt(250), () => {
            socket.send(
              encodeMessage(EVENT.HM_ROUND_ANSWER, {
                roomId,
                playerId,
                answer: randomInt(6),
              }),
            );
            hmAnswerRate.add(true);
          });
          return;
        }

        case EVENT.ROOM_CLOSED:
          socket.close();
          return;

        case EVENT.ERROR:
        case EVENT.NOT_FOUND:
          hadSocketError = true;
          socket.close();
          return;

        default:
          return;
      }
    });

    socket.on("error", () => {
      hadSocketError = true;
    });

    socket.on("close", () => {
      check(
        {
          openAcked,
          roomStateSeen,
        },
        {
          "player received open ack": (state) => state.openAcked === true,
          "player received room state": (state) => state.roomStateSeen === true,
        },
      );

      openAckRate.add(openAcked);
      roomStateRate.add(roomStateSeen);
      socketErrorRate.add(hadSocketError);
      sessionDuration.add(Date.now() - sessionStartedAt);
    });
  });

  websocketUpgradeRate.add(response && response.status === 101);
  check(response, {
    "player websocket upgrade succeeded": (res) => res && res.status === 101,
  });
}
