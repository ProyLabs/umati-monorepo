import Navbar from '@/components/landing/navbar'
import JoinLobby from '@/components/lobby/join'
import { Particles } from '@/components/ui/shadcn-io/particles'

export default function Page() {
  return (
    <main className="flex h-dvh flex-col items-center ">
      <Navbar />
       <section className="flex flex-col justify-center items-center flex-1 w-full h-[calc(100vh-68px)] md:h-[calc(100vh-80px)] overflow-clip gap-16 px-4">
        <JoinLobby />
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
