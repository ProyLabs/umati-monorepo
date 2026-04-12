import { GameType } from "./types";

type Game = {
  id: GameType;
  title: string;
  description?: string;
  color: string;
  className: string;
  src?: string;
  min?: number;
  max?: number;
  instructions?: string;
  playable?: boolean;
};

export const Games: Game[] = [
  {
    id: "drawit",
    title: "Draw It!",
    description: "Draw pictures and guess what others drew.",
    color: "blue",
    className: "from-[var(--umati-blue)] to-[#446BF5]",
    src: "https://img.icons8.com/?size=400&id=13370&format=png&color=000000",
    min: 3,
    playable: true,
  },
  {
    id: "quizzer",
    title: "Quizzer",
    description: "Test your knowledge with custom questions.",
    color: "orange",
    className: "from-orange-400 to-orange-600",
    src: "https://img.icons8.com/?size=100&id=rx6rZTa05YPn&format=png&color=FFFFFF",
    min: 1,
    instructions: `
  <ul>
    <li>Start the game, then set up the quiz live from the host screen.</li>
    <li>Download the template first if you want sample question structure.</li>
    <li>Make sure this screen is being shared on Zoom (or others) or a TV.</li>
    <li>Questions will appear on this screen.</li>
    <li>Players answer on their own device.</li>
    <li>Supports both selection questions and true/false, with answer positions shuffled during play.</li>
  </ul>
`,
playable: true,
  },
  {
    id: "trivia",
    title: "Trivia Go",
    description: "Answer trivia questions as fast as you can.",
    color: "red",
    className: "from-[#FE566B] to-[var(--umati-red)]",
    src: "https://img.icons8.com/?size=400&id=OQQN8J666Pau&format=png&color=000000",
    min: 1,
    instructions: `
  <ul>
    <li>Make sure this screen is being shared on Zoom (or others) or a TV.</li>
    <li>Questions will appear on this screen.</li>
    <li>Answer using the device you've joined with.</li>
    <li>The faster you answer, the more points you'll get.</li>
  </ul>
`,
playable: true,
  },
  {
    id: "herdmentality",
    title: "Herd Mentality™",
    description: "Match majority answers to score points.",
    color: "aqua",
    className: "from-(--umati-aqua) to-[#00D9D5] text-black",
    src: "https://img.icons8.com/?size=400&id=9186&format=png&color=000000",
    min: 3,
    instructions: `
  <ul>
    <li>Make sure this screen is being shared on Zoom (or others) or a TV.</li>
    <li>A prompt will appear on this screen.</li>
    <li>Answer using the device you've joined with.</li>
    <li>Your goal is to match the majority answer!</li>
    <li>If you're with the herd, you score points. If you're the odd one out, you don’t!</li>
  </ul>`,
  playable: true,
  },
  {
    id: "chameleon",
    title: "Chameleon",
    description: "Find the spy hiding among your team.",
    color: "lime",
    className: "from-lime-500 to-green-600",
    src: "https://img.icons8.com/?size=400&id=iy7s412RVvVR&format=png&color=000000",
    min: 3,
    instructions: `
  <ul>
    <li>Make sure this screen is being shared on Zoom (or others) or a TV.</li>
    <li>A category and a secret word will appear on this screen.</li>
    <li>Everyone except the Chameleon will see the secret word.</li>
    <li>Use your device to submit a one-word clue related to the secret word.</li>
    <li>Discuss and try to identify who the Chameleon is.</li>
    <li>The Chameleon wins if they blend in or guess the secret word!</li>
  </ul>
`,
playable: true,
  },
  {
    id: "codenames",
    title: "Codenames",
    description: "Give one-word clues to find secret agents.",
    color: "yellow",
    className: "from-yellow-300 to-yellow-400 text-black",
    src: "https://img.icons8.com/?size=100&id=10528&format=png&color=000000",
    min: 4,
    playable: true,
  },
  {
    id: "jaroflies",
    title: "Jar of Lies",
    description: "Deceive others with your convincing lies.",
    color: "purple",
    className: "from-[#9856FE] to-[var(--umati-purple)]",
    src: "https://img.icons8.com/?size=400&id=61211&format=png&color=000000",
    min: 1,
  },

  {
    id: "friendfacts",
    title: "Friend Facts",
    description: "Guess fun facts about your friends.",
    color: "sky",
    className: "from-[var(--umati-sky)] to-[#3A6EE4]",
    src: "https://img.icons8.com/?size=100&id=46204&format=png&color=000000",
    min: 3,
    playable: true,
  },
];
