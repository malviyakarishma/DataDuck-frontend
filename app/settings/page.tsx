"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Lock, ShieldCheck } from "lucide-react";
import { authApi, ensureAuthenticated, getCurrentUserName } from "@/lib/api";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function SettingsPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const initAuth = async () => {
      const isAuth = await ensureAuthenticated();
      if (!isAuth) {
        router.push("/login");
        return;
      }
      setUserName(getCurrentUserName());
      if (typeof window !== "undefined") {
        setEmail(localStorage.getItem("user_email") || "");
      }
    };
    initAuth();
  }, []);

  const handleLogout = async () => {
    await authApi.logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-void)" }}>
      {/* Header */}
      <div className="navbar px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-1.5 transition-smooth text-sm font-medium hover:opacity-80" style={{ color: "var(--text-secondary)" }}>
            <ArrowLeft size={16} /> <span>Dashboard</span>
          </Link>
          <div className="w-px h-5" style={{ background: "var(--border-subtle)" }} />
          <span className="font-bold" style={{ color: "var(--text-primary)" }}>Settings</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
        {/* Profile Card */}
        <div className="card-luxury p-6 border shadow-sm">
          <h2 className="text-base font-bold mb-5 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <User size={18} style={{ color: "var(--accent-emerald)" }} /> Profile
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>Full Name</label>
              <div className="input-dark opacity-80 cursor-not-allowed font-medium">{userName || "User"}</div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>Email</label>
              <div className="input-dark opacity-80 cursor-not-allowed font-medium">{email || "account@dataduck.internal"}</div>
            </div>
            <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Profile editing coming in next release.</p>
          </div>
        </div>

        {/* Security Card */}
        <div className="card-luxury p-6 border shadow-sm">
          <h2 className="text-base font-bold mb-5 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Lock size={18} style={{ color: "var(--accent-emerald)" }} /> Security & Access
          </h2>
          <div className="space-y-3">
            <div
              className="flex items-center justify-between py-3 px-4 rounded-xl border"
              style={{ background: "var(--bg-card-raised)", borderColor: "var(--border-subtle)" }}
            >
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Password</p>
                <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Change your account password</p>
              </div>
              <button className="btn-ghost text-xs py-1.5 px-3 opacity-50 cursor-not-allowed">Change</button>
            </div>
            <div
              className="flex items-center justify-between py-3 px-4 rounded-xl border"
              style={{ background: "var(--bg-card-raised)", borderColor: "var(--border-subtle)" }}
            >
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Sessions</p>
                <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Manage active sessions across devices</p>
              </div>
              <button
                onClick={handleLogout}
                className="btn-ghost text-xs py-1.5 px-3 font-semibold text-red-500 hover:text-red-600 hover:bg-red-500/10 border-transparent"
              >
                Log out all
              </button>
            </div>
          </div>
        </div>

        {/* About Card */}
        <div className="card-luxury p-6 border shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <img src="/duck.png" alt="DataDuck Logo" className="w-10 h-10 object-contain" />
            <div className="flex flex-col justify-center">
              <h2 className="text-base font-bold leading-none" style={{ color: "var(--text-primary)" }}>About DataDuck</h2>
              <span className="text-[10px] uppercase font-bold tracking-wider mt-1 block" style={{ color: "var(--accent-emerald)" }}>
                Doubt. Dig. Discover.
              </span>
            </div>
          </div>
          <div className="space-y-2 text-xs font-medium leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            <p>Version: <span className="font-mono font-semibold" style={{ color: "var(--text-primary)" }}>1.0.0 Pearl Platinum</span></p>
            <p>• All database connection strings are encrypted at rest using AES-256 Fernet keys.</p>
            <p>• Database credentials are never transmitted to LLM model providers.</p>
            <p>• All query execution requests are pre-validated by AST analyzers for strict read-only compliance.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
