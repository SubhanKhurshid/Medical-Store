import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /**
   * When true (default), Cmd+Enter (macOS) or Ctrl+Enter submits the parent form if a submit control exists.
   * Plain Enter still inserts a new line.
   */
  submitWithMetaEnter?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, submitWithMetaEnter = true, onKeyDown, ...props }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      onKeyDown?.(e)
      if (e.defaultPrevented || !submitWithMetaEnter) return
      if (e.key !== "Enter" || (!e.metaKey && !e.ctrlKey)) return
      if (e.nativeEvent.isComposing) return

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
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        onKeyDown={handleKeyDown}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
