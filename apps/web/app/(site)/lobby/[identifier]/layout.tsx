"use client";

import { HostLobbyFooter, PlayerJoinAnimationLayer, PlayerReactionLayer, Reconnecting } from "@/components/lobby/widgets";
import { Fbutton } from "@/components/ui/fancy-button";
import { BubbleBackground } from "@/components/ui/shadcn-io/bubble-background";
import { Particles } from "@/components/ui/shadcn-io/particles";
import { LobbyHostProvider } from "@/providers/lobby-host-provider";
import { LobbyPlayerProvider } from "@/providers/lobby-player-provider";
import { Smartphone, RotateCw } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function LobbyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isHostRoute = pathname.endsWith("/host");
  const [isMobile, setIsMobile] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const updateViewportState = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const mobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      setIsMobile(mobile);
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    updateViewportState();
    window.addEventListener("resize", updateViewportState);
    window.addEventListener("orientationchange", updateViewportState);

    return () => {
      window.removeEventListener("resize", updateViewportState);
      window.removeEventListener("orientationchange", updateViewportState);
    };
  }, []);

  // 🧑‍💻 Host view
  if (isHostRoute) {
    return (
      <LobbyHostProvider>
        <section className="w-full h-dvh flex flex-1 flex-col text-foreground z-10 fixed overflow-y-auto">
          {children}
          <HostLobbyFooter />
          <PlayerReactionLayer />
          <PlayerJoinAnimationLayer />
        </section>
        <Particles className="absolute inset-0 flex items-center justify-center rounded-xl !z-0" />
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
