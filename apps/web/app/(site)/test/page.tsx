'use client';

import { Particles } from "@/components/ui/shadcn-io/particles";
import GameCard from "@/components/landing/game-card";
import Navbar from "@/components/landing/navbar";
import CardFan from "@/components/ui/card-fan";
import { Fbutton } from "@/components/ui/fancy-button";
import Link from "next/link";
import { Games } from "@umati/ws";
import { ChameleonHostProvider } from "@/providers/games/chameleon/chameleon-host-provider";
import ChameleonaHost from "@/components/games/chameleon/host";
import { LobbyHostProvider } from "@/providers/lobby-host-provider";

export default function Home() {
  return (
    <LobbyHostProvider>
    <ChameleonHostProvider>
      <ChameleonaHost/>
    </ChameleonHostProvider>
    </LobbyHostProvider>
  );
}
