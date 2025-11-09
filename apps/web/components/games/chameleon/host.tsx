import { BeforeWeBegin } from "@/components/lobby/widgets";

// import { RoundHost } from "./widgets";
import { Leaderboard, Podium } from "../shared";
import { useChameleonHost } from "@/providers/games/chameleon/chameleon-host-provider";
import { Setup } from "./widgets";

export default function ChameleonaHost() {
  const { state } = useChameleonHost();

  if (state === "BEFORE") {
    return <BeforeWeBegin/>;
  } else if(state === "ROUND_SETUP"){
    return <Setup />
  }
  
  else if (state === "ROUND" || state === "ROUND_END") {
    // return <RoundHost />;
  }
//   } else if(state === "LEADERBOARD") {
//     return <Leaderboard scores={scores}  />
//   } else if(state === "RANKING"){
//     return <Podium scores={scores}  />
//   }

  return ''
}


