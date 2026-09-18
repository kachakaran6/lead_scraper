import React, { useState, useRef, useEffect } from "react";
import { Palette, Sun, Moon, Check, ChevronDown } from "lucide-react";
import { useTheme, THEME_PALETTES, ThemePalette } from "../../lib/theme";

export const ThemeSelector: React.FC = () => {
  const { palette, mode, setPalette, toggleMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeTheme =
    THEME_PALETTES.find((t) => t.id === palette) || THEME_PALETTES[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center gap-1.5">
        {/* Palette Dropdown Toggle */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border-default bg-bg-surface hover:bg-bg-surface-hover text-xs font-medium text-text-primary transition-colors focus:outline-none"
          title="Change Theme Palette"
        >
          <span
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: activeTheme.primaryColor }}
          />
          <span className="hidden sm:inline-block text-xs">{activeTheme.name}</span>
          <ChevronDown
            className={`w-3 h-3 text-text-tertiary transition-transform duration-150 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Quick Dark/Light Switcher */}
        <button
          type="button"
          onClick={toggleMode}
          className="p-1.5 rounded-lg border border-border-default bg-bg-surface hover:bg-bg-surface-hover text-text-secondary hover:text-text-primary transition-colors"
          title={`Switch to ${mode === "dark" ? "Light" : "Dark"} mode`}
        >
          {mode === "dark" ? (
            <Sun className="w-3.5 h-3.5 text-warning" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-accent" />
          )}
        </button>
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-60 rounded-xl bg-bg-surface border border-border-subtle shadow-xl py-1.5 z-50">
          <div className="px-3 py-1.5 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider border-b border-border-subtle">
            Select Platform Theme
          </div>

          <div className="py-1">
            {THEME_PALETTES.map((t) => {
              const isSelected = t.id === palette;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setPalette(t.id);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs hover:bg-bg-surface-hover transition-colors ${
                    isSelected ? "bg-accent/10 font-medium text-text-primary" : "text-text-secondary"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                      style={{ backgroundColor: t.primaryColor }}
                    />
                    <div>
                      <div className="text-xs font-medium text-text-primary">{t.name}</div>
                      <div className="text-[11px] text-text-tertiary">{t.description}</div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-accent shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
