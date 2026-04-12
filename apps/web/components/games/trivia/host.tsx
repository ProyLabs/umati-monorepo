import { BeforeWeBegin } from "@/components/lobby/widgets";
import { useTriviaHost } from "@/providers/games/trivia/trivia-host-provider";
import { QuizzerSetupHost, RoundHost } from "./widgets";
import { Leaderboard, Podium } from "../shared";
import { GameState, GameType } from "@umati/ws";

export default function TriviaHost() {
  const { gameType, state, scores, nextRound } = useTriviaHost();

  if (state === "BEFORE") {
    return <BeforeWeBegin />;
  } else if (gameType === GameType.QUIZZER && state === GameState.ROUND_SETUP) {
    return <QuizzerSetupHost />;
  } else if (state === "ROUND" || state === "ROUND_END") {
    return <RoundHost />;
  } else if (state === "LEADERBOARD") {
    return <Leaderboard scores={scores} nextRound={nextRound} />;
  } else if (state === "RANKING") {
    return <Podium scores={scores} nextRound={nextRound} />;
  }

  return "";
}
