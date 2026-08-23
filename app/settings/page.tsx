"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Database, ArrowLeft, User, Lock, Trash2 } from "lucide-react";
import { authApi, isAuthenticated, getCurrentUserName } from "@/lib/api";

export default function SettingsPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    setUserName(getCurrentUserName());
    if (typeof window !== "undefined") {
      setEmail(localStorage.getItem("user_email") || "");
    }
  }, []);

  const handleLogout = async () => {
    await authApi.logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-void)" }}>
      <div className="navbar px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="flex items-center gap-1.5 transition-smooth" style={{ color: "#6B6B6B" }}>
          <ArrowLeft size={16} /> <span className="text-sm">Dashboard</span>
        </Link>
        <div className="w-px h-5" style={{ background: "rgba(255,255,255,0.08)" }} />
        <span className="font-semibold" style={{ color: "#E5E7EB" }}>Settings</span>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
        {/* Profile */}
        <div className="card-luxury p-6">
          <h2 className="text-lg font-semibold mb-5 flex items-center gap-2" style={{ color: "#E5E7EB" }}>
            <User size={18} style={{ color: "#C7C7C7" }} /> Profile
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1" style={{ color: "#6B6B6B" }}>Full Name</label>
              <div className="input-dark opacity-70 cursor-not-allowed">{userName}</div>
            </div>
            <div>
              <label className="block text-sm mb-1" style={{ color: "#6B6B6B" }}>Email</label>
              <div className="input-dark opacity-70 cursor-not-allowed">{email}</div>
            </div>
            <p className="text-xs" style={{ color: "#4A4A4A" }}>Profile editing coming soon.</p>
          </div>
        </div>

        {/* Security */}
        <div className="card-luxury p-6">
          <h2 className="text-lg font-semibold mb-5 flex items-center gap-2" style={{ color: "#E5E7EB" }}>
            <Lock size={18} style={{ color: "#C7C7C7" }} /> Security
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 px-4 rounded-xl"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div>
                <p className="text-sm font-medium" style={{ color: "#C7C7C7" }}>Password</p>
                <p className="text-xs" style={{ color: "#6B6B6B" }}>Change your account password</p>
              </div>
              <button className="btn-ghost text-sm py-1.5 px-4 opacity-50 cursor-not-allowed">Change</button>
            </div>
            <div className="flex items-center justify-between py-3 px-4 rounded-xl"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div>
                <p className="text-sm font-medium" style={{ color: "#C7C7C7" }}>Sessions</p>
                <p className="text-xs" style={{ color: "#6B6B6B" }}>Manage active sessions</p>
              </div>
              <button onClick={handleLogout} className="btn-ghost text-sm py-1.5 px-4" style={{ color: "#FCA5A5" }}>
                Log out all
              </button>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="card-luxury p-6">
          <div className="flex items-center gap-2 mb-4">
            <img src="/duck.png" alt="DataDuck Logo" className="w-10 h-10 object-contain" />
            <div className="flex flex-col justify-center">
              <h2 className="text-base font-semibold uppercase tracking-wider leading-none" style={{ color: "#E5E7EB" }}>About DataDuck</h2>
              <span className="text-[10px] uppercase font-medium tracking-widest text-gray-500 mt-0.5 block">Ask. Dig. Discover.</span>
            </div>
          </div>
          <div className="space-y-2 text-sm" style={{ color: "#6B6B6B" }}>
            <p>Version: 1.0.0</p>
            <p>All database connections are encrypted at rest using Fernet symmetric encryption.</p>
            <p>Your database credentials are never sent to the AI model.</p>
            <p>All queries are validated as read-only before execution.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
