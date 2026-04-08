import { BeforeWeBegin } from "@/components/lobby/widgets";
import { Fbutton } from "@/components/ui/fancy-button";

import { RoundHost } from "./widgets";
import { Leaderboard, Podium } from "../shared";
import { useHerdMentalityHost } from "@/providers/games/herd-mentality/hm-host-provider";

export default function HerdMentalityaHost() {
  const { state, scores, nextRound } = useHerdMentalityHost();

  if (state === "BEFORE") {
    return <BeforeWeBegin/>;
  } else if (state === "ROUND" || state === "ROUND_END") {
    return <RoundHost />;
  } else if(state === "LEADERBOARD") {
    return <Leaderboard scores={scores} nextRound={nextRound} />;
  } else if(state === "RANKING"){
    return <Podium scores={scores}  />
  }

  return ''
}

