"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
  useRef,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Lobby, Player, LobbyUIState } from "@/lib/types/lobby-shared";
import { WSEvent } from "@/lib/ws/events";
import WSClient, { getWsUrl } from "@/lib/ws/client";

/**
 * 🎮 Host Lobby Context
 */
interface LobbyHostContextType {
  lobby: Lobby | null;
  players: Player[];
  reactions: Record<string, string | null>; // playerId → emoji
  loading: boolean;
  uiState: LobbyUIState;
  joinUrl: string;

  refetchLobby: () => Promise<void>;
  setUiState: (state: LobbyUIState) => void;
  sendAnnouncement: (message: string) => void;
  kickPlayer: (playerId: string, reason?: string) => void;
  closeLobby: () => void;
}

/**
 * 🧩 Context
 */
const LobbyHostContext = createContext<LobbyHostContextType | undefined>(
  undefined
);

/**
 * 🏠 Provider Component
 */
export function LobbyHostProvider({ children }: { children: ReactNode }) {
  const { identifier } = useParams() as { identifier: string };
  const router = useRouter();

  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [reactions, setReactions] = useState<Record<string, string | null>>({});
  const [uiState, setUiState] = useState<LobbyUIState>("WAITING");

  const wsRef = useRef<WSClient | null>(null);

  // --------------------------------------------------------------------------
  // 🧭 Fetch Lobby Details
  // --------------------------------------------------------------------------

  const fetchLobby = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetch(`/api/lobbies/${identifier}`);
      if (!res.ok) {
        if (res.status === 404) {
          toast.error("Lobby not found");
          router.replace("/join-lobby");
        } else {
          toast.error("Failed to fetch lobby");
        }
        return;
      }

      const data = await res.json();
      setLobby(data);
      setPlayers(data.players ?? []);
      setUiState(data.state ?? "WAITING");
    } catch (err) {
      console.error("❌ Error fetching lobby:", err);
      toast.error("Something went wrong while loading the lobby");
    } finally {
      setLoading(false);
    }
  }, [identifier, router]);


  const removePlayer = useCallback(
    async (playerId: string) => {
      const player = players.find((p) => p.playerId === playerId);
      try {
        await fetch(`/api/lobbies/${identifier}/leave`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: playerId, type: player!.type }),
        });

        setPlayers((prev) => prev.filter((p) => p.playerId !== playerId));
        toast.success(`${player?.displayName} left the lobby`);
      } catch {
        toast.error("Failed to leave lobby");
      }
    },
    [identifier, router]
  );

  // --------------------------------------------------------------------------
  // ⚡ WebSocket event handling
  // --------------------------------------------------------------------------
  const handleMessage = useCallback(
    (event: WSEvent, payload: any) => {
      switch (event) {
        case WSEvent.OPEN:
          console.log("✅ Host WS connected");
          break;

        case WSEvent.PLAYER_JOINED:
          setPlayers((prev) =>
            prev.some((p) => p.playerId === payload.playerId)
              ? prev
              : [...prev, payload]
          );
          toast.success(`${payload?.displayName} joined the lobby`);
          break;

        case WSEvent.PLAYER_LEFT:
          console.log("🚀 ~ LobbyHostProvider ~ players:", players);
          // removePlayer(payload.playerId);
          setPlayers((prev) => prev.filter((p) => p.playerId !== payload.playerId));
          break;

        case WSEvent.PLAYER_REACTION:
          setReactions((prev) => ({
            ...prev,
            [payload.playerId]: payload.emoji,
          }));
          setTimeout(() => {
            setReactions((prev) => ({ ...prev, [payload.playerId]: null }));
          }, 3000);
          break;

        case WSEvent.PLAYER_KICKED:
          toast.info(`Player ${payload.playerId} was kicked`);
          setPlayers((prev) =>
            prev.filter((p) => p.playerId !== payload.playerId)
          );
          break;

        case WSEvent.GAME_QUESTION:
          setUiState("GAME");
          break;

        case WSEvent.GAME_ROUND_ENDED:
          setUiState("LEADERBOARD");
          break;

        case WSEvent.ROOM_CLOSED:
          toast.info("Lobby closed");
          router.replace("/dashboard");
          break;

        default:
          console.log("📩 Unhandled event:", event, payload);
          break;
      }
    },
    [router]
  );

  // --------------------------------------------------------------------------
  // 🔌 WebSocket connection setup
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!identifier) return;
    fetchLobby();

    const wsUrl = getWsUrl(identifier, "host");
    const ws = new WSClient(wsUrl);
    wsRef.current = ws;

    ws.onConnectionChange((state) => {
      if (state === "open") console.log("✅ Host WS connected");
      if (state === "reconnecting") toast.info("Reconnecting...");
      if (state === "closed") toast.error("WS disconnected");
    });

    // Register handlers
    ws.on(WSEvent.OPEN, (p) => handleMessage(WSEvent.OPEN, p));
    ws.on(WSEvent.PLAYER_JOINED, (p) =>
      handleMessage(WSEvent.PLAYER_JOINED, p)
    );
    ws.on(WSEvent.PLAYER_LEFT, (p) => handleMessage(WSEvent.PLAYER_LEFT, p));
    ws.on(WSEvent.PLAYER_REACTION, (p) =>
      handleMessage(WSEvent.PLAYER_REACTION, p)
    );
    ws.on(WSEvent.PLAYER_KICKED, (p) =>
      handleMessage(WSEvent.PLAYER_KICKED, p)
    );
    ws.on(WSEvent.GAME_QUESTION, (p) =>
      handleMessage(WSEvent.GAME_QUESTION, p)
    );
    ws.on(WSEvent.GAME_ROUND_ENDED, (p) =>
      handleMessage(WSEvent.GAME_ROUND_ENDED, p)
    );
    ws.on(WSEvent.ROOM_CLOSED, (p) => handleMessage(WSEvent.ROOM_CLOSED, p));

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [identifier, fetchLobby, handleMessage]);

  // --------------------------------------------------------------------------
  // 🧩 Derived values
  // --------------------------------------------------------------------------

  const joinUrl = useMemo(() => {
    if (!lobby) return "";
    if (typeof window === "undefined") return "";
    // ✅ Use your Next.js route convention here
    return `${window.location.origin}/lobby/${lobby.lobbyIdentifier}`;
  }, [lobby]);

  // --------------------------------------------------------------------------
  // 🎮 Host Actions
  // --------------------------------------------------------------------------


  const sendAnnouncement = useCallback((message: string) => {
    wsRef.current?.send(WSEvent.SYSTEM_ANNOUNCEMENT, {
      message,
      level: "info",
    });
  }, []);

  const kickPlayer = useCallback((playerId: string, reason?: string) => {
    wsRef.current?.send(WSEvent.PLAYER_KICKED, { playerId, reason });
  }, []);

  const closeLobby = useCallback(() => {
    wsRef.current?.send(WSEvent.ROOM_CLOSED, {
      roomId: identifier,
      reason: "Host closed lobby",
    });
    toast.info("Lobby closed");
    router.replace("/dashboard");
  }, [identifier, router]);

  // --------------------------------------------------------------------------
  // 💾 Context Value
  // --------------------------------------------------------------------------

  const value = useMemo(
    () => ({
      lobby,
      players,
      reactions,
      loading,
      uiState,
      joinUrl,
      refetchLobby: fetchLobby,
      setUiState,
      sendAnnouncement,
      kickPlayer,
      closeLobby,
    }),
    [
      lobby,
      players,
      reactions,
      loading,
      uiState,
      joinUrl,
      fetchLobby,
      sendAnnouncement,
      kickPlayer,
      closeLobby,
    ]
  );

  return (
    <LobbyHostContext.Provider value={value}>
      {children}
    </LobbyHostContext.Provider>
  );
}

/**
 * 🪄 Hook to use host lobby context
 */
export function useLobbyHost() {
  const ctx = useContext(LobbyHostContext);
  if (!ctx)
    throw new Error("useLobbyHost must be used within a LobbyHostProvider");
  return ctx;
}
