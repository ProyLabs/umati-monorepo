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
import { Lobby, LobbyUIState, Player } from "@/lib/types/lobby-shared";
import WSClient, { getWsUrl } from "@/lib/ws/client";
import { WSEvent } from "@/lib/ws/events";

/** Context shape */
interface LobbyPlayerContextType {
  lobby: Lobby | null;
  players: Player[];
  player: Player | null;
  uiState: LobbyUIState;
  loading: boolean;
  isInLobby: boolean;

  // Actions
  joinLobby: (displayName: string, avatar?: string) => Promise<void>;
  leaveLobby: () => Promise<void>;
  sendReaction: (emoji: string) => void;
  refetchLobby: () => Promise<void>;
}

const LobbyPlayerContext = createContext<LobbyPlayerContextType | undefined>(
  undefined
);

export function LobbyPlayerProvider({ children }: { children: ReactNode }) {
  const { identifier } = useParams() as { identifier: string };
  const router = useRouter();
  const { user, updateUser } = useAuth(); // Always returns a user or guest
  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uiState, setUiState] = useState<LobbyUIState>("WAITING");

  const wsRef = useRef<WSClient | null>(null);

  // --------------------------------------------------------------------------
  // 🧭 Fetch lobby via REST
  // --------------------------------------------------------------------------
  const fetchLobby = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/lobbies/${identifier}`);
      if (!res.ok) throw new Error("Failed to fetch lobby");
      const data = await res.json();
      setLobby(data);
      setPlayers(data.players ?? []);
      setUiState(data.state ?? "WAITING");
      const player = players.find((p)=> p.playerId === user?.id)
      if(player){
        setJoined(true)
      }
    } catch (err) {
      console.error("❌ Fetch lobby failed:", err);
      toast.error("Could not load lobby");
      router.replace("/join-lobby");
    } finally {
      setLoading(false);
    }
  }, [identifier, router]);

  // --------------------------------------------------------------------------
  // 👥 Join Lobby via HTTP (creates LobbyPlayer row)
  // --------------------------------------------------------------------------
  const joinLobby = useCallback(
    async (displayName: string, avatar?: string) => {
      try {
        const res = await fetch(`/api/lobbies/${identifier}/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: user!.id, // guest or user id
            type: user!.type,
            displayName,
            avatar,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to join lobby");
        }

        const data = await res.json();
         setJoined(true)
        updateUser(displayName, avatar);
        fetchLobby();
        toast.success(`Welcome, ${displayName}!`);
      } catch (err: any) {
        toast.error(err.message || "Could not join lobby");
      }
    },
    [identifier, user, updateUser]
  );

  // --------------------------------------------------------------------------
  // 🚪 Leave Lobby via HTTP
  // --------------------------------------------------------------------------
  const leaveLobby = useCallback(async () => {
    try {
      await fetch(`/api/lobbies/${identifier}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user!.id, type: user!.type }),
      });
      setJoined(false)
      wsRef.current?.send(WSEvent.PLAYER_LEFT, {
        playerId: user!.id,
      });
      toast.info("You left the lobby");
      wsRef.current?.close();
      router.push("/join-lobby");
    } catch {
      toast.error("Failed to leave lobby");
    }
  }, [identifier, router, user]);

  // --------------------------------------------------------------------------
  // ⚡ WebSocket: Event Handling
  // --------------------------------------------------------------------------
  const handleMessage = useCallback(
    (event: WSEvent, payload: any) => {
      switch (event) {
        case WSEvent.OPEN:
          console.log("✅ Player WS connected");
          break;

        case WSEvent.PLAYER_KICKED_ME:
          toast.error(payload.reason || "You were removed from the lobby");
          router.replace("/join-lobby");
          break;

        case WSEvent.ROOM_CLOSED_ME:
          toast.info("Lobby closed by host");
          router.replace("/join-lobby");
          break;

        case WSEvent.ROOM_STATE:
          setPlayers(payload.players ?? []);
          setUiState(payload.state ?? "WAITING");
          break;

        case WSEvent.GAME_QUESTION:
          setUiState("GAME");
          break;

        case WSEvent.GAME_ROUND_ENDED:
          setUiState("LEADERBOARD");
          break;

        case WSEvent.SYSTEM_ANNOUNCEMENT:
          toast.info(payload.message);
          break;

        default:
          console.log("📩 Unhandled event:", event, payload);
          break;
      }
    },
    [router]
  );

  useEffect(() => {
    if (!identifier) return;
    fetchLobby();
  }, []);

  // --------------------------------------------------------------------------
  // 🔌 WebSocket connection setup
  // --------------------------------------------------------------------------
  const connectWs = useCallback(() => {
    if (!user || !identifier) return;
    // connect after join
    const wsUrl = getWsUrl(identifier, "player", user.id);
    const ws = new WSClient(wsUrl);
    wsRef.current = ws;

    ws.onConnectionChange((state) => {
      if (state === "reconnecting" && joined) toast.info("Reconnecting WebSocket...");
      if (state === "open" && ws.reconnected)
        toast.success("Reconnected to session");

      if (state === "open") {
        console.log("✅ Player WS connected");
        ws?.send(WSEvent.PLAYER_JOINED, {
          playerId: user!.id,
          displayName: user!.displayName,
          avatar: user!.avatar,
        });
      }
      if (state === "closed" && joined) toast.error("Connection lost");
    });

    ws.onReconnect(() => {
      console.log("🔁 Session fully restored — skipping join()");
    });

    // Register handlers
    ws.on(WSEvent.OPEN, (p) => handleMessage(WSEvent.OPEN, p));
    ws.on(WSEvent.ROOM_STATE, (p) => handleMessage(WSEvent.ROOM_STATE, p));
    ws.on(WSEvent.ROOM_CLOSED_ME, (p) =>
      handleMessage(WSEvent.ROOM_CLOSED_ME, p)
    );
    ws.on(WSEvent.PLAYER_KICKED_ME, (p) =>
      handleMessage(WSEvent.PLAYER_KICKED_ME, p)
    );
    ws.on(WSEvent.GAME_QUESTION, (p) =>
      handleMessage(WSEvent.GAME_QUESTION, p)
    );
    ws.on(WSEvent.GAME_ROUND_ENDED, (p) =>
      handleMessage(WSEvent.GAME_ROUND_ENDED, p)
    );
    ws.on(WSEvent.SYSTEM_ANNOUNCEMENT, (p) =>
      handleMessage(WSEvent.SYSTEM_ANNOUNCEMENT, p)
    );

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [user, identifier, handleMessage]);

  // --------------------------------------------------------------------------
  // 🎭 Send Reaction
  // --------------------------------------------------------------------------
  const sendReaction = useCallback(
    (emoji: string) => {
      if (!user) return;
      wsRef.current?.send(WSEvent.PLAYER_REACTION, {
        playerId: user.id,
        emoji,
      });
    },
    [user]
  );

  // --------------------------------------------------------------------------
  // 🧩 Derived State
  // --------------------------------------------------------------------------
  const player = useMemo(
    () => players.find((p) => p.playerId === user!.id) ?? null,
    [players, user]
  );

  const isInLobby = useMemo(() => !!player, [player]);

  const wsState = useMemo(() => wsRef.current?.state, [wsRef.current?.state]);
  console.log("🚀 ~ LobbyPlayerProvider ~ wsState:", wsState);

  useEffect(() => {
    if (!player || !isInLobby) return;
    connectWs();
  }, [player, isInLobby]);

  // --------------------------------------------------------------------------
  // 💾 Context Value
  // --------------------------------------------------------------------------
  const value = useMemo(
    () => ({
      lobby,
      players,
      player,
      uiState,
      loading,
      isInLobby,
      joinLobby,
      leaveLobby,
      sendReaction,
      refetchLobby: fetchLobby,
    }),
    [
      lobby,
      players,
      player,
      uiState,
      loading,
      isInLobby,
      joinLobby,
      leaveLobby,
      sendReaction,
      fetchLobby,
    ]
  );

  return (
    <LobbyPlayerContext.Provider value={value}>
      {children}
    </LobbyPlayerContext.Provider>
  );
}

/** Hook */
export function useLobbyPlayer() {
  const ctx = useContext(LobbyPlayerContext);
  if (!ctx)
    throw new Error("useLobbyPlayer must be used within a LobbyPlayerProvider");
  return ctx;
}
