"use client";

import Navbar from '@/components/landing/navbar';
import CreateLobby from '@/components/lobby/create';
import { DesktopOnly } from '@/components/lobby/widgets';
import { Particles } from '@/components/ui/shadcn-io/particles';
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
    <main className="flex min-h-screen flex-col items-center ">
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
