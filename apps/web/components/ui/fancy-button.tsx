import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"
import { BouncingCircles } from "./svgs"

const fbuttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap [&_span]:font-bold [&_*]:z-2 transition-all disabled:pointer-events-none disabled:opacity-50 uppercase select-none before:absolute before:inset-0 before:content-[''] before:transition-all before:z-1 cursor-pointer bg-none active:before:shadow-none hover:before:brightness-110 before:shadow-md before:shadow-[0_4px_0] ",
  {
    variants: {
      variant: {
        default: "text-primary-foreground before:bg-[#446BF5] text-[var(--umati-blue)] [&_span]:text-white",
        red: "text-primary-foreground before:bg-[#FE566B] text-red-900 [&_span]:text-white",
        aqua: "text-primary-foreground before:bg-[#09DEAE] text-[#059C7A] [&_span]:text-black",
        purple: "text-primary-foreground before:bg-[#9856FE] text-[#7B35F7] [&_span]:text-white",
        sky: "text-primary-foreground before:bg-[var(--umati-sky)] text-[#3A6EE4] [&_span]:text-white",
        secondary:
          "text-primary-foreground before:bg-white hover:before:brightness-90 before:shadow-md before:shadow-[0_4px_0] before:border-[2px] before:border-[#e5e5e5] text-[#e5e5e5] [&_span]:text-foreground dark:[&_span]:text-background",
        outline:
          "text-primary-foreground before:bg-white dark:before:bg-input/30 hover:before:brightness-90 before:shadow-md before:shadow-[0_4px_0] before:border-[2px] before:border-[#e5e5e5] dark:before:border-input text-[#e5e5e5] dark:text-input [&_span]:text-foreground dark:[&_span]:text-foreground dark:hover:[&_span]:text-accent-foreground",

        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12.5 px-4 text-sm font-semibold before:h-11.5 rounded-md before:rounded-md active:translate-y-1",
        sm: "h-10.5 px-4 text-sm font-semibold before:h-9.5 rounded-md before:rounded-md active:translate-y-0.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "h-12.5 w-11.5 flex-shrink-0 text-sm font-semibold before:h-11.5 rounded-md before:rounded-md active:translate-y-1",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
      rounded: {
        true: "rounded-full before:rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      rounded: false,
    },
  }
)

function Fbutton({
  className,
  variant,
  size,
  rounded,
  asChild = false,
  children,
loading = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof fbuttonVariants> & {
    asChild?: boolean
    loading?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(fbuttonVariants({ variant, size, rounded, className }))}
      {...props}
    >
     {!loading ? <span className="relative font-bold flex gap-2 items-center justify-center">{children}</span> :
      <span className="relative">
        <BouncingCircles className={cn("h-10 w-auto")} />
      </span>}
      </Comp>
  )
}

export { Fbutton, fbuttonVariants }
