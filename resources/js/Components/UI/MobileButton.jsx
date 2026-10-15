import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const mobileButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-poppins font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-95",
  {
    variants: {
      variant: {
        default:
          "bg-brand text-ink shadow-md hover:bg-brand-600 active:bg-brand-700",
        destructive:
          "bg-error text-white shadow-md hover:bg-red-600 active:bg-red-700",
        outline:
          "border border-slate-300 bg-white shadow-sm hover:bg-slate-50 hover:text-brand-700 active:bg-slate-100",
        secondary:
          "bg-slate-100 text-ink shadow-sm hover:bg-slate-200 active:bg-slate-300",
        ghost: "hover:bg-brand-50 hover:text-brand-700 active:bg-brand-100",
        link: "text-brand-700 underline-offset-4 hover:underline active:text-brand-800",
      },
      size: {
        default: "h-12 px-6 py-3 min-h-[48px] min-w-[48px]",
        sm: "h-10 rounded-lg px-4 text-xs min-h-[40px] min-w-[40px]",
        lg: "h-14 rounded-xl px-8 text-base min-h-[56px] min-w-[56px]",
        icon: "h-12 w-12 min-h-[48px] min-w-[48px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const MobileButton = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(mobileButtonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />
  );
})
MobileButton.displayName = "MobileButton"

export { MobileButton, mobileButtonVariants };

export default MobileButton;
