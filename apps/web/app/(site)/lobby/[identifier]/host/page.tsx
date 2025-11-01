"use client";


import TriviaHost from "@/components/games/trivia/host";
import HostLobby from "@/components/lobby/host-lobby";
import HostWaitingLobby from "@/components/lobby/host-waiting-lobby";
import Loading from "@/components/lobby/loading";
import { BeforeWeBegin } from "@/components/lobby/widgets";
import { TriviaHostProvider } from "@/providers/games/trivia/trivia-host-provider";
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

      return  <TriviaHostProvider>
        <TriviaHost />
            </TriviaHostProvider>
        // if(gameState === "BEFORE"){
        // } else if (gameState === "ROUND" || gameState === "ROUND_END") {
        //         return <TriviaHost/>
        // }



    }

    return ''
}