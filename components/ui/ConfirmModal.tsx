"use client";

import React, { useEffect } from "react";
import { AlertTriangle, Trash2, Info, Loader2, X } from "lucide-react";

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info" | "primary";
  loading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  loading = false,
}: ConfirmModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape" && !loading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (variant) {
      case "danger":
        return <Trash2 size={20} className="text-red-500" />;
      case "warning":
        return <AlertTriangle size={20} className="text-amber-500" />;
      case "info":
      case "primary":
      default:
        return <Info size={20} className="text-[var(--accent-emerald)]" />;
    }
  };

  const getIconBg = () => {
    switch (variant) {
      case "danger":
        return {
          background: "var(--error-pale)",
          borderColor: "var(--error-border)",
        };
      case "warning":
        return {
          background: "rgba(245, 158, 11, 0.12)",
          borderColor: "rgba(245, 158, 11, 0.3)",
        };
      default:
        return {
          background: "var(--accent-emerald-pale)",
          borderColor: "var(--accent-emerald-border)",
        };
    }
  };

  const getConfirmButtonClasses = () => {
    switch (variant) {
      case "danger":
        return "bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/20";
      case "warning":
        return "bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-500/20";
      default:
        return "btn-primary";
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md p-6 rounded-2xl border shadow-2xl animate-scale-in relative"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border-dim)",
        }}
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-smooth disabled:opacity-50"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-4 mb-4 pr-6">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0 mt-0.5"
            style={getIconBg()}
          >
            {getIcon()}
          </div>
          <div>
            <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
              {title}
            </h3>
            <p className="text-xs mt-1 leading-relaxed font-medium" style={{ color: "var(--text-secondary)" }}>
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="btn-ghost py-2 px-4 text-xs font-semibold"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-smooth disabled:opacity-50 ${getConfirmButtonClasses()}`}
          >
            {loading ? (
              <>
                <Loader2 size={13} className="animate-spin" /> Processing...
              </>
            ) : (
              <>
                {variant === "danger" && <Trash2 size={13} />}
                {confirmText}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
