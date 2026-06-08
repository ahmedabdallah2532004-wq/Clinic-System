import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: boolean;
    errorMessage?: string;
    label?: string;
  }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, errorMessage, label, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-1">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            type={type}
            className={cn(
              "flex h-11 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all disabled:cursor-not-allowed disabled:opacity-50",
              (error || errorMessage) && "border-destructive focus-visible:ring-destructive/20 focus-visible:border-destructive",
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {errorMessage && (
          <p className="text-[10px] font-bold text-destructive mr-1 animate-in fade-in slide-in-from-top-1">
            {errorMessage}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
