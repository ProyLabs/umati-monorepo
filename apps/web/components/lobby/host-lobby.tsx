import { JoinLobbyCode, LobbyTitle, WaitingForPlayers } from "./widgets";
import { Rankings } from "../games/shared";
import GameCarousel from "./game-carousel";

export default function HostLobby() {

  return (
      <div className="max-w-screen-2xl mx-auto w-full h-full flex flex-col gap-12 px-4 items-center justify-center pt-10 pb-20">
        <LobbyTitle />

     <div className="grid grid-cols-4 grid-rows-[minmax(0,280px)_minmax(0,280px)] gap-4 w-full h-fit max-h-[75dvh]">
  <div className="bg-foreground/5 w-full col-span-2 md:col-span-3 rounded-2xl h-full p-4 flex flex-col">
    <p className="text-2xl font-bold mb-4">🎮 Play Games</p>
    <GameCarousel />
  </div>

  <JoinLobbyCode vertical className="col-span-2 md:col-span-1 row-span-2" />

  <div className="bg-foreground/5 w-full col-span-1 md:col-span-2 rounded-2xl h-full p-4 flex flex-col">
    <Rankings />
  </div>

  <WaitingForPlayers className="col-span-1" />
</div>

    </div>
  );
}
