import * as React from "react"
import { cn } from "@/lib/utils"

const MobileCard = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("rounded-2xl border border-gray-200 bg-white text-gray-900 shadow-sm", className)}
    {...props} />
))
MobileCard.displayName = "MobileCard"

const MobileCardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6 pb-4", className)}
    {...props} />
))
MobileCardHeader.displayName = "MobileCardHeader"

const MobileCardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("font-poppins font-semibold text-xl leading-none tracking-tight text-gray-900", className)}
    {...props} />
))
MobileCardTitle.displayName = "MobileCardTitle"

const MobileCardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm font-poppins text-gray-600 mt-2", className)}
    {...props} />
))
MobileCardDescription.displayName = "MobileCardDescription"

const MobileCardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
MobileCardContent.displayName = "MobileCardContent"

const MobileCardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props} />
))
MobileCardFooter.displayName = "MobileCardFooter"

export {
  MobileCard,
  MobileCardHeader,
  MobileCardFooter,
  MobileCardTitle,
  MobileCardDescription,
  MobileCardContent
};

export default MobileCard;
