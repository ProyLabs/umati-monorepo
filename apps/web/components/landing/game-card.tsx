import { cn } from "../../lib/utils";
import { RiMedalFill } from "@remixicon/react";
import { cva, VariantProps } from "class-variance-authority";
import Image from "next/image";
import React from "react";

const gameCardVariants = cva(
  "border-2 border-foreground/20 rounded-xl md:rounded-3xl p-4 md:p-6 gap-6 bg-gradient-to-b flex flex-col shadow-xl text-white",
  {
    variants: {
      variant: {
        sky: "from-[var(--umati-sky)] to-[#3A6EE4]",
        aqua: "from-[var(--umati-aqua)] to-[#00D9D5] text-black",
        blue: "from-[var(--umati-blue)] to-[#446BF5]",
        red: "from-[#FE566B] to-[var(--umati-red)] ",
        purple: "from-[#9856FE] to-[var(--umati-purple)] ",
        lime: "from-lime-500 to-green-600"
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
  description,
  className,
  variant,
  src,
  size,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof gameCardVariants> & {
  title: string;
  description?: string;
  src?: string
}) {
  return (
    <div className={cn(gameCardVariants({ variant, size,  className }))} {...props}>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="">
          <h2 className="text-2xl md:text-3xl font-bold leading-none">{title}</h2>
          <p className="text-sm md:text-lg">{description}</p>
        </div>
        <div className="bg-black/30 rounded-lg flex items-center justify-center p-1 gap-1 text-white">
            <RiMedalFill className="size-3.5 md:size-4.5" />
          <span className="mr-1 font-semibold text-xs md:text-sm">4.7</span>
        </div>
      </div>
     {src && <Image src={src} alt={title} width={150} height={100} className="mt-auto md:size-50 mx-auto" />}
    </div>
  );
}

export default GameCard;
