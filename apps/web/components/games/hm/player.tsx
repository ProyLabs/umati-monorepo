import { useHerdMentalityPlayer } from "@/providers/games/herd-mentality/hm-player-provider";
import { PlayerPodium } from "../shared";
import {
  HmTitleScreen,
  PlayerRound,
  PlayerRoundEnd
} from "./widgets";

export default function HerdMentalityPlayer() {
  const { state, scores } = useHerdMentalityPlayer();

    if(state === 'BEFORE'){
      return <HmTitleScreen/>
    } else if (state === 'ROUND' ) {
      return <PlayerRound/>
    } else if (state === 'ROUND_END' || state === 'LEADERBOARD'){
      return <PlayerRoundEnd />
    } else if (state === 'RANKING'){
      return <PlayerPodium scores={scores} />
    }


    return (
      ""
  );
}


