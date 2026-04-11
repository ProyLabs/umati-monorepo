import { JoinLobbyCode, WaitingForPlayers } from "./widgets";
import { Fbutton } from "../ui/fancy-button";
import { useLobbyHost } from "../../providers/lobby-host-provider";

export default function HostWaitingLobby() {
  const { lobby, changeUiState, closeLobby } = useLobbyHost();

  return (
    <div className="max-w-screen-2xl mx-auto w-full py-4 flex flex-col gap-6 md:gap-8 px-4 items-center justify-center min-h-full pb-28 md:pb-16">
      <h1 className="text-4xl md:text-6xl text-center font-bold w-full md:w-4/5 py-4 md:py-8">
        {lobby?.name}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        <WaitingForPlayers className="aspect-auto min-h-72 md:min-h-0" />
        <JoinLobbyCode />
      </div>

      <div className="pt-4 md:pt-8 pb-4 md:pb-16 gap-3 md:gap-4 flex flex-col md:flex-row items-stretch md:items-center w-full max-w-md md:max-w-none">
        <Fbutton
          className="w-full md:w-60"
          onClick={() => changeUiState("LOBBY")}
        >
          Show Lobby
        </Fbutton>
        <Fbutton
          variant="outline"
          className="w-full md:w-60"
          onClick={closeLobby}
        >
          Close Lobby
        </Fbutton>
      </div>
    </div>
  );
}
