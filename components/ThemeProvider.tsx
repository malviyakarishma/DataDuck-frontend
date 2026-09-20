"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: "light" | "dark";
  resolvedTheme: "light" | "dark";
  themeSetting: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "dataduck-theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeSetting, setThemeSetting] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedTheme = (localStorage.getItem(STORAGE_KEY) as Theme) || "system";
    setThemeSetting(savedTheme);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const resolveAndApply = (setting: Theme) => {
      let resolved: "light" | "dark" = "light";
      if (setting === "system") {
        resolved = mediaQuery.matches ? "dark" : "light";
      } else {
        resolved = setting;
      }

      setResolvedTheme(resolved);

      const root = document.documentElement;
      root.setAttribute("data-theme", resolved);
      if (resolved === "dark") {
        root.classList.add("dark");
        root.classList.remove("light");
      } else {
        root.classList.add("light");
        root.classList.remove("dark");
      }
    };

    resolveAndApply(savedTheme);

    const handleChange = () => {
      const currentSaved = (localStorage.getItem(STORAGE_KEY) as Theme) || "system";
      if (currentSaved === "system") {
        resolveAndApply("system");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const handleSetTheme = (newTheme: Theme) => {
    setThemeSetting(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);

    let resolved: "light" | "dark" = "light";
    if (newTheme === "system") {
      resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } else {
      resolved = newTheme;
    }

    setResolvedTheme(resolved);

    const root = document.documentElement;
    root.setAttribute("data-theme", resolved);
    if (resolved === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
  };

  const toggleTheme = () => {
    const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
    handleSetTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: resolvedTheme,
        resolvedTheme,
        themeSetting,
        setTheme: handleSetTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
