import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "lg",
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-200">
      <div
        className={cn(
          "w-full rounded-lg bg-bg-surface border border-border-subtle p-6 relative text-text-primary shadow-modal",
          maxWidthClass
        )}
      >
        <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
          <div>
            <h3 className="text-h2 font-semibold text-text-primary tracking-tight">{title}</h3>
            {subtitle && <p className="text-body-secondary text-text-secondary mt-1">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-text-secondary hover:text-text-primary rounded-md hover:bg-bg-surface-hover transition-colors duration-150"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-5 max-h-[75vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
