import { cn } from "../../lib/utils";
import { RiMedalFill } from "@remixicon/react";
import { cva, VariantProps } from "class-variance-authority";
import Image from "next/image";
import React from "react";

const gameCardVariants = cva(
  "border-2 border-foreground/20 rounded-3xl p-6 bg-gradient-to-b flex flex-col shadow-xl text-white",
  {
    variants: {
      variant: {
        sky: "from-[var(--umati-sky)] to-[#3A6EE4]",
        aqua: "from-[var(--umati-aqua)] to-[#00D9D5] text-black",
        blue: "from-[var(--umati-blue)] to-[#446BF5]",
        red: "from-[#FE566B] to-[var(--umati-red)] ",
        purple: "from-[#9856FE] to-[var(--umati-purple)] ",
      },
      size: {
        default: "w-50 h-66.67 md:w-75 md:h-100",
      },
    },
    defaultVariants: {
      variant: "sky",
      size: "default",
    },
  }
);


function GameCard({
  title,
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof gameCardVariants> & {
  title: string;
}) {
  return (
    <div className={cn(gameCardVariants({ variant, size,  className }))} {...props}>
      <div className="flex items-start justify-between gap-4">
        <div className="">
          <h2 className="text-3xl font-bold">{title}</h2>
          <p className="">Multiplayer</p>
        </div>
        <div className="bg-black/30 rounded-lg flex items-center justify-center p-1 gap-1 text-white">
            <RiMedalFill size={18} className="" />
          <span className="mr-1 font-semibold text-sm">4.7</span>
        </div>
      </div>
      <Image src="/games/trivia-logo.png" alt="Game Image" width={350} height={100} className="mt-auto" />
    </div>
  );
}

export default GameCard;
