import { GameType } from "./types"

type Game = {
    id: GameType;
    title: string;
    description?: string;
    color: string;
    className: string;
    src?: string
}


export const Games: Game[] = [
  {id: "trivia", title: 'Trivia Go', color: 'red', className: 'from-[#FE566B] to-[var(--umati-red)]', src: 'https://img.icons8.com/?size=400&id=OQQN8J666Pau&format=png&color=000000' },
  {id: "drawit", title: 'Draw It!', color: 'purple', className: 'from-[#9856FE] to-[var(--umati-purple)]', src: 'https://img.icons8.com/?size=400&id=13370&format=png&color=000000' },
  {id: "oddoneout", title: 'Odd One Out', color: 'sky', className: 'from-[var(--umati-sky)] to-[#3A6EE4]', src: "https://img.icons8.com/?size=400&id=sePVjS3lDZr6&format=png&color=000000" },
  {id: "herdmentality", title: 'Herd Mentality™', description: "Min 2. players", color: 'aqua', className: 'from-(--umati-aqua) to-[#00D9D5] text-black', src:"https://img.icons8.com/?size=400&id=9186&format=png&color=000000" },
  {id: "chameleon", title: 'Chameleon', color: 'lime', className: 'from-lime-500 to-green-600', src: "https://img.icons8.com/?size=400&id=iy7s412RVvVR&format=png&color=000000" },
]