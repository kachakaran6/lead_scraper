import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemePreference = "light" | "dark";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextType {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => {
    try {
      const stored = localStorage.getItem("theme-preference");
      if (stored === "light" || stored === "dark") {
        return stored;
      }
      // Legacy: if stored was "system", keep dark as the app's intended default
    } catch {}
    return "dark";
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(preference);

  useEffect(() => {
    const resolved = preference;
    setResolvedTheme(resolved);

    const root = document.documentElement;
    root.setAttribute("data-theme", resolved);
    if (resolved === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [preference]);

  const setPreference = (newPref: ThemePreference) => {
    setPreferenceState(newPref);
    try {
      localStorage.setItem("theme-preference", newPref);
    } catch {}
  };

  return (
    <ThemeContext.Provider value={{ preference, resolvedTheme, setPreference }}>
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
