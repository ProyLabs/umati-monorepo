"use client";


import TriviaPlayer from "../../../../components/games/trivia/player";
import Loading from "../../../../components/lobby/loading";
import PlayerLobby from "../../../../components/lobby/player-lobby.";
import { BeforeWeBegin, PlayerJoinLobby } from "../../../../components/lobby/widgets";
import { useLobbyPlayer } from "../../../../providers/lobby-player-provider";


export default function LobbyPage() {

    const {lobby, isInLobby, loading} = useLobbyPlayer();

    if(loading){
        return <Loading />;
    } 

    if(!isInLobby){
        return <PlayerJoinLobby />
    }

    // return <BeforeWeBegin/>

    return <PlayerLobby />
    // return <TriviaPlayer/>;
}