import { useChameleonPlayer } from "@/providers/games/chameleon/chameleon-player-provider";
import { PlayerPodium } from "../shared";
import { ChameleonTitleScreen, PlayerSetup, VotingRoundPlayer } from "./widgets";
import { GameState } from "@umati/ws";
// import {
//   ChTitleScreen,
//   PlayerRound,
//   PlayerRoundEnd
// } from "./widgets";

export default function ChameleonPlayer() {
  const { state } = useChameleonPlayer();

    if(state === GameState.BEFORE){
      return <ChameleonTitleScreen/>
    } else if (state === GameState.ROUND_SETUP || state === GameState.SPEAKING ) {
      return <PlayerSetup/>
    } else if (state === GameState.VOTING) {
      return <VotingRoundPlayer />
    } else if (state === 'ROUND_END' || state === 'LEADERBOARD'){
    //   return <PlayerRoundEnd />
    } else if (state === 'RANKING'){
      // return <PlayerPodium scores={scores} />
      return ""
    }

    return (
      ""
  );
}


