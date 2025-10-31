"use client";


import TriviaPlayer from "@/components/games/trivia/player";
import Loading from "@/components/lobby/loading";
import PlayerLobby from "@/components/lobby/player-lobby.";
import { BeforeWeBegin, PlayerJoinLobby } from "@/components/lobby/widgets";
import { useLobbyPlayer } from "@/providers/lobby-player-provider";


export default function LobbyPage() {

    const {lobby, uiState, gameState, isInLobby, loading} = useLobbyPlayer();

    if(loading){
        return <Loading />;
    } 

    else if(!isInLobby){
        return <PlayerJoinLobby />
    }
else if(uiState === 'INIT' || uiState === 'LOBBY' || (uiState === 'PLAYING' && gameState === 'BEFORE')) {
    return <PlayerLobby />

}  else if (uiState === 'PLAYING' && gameState === 'ROUND'){
    return <TriviaPlayer/>;

}
    // return <BeforeWeBegin/>


    return ''
}