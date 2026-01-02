import * as React from "react"
import { cn } from "@/lib/utils"

const MobileForm = React.forwardRef(({ className, ...props }, ref) => (
  <form
    ref={ref}
    className={cn("space-y-6 font-poppins", className)}
    {...props} />
))
MobileForm.displayName = "MobileForm"

const MobileFormSection = React.forwardRef(({ className, title, description, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("space-y-4", className)}
    {...props}>
    {title && (
      <div className="space-y-2">
        <h3 className="text-lg font-poppins font-semibold text-gray-900">{title}</h3>
        {description && (
          <p className="text-sm font-poppins text-gray-600">{description}</p>
        )}
      </div>
    )}
    {children}
  </div>
))
MobileFormSection.displayName = "MobileFormSection"

const MobileFormField = React.forwardRef(({ className, label, error, required, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("space-y-2", className)}
    {...props}>
    {label && (
      <label className="text-sm font-poppins font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    )}
    {children}
    {error && (
      <p className="text-sm font-poppins text-red-600">{error}</p>
    )}
  </div>
))
MobileFormField.displayName = "MobileFormField"

const MobileFormActions = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col sm:flex-row gap-3 pt-4", className)}
    {...props} />
))
MobileFormActions.displayName = "MobileFormActions"

export {
  MobileForm,
  MobileFormSection,
  MobileFormField,
  MobileFormActions
}
