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
    "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent";

  const sizeStyles = {
    sm: "text-[12px] px-2.5 py-1 h-7",
    md: "text-[13px] px-3 py-1.5 h-8",
    lg: "text-[14px] px-4 py-2 h-9",
  };

  const variantStyles = {
    primary: "bg-accent hover:bg-accent-hover text-white border border-transparent",
    secondary: "bg-bg-surface hover:bg-bg-surface-hover text-text-primary border border-border-default",
    outline: "bg-transparent hover:bg-bg-surface-hover text-text-primary border border-border-default",
    ghost: "bg-transparent hover:bg-bg-surface-hover text-text-secondary hover:text-text-primary border border-transparent",
    danger: "bg-semantic-danger hover:opacity-90 text-white border border-transparent",
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
