"use client";


import { GameResolverHost } from "@/components/games/game-resolver";
import HostLobby from "@/components/lobby/host-lobby";
import HostWaitingLobby from "@/components/lobby/host-waiting-lobby";
import Loading from "@/components/lobby/loading";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Fbutton } from "@/components/ui/fancy-button";
import { useLobbyHost } from "@/providers/lobby-host-provider";
import { useState } from "react";



export default function LobbyPage() {
    const {loading, lobby, uiState, cancelGame} = useLobbyHost();
    const [showEndDialog, setShowEndDialog] = useState(false);


    if(loading){
        return <Loading />;
    }

    if(uiState === 'INIT'){
        return <HostWaitingLobby />
    } else if(uiState === 'LOBBY'){
        return <HostLobby />
    } else if (uiState === 'PLAYING'){
      return (
        <>
          <div className="absolute right-4 top-4 z-40 md:right-8 md:top-8">
            <Fbutton
              variant="red"
              onClick={() => setShowEndDialog(true)}
            >
              End Game
            </Fbutton>
          </div>
          <GameResolverHost />
          <AlertDialog open={showEndDialog} onOpenChange={setShowEndDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>End game now?</AlertDialogTitle>
                <AlertDialogDescription>
                  The current game in {lobby?.name ?? "this lobby"} will end immediately and everyone will return to the lobby.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setShowEndDialog(false)}>
                  Keep playing
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-[#FE566B] text-white hover:bg-[#e64c61]"
                  onClick={() => {
                    cancelGame();
                    setShowEndDialog(false);
                  }}
                >
                  End Game
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )
    }

    return ''
}
