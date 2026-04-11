"use client";

import Navbar from '@/components/landing/navbar';
import CreateLobby from '@/components/lobby/create';
import { Fbutton } from '@/components/ui/fancy-button';
import UmatiLogo from '@/components/ui/logo';
import { Particles } from '@/components/ui/shadcn-io/particles';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Page() {
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device on client side
  useEffect(() => {
    const checkMobile = () => {
      const userAgent =
        navigator.userAgent || navigator.vendor || (window as any).opera;
      return /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent,
      );
    };
    setIsMobile(checkMobile());
  }, []);

  return (
    <main className="flex h-dvh flex-col items-center fixed w-full">
      <Navbar />
      <section className="flex flex-col justify-center items-center flex-1 w-full h-[calc(100vh-68px)] md:h-[calc(100vh-80px)] overflow-clip gap-16 px-4">
        <CreateLobby />
      </section>
      <Particles
        className="absolute inset-0"
        quantity={200}
        ease={80}
        color="#ffffff"
        refresh
      />
    </main>
  );
}