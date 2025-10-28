import Navbar from '../../../components/landing/navbar'
import CreateLobby from '../../../components/lobby/create'
import React from 'react'

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center ">
      <Navbar />
       <section className="flex flex-col justify-center items-center flex-1 w-full h-[calc(100vh-68px)] md:h-[calc(100vh-80px)] overflow-clip gap-16 px-4">
        <CreateLobby />
      </section>
      </main>
  )
}
