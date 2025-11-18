"use client";


import { GameResolverHost } from "@/components/games/game-resolver";
import HostLobby from "@/components/lobby/host-lobby";
import HostWaitingLobby from "@/components/lobby/host-waiting-lobby";
import Loading from "@/components/lobby/loading";
import { useLobbyHost } from "@/providers/lobby-host-provider";



export default function LobbyPage() {
    const {loading, lobby, uiState} = useLobbyHost();


    if(loading){
        return <Loading />;
    }

    if(uiState === 'INIT'){
        return <HostWaitingLobby />
    } else if(uiState === 'LOBBY'){
        return <HostLobby />
    } else if (uiState === 'PLAYING'){
      return  <GameResolverHost/>
    }

    return ''
}