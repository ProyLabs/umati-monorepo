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
        const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
        return /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      };
      setIsMobile(checkMobile());
    }, []);
  
    // 🧱 Show block screen if host is on mobile
    if (isMobile) {
      return <DesktopOnly />
    }

    
  return (
    <main className="flex h-dvh flex-col items-center ">
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
  )
}



const DesktopOnly = () => {
  return (
    <div className="flex flex-col items-center justify-center h-dvh bg-black text-white text-center p-6">
      <UmatiLogo className="w-8 text-foreground block md:hidden" />
      <div className="my-auto">
        <h1 className="text-3xl font-bold mb-4">Desktop Only</h1>
        <p className="text-lg max-w-md mb-6 w-full mx-auto">
          Hosting is only supported on desktop devices. Please use a laptop or
          desktop computer to access the host dashboard.
        </p>
        <Link href="/">
          <Fbutton className="w-full max-w-xs">Go Back</Fbutton>
        </Link>
      </div>
    </div>
  );
};