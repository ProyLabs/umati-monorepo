import { Rankings } from "../games/shared";
import {
  GameShelf,
  JoinLobbyCode,
  LobbyTitle,
  WaitingForPlayers,
} from "./widgets";

export default function HostLobby() {
  return (
    <div className="max-w-screen-2xl mx-auto w-full flex flex-col gap-6 px-4 items-center justify-start pt-6 md:pt-10 pb-28 md:pb-20">
      <LobbyTitle />

      <div className="flex-1 flex flex-col gap-4 w-full h-full">
        <GameShelf />

        <div className="flex flex-col lg:flex-row gap-4 h-full">
          <Rankings />

          <WaitingForPlayers className="w-full aspect-auto min-h-72" />
        </div>
      </div>
    </div>
  );
}
