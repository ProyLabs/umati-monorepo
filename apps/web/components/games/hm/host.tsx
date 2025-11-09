import { BeforeWeBegin } from "@/components/lobby/widgets";

import { RoundHost } from "./widgets";
import { Leaderboard, Podium } from "../shared";
import { useHerdMentalityHost } from "@/providers/games/herd-mentality/hm-host-provider";

export default function HerdMentalityaHost() {
  const { state, scores } = useHerdMentalityHost();

  if (state === "BEFORE") {
    return <BeforeWeBegin/>;
  } else if (state === "ROUND" || state === "ROUND_END") {
    return <RoundHost />;
  } else if(state === "LEADERBOARD") {
    return <Leaderboard scores={scores}  />
  } else if(state === "RANKING"){
    return <Podium scores={scores}  />
  }

  return ''
}


