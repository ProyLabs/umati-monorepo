import { Particles } from "@/components/ui/shadcn-io/particles";
import GameCard from "@/components/landing/game-card";
import Navbar from "@/components/landing/navbar";
import CardFan from "@/components/ui/card-fan";
import { Fbutton } from "@/components/ui/fancy-button";
import Link from "next/link";
import { Games } from "@umati/ws";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center relative">
      <Navbar />
      <section className="flex flex-col w-full items-center justify-between h-[calc(100vh-68px)] md:h-[calc(100vh-80px)] overflow-clip">
        <div className=" max-w-3xl mx-auto text-center mb-8 px-5 md:px-0 py-5 h-full">
          <h1 className="text-5xl md:text-7xl font-bold text-center mb-8">
            Bring the crowd together.
          </h1>
          <p className="text-sm md:text-base opacity-75">
            Umati makes it easy to host and play interactive party games with
            friends, family, or coworkers — all in real time, right from your
            browser.
          </p>

          <div className="grid grid-cols-2 gap-4 mt-8 max-w-lg mx-auto">
            <Link href="/create-lobby">
              <Fbutton className="w-full">Create a Lobby</Fbutton>
            </Link>
            <Link href="/join-lobby">
              <Fbutton variant="outline" className="w-full">
                Join a Lobby
              </Fbutton>
            </Link>
          </div>
        </div>

        <CardFan>
          {
            Games.map((game)=> {
              return <GameCard key={game.id} title={game.title} variant={game.color as any} description={game.description} src={game.src} />
            })
          }
        </CardFan>

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
