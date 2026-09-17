import React, { useState, useRef, useEffect } from "react";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { useTheme, ThemePreference } from "../../lib/theme";

export const ThemeToggle: React.FC = () => {
  const { preference, resolvedTheme, setPreference } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const options: { id: ThemePreference; label: string; icon: React.ReactNode }[] = [
    {
      id: "system",
      label: "System default",
      icon: <Monitor className="w-3.5 h-3.5 text-text-secondary" />,
    },
    {
      id: "light",
      label: "Light mode",
      icon: <Sun className="w-3.5 h-3.5 text-text-secondary" />,
    },
    {
      id: "dark",
      label: "Dark mode",
      icon: <Moon className="w-3.5 h-3.5 text-text-secondary" />,
    },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle theme"
        title={`Theme: ${preference}`}
        className="w-8 h-8 rounded-md bg-bg-surface hover:bg-bg-surface-hover border border-border-default flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors focus:outline-none"
      >
        {resolvedTheme === "dark" ? (
          <Moon className="w-3.5 h-3.5" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-warning" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-38 rounded-md bg-bg-surface border border-border-default shadow-dropdown py-1 z-50 animate-in fade-in-50 zoom-in-95">
          {options.map((opt) => {
            const isSelected = preference === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => {
                  setPreference(opt.id);
                  setIsOpen(false);
                }}
                className="w-full px-3 py-1.5 flex items-center justify-between text-xs text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  {opt.icon}
                  <span>{opt.label}</span>
                </div>
                {isSelected && <Check className="w-3 h-3 text-accent" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
