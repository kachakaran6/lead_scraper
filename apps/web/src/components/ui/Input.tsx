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
      <div className="w-full space-y-1">
        {label && (
          <label className="block text-[12px] font-medium text-text-secondary tracking-[0.02em]">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-text-tertiary">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "w-full rounded-md border border-border-default bg-bg-surface px-3 py-1.5 text-[13px] text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors duration-150",
              icon ? "pl-9" : "",
              error ? "border-danger focus:border-danger focus:ring-danger" : "",
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && <p className="text-[12px] text-semantic-danger mt-0.5">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
