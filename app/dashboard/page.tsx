"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Database, MessageSquare, Plus, Settings, LogOut, ChevronRight,
  Server, BarChart3, Loader2, Clock
} from "lucide-react";
import { authApi, databasesApi, chatApi, getApiErrorMessage, getCurrentUserName, isAuthenticated, ensureAuthenticated } from "@/lib/api";
import type { DatabaseConnection, Conversation } from "@/lib/types";

const SUGGESTED_QUESTIONS = [
  "Analyze my database and give me an overview.",
  "Which tables have the most missing values?",
  "Show me the largest tables by row count.",
  "What are the recent trends in my data?",
  "Find any duplicate records.",
  "Show the schema relationships between tables.",
];

export default function DashboardPage() {
  const router = useRouter();
  const [databases, setDatabases] = useState<DatabaseConnection[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("there");

  useEffect(() => {
    const initAuth = async () => {
      const isAuth = await ensureAuthenticated();
      if (!isAuth) {
        router.push("/login");
        return;
      }
      setUserName(getCurrentUserName() || "there");
      loadData();
    };
    initAuth();
  }, []);

  const loadData = async () => {
    try {
      const [dbData, convData] = await Promise.all([
        databasesApi.listDatabases(),
        chatApi.listConversations(),
      ]);
      setDatabases(dbData.databases);
      setConversations(convData.conversations);
    } catch {
      // Handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await authApi.logout();
    router.push("/");
  };

  const handleStartChat = (dbId: string, question?: string) => {
    const url = question
      ? `/chat?db=${dbId}&q=${encodeURIComponent(question)}`
      : `/chat?db=${dbId}`;
    router.push(url);
  };

  const firstDb = databases[0];

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-void)" }}>
      {/* Sidebar */}
      <div className="sidebar w-64 flex flex-col p-4 flex-shrink-0">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 px-2 py-3 mb-6 group">
          <img src="/duck.png" alt="DataDuck Logo" className="w-10 h-10 object-contain transition-transform group-hover:scale-105" />
          <div className="flex flex-col justify-center">
            <span className="font-bold text-lg text-gradient-silver leading-none">DataDuck</span>
            <span className="text-[10px] tracking-wider uppercase font-semibold text-gray-400 mt-0.5">Ask. Dig. Discover.</span>
          </div>
        </Link>

        {/* New Chat */}
        {firstDb && (
          <button onClick={() => handleStartChat(firstDb.id)}
            className="btn-primary w-full flex items-center gap-2 justify-center py-2.5 mb-4 text-sm">
            <Plus size={16} /> New Chat
          </button>
        )}

        {/* Nav */}
        <nav className="flex-1 space-y-1">
          {[
            { icon: <BarChart3 size={16} />, label: "Dashboard", href: "/dashboard", active: true },
            { icon: <MessageSquare size={16} />, label: "Conversations", href: "/chat" },
            { icon: <Database size={16} />, label: "Databases", href: "/databases" },
            { icon: <Settings size={16} />, label: "Settings", href: "/settings" },
          ].map((item) => (
            <Link key={item.label} href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-smooth"
              style={{
                background: item.active ? "rgba(255,255,255,0.08)" : "transparent",
                color: item.active ? "#C7C7C7" : "#6B6B6B",
                border: item.active ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
              }}>
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Recent conversations */}
        {conversations.length > 0 && (
          <div className="mt-4 mb-4">
            <p className="text-xs px-3 mb-2 uppercase tracking-wider" style={{ color: "#4A4A4A" }}>Recent</p>
            {conversations.slice(0, 4).map((conv) => (
              <Link key={conv.id} href={`/chat?conversation=${conv.id}`}
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-smooth group"
                style={{ color: "#4A4A4A" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  e.currentTarget.style.color = "#8A8A8A";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#4A4A4A";
                }}>
                <MessageSquare size={13} className="flex-shrink-0" />
                <span className="text-xs truncate">{conv.title}</span>
              </Link>
            ))}
          </div>
        )}

        {/* Logout */}
        <button onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-smooth w-full"
          style={{ color: "#4A4A4A" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#EF4444"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#4A4A4A"; }}>
          <LogOut size={16} /> Logout
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-10">
          {/* Welcome */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold mb-2">
              Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},{" "}
              <span className="text-gradient-silver">{userName.split(" ")[0]}</span>.
            </h1>
            <p className="text-sm" style={{ color: "#6B6B6B" }}>
              What would you like to analyze today?
            </p>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <Loader2 size={32} className="animate-spin mx-auto mb-4" style={{ color: "#4A4A4A" }} />
            </div>
          ) : (
            <>
              {/* Database status */}
              {databases.length === 0 ? (
                <div className="card-luxury p-8 mb-8 text-center">
                  <Server size={32} className="mx-auto mb-4" style={{ color: "#4A4A4A" }} />
                  <h2 className="text-xl font-bold mb-2" style={{ color: "#E5E7EB" }}>No database connected</h2>
                  <p className="text-sm mb-6" style={{ color: "#6B6B6B" }}>
                    Connect your first database to start asking questions.
                  </p>
                  <Link href="/databases" className="btn-primary inline-flex items-center gap-2">
                    <Plus size={18} /> Connect Database
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {databases.slice(0, 4).map((db) => (
                    <div key={db.id} className="card-glass p-5 cursor-pointer animate-fade-in"
                      onClick={() => handleStartChat(db.id)}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold"
                            style={{ background: "rgba(255,255,255,0.05)", color: "#C7C7C7" }}>
                            {db.db_type.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: "#E5E7EB" }}>{db.name}</p>
                            <p className="text-xs capitalize" style={{ color: "#6B6B6B" }}>{db.db_type}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full"
                            style={{ background: db.is_connected ? "#22C55E" : "#EF4444" }} />
                          <span className="text-xs" style={{ color: db.is_connected ? "#86EFAC" : "#FCA5A5" }}>
                            {db.is_connected ? "Online" : "Offline"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs" style={{ color: "#4A4A4A" }}>
                          {db.database_name ? `Database: ${db.database_name}` : db.host || ""}
                        </p>
                        <ChevronRight size={14} style={{ color: "#4A4A4A" }} />
                      </div>
                    </div>
                  ))}
                  {databases.length < 4 && (
                    <Link href="/databases"
                      className="card-glass p-5 flex items-center justify-center gap-2 animate-fade-in"
                      style={{ border: "1px dashed rgba(255,255,255,0.08)" }}>
                      <Plus size={16} style={{ color: "#4A4A4A" }} />
                      <span className="text-sm" style={{ color: "#4A4A4A" }}>Add Database</span>
                    </Link>
                  )}
                </div>
              )}

              {/* Suggested questions */}
              {databases.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: "#4A4A4A" }}>
                    Suggested Questions
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {SUGGESTED_QUESTIONS.map((q, i) => (
                      <button key={i}
                        onClick={() => handleStartChat(firstDb!.id, q)}
                        className="text-left p-4 rounded-xl transition-smooth text-sm animate-fade-in"
                        style={{
                          background: "rgba(255,255,255,0.02)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          color: "#6B6B6B",
                          animationDelay: `${i * 0.05}s`,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                          e.currentTarget.style.color = "#AFAFAF";
                          e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                          e.currentTarget.style.color = "#6B6B6B";
                          e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                        }}>
                        "{q}"
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent conversations */}
              {conversations.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: "#4A4A4A" }}>
                    Recent Conversations
                  </h2>
                  <div className="space-y-2">
                    {conversations.slice(0, 5).map((conv) => (
                      <Link key={conv.id} href={`/chat?conversation=${conv.id}`}
                        className="flex items-center justify-between p-4 rounded-xl transition-smooth animate-fade-in"
                        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                          e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                          e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
                        }}>
                        <div className="flex items-center gap-3">
                          <MessageSquare size={16} style={{ color: "#4A4A4A" }} />
                          <div>
                            <p className="text-sm" style={{ color: "#C7C7C7" }}>{conv.title}</p>
                            <p className="text-xs" style={{ color: "#4A4A4A" }}>
                              {conv.database_name} · {conv.message_count} messages
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={12} style={{ color: "#4A4A4A" }} />
                          <span className="text-xs" style={{ color: "#4A4A4A" }}>
                            {new Date(conv.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
