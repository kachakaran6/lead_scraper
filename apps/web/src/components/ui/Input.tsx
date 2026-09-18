import React from "react";
import { cn } from "../../lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-meta text-text-tertiary">
            {label}
          </label>
        )}
        <div className="relative flex items-center group">
          {icon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-text-tertiary group-focus-within:text-text-primary transition-colors duration-150">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "w-full rounded-lg border border-border-default bg-bg-surface px-3 py-2 text-body text-text-primary placeholder:text-text-tertiary " +
                "focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent " +
                "transition-colors duration-150",
              icon ? "pl-9" : "",
              error ? "border-semantic-danger focus:border-semantic-danger focus:ring-semantic-danger" : "",
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-semantic-danger mt-1">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
