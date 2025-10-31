import React, { useMemo } from 'react'
import {Option, OptionLetter, Question, Timer} from './widgets'
import { Fbutton } from '../../ui/fancy-button'
import { Leaderboard, Podium } from '../shared'
import { useLobbyHost } from '@/providers/lobby-host-provider'
import { AnimatePresence } from 'motion/react'

export default function TriviaHost() {
  const { game, gameState, lobby } = useLobbyHost();
  const data = useMemo(() => {return game?.data[game?.currentRound]!}, [game])

  const letters: OptionLetter[] = ['A', 'B', 'C', 'D'];
  return (
    <div className='bg-gradient-to-br from-[#FE566B] to-[var(--umati-red)] h-screen w-screen'>
      <div className="fixed top-0 px-8 py-4 w-full">
            <div className="flex items-center justify-between w-full ">
              <div className="">
              <p className="text-xl font-medium"><span className="font-bold ">{lobby?.name}</span>  Code: {lobby?.code}</p>
              <p className="text-xl font-bold">Round {game?.currentRound!+1 } of {game?.noOfRounds}</p>
              </div>
            </div>
          </div>

{/* <Podium /> */}
<AnimatePresence>
        {
          (gameState === 'ROUND' || gameState == 'ROUND_END') &&
  
          <div className="flex flex-col items-center justify-center h-full gap-16">
           <Question text={data.question} />

            <div className="grid grid-cols-2 gap-8 max-w-4xl w-full px-4">{
              data.choices.map((choice, index)=> {
                return <Option letter={letters[index]} text={choice}   state={gameState === "ROUND_END" ?  choice === data?.answer ? 'correct' : 'wrong' :'default'} />
              })
              }
            </div>

            {/* <Timer duration={30}/> */}

            <Fbutton variant="secondary" className="w-60">
              End Round
            </Fbutton>
          </div>
                }

                {
                  gameState === 'LEADERBOARD' && 
                  <Leaderboard />

                }




          </AnimatePresence>

    </div>
  )
}
