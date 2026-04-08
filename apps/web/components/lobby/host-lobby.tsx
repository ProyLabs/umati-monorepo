import { JoinLobbyCode, LobbyTitle, WaitingForPlayers } from "./widgets";
import { Rankings } from "../games/shared";
import GameCarousel from "./game-carousel";

export default function HostLobby() {

  return (
    <div className="max-w-screen-2xl mx-auto w-full min-h-full flex flex-col gap-6 md:gap-12 px-4 items-center justify-start pt-6 md:pt-10 pb-28 md:pb-20">
      <LobbyTitle />

      <div className="flex flex-col xl:flex-row items-stretch justify-center gap-4 w-full h-full">
        <div className="flex-1 flex flex-col gap-4 w-full xl:w-3/4 h-full">
          <div className="bg-foreground/5 w-full rounded-2xl p-4 flex flex-col">
            <p className="text-2xl font-bold mb-4">🎮 Play Games</p>
            <GameCarousel />
          </div>

          <div className="flex flex-col lg:flex-row gap-4 h-full">
            <div className="bg-foreground/5 w-full lg:w-3/5 rounded-2xl h-full min-h-72 p-4 flex flex-col">
              <Rankings />
            </div>

            <WaitingForPlayers className="w-full lg:w-2/5 aspect-auto min-h-72" />
          </div>
        </div>
        <JoinLobbyCode vertical className="w-full xl:w-1/4 h-full min-h-72" />
      </div>
    </div>
  );
}
