import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-poppins font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-brand text-ink shadow hover:bg-brand-600 active:bg-brand-700",
        destructive:
          "bg-error text-white shadow-sm hover:bg-red-600 active:bg-red-700",
        outline:
          "border border-slate-300 bg-white shadow-sm hover:bg-slate-50 hover:text-brand-700 active:bg-slate-100",
        secondary:
          "bg-slate-100 text-ink shadow-sm hover:bg-slate-200 active:bg-slate-300",
        ghost: "hover:bg-brand-50 hover:text-brand-700 active:bg-brand-100",
        link: "text-brand-700 underline-offset-4 hover:underline active:text-brand-800",
      },
      size: {
        default: "h-11 px-4 py-2 min-h-[44px]",
        sm: "h-9 rounded-md px-3 text-xs min-h-[36px]",
        lg: "h-12 rounded-md px-8 min-h-[48px]",
        icon: "h-11 w-11 min-h-[44px] min-w-[44px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
