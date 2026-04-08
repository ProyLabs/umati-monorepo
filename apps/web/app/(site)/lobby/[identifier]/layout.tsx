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
          {isMobile && isPortrait && (
            <div className="absolute inset-0 z-[60] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center text-center px-6 text-white">
              <div className="rounded-full border border-white/20 bg-white/10 p-5 mb-6">
                <div className="relative">
                  <Smartphone className="size-10" />
                  <RotateCw className="size-5 absolute -right-3 -top-3" />
                </div>
              </div>
              <h1 className="text-3xl font-bold mb-3">Rotate Your Screen</h1>
              <p className="text-base max-w-sm mx-auto mb-8 text-white/80">
                Hosting works on mobile in landscape mode. Turn your phone sideways to continue using the host dashboard.
              </p>
              <Link href="/">
                <Fbutton variant="secondary" className="min-w-44">
                  Go Back
                </Fbutton>
              </Link>
            </div>
          )}
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
