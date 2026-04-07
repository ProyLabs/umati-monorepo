import { BeforeWeBegin } from "@/components/lobby/widgets";
import { Fbutton } from "@/components/ui/fancy-button";
import { useTriviaHost } from "@/providers/games/trivia/trivia-host-provider";
import { RoundHost } from "./widgets";
import { Leaderboard, Podium } from "../shared";

export default function TriviaHost() {
  const { state, scores, nextRound } = useTriviaHost();

  if (state === "BEFORE") {
    return <BeforeWeBegin />;
  } else if (state === "ROUND" || state === "ROUND_END") {
    return (
      <>
        <RoundHost />
        {state === "ROUND_END" && (
          <div className="fixed bottom-6 right-6 z-40">
            <Fbutton variant="secondary" onClick={nextRound}>
              Next
            </Fbutton>
          </div>
        )}
      </>
    );
  } else if(state === "LEADERBOARD") {
    return (
      <>
        <Leaderboard scores={scores} />
        <div className="fixed bottom-6 right-6 z-40">
          <Fbutton variant="secondary" onClick={nextRound}>
            Next
          </Fbutton>
        </div>
      </>
    )
  } else if(state === "RANKING"){
    return <Podium scores={scores}  />
  }

  return ''
}

