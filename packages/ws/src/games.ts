import { GameType } from "./types";

type Game = {
  id: GameType;
  title: string;
  description?: string;
  color: string;
  className: string;
  src?: string;
  min?: number
};

export const Games: Game[] = [
  // {id: "drawit", title: 'Draw It!', color: 'purple', className: 'from-[#9856FE] to-[var(--umati-purple)]', src: 'https://img.icons8.com/?size=400&id=13370&format=png&color=000000' },
  {
    id: "chameleon",
    title: "Chameleon",
    color: "lime",
    className: "from-lime-500 to-green-600",
    src: "https://img.icons8.com/?size=400&id=iy7s412RVvVR&format=png&color=000000",
    min: 3,
  },
  {
    id: "jaroflies",
    title: "Jar of Lies",
    color: "purple",
    className: "from-[#9856FE] to-[var(--umati-purple)]",
    src: "https://img.icons8.com/?size=400&id=61211&format=png&color=000000",
    min:1
  },
  {
    id: "trivia",
    title: "Trivia Go",
    color: "red",
    className: "from-[#FE566B] to-[var(--umati-red)]",
    src: "https://img.icons8.com/?size=400&id=OQQN8J666Pau&format=png&color=000000",
     min:1
  },
  {
    id: "drawit",
    title: "Most Likely to...",
    color: "sky",
    className: "from-[#9856FE] to-[var(--umati-purple)]",
    src: "https://img.icons8.com/?size=400&id=ziAWwQ4GdGVA&format=png&color=000000",
     min:2
  },
  {
    id: "herdmentality",
    title: "Herd Mentality™",
    color: "aqua",
    className: "from-(--umati-aqua) to-[#00D9D5] text-black",
    src: "https://img.icons8.com/?size=400&id=9186&format=png&color=000000",
    min:3,
  },
];
