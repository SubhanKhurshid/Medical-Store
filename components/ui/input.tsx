import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * When true (default), Enter inside a form triggers submit if a submit control exists.
   * Set false for custom Enter behavior only (your onKeyDown can still call preventDefault).
   */
  submitOnEnter?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", submitOnEnter = true, onKeyDown, ...props }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      onKeyDown?.(e)
      if (e.defaultPrevented || !submitOnEnter) return
      if (e.key !== "Enter") return
      if (e.nativeEvent.isComposing) return

      const inputType = type ?? "text"
      if (
        inputType === "button" ||
        inputType === "checkbox" ||
        inputType === "radio" ||
        inputType === "file" ||
        inputType === "submit" ||
        inputType === "reset"
      ) {
        return
      }

      const form = e.currentTarget.form
      if (!form) return
      const submitter = form.querySelector(
        'button[type="submit"]:not([disabled]), input[type="submit"]:not([disabled])',
      )
      if (!submitter) return

      e.preventDefault()
      form.requestSubmit()
    }

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        onKeyDown={handleKeyDown}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
