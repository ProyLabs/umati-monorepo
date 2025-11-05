import {
  PlayerAvatar,
  Reactions
} from "./widgets";
import { Fbutton } from "../ui/fancy-button";
import { getRandomAvatarUrl } from "../../lib/utils";
import { RankingHeader, RankingRow } from "../games/shared";
import UmatiLogo from "../ui/logo";
import { useAuth } from "../../providers/auth-provider";
import { useLobbyPlayer } from "@/providers/lobby-player-provider";

export default function PlayerLobby() {
      const {lobby, player, leaveLobby} = useLobbyPlayer();
      console.log("🚀 ~ PlayerLobby ~ player:", player)
      
  return (
    <div className="max-w-screen-2xl mx-auto w-full md:py-8 flex flex-col gap-8 px-5 items-center justify-center md:justify-center h-dvh">
      <div className="my-auto flex flex-col items-center justify-center gap-4 w-full">
        <h1 className="text-3xl md:text-6xl text-center font-bold w-4/5">
 {lobby?.name}
        </h1>
        <p className="my-auto text-lg md:text-2xl font-medium text-center">
          The games will begin shortly...
        </p>
        {/* <WaitingForPlayers className="w-full max-w-3xl mx-auto aspect-auto h-full min-h-100"/> */}

        <div className="animate-bounce animation-duration-[5s] mt-10">
          <PlayerAvatar displayName={player?.displayName!} avatar={player?.avatar!} />
        </div>
      </div>
{/* 
      <div className="max-w-md w-full flex flex-col">
        <h2 className="text-xl font-bold text-center mb-2">🏅 Your Rankings</h2>

      <RankingHeader className="mb-0 rounded-b-none"/>
      <RankingRow position={20} name={"Alex"} gold={0} silver={0} bronze={0} variant="single" />
      </div> */}

      <div className="flex items-center justify-center gap-4 w-full relative max-w-md mb-4">
        <UmatiLogo className="w-8 text-foreground block md:hidden" />
        <Fbutton variant="secondary" className="w-full flex-1 mt-auto" onClick={leaveLobby}>
          Leave Room
        </Fbutton>
        <Reactions />
      </div>
    </div>
  );
}


