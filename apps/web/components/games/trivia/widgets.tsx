import { cn } from "../../../lib/utils";
import { CheckIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import React from "react";
import { useEffect, useState } from "react";

export const Question = ({ text }: { text: string }) => {
  return (
    <h1 className="text-6xl font-bold mb-8 text-center max-w-4xl mx-auto w-full">
      {text}
    </h1>
  );
};

type OptionLetter = "A" | "B" | "C" | "D";

export const Option = ({
  letter,
  text,
  state = "default",
}: {
  letter: OptionLetter;
  text: string;
  state?: "default" | "correct" | "wrong";
}) => {
  const Icon = () => {
    if (state === "correct") {
      return (
        <div className="rounded-full size-10 bg-[var(--umati-aqua)] flex items-center justify-center text-white">
          <CheckIcon className="size-6" />
        </div>
      );
    } else {
      return (
        <div
          data-letter={letter}
          className="rounded-full size-10 data-[letter=A]:bg-[var(--umati-yellow)] data-[letter=B]:bg-[var(--umati-sky)] data-[letter=C]:bg-[var(--umati-purple)] data-[letter=D]:bg-[var(--umati-red)] flex items-center justify-center text-white"
        >
          <p className="text-xl font-bold text-center w-full">{letter}</p>
        </div>
      );
    }
  };

  return (
    <motion.div
      className={cn(
        "bg-white text-black p-4 rounded-2xl inline-flex items-center gap-4 cursor-pointer hover:scale-[1.02] transition-transform duration-300 ease-linear",
        state === "wrong" && "opacity-50"
      )}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      transition={{ duration: 0.15 }}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={`${state}-${letter}`}
          data-slot="copy-button-icon"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          transition={{ duration: 0.15 }}
        >
          <Icon />
        </motion.span>
      </AnimatePresence>
      <p className="text-3xl font-semibold">{text}</p>
    </motion.div>
  );
};



export const PlayerOption = ({
  letter,
  text,
  selected,
  disabled,
  onClick,
}: {
  letter: OptionLetter;
  text: string;
  selected?: boolean;
    disabled?: boolean;
  onClick?: () => void;
}) => {
  return (
    <motion.div
      onClick={onClick}
      className={cn(
        "bg-white text-black p-4 h-20 rounded-2xl inline-flex items-center gap-4 cursor-pointer select-none transition-transform duration-300 ease-linear",
        "hover:scale-102 active:scale-105",
        selected && "bg-[var(--umati-blue)] text-white",
         (disabled && !selected) && "pointer-events-none opacity-75 "
      )}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      transition={{ duration: 0.15 }}
    >
      <span className="text-2xl md:text-3xl font-bold bg-black/10 rounded-full px-4 py-1">
        {letter}
      </span>
      <p className="text-2xl md:text-3xl font-semibold text-center w-full">
        {text}
      </p>
    </motion.div>
  );
};

export const PlayerOptions = ({
  selected=null,
  options,
  onSelect,
}: {
  selected?: OptionLetter | null;
  options: { letter: OptionLetter; text: string }[];
  onSelect?: (letter: OptionLetter) => void;
}) => {
  const [internalSelected, setSelected] = useState<OptionLetter | null>(selected || null);

  const handleSelect = (letter: OptionLetter) => {
    if(internalSelected) return;
    setSelected(letter);
    onSelect?.(letter);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl w-full mx-auto px-4">
      {options.map((opt) => (
        <PlayerOption
          key={opt.letter}
          {...opt}
          selected={opt.letter === internalSelected}
          disabled={!!internalSelected}
          onClick={() => handleSelect(opt.letter)}
        />
      ))}
    </div>
  );
};



export const Timer = ({ duration }: { duration: number }) => {
  const [seconds, setSeconds] = useState(duration);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [seconds]);

  const progress = (seconds / duration) * 100;

  return (
    <div className="w-full max-w-3xl relative flex items-center justify-center h-16">
      <div className="h-4 w-full rounded-l-full bg-white/10 relative overflow-clip flex items-center justify-end -mr-1">
        <div
          className="absolute h-full bg-white inset-y-0 origin-[right_center_0px] rounded-l-full transition-all duration-1000 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="rounded-full size-16 aspect-square border-6 border-white flex items-center justify-center z-10">
        <p className="text-4xl font-bold">{seconds}</p>
      </div>
      <div className="h-4 w-full rounded-r-full bg-white/10 relative overflow-clip -ml-1">
        <div
          className="absolute h-full bg-white inset-y-0 origin-left rounded-r-full transition-all duration-1000 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

