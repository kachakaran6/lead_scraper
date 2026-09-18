import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemePalette = "default" | "ocean" | "emerald" | "violet" | "amber";
export type ThemeMode = "dark" | "light";

export interface ThemeConfig {
  id: ThemePalette;
  name: string;
  description: string;
  primaryColor: string;
  accentColor: string;
}

export const THEME_PALETTES: ThemeConfig[] = [
  {
    id: "default",
    name: "Default Slate",
    description: "Classic enterprise indigo & slate",
    primaryColor: "#6366F1",
    accentColor: "#EC4899",
  },
  {
    id: "ocean",
    name: "Ocean Navy",
    description: "Deep naval blue & vibrant cyan",
    primaryColor: "#0284C7",
    accentColor: "#06B6D4",
  },
  {
    id: "emerald",
    name: "Emerald Forest",
    description: "Deep evergreen & crisp mint",
    primaryColor: "#10B981",
    accentColor: "#34D399",
  },
  {
    id: "violet",
    name: "Violet Mauve",
    description: "Regal violet & soft lavender",
    primaryColor: "#8B5CF6",
    accentColor: "#C084FC",
  },
  {
    id: "amber",
    name: "Obsidian Amber",
    description: "Warm bronze, obsidian & gold",
    primaryColor: "#D97706",
    accentColor: "#FBBF24",
  },
];

interface ThemeContextType {
  palette: ThemePalette;
  mode: ThemeMode;
  setPalette: (palette: ThemePalette) => void;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [palette, setPaletteState] = useState<ThemePalette>(() => {
    try {
      const stored = localStorage.getItem("leadengine-theme-palette") as ThemePalette;
      if (["default", "ocean", "emerald", "violet", "amber"].includes(stored)) {
        return stored;
      }
    } catch {}
    return "default";
  });

  const [mode, setModeState] = useState<ThemeMode>(() => {
    try {
      const stored = localStorage.getItem("leadengine-theme-mode") as ThemeMode;
      if (stored === "light" || stored === "dark") {
        return stored;
      }
    } catch {}
    return "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", palette);
    root.setAttribute("data-mode", mode);

    if (mode === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
  }, [palette, mode]);

  const setPalette = (newPalette: ThemePalette) => {
    setPaletteState(newPalette);
    try {
      localStorage.setItem("leadengine-theme-palette", newPalette);
    } catch {}
  };

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem("leadengine-theme-mode", newMode);
    } catch {}
  };

  const toggleMode = () => {
    setMode(mode === "dark" ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider value={{ palette, mode, setPalette, setMode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
