import React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = "primary",
  size = "md",
  icon,
  isLoading,
  disabled,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#4C7CF0]";

  const sizeStyles = {
    sm: "text-[12px] px-2.5 py-1 h-7",
    md: "text-[13px] px-3 py-1.5 h-8",
    lg: "text-[14px] px-4 py-2 h-9",
  };

  const variantStyles = {
    primary: "bg-[#4C7CF0] hover:bg-[#3B6BE0] text-white border border-transparent",
    secondary: "bg-[#131315] hover:bg-[#1B1B1E] text-[#EDEDEF] border border-[#2E2E32]",
    outline: "bg-transparent hover:bg-[#1B1B1E] text-[#EDEDEF] border border-[#2E2E32]",
    ghost: "bg-transparent hover:bg-[#1B1B1E] text-[#9B9BA1] hover:text-[#EDEDEF] border border-transparent",
    danger: "bg-[#D14D4D] hover:bg-[#B83E3E] text-white border border-transparent",
  };

  return (
    <button
      className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-3.5 w-3.5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        icon
      )}
      {children}
    </button>
  );
};
