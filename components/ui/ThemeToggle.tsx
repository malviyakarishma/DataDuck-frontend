"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

interface ThemeToggleProps {
  className?: string;
  size?: "sm" | "md";
}

export default function ThemeToggle({ className = "", size = "md" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        className={`theme-toggle-btn ${size === "sm" ? "p-1.5" : "p-2"} ${className}`}
        aria-label="Toggle theme"
        disabled
      >
        <span className="w-4 h-4 block" />
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`theme-toggle-btn ${size === "sm" ? "p-1.5" : "p-2"} ${className}`}
      aria-label={isDark ? "Switch to Pearl Platinum light theme" : "Switch to Matte Black dark theme"}
      title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
    >
      {isDark ? (
        <Sun size={size === "sm" ? 15 : 18} className="text-amber-300 transition-transform duration-200 hover:rotate-45" />
      ) : (
        <Moon size={size === "sm" ? 15 : 18} className="text-slate-700 transition-transform duration-200 hover:-rotate-12" />
      )}
    </button>
  );
}
