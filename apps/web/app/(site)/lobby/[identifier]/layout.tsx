"use client";

// app/lobby/[identifier]/layout.tsx
import { HostLobbyFooter, PlayerReactionLayer } from "../../../../components/lobby/widgets";
import { LobbyHostProvider } from "../../../../providers/lobby-host-provider";
import { LobbyPlayerProvider } from "../../../../providers/lobby-player-provider";
import { usePathname } from "next/navigation";

export default function LobbyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isHostRoute = pathname.endsWith("/host");

  if (isHostRoute) {
    return (
      <LobbyHostProvider>
        <section className="w-full h-dvh flex flex-1 flex-col bg-background text-foreground">
          {children}
          <HostLobbyFooter/>
          <PlayerReactionLayer/>
        </section>
      </LobbyHostProvider>
    );
  }

  return (
    <LobbyPlayerProvider>
      {" "}
      <section className="w-full h-dvh flex flex-1 flex-col bg-background text-foreground">
        {children}
      </section>
    </LobbyPlayerProvider>
  );
}
