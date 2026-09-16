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
          <label className="block text-[12px] font-medium text-[#9B9BA1] tracking-[0.02em]">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-[#6B6B70]">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "w-full rounded-md border border-[#2E2E32] bg-[#0A0A0B] px-3 py-1.5 text-[13px] text-[#EDEDEF] placeholder:text-[#6B6B70] focus:border-[#4C7CF0] focus:outline-none focus:ring-1 focus:ring-[#4C7CF0] transition-colors duration-150",
              icon ? "pl-9" : "",
              error ? "border-[#D14D4D] focus:border-[#D14D4D] focus:ring-[#D14D4D]" : "",
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && <p className="text-[12px] text-[#D14D4D] mt-0.5">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
