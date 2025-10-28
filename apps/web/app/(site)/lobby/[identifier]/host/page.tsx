"use client";


import HostLobby from "@/components/lobby/host-lobby";
import HostWaitingLobby from "@/components/lobby/host-waiting-lobby";
import Loading from "@/components/lobby/loading";
import { useLobbyHost } from "@/providers/lobby-host-provider";


export default function LobbyPage() {
    const {loading, lobby, uiState} = useLobbyHost();


    if(loading){
        return <Loading />;
    }

    if(uiState === 'WAITING'){
        return <HostWaitingLobby />
    } else if(uiState === 'LOBBY'){
        return <HostLobby />
    }

    return ''

    // return <BeforeWeBegin/>
    // return <TriviaHost/>
}