import React from 'react'
import {Option, PlayerOption, PlayerOptions, Question, Timer} from './widgets'
import { Fbutton } from '../../ui/fancy-button'
import { Leaderboard, Podium } from '../shared'

export default function TriviaPlayer() {
  return (
    <div className='bg-gradient-to-br from-[#FE566B] to-[var(--umati-red)] h-dvh w-dvw'>
  
{/* <Leaderboard /> */}

{/* <Podium /> */}


          <div className="flex flex-col items-center justify-center h-full gap-16">
            <h6 className="text-3xl font-bold">Round 1</h6>

            <PlayerOptions
  options={[
    { letter: "A", text: "China" },
    { letter: "B", text: "Brazil" },
    { letter: "C", text: "UK" },
    { letter: "D", text: "Russia" },
  ]}
  onSelect={(letter) => console.log("Selected:", letter)}
/>
          </div>

    </div>
  )
}
