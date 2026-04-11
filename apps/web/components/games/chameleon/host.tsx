import { BeforeWeBegin } from "@/components/lobby/widgets";
import { EndGameButton } from "@/components/games/shared";

// import { RoundHost } from "./widgets";
import { Leaderboard, Podium } from "../shared";
import { useChameleonHost } from "@/providers/games/chameleon/chameleon-host-provider";
import { GetReady, PlayerSetup, Reveal, Setup, VotingRound } from "./widgets";
import { GameState } from "@umati/ws";

export default function ChameleonHost() {
  const { state, scores } = useChameleonHost();

  let content;
  if (state === GameState.BEFORE) {
    return <BeforeWeBegin/>;
  } else if(state === GameState.ROUND_SETUP || state === GameState.SPEAKING){
    content = <Setup />;
  } else if (state === GameState.VOTING || state === GameState.ROUND_END){
    content = <VotingRound />;
  }
  else if (state === GameState.ROUND) {
    content = <GetReady />;
  } else if (state === GameState.REVEAL) {
    content = <Reveal />;
  }
  else if(state === GameState.LEADERBOARD){ 
    content = <Leaderboard scores={scores} nextRound={() => {}} />;
  } else if(state === GameState.RANKING){
    content = <Podium scores={scores} nextRound={() => {}} />
  } else {
    return '';
  }

  return (
    <div className="relative h-full w-full">
      <div className="absolute right-4 top-4 z-50">
        <EndGameButton />
      </div>
      {content}
    </div>
  );
}

