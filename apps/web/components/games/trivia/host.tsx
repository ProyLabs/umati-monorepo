import React from 'react'
import {Option, Question, Timer} from './widgets'
import { Fbutton } from '../../ui/fancy-button'
import { Leaderboard, Podium } from '../shared'

export default function TriviaHost() {
  return (
    <div className='bg-gradient-to-br from-[#FE566B] to-[var(--umati-red)] h-screen w-screen'>
      <div className="fixed top-0 px-8 py-4 w-full">
            <div className="flex items-center justify-between w-full ">
              <div className="">
              <p className="text-xl font-medium">umati.app = Code: 9464673</p>
              <p className="text-xl font-bold">Round 1 of 10</p>
              </div>
            </div>
          </div>


{/* <Leaderboard /> */}

{/* <Podium /> */}


          <div className="flex flex-col items-center justify-center h-full gap-16">
           <Question text="Which country hosted the 2016 Summer Olympics?" />

            <div className="grid grid-cols-2 gap-8 max-w-4xl w-full px-4">
              <Option letter="A" text="China"   state='wrong' />
              <Option letter="B" text="Brazil"  state='correct' />
              <Option letter="C" text="UK"  state='wrong'  />
              <Option letter="D" text="Russia"  state='wrong'  />
            </div>

            <Timer duration={30}/>

            <Fbutton variant="secondary" className="w-60">
              End Round
            </Fbutton>
          </div>

    </div>
  )
}
