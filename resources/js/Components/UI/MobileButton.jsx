import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const mobileButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-poppins font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-95",
  {
    variants: {
      variant: {
        default:
          "bg-blue-600 text-white shadow-md hover:bg-blue-700 active:bg-blue-800",
        destructive:
          "bg-red-600 text-white shadow-md hover:bg-red-700 active:bg-red-800",
        outline:
          "border border-gray-300 bg-white shadow-sm hover:bg-gray-50 hover:text-blue-600 active:bg-gray-100",
        secondary:
          "bg-gray-100 text-gray-900 shadow-sm hover:bg-gray-200 active:bg-gray-300",
        ghost: "hover:bg-blue-50 hover:text-blue-600 active:bg-blue-100",
        link: "text-blue-600 underline-offset-4 hover:underline active:text-blue-700",
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
