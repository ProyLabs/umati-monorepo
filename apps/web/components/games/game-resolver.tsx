import { TriviaHostProvider } from '@/providers/games/trivia/trivia-host-provider';
import { useLobbyHost } from '@/providers/lobby-host-provider'
import React from 'react'
import TriviaHost from './trivia/host';
import { HerdMentalityHostProvider } from '@/providers/games/herd-mentality/hm-host-provider';
import { useLobbyPlayer } from '@/providers/lobby-player-provider';
import { TriviaPlayerProvider } from '@/providers/games/trivia/trivia-player-provider';
import { HerdMentalityPlayerProvider } from '@/providers/games/herd-mentality/hm-player-provider';
import { GameType } from '@umati/ws';
import HerdMentalityaHost from './hm/host';
import TriviaPlayer from './trivia/player';
import HerdMentalityPlayer from './hm/player';
import { ChameleonHostProvider } from '@/providers/games/chameleon/chameleon-host-provider';
import ChameleonHost from './chameleon/host';
import { ChameleonPlayerProvider } from '@/providers/games/chameleon/chameleon-player-provider';
import ChameleonPlayer from './chameleon/player';

export function GameResolverHost () {
    const {game} = useLobbyHost();
    console.log("🚀 ~ GameResolverHost ~ game:", game)

    const TriviaGame = <TriviaHostProvider><TriviaHost /></TriviaHostProvider>
    const HerdMentality = <HerdMentalityHostProvider><HerdMentalityaHost/></HerdMentalityHostProvider>
    const Chameleon = <ChameleonHostProvider><ChameleonHost/></ChameleonHostProvider>

    if(game?.type === GameType.TRIVIA){
        return TriviaGame;
    } else if(game?.type === GameType.HM){
        return HerdMentality;
    } else if(game?.type === GameType.CHAMELEON){
      return Chameleon;
    }

      return (
    <div>GameResolver</div>
  )
}


export function GameResolverPlayer () {
    const {game} = useLobbyPlayer();

    const TriviaGame = <TriviaPlayerProvider><TriviaPlayer /></TriviaPlayerProvider>
    const HerdMentality = <HerdMentalityPlayerProvider><HerdMentalityPlayer/></HerdMentalityPlayerProvider>
    const Chameleon = <ChameleonPlayerProvider><ChameleonPlayer/></ChameleonPlayerProvider>


    if(game?.type === GameType.TRIVIA){
        return TriviaGame;
    } else if(game?.type === GameType.HM){
        return HerdMentality;
    }  else if(game?.type === GameType.CHAMELEON){
      return Chameleon;
    }

      return (
    <div>GameResolver</div>
  )
}