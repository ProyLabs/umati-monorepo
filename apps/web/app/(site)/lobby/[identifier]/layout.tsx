"use client";

// app/lobby/[identifier]/layout.tsx
import { HostLobbyFooter, PlayerReactionLayer, Reconnecting } from "@/components/lobby/widgets";
import { BubbleBackground } from "@/components/ui/shadcn-io/bubble-background";
import { Particles } from "@/components/ui/shadcn-io/particles";
import { LobbyHostProvider } from "@/providers/lobby-host-provider";
import { LobbyPlayerProvider } from "@/providers/lobby-player-provider";
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
        <section className="w-full h-dvh flex flex-1 flex-col text-foreground relative z-10">
          {children}
          <HostLobbyFooter/>
          <PlayerReactionLayer/>
        </section>
          <BubbleBackground className="absolute inset-0 flex items-center justify-center rounded-xl !z-0"/>
      </LobbyHostProvider>
    );
  }

  return (
    <LobbyPlayerProvider>
      <section className="w-full h-dvh flex flex-1 flex-col text-foreground relative z-10">
        {children}
      <Reconnecting />
      </section>
        <Particles
               className="absolute inset-0"
               quantity={200}
               ease={80}
               color="#ffffff"
               refresh
             />
    </LobbyPlayerProvider>
  );
}
