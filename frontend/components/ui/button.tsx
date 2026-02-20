import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.95]",
  {
    variants: {
      variant: {
        default:
          "bg-cyber-yellow text-black shadow-lg hover:shadow-[0_0_30px_-5px_rgba(253,224,71,0.5)] hover:scale-[1.02]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border-2 border-white/20 bg-transparent text-white hover:border-white/40",
        secondary:
          "bg-white/10 text-white backdrop-blur-xl border border-white/20 shadow-sm hover:bg-white/20",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        pill: "rounded-full px-8 py-3 font-semibold bg-cyber-yellow text-black hover:scale-105 hover:shadow-lg",
        pillOutline: "rounded-full px-8 py-3 font-semibold border-2 border-black/20 text-black hover:border-black/40 bg-transparent",
        pillLight: "rounded-full px-8 py-3 font-semibold border-2 border-white/20 text-white hover:border-white/40 bg-transparent",
        solid: "rounded-full px-8 py-3 font-semibold bg-black text-white hover:bg-zinc-900 hover:scale-105 hover:shadow-lg",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-full px-4 text-xs",
        lg: "h-12 rounded-full px-10 text-base",
        xl: "h-14 rounded-full px-12 text-lg",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
