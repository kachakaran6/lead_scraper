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
    | "neutral";
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
    default: "bg-[#6B6B70]",
    neutral: "bg-[#6B6B70]",
    primary: "bg-[#4C7CF0]",
    info: "bg-[#4C7CF0]",
    secondary: "bg-[#9B9BA1]",
    success: "bg-[#34A874]",
    warning: "bg-[#C98A2E]",
    danger: "bg-[#D14D4D]",
    destructive: "bg-[#D14D4D]",
  }[variant];

  const sizeStyles = {
    sm: "text-[11px] px-2 py-0.5",
    md: "text-[12px] px-2.5 py-1",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border border-[#232326] bg-[#131315] text-[#9B9BA1] font-medium tracking-[0.02em]",
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
