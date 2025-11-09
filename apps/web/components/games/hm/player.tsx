import { useTriviaPlayer } from "@/providers/games/trivia/trivia-player-provider";
import {
  PlayerRound,
  PlayerRoundEnd,
  HmTitleScreen
} from "./widgets";
import { PlayerPodium } from "../shared";
import { useHerdMentalityPlayer } from "@/providers/games/herd-mentality/hm-player-provider";

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


