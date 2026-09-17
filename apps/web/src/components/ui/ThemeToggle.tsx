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
      className="w-8 h-8 rounded-md bg-bg-surface hover:bg-bg-surface-hover border border-border-default flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors focus:outline-none"
    >
      {resolvedTheme === "dark" ? (
        <Sun className="w-3.5 h-3.5 text-warning" />
      ) : (
        <Moon className="w-3.5 h-3.5" />
      )}
    </button>
  );
};
