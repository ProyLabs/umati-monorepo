"use client";

import { GameResolverHost } from "@/components/games/game-resolver";
import HostLobby from "@/components/lobby/host-lobby";
import HostWaitingLobby from "@/components/lobby/host-waiting-lobby";
import Loading from "@/components/lobby/loading";
import { HostPollStage } from "@/components/lobby/widgets";
import { useLobbyHost } from "@/providers/lobby-host-provider";

export default function LobbyPage() {
  const { loading, uiState } = useLobbyHost();
  if (loading) {
    return <Loading />;
  }

  if (uiState === "INIT" || uiState === "LOBBY") {
    return <HostLobby />;
  } else if (uiState === "POLL") {
    return <HostPollStage />;
  } else if (uiState === "PLAYING") {
    return <GameResolverHost />;
  }

  return "";
}
