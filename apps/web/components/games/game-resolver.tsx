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
import { FriendFactsHostProvider } from '@/providers/games/friend-facts/friend-facts-host-provider';
import FriendFactsHost from './friend-facts/host';
import { FriendFactsPlayerProvider } from '@/providers/games/friend-facts/friend-facts-player-provider';
import FriendFactsPlayer from './friend-facts/player';

export function GameResolverHost () {
    const {game} = useLobbyHost();
    console.log("🚀 ~ GameResolverHost ~ game:", game)

    const TriviaGame = <TriviaHostProvider><TriviaHost /></TriviaHostProvider>
    const HerdMentality = <HerdMentalityHostProvider><HerdMentalityaHost/></HerdMentalityHostProvider>
    const Chameleon = <ChameleonHostProvider><ChameleonHost/></ChameleonHostProvider>
    const FriendFacts = <FriendFactsHostProvider><FriendFactsHost /></FriendFactsHostProvider>

    if(game?.type === GameType.TRIVIA || game?.type === GameType.QUIZZER){
        return TriviaGame;
    } else if(game?.type === GameType.HM){
        return HerdMentality;
    } else if(game?.type === GameType.CHAMELEON){
      return Chameleon;
    } else if (game?.type === GameType.FF) {
      return FriendFacts;
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
    const FriendFacts = <FriendFactsPlayerProvider><FriendFactsPlayer /></FriendFactsPlayerProvider>


    if(game?.type === GameType.TRIVIA || game?.type === GameType.QUIZZER){
        return TriviaGame;
    } else if(game?.type === GameType.HM){
        return HerdMentality;
    }  else if(game?.type === GameType.CHAMELEON){
      return Chameleon;
    } else if (game?.type === GameType.FF) {
      return FriendFacts;
    }

      return (
    <div>GameResolver</div>
  )
}
