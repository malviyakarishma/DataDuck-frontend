"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Database, MessageSquare, Plus, Settings, LogOut, ChevronRight,
  Server, BarChart3, Loader2, Clock, Trash2
} from "lucide-react";
import { authApi, databasesApi, chatApi, getCurrentUserName, ensureAuthenticated, getApiErrorMessage } from "@/lib/api";
import { type DatabaseConnection, type Conversation, getConnectionBadge } from "@/lib/types";
import AddConnectionModal from "@/components/ui/AddConnectionModal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/Toast";
import ThemeToggle from "@/components/ui/ThemeToggle";

const SUGGESTED_QUESTIONS = [
  "Analyze my database and give me an overview.",
  "Which tables or collections have the most records?",
  "Check data quality, nulls, and missing values.",
  "Show the schema relationships and structure.",
  "Show sample records from the primary tables.",
  "What collections or tables exist in this database?",
];

function dedupeConversations(list: Conversation[]): Conversation[] {
  const seen = new Set<string>();
  return list.filter((c) => {
    if (!c.id || seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });
}

export default function DashboardPage() {
  const router = useRouter();
  const toast = useToast();
  const [databases, setDatabases] = useState<DatabaseConnection[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [userName, setUserName] = useState("there");
  const [deleteConvTarget, setDeleteConvTarget] = useState<Conversation | null>(null);
  const [deletingConv, setDeletingConv] = useState(false);

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
      setConversations(dedupeConversations(convData.conversations));
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
        {/* Logo & Theme Toggle */}
        <div className="flex items-center justify-between px-2 py-3 mb-4">
          <Link href="/dashboard" className="flex items-center gap-2 group cursor-pointer">
            <img src="/duck.png" alt="DataDuck Logo" className="w-9 h-9 object-contain transition-transform group-hover:scale-105" />
            <div className="flex flex-col justify-center">
              <span className="font-bold text-lg leading-none" style={{ color: "var(--text-primary)" }}>DataDuck</span>
              <span className="text-[10px] tracking-wider uppercase font-semibold mt-0.5" style={{ color: "var(--text-muted)" }}>
                Doubt. Dig. Discover.
              </span>
            </div>
          </Link>
          <ThemeToggle size="sm" />
        </div>

        {/* New Chat */}
        {firstDb && (
          <button
            onClick={() => handleStartChat(firstDb.id)}
            className="btn-primary w-full flex items-center gap-2 justify-center py-2.5 mb-4 text-sm font-semibold shadow-sm"
          >
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
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-smooth"
              style={{
                background: item.active ? "var(--accent-emerald-pale)" : "transparent",
                color: item.active ? "var(--accent-emerald-dark)" : "var(--text-secondary)",
                border: item.active ? "1px solid var(--accent-emerald-border)" : "1px solid transparent",
              }}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Recent conversations */}
        {conversations.length > 0 && (
          <div className="mt-4 mb-4">
            <p className="text-xs px-3 mb-2 uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>
              Recent
            </p>
            {conversations.slice(0, 5).map((conv) => (
              <div
                key={conv.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg transition-smooth group hover:bg-[var(--bg-card-hover)]"
                style={{ color: "var(--text-secondary)" }}
              >
                <Link href={`/chat?conversation=${conv.id}`} className="flex items-center gap-2 min-w-0 flex-1">
                  <MessageSquare size={13} className="flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                  <span className="text-xs truncate">{conv.title}</span>
                </Link>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDeleteConvTarget(conv);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-red-500 rounded transition-smooth ml-1"
                  title="Delete conversation"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-smooth w-full hover:text-red-600 hover:bg-red-500/10"
          style={{ color: "var(--text-muted)" }}
        >
          <LogOut size={16} /> Logout
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto" style={{ background: "var(--bg-void)" }}>
        <div className="max-w-4xl mx-auto px-8 py-10">
          {/* Welcome */}
          <div className="mb-10">
            <h1 className="text-3xl font-extrabold mb-2 tracking-tight" style={{ color: "var(--text-primary)" }}>
              Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},{" "}
              <span style={{ color: "var(--accent-emerald)" }}>{userName.split(" ")[0]}</span>.
            </h1>
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              What would you like to analyze today?
            </p>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <Loader2 size={32} className="animate-spin mx-auto mb-4" style={{ color: "var(--accent-emerald)" }} />
            </div>
          ) : (
            <>
              {/* Database status */}
              {databases.length === 0 ? (
                <div className="card-luxury p-8 mb-8 text-center border shadow-md">
                  <Server size={36} className="mx-auto mb-4" style={{ color: "var(--text-muted)" }} />
                  <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>No database connected</h2>
                  <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: "var(--text-secondary)" }}>
                    Connect your PostgreSQL, MySQL, SQLite, or MongoDB database to start querying.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    <Plus size={18} /> Connect Database
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {databases.slice(0, 4).map((db) => (
                    <div
                      key={db.id}
                      className="card-glass p-5 cursor-pointer animate-fade-in border shadow-sm hover:border-[var(--accent-emerald-border)]"
                      onClick={() => handleStartChat(db.id)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold border"
                            style={{
                              background: "var(--accent-emerald-pale)",
                              borderColor: "var(--accent-emerald-border)",
                              color: "var(--accent-emerald-dark)",
                            }}
                          >
                            {getConnectionBadge(db.name)}
                          </div>
                          <div>
                            <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{db.name}</p>
                            <p className="text-xs capitalize font-medium" style={{ color: "var(--text-secondary)" }}>{db.db_type}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ background: db.is_connected ? "var(--accent-emerald)" : "var(--error-red)" }}
                          />
                          <span
                            className="text-xs font-semibold"
                            style={{ color: db.is_connected ? "var(--accent-emerald)" : "var(--error-red)" }}
                          >
                            {db.is_connected ? "Online" : "Offline"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                        <p className="text-xs font-mono truncate max-w-[200px]" style={{ color: "var(--text-muted)" }}>
                          {db.database_name ? `DB: ${db.database_name}` : db.host || ""}
                        </p>
                        <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />
                      </div>
                    </div>
                  ))}
                  {databases.length < 4 && (
                    <button
                      type="button"
                      onClick={() => setShowAddModal(true)}
                      className="card-glass p-5 flex items-center justify-center gap-2 animate-fade-in transition-smooth hover:border-[var(--accent-emerald)] group cursor-pointer text-left w-full border-dashed"
                      style={{ borderColor: "var(--border-dim)" }}
                    >
                      <Plus size={16} style={{ color: "var(--accent-emerald)" }} />
                      <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Add Another Database</span>
                    </button>
                  )}
                </div>
              )}

              {/* Suggested questions */}
              {databases.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xs font-bold mb-4 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    Suggested Questions
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {SUGGESTED_QUESTIONS.map((q, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-xl text-sm animate-fade-in border shadow-sm select-text"
                        style={{
                          background: "var(--bg-card)",
                          borderColor: "var(--border-subtle)",
                          color: "var(--text-secondary)",
                          cursor: "default",
                          animationDelay: `${i * 0.04}s`,
                        }}
                      >
                        "{q}"
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent conversations */}
              {conversations.length > 0 && (
                <div>
                  <h2 className="text-xs font-bold mb-4 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    Recent Conversations
                  </h2>
                  <div className="space-y-2.5">
                    {conversations.slice(0, 5).map((conv) => (
                      <Link
                        key={conv.id}
                        href={`/chat?conversation=${conv.id}`}
                        className="flex items-center justify-between p-4 rounded-xl transition-smooth animate-fade-in border shadow-sm hover:border-[var(--border-dim)] hover:bg-[var(--bg-card-hover)]"
                        style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center border"
                            style={{ background: "var(--bg-card-raised)", borderColor: "var(--border-subtle)" }}
                          >
                            <MessageSquare size={15} style={{ color: "var(--accent-emerald)" }} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{conv.title}</p>
                            <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                              {conv.database_name} · {conv.message_count} messages
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={12} style={{ color: "var(--text-muted)" }} />
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
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

      {showAddModal && (
        <AddConnectionModal
          onClose={() => setShowAddModal(false)}
          onAdded={(conn) => {
            setDatabases((prev) => [conn, ...prev]);
            setShowAddModal(false);
            toast.success("Database connected", `Successfully connected to "${conn.name}"`);
          }}
        />
      )}

      {/* Delete Conversation Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConvTarget}
        onClose={() => {
          if (!deletingConv) setDeleteConvTarget(null);
        }}
        onConfirm={async () => {
          if (!deleteConvTarget) return;
          setDeletingConv(true);
          try {
            await chatApi.deleteConversation(deleteConvTarget.id);
            setConversations((prev) => prev.filter((c) => c.id !== deleteConvTarget.id));
            toast.success("Conversation deleted", `Deleted "${deleteConvTarget.title}"`);
            setDeleteConvTarget(null);
          } catch (err) {
            toast.error("Failed to delete conversation", getApiErrorMessage(err));
          } finally {
            setDeletingConv(false);
          }
        }}
        title={deleteConvTarget ? `Delete "${deleteConvTarget.title}"?` : "Delete Conversation?"}
        description="Are you sure you want to delete this conversation? This action cannot be undone."
        confirmText="Delete Conversation"
        cancelText="Cancel"
        variant="danger"
        loading={deletingConv}
      />
    </div>
  );
}
