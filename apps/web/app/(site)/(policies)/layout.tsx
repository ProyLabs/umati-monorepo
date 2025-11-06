import Navbar from '@/components/landing/navbar';
import React from 'react'

export default function PolicyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
     <main className="flex min-h-screen flex-col items-center relative">
        <Navbar/>
        <section className="policy px-5">
                <div className="max-w-4xl mx-auto w-full py-8 ">
                    {children}
                </div>
        </section>
     </main>
  )
}
