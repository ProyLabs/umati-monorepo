import { useChameleonPlayer } from "@/providers/games/chameleon/chameleon-player-provider";
import { PlayerPodium } from "../shared";
import { PlayerRoundEnd } from "../trivia/widgets";
import { ChameleonTitleScreen, PlayerSetup, VotingRoundPlayer } from "./widgets";
import { GameState } from "@umati/ws";
// import {
//   ChTitleScreen,
//   PlayerRound,
//   PlayerRoundEnd
// } from "./widgets";

export default function ChameleonPlayer() {
  const { state, scores } = useChameleonPlayer();

    if(state === GameState.BEFORE){
      return <ChameleonTitleScreen/>
    } else if (state === GameState.ROUND_SETUP || state === GameState.SPEAKING ) {
      return <PlayerSetup/>
    } else if (state === GameState.VOTING) {
      return <VotingRoundPlayer />
    } else if (state === GameState.ROUND_END || state === GameState.LEADERBOARD){
      return <PlayerRoundEnd />
    } else if (state === GameState.RANKING){
      return <PlayerPodium scores={scores} />
    }

    return (
      <div className="flex h-full items-center justify-center px-6 text-center text-white/80">
        Waiting for the host to continue the round…
      </div>
    );
}


