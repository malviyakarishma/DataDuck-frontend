"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, "id">) => string;
  removeToast: (id: string) => void;
  success: (title: string, description?: string, duration?: number) => string;
  error: (title: string, description?: string, duration?: number) => string;
  warning: (title: string, description?: string, duration?: number) => string;
  info: (title: string, description?: string, duration?: number) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Global toast ref for non-React call sites if needed
let globalToastHandler: ToastContextType | null = null;

export const toast = {
  success: (title: string, description?: string, duration?: number) =>
    globalToastHandler?.success(title, description, duration),
  error: (title: string, description?: string, duration?: number) =>
    globalToastHandler?.error(title, description, duration),
  warning: (title: string, description?: string, duration?: number) =>
    globalToastHandler?.warning(title, description, duration),
  info: (title: string, description?: string, duration?: number) =>
    globalToastHandler?.info(title, description, duration),
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type, title, description, duration = 4000 }: Omit<ToastItem, "id">) => {
      const id = "toast_" + Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, type, title, description, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const success = useCallback(
    (title: string, description?: string, duration?: number) =>
      addToast({ type: "success", title, description, duration }),
    [addToast]
  );

  const error = useCallback(
    (title: string, description?: string, duration?: number) =>
      addToast({ type: "error", title, description, duration: duration || 5000 }),
    [addToast]
  );

  const warning = useCallback(
    (title: string, description?: string, duration?: number) =>
      addToast({ type: "warning", title, description, duration }),
    [addToast]
  );

  const info = useCallback(
    (title: string, description?: string, duration?: number) =>
      addToast({ type: "info", title, description, duration }),
    [addToast]
  );

  const contextValue: ToastContextType = {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };

  globalToastHandler = contextValue;

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {/* Toast Notification Container */}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function ToastCard({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />;
      case "error":
        return <AlertCircle size={18} className="text-red-500 flex-shrink-0" />;
      case "warning":
        return <AlertTriangle size={18} className="text-amber-500 flex-shrink-0" />;
      case "info":
      default:
        return <Info size={18} className="text-blue-500 flex-shrink-0" />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case "success":
        return "var(--accent-emerald-border)";
      case "error":
        return "var(--error-border)";
      case "warning":
        return "rgba(245, 158, 11, 0.3)";
      case "info":
      default:
        return "rgba(59, 130, 246, 0.3)";
    }
  };

  return (
    <div
      className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl border shadow-xl backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100"
      style={{
        background: "var(--bg-card)",
        borderColor: getBorderColor(),
        boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.2), 0 0 0 1px var(--border-subtle)",
      }}
    >
      <div className="mt-0.5">{getIcon()}</div>
      <div className="flex-1 min-w-0 pr-1">
        <p className="text-xs font-bold leading-snug" style={{ color: "var(--text-primary)" }}>
          {toast.title}
        </p>
        {toast.description && (
          <p className="text-[11px] mt-0.5 leading-relaxed font-medium" style={{ color: "var(--text-secondary)" }}>
            {toast.description}
          </p>
        )}
      </div>
      <button
        onClick={onClose}
        className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-smooth -mr-1 -mt-1"
        aria-label="Close notification"
      >
        <X size={14} />
      </button>
    </div>
  );
}
