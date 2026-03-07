import { JoinLobbyCode, LobbyTitle, WaitingForPlayers } from "./widgets";
import { Rankings } from "../games/shared";
import GameCarousel from "./game-carousel";

export default function HostLobby() {

  return (
    <div className="max-w-screen-2xl mx-auto w-full h-full flex flex-col gap-12 px-4 items-center justify-center pt-10 pb-20">
      <LobbyTitle />

      <div className="flex flex-row items-center justify-center gap-4 w-full h-full max-h-[65dvh]">
        <div className="flex-1 flex flex-col gap-4 w-3/4 h-full">
          <div className="bg-foreground/5 w-full rounded-2xl p-4 flex flex-col">
            <p className="text-2xl font-bold mb-4">🎮 Play Games</p>
            <GameCarousel />
          </div>

          <div className="flex flex-row gap-4 h-full">
            <div className="bg-foreground/5 w-3/5 rounded-2xl h-full p-4 flex flex-col">
              <Rankings />
            </div>

            <WaitingForPlayers className="w-2/5" />
          </div>
        </div>
        <JoinLobbyCode vertical className="w-1/4 h-full" />
      </div>
    </div>
  );
}
