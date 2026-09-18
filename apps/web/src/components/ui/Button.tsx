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
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium select-none cursor-pointer " +
    "transition-colors duration-150 " +
    "disabled:opacity-40 disabled:cursor-not-allowed " +
    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent";

  const sizeStyles = {
    sm: "text-xs px-3 py-1.5 h-8",
    md: "text-body px-3.5 py-2 h-9",
    lg: "text-body px-4 py-2.5 h-10",
  };

  const variantStyles = {
    primary:
      "bg-accent hover:bg-accent-hover text-white border border-transparent shadow-subtle",
    secondary:
      "bg-bg-surface hover:bg-bg-surface-hover text-text-primary border border-border-default shadow-subtle",
    outline:
      "bg-transparent hover:bg-bg-surface-hover text-text-primary border border-border-default",
    ghost:
      "bg-transparent hover:bg-bg-surface-hover text-text-secondary hover:text-text-primary border border-transparent",
    danger:
      "bg-semantic-danger/10 hover:bg-semantic-danger/20 text-semantic-danger border border-semantic-danger/30",
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
