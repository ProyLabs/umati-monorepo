"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/providers/auth-provider";
import {
  Lobby,
  Player,
  RoomState,
  WSEvent,
  WSClient,
  WSPayloads,
  getWsUrl,
  GameLobbyMeta,
  TriviaOptions,
} from "@umati/ws";

/* -------------------------------------------------------------------------- */
/* 🧩 Context Type                                                           */
/* -------------------------------------------------------------------------- */
interface LobbyPlayerContextType {
  lobby: Lobby | null;
  players: Player[];
  player: Player | null;
  uiState: RoomState;
  game: GameLobbyMeta | null;
  loading: boolean;
  reconnecting: boolean;
  isInLobby: boolean;
  wsClient: WSClient | null;

  // Actions
  joinLobby: (displayName: string, avatar: string) => Promise<void>;
  leaveLobby: () => Promise<void>;
  sendReaction: (emoji: string) => void;
  sendAnswer: (index: TriviaOptions) => void;
}

const LobbyPlayerContext = createContext<LobbyPlayerContextType | undefined>(
  undefined
);

/* -------------------------------------------------------------------------- */
/* 🏠 Provider                                                               */
/* -------------------------------------------------------------------------- */
export function LobbyPlayerProvider({ children }: { children: ReactNode }) {
  const { identifier } = useParams() as { identifier: string };
  const router = useRouter();
  const { user, updateUser } = useAuth();

  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [uiState, setUiState] = useState<RoomState>("INIT");
  const [game, setGame] = useState<GameLobbyMeta | null>(null);
  const [reconnecting, setReconnecting] = useState(false);

  const wsRef = useRef<WSClient | null>(null);
  const initializedRef = useRef(false);

  /* ------------------------------------------------------------------------ */
  /* 🧠 Strongly Typed Send Helper                                            */
  /* ------------------------------------------------------------------------ */
  const send = useCallback(
    <E extends WSEvent>(event: E, payload: WSPayloads[E & keyof WSPayloads]) => {
      wsRef.current?.send(event, payload);
    },
    []
  );

  /* ------------------------------------------------------------------------ */
  /* ⚡ WebSocket Event Handling                                              */
  /* ------------------------------------------------------------------------ */
  const handleMessage = useCallback(
    (event: WSEvent, payload: any) => {
      switch (event) {
        // case WSEvent.NOT_FOUND:
        //   router.push("/not-found");
        //   break;

        case WSEvent.OPEN:
          console.log(`✅ Player ${user?.id} WS connected`);
          setReconnecting(false);
          send(WSEvent.PLAYER_CONNECT, {
            roomId: identifier,
            playerId: user?.id!,
          });
          break;

        case WSEvent.ROOM_STATE: {
          const data = payload as WSPayloads[WSEvent.ROOM_STATE];
          setLobby(data);
          setPlayers(data!.players);
          setUiState(data!.state);
          setGame(data!.game ?? null);
          setLoading(false);
          break;
        }

        case WSEvent.ROOM_CLOSED:
          toast.info(payload.reason ?? "Lobby closed");
          router.replace("/");
          break;

        default:
          console.log("📩 Unhandled event:", event, payload);
      }
    },
    [identifier, router, send, user?.id]
  );

  /* ------------------------------------------------------------------------ */
  /* 🔌 WebSocket Setup + Lifecycle                                           */
  /* ------------------------------------------------------------------------ */
  useEffect(() => {
    if (!identifier || initializedRef.current) return;

    initializedRef.current = true;
    console.log("🔌 Player WS initializing:", identifier);

    const ws = new WSClient(getWsUrl());
    wsRef.current = ws;

    ws.onConnectionChange((state) => {
      switch (state) {
        case "open":
          setReconnecting(false);
          console.log("✅ WS open");
          break;
        case "reconnecting":
          // if (!reconnecting) toast.info("Reconnecting...");
          setReconnecting(true);
          break;
        case "closed":
          setReconnecting(false);
          // toast.error("WS disconnected");
          break;
        // case "error": 
        //   router.push("/not-found");
        //   break;
      }
    });

    const events: WSEvent[] = [
      WSEvent.OPEN,
      WSEvent.ROOM_STATE,
      WSEvent.ROOM_CLOSED,
    ];
    for (const ev of events) ws.on(ev as WSEvent & keyof WSPayloads, (payload) => handleMessage(ev, payload));

    return () => {
      console.log("🧹 Cleaning up WS connection");
      initializedRef.current = false;
      ws.close();
      wsRef.current = null;
    };
  }, [identifier, handleMessage, reconnecting]);

  /* ------------------------------------------------------------------------ */
  /* 🧩 Derived Values                                                        */
  /* ------------------------------------------------------------------------ */
  const player = useMemo(
    () => players.find((p) => p.id === user?.id) ?? null,
    [players, user?.id]
  );

  const isInLobby = useMemo(
    () => players.some((p) => p.id === user?.id),
    [players, user?.id]
  );

  /* ------------------------------------------------------------------------ */
  /* 🎮 Player Actions                                                        */
  /* ------------------------------------------------------------------------ */
  const joinLobby = useCallback(
    async (displayName: string, avatar: string) => {
      updateUser(displayName, avatar);
      send(WSEvent.PLAYER_JOIN, {
        roomId: identifier,
        playerId: user?.id!,
        displayName,
        avatar,
      });
    },
    [identifier, send, updateUser, user?.id]
  );

  const leaveLobby = useCallback(async () => {
    send(WSEvent.PLAYER_LEAVE, {
      roomId: identifier,
      playerId: user?.id!,
    });
  }, [identifier, send, user?.id]);

  const sendReaction = useCallback(
    (emoji: string) => {
      if (!player) return;
      send(WSEvent.PLAYER_REACTION, {
        roomId: identifier,
        playerId: player.id,
        displayName: player.displayName,
        emoji,
      });
    },
    [identifier, player, send]
  );

  const sendAnswer = useCallback(
    (index: TriviaOptions) => {
      if (!player) return;
      send(WSEvent.GAME_ANSWER, {
        roomId: identifier,
        playerId: player.id,
        answer: index,
      });
    },
    [identifier, player, send]
  );

  /* ------------------------------------------------------------------------ */
  /* 💾 Context Value                                                         */
  /* ------------------------------------------------------------------------ */
  const value = useMemo<LobbyPlayerContextType>(
    () => ({
      lobby,
      players,
      player,
      uiState,
      game,
      loading,
      reconnecting,
      isInLobby,
      wsClient: wsRef.current,
      joinLobby,
      leaveLobby,
      sendReaction,
      sendAnswer,
    }),
    [
      lobby,
      players,
      player,
      uiState,
      game,
      loading,
      reconnecting,
      isInLobby,
      joinLobby,
      leaveLobby,
      sendReaction,
      sendAnswer,
    ]
  );

  return (
    <LobbyPlayerContext.Provider value={value}>
      {children}
    </LobbyPlayerContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/* 🪄 Hook                                                                    */
/* -------------------------------------------------------------------------- */
export function useLobbyPlayer() {
  const ctx = useContext(LobbyPlayerContext);
  if (!ctx) throw new Error("useLobbyPlayer must be used within a LobbyPlayerProvider");
  return ctx;
}
