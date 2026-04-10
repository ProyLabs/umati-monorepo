import exec from "k6/execution";
import http from "k6/http";
import ws from "k6/ws";
import { check, fail, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

const wsUrl = __ENV.WS_URL || "ws://localhost:4000/ws";
const apiBaseUrl = (__ENV.API_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

const MAX_PLAYERS = Number(__ENV.MAX_PLAYERS || 50);
const OVERFLOW_PLAYERS = Number(__ENV.OVERFLOW_PLAYERS || 5);
const TOTAL_JOINERS = MAX_PLAYERS + OVERFLOW_PLAYERS;
const HOST_MAX_DURATION = __ENV.HOST_MAX_DURATION || "2m";
const PLAYER_MAX_DURATION = __ENV.PLAYER_MAX_DURATION || "2m";
const PLAYER_JOIN_STAGGER_MS = Number(__ENV.PLAYER_JOIN_STAGGER_MS || 20);
const HOLD_MS = Number(__ENV.HOLD_MS || 5000);

const hostAvatar =
  __ENV.HOST_AVATAR ||
  "https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_1.png";

const lobbyCreateDuration = new Trend("capacity_lobby_create_duration", true);
const guestCreateDuration = new Trend("capacity_guest_create_duration", true);
const handshakeLatency = new Trend("capacity_ws_handshake_latency", true);

const websocketUpgradeRate = new Rate("capacity_ws_upgrade_rate");
const hostReadyRate = new Rate("capacity_host_ready_rate");
const joinAcceptedRate = new Rate("capacity_join_accepted_rate");
const joinRejectedRate = new Rate("capacity_join_rejected_rate");
const socketErrorRate = new Rate("capacity_socket_error_rate");
const lobbyClosedRate = new Rate("capacity_lobby_closed_rate");

const acceptedCount = new Counter("capacity_accepted_count");
const rejectedCount = new Counter("capacity_rejected_count");

const EVENT = {
  OPEN: "OPEN",
  ERROR: "ERROR",
  ROOM_INIT: "ROOM:HOST:INIT",
  ROOM_STATE: "ROOM:STATE",
  ROOM_CLOSED: "ROOM:closed",
  ROOM_CLOSED_ME: "ROOM:closed-me",
  PLAYER_JOIN: "PLAYER:JOIN",
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
      vus: TOTAL_JOINERS,
      iterations: 1,
      startTime: "1s",
      maxDuration: PLAYER_MAX_DURATION,
      tags: { role: "player" },
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.05"],
    capacity_ws_upgrade_rate: ["rate>0.99"],
    capacity_host_ready_rate: ["rate>0.99"],
    capacity_join_accepted_rate: [`rate>${MAX_PLAYERS / TOTAL_JOINERS - 0.01}`],
    capacity_join_rejected_rate: [`rate>${OVERFLOW_PLAYERS / TOTAL_JOINERS - 0.01}`],
    capacity_socket_error_rate: ["rate<0.05"],
    capacity_lobby_closed_rate: ["rate>0.99"],
  },
};

function encodeMessage(event, payload) {
  return JSON.stringify({ event, payload });
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
      name: __ENV.LOBBY_NAME || `k6 Capacity ${Date.now()}`,
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
  const hostGuest = createGuest("k6 Capacity Host", hostAvatar);
  const lobby = createLobby(hostGuest.id);

  return {
    roomId: lobby.lobbyIdentifier,
    lobbyCode: lobby.code,
  };
}

function schedule(socket, delayMs, fn) {
  socket.setTimeout(fn, Math.max(1, Math.round(delayMs)));
}

export function hostSession(data) {
  const roomId = data.roomId;

  const response = ws.connect(wsUrl, {}, (socket) => {
    let openAcked = false;
    let roomStateSeen = false;
    let handshakeStartedAt = 0;
    let hadSocketError = false;
    let lobbyClosed = false;
    let closeScheduled = false;

    socket.on("open", () => {
      handshakeStartedAt = Date.now();
    });

    socket.on("message", (raw) => {
      const msg = JSON.parse(raw);

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

          const players = msg.payload?.players || [];
          if (!closeScheduled && players.length >= MAX_PLAYERS) {
            closeScheduled = true;
            schedule(socket, HOLD_MS, () => {
              socket.send(
                encodeMessage(EVENT.ROOM_CLOSED_ME, {
                  roomId,
                  reason: "k6 capacity test complete",
                }),
              );
            });
          }
          return;
        }

        case EVENT.ROOM_CLOSED:
          lobbyClosed = true;
          lobbyClosedRate.add(true);
          socket.close();
          return;

        case EVENT.ERROR:
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
      hostReadyRate.add(openAcked && roomStateSeen);
      socketErrorRate.add(hadSocketError);
      check(
        { openAcked, roomStateSeen, lobbyClosed },
        {
          "host received open ack": (s) => s.openAcked === true,
          "host received room state": (s) => s.roomStateSeen === true,
          "host saw lobby close": (s) => s.lobbyClosed === true,
        },
      );
    });
  });

  websocketUpgradeRate.add(response && response.status === 101);
  check(response, {
    "host websocket upgrade succeeded": (res) => res && res.status === 101,
  });
}

export function playerSession(data) {
  const roomId = data.roomId;
  const vuId = exec.vu.idInTest;
  const playerId = `capacity-player-${vuId}`;
  const displayName = `Capacity Player ${vuId}`;
  const avatar = `https://api.dicebear.com/9.x/glass/svg?seed=capacity-${vuId}`;
  const shouldBeAccepted = vuId <= MAX_PLAYERS;

  sleep((vuId - 1) * PLAYER_JOIN_STAGGER_MS / 1000);

  const response = ws.connect(wsUrl, {}, (socket) => {
    let openAcked = false;
    let roomStateSeen = false;
    let handshakeStartedAt = 0;
    let accepted = false;
    let rejected = false;
    let hadSocketError = false;
    let lobbyClosed = false;

    socket.on("open", () => {
      handshakeStartedAt = Date.now();
    });

    socket.on("message", (raw) => {
      const msg = JSON.parse(raw);

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
          roomStateSeen = true;
          accepted = true;
          if (handshakeStartedAt) {
            handshakeLatency.add(Date.now() - handshakeStartedAt);
            handshakeStartedAt = 0;
          }
          return;

        case EVENT.ERROR:
          if ((msg.payload?.message || "").includes("capacity")) {
            rejected = true;
            socket.close();
            return;
          }
          hadSocketError = true;
          socket.close();
          return;

        case EVENT.ROOM_CLOSED:
          lobbyClosed = true;
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
      if (accepted) {
        acceptedCount.add(1);
      }
      if (rejected) {
        rejectedCount.add(1);
      }

      joinAcceptedRate.add(accepted === shouldBeAccepted);
      joinRejectedRate.add(rejected === !shouldBeAccepted);
      socketErrorRate.add(hadSocketError);

      check(
        { shouldBeAccepted, accepted, rejected, openAcked, roomStateSeen, lobbyClosed },
        {
          "player received open ack": (s) => s.openAcked === true,
          "accepted players were admitted": (s) =>
            !s.shouldBeAccepted || (s.accepted === true && s.roomStateSeen === true),
          "overflow players were rejected": (s) =>
            s.shouldBeAccepted || s.rejected === true,
          "accepted players stayed until close": (s) =>
            !s.shouldBeAccepted || s.lobbyClosed === true,
        },
      );
    });
  });

  websocketUpgradeRate.add(response && response.status === 101);
  check(response, {
    "player websocket upgrade succeeded": (res) => res && res.status === 101,
  });
}

