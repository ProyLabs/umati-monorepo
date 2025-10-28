import { JoinLobbyCode, WaitingForPlayers } from "./widgets";
import { Fbutton } from "../ui/fancy-button";
import { useLobbyHost } from "../../providers/lobby-host-provider";

export default function HostWaitingLobby() {
  const { lobby, setUiState } = useLobbyHost();

  return (
    <div className="max-w-screen-2xl mx-auto w-full py-4 flex flex-col gap-8 px-4 items-center justify-center h-full">
      <h1 className="text-6xl text-center font-bold w-4/5 py-8">
       {lobby?.name}
      </h1>

      <div className="grid grid-cols-2 gap-4">
       <WaitingForPlayers/>
       <JoinLobbyCode/>
      </div>

      <div className="pt-8 pb-16 gap-4 flex items-center">
        <Fbutton variant="secondary" className="w-60" onClick={()=>setUiState("LOBBY")}>Show Lobby</Fbutton>
        <Fbutton variant="outline" className="w-60">Close Lobby</Fbutton>
      </div>
    </div>
  );
}
