import * as React from "react"
import { cn } from "@/lib/utils"

const MobileInput = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-12 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base font-poppins shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 min-h-[48px]",
        className
      )}
      ref={ref}
      {...props} />
  );
})
MobileInput.displayName = "MobileInput"

export { MobileInput };

export default MobileInput;
