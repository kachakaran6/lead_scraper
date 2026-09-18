import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../lib/theme";

export const ThemeToggle: React.FC = () => {
  const { resolvedTheme, setPreference } = useTheme();

  const toggle = () => {
    setPreference(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <button
      onClick={toggle}
      aria-label={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="w-8 h-8 rounded-lg bg-bg-surface hover:bg-bg-surface-hover border border-border-default flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
    >
      {resolvedTheme === "dark" ? (
        <Sun className="w-4 h-4 text-text-secondary hover:text-text-primary transition-colors" />
      ) : (
        <Moon className="w-4 h-4 text-text-secondary hover:text-text-primary transition-colors" />
      )}
    </button>
  );
};
