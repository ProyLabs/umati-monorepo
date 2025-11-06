"use client";

import { DesktopOnly, HostLobbyFooter, PlayerReactionLayer, Reconnecting } from "@/components/lobby/widgets";
import { BubbleBackground } from "@/components/ui/shadcn-io/bubble-background";
import { Particles } from "@/components/ui/shadcn-io/particles";
import { LobbyHostProvider } from "@/providers/lobby-host-provider";
import { LobbyPlayerProvider } from "@/providers/lobby-player-provider";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function LobbyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isHostRoute = pathname.endsWith("/host");
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device on client side
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      return /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    };
    setIsMobile(checkMobile());
  }, []);

  // 🧱 Show block screen if host is on mobile
  if (isHostRoute && isMobile) {
    return <DesktopOnly />
  }

  // 🧑‍💻 Host view (desktop only)
  if (isHostRoute) {
    return (
      <LobbyHostProvider>
        <section className="w-full h-dvh flex flex-1 flex-col text-foreground z-10 fixed">
          {children}
          <HostLobbyFooter />
          <PlayerReactionLayer />
        </section>
        <BubbleBackground className="absolute inset-0 flex items-center justify-center rounded-xl !z-0" />
      </LobbyHostProvider>
    );
  }

  // 🎮 Player view (mobile + desktop)
  return (
    <LobbyPlayerProvider>
      <section className="w-full h-dvh flex flex-1 flex-col text-foreground z-10 fixed">
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
