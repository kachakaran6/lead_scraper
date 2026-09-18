import React from "react";
import { cn } from "../../lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger"
    | "destructive"
    | "info"
    | "neutral"
    | "outline";
  size?: "sm" | "md";
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = "default",
  size = "sm",
  dot = false,
  ...props
}) => {
  const dotColor = {
    default: "bg-text-tertiary",
    neutral: "bg-text-tertiary",
    outline: "bg-text-tertiary",
    primary: "bg-accent",
    info: "bg-accent",
    secondary: "bg-text-secondary",
    success: "bg-semantic-success",
    warning: "bg-semantic-warning",
    danger: "bg-semantic-danger",
    destructive: "bg-semantic-danger",
  }[variant];

  const sizeStyles = {
    sm: "text-[11px] px-2 py-0.5",
    md: "text-xs px-2.5 py-1",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-border-subtle bg-bg-surface text-text-secondary font-medium tracking-[0.02em]",
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColor)} />}
      {children}
    </span>
  );
};
