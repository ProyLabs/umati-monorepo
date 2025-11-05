import { useTriviaPlayer } from "@/providers/games/trivia/trivia-player-provider";
import {
  PlayerRound,
  PlayerRoundEnd,
  TriviaTitleScreen
} from "./widgets";
import { PlayerPodium } from "../shared";

export default function TriviaPlayer() {
  const { state, scores } = useTriviaPlayer();

    if(state === 'BEFORE'){
      return <TriviaTitleScreen/>
    } else if (state === 'ROUND' ) {
      return <PlayerRound/>
    } else if (state === 'ROUND_END' || state === 'LEADERBOARD'){
      return <PlayerRoundEnd />
    } else if (state === 'RANKING'){
      return <PlayerPodium scores={scores} />
    }


    return (
      <div className="bg-gradient-to-br from-[#FE566B] to-[var(--umati-red)] h-dvh w-dvw">
      {/* <Leaderboard /> */}


    </div>
  );
}


