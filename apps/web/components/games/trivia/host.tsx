import { BeforeWeBegin } from "@/components/lobby/widgets";
import { useTriviaHost } from "@/providers/games/trivia/trivia-host-provider";
import { RoundHost } from "./widgets";
import { Leaderboard, Podium } from "../shared";

export default function TriviaHost() {
  const { state, scores } = useTriviaHost();

  if (state === "BEFORE") {
    return <BeforeWeBegin />;
  } else if (state === "ROUND" || state === "ROUND_END") {
    return <RoundHost />;
  } else if(state === "LEADERBOARD") {
    return <Leaderboard scores={scores}  />
  } else if(state === "RANKING"){
    return <Podium scores={scores}  />
  }

  return ''
}


