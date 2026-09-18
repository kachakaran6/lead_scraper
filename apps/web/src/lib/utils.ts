import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatRelativeTime(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

export function scoreToColor(score: number): { text: string; bg: string; border: string; glow: string; dot: string } {
  if (score >= 80) {
    return {
      text: "text-[#34A874]",
      bg: "bg-[#34A874]/10",
      border: "border-[#34A874]/20",
      glow: "",
      dot: "bg-[#34A874]",
    };
  }
  if (score >= 60) {
    return {
      text: "text-[#4C7CF0]",
      bg: "bg-[#4C7CF0]/10",
      border: "border-[#4C7CF0]/20",
      glow: "",
      dot: "bg-[#4C7CF0]",
    };
  }
  if (score >= 40) {
    return {
      text: "text-[#C98A2E]",
      bg: "bg-[#C98A2E]/10",
      border: "border-[#C98A2E]/20",
      glow: "",
      dot: "bg-[#C98A2E]",
    };
  }
  return {
    text: "text-[#D14D4D]",
    bg: "bg-[#D14D4D]/10",
    border: "border-[#D14D4D]/20",
    glow: "",
    dot: "bg-[#D14D4D]",
  };
}
