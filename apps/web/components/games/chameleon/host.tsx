import { BeforeWeBegin } from "@/components/lobby/widgets";

// import { RoundHost } from "./widgets";
import { Leaderboard, Podium } from "../shared";
import { useChameleonHost } from "@/providers/games/chameleon/chameleon-host-provider";
import { GetReady, PlayerSetup, Reveal, Setup, VotingRound } from "./widgets";
import { GameState } from "@umati/ws";

export default function ChameleonHost() {
  const { state, scores } = useChameleonHost();

  if (state === GameState.BEFORE) {
    return <BeforeWeBegin/>;
  } else if(state === GameState.ROUND_SETUP || state === GameState.SPEAKING){
    return <Setup />
  } else if (state === GameState.VOTING || state === GameState.ROUND_END){
    return <VotingRound />
  }
  else if (state === GameState.ROUND) {
    return <GetReady />;
  }  else if (state === GameState.REVEAL) {
    return <Reveal />;
  }
  
  else if(state === GameState.LEADERBOARD){ 
    return <Leaderboard scores={scores}  />
  } else if(state === GameState.RANKING){
    return <Podium scores={scores}  />
  }

  return ''
}


