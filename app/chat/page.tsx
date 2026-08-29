"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Database, MessageSquare, Plus, Settings, LogOut, Send, Loader2,
  ChevronDown, ChevronUp, BarChart3, AlertTriangle, Info, Zap, Code2, X, Trash2, Check
} from "lucide-react";
import { chatApi, databasesApi, authApi, isAuthenticated, ensureAuthenticated, getCurrentUserName } from "@/lib/api";
import type { ChatMessage, Conversation, DatabaseConnection, LoadingStage } from "@/lib/types";
import DataVisualization from "@/components/charts/DataVisualization";
import DataTable from "@/components/ui/DataTable";
import MermaidDiagram from "@/components/ui/MermaidDiagram";
import SchemaExplorerModal from "@/components/ui/SchemaExplorerModal";

const STAGE_LABELS: Record<NonNullable<LoadingStage>, string> = {
  understanding: "Understanding question...",
  "retrieving-schema": "Finding relevant tables...",
  "generating-query": "Generating safe query...",
  validating: "Validating query...",
  executing: "Executing query...",
  analyzing: "Analyzing results...",
  visualizing: "Creating visualization...",
};

function LoadingIndicator({ stage }: { stage: LoadingStage }) {
  if (!stage) return null;
  return (
    <div className="flex items-center gap-3 px-5 py-3 animate-fade-in"
      style={{ background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="loading-dots">
        {[0, 1, 2].map((i) => (
          <div key={i} className="loading-dot" style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
      <span className="text-sm" style={{ color: "#6B6B6B" }}>{STAGE_LABELS[stage]}</span>
    </div>
  );
}

function QueryBlock({ query }: { query: { display: boolean; language: string; content: string } }) {
  const [open, setOpen] = useState(false);
  if (!query.display || !query.content) return null;
  return (
    <div className="mt-3">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs transition-smooth py-1"
        style={{ color: "#4A4A4A" }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "#8A8A8A"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "#4A4A4A"; }}>
        <Code2 size={12} />
        {open ? "Hide" : "View"} generated {query.language.toUpperCase()} query
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {open && (
        <div className="mt-2 animate-fade-in">
          <pre className="code-block">{query.content}</pre>
        </div>
      )}
    </div>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end mb-4 animate-fade-in">
        <div className="chat-bubble-user px-5 py-4 max-w-2xl">
          <p className="text-sm" style={{ color: "#C7C7C7" }}>{msg.answer}</p>
        </div>
      </div>
    );
  }

  // Assistant message
  const hasResult = msg.result && msg.result.rows && msg.result.rows.length > 0;
  const isErDiagram = msg.visualization?.type === "er_diagram" || Boolean(msg.visualization?.mermaid);
  const hasViz = msg.visualization?.required && msg.result?.rows && msg.result.rows.length > 0;
  const showTable = hasResult && !hasViz && !isErDiagram;

  // Check if answer contains mermaid code
  const mermaidMatch = msg.answer ? msg.answer.match(/```mermaid\s*([\s\S]*?)```/i) : null;
  const rawMermaid = msg.visualization?.mermaid || (isErDiagram ? (msg.visualization?.value_key || "") : "") || (mermaidMatch ? mermaidMatch[1].trim() : "");
  const cleanAnswer = mermaidMatch ? msg.answer.replace(/```mermaid\s*[\s\S]*?```/i, "").trim() : msg.answer;

  const getIntentBadge = () => {
    if (!msg.intent) return null;
    switch (msg.intent) {
      case "SCHEMA_EXPLORATION":
        return <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-950/40 border border-blue-800/40 text-blue-300">SCHEMA</span>;
      case "WRITE_REQUEST":
        return <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-950/40 border border-red-800/40 text-red-300">READ-ONLY ENFORCED</span>;
      case "CASUAL_CHAT":
        return <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400">CHAT</span>;
      default:
        return null;
    }
  };

  return (
    <div className="flex justify-start mb-6 animate-fade-in">
      <div className="w-full max-w-3xl space-y-4">
        {/* Main answer bubble */}
        <div className="chat-bubble-ai px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 overflow-hidden"
              style={{ background: "rgba(255,255,255,0.08)" }}>
              <img src="/duck.png" alt="DataDuck Logo" className="w-4 h-4 object-contain" />
            </div>
            <span className="text-xs font-semibold" style={{ color: "#4A4A4A" }}>DATADUCK ANALYST</span>
            {getIntentBadge()}
            {msg.result?.execution_time_ms && (
              <span className="text-xs ml-auto" style={{ color: "#2A2A2A" }}>
                {msg.result.execution_time_ms.toFixed(0)}ms
              </span>
            )}
          </div>

          {cleanAnswer && (
            <div className="text-sm leading-relaxed mb-3 whitespace-pre-wrap" style={{ color: "#C7C7C7" }}>
              {cleanAnswer}
            </div>
          )}

          {/* Insights */}
          {msg.insights && msg.insights.length > 0 && (
            <div className="space-y-1.5 mt-3">
              {msg.insights.map((insight, i) => (
                <div key={i} className="insight-box">
                  {insight}
                </div>
              ))}
            </div>
          )}

          {/* Warnings */}
          {msg.warnings && msg.warnings.length > 0 && (
            <div className="space-y-1.5 mt-3">
              {msg.warnings.map((w, i) => (
                <div key={i} className="warning-box flex items-start gap-2">
                  <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}

          <QueryBlock query={msg.query || { display: false, language: "sql", content: "" }} />
        </div>

        {/* Visual ER Diagram */}
        {rawMermaid && (
          <div className="animate-scale-in">
            <MermaidDiagram
              chart={rawMermaid}
              title={msg.visualization?.title || "Database Entity-Relationship Diagram"}
            />
          </div>
        )}

        {/* Visualization */}
        {hasViz && msg.visualization && msg.result && !isErDiagram && (
          <div className="animate-scale-in" style={{
            background: "rgba(255,255,255,0.015)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16,
            padding: "1.5rem",
          }}>
            <DataVisualization
              spec={msg.visualization}
              data={msg.result.rows as Record<string, unknown>[]}
            />
            {msg.result.truncated && (
              <p className="text-xs mt-2" style={{ color: "#4A4A4A" }}>
                ⚠ Results truncated at {msg.result.rows.length.toLocaleString()} rows
              </p>
            )}
          </div>
        )}

        {/* Table (when no viz and not ER diagram) */}
        {showTable && msg.result && (
          <div className="animate-scale-in" style={{
            background: "rgba(255,255,255,0.015)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16,
            padding: "1rem",
          }}>
            <DataTable
              columns={msg.result.columns}
              rows={msg.result.rows as Record<string, unknown>[]}
              truncated={msg.result.truncated}
              rowCount={msg.result.row_count}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dbId = searchParams.get("db");
  const conversationId = searchParams.get("conversation");
  const prefilledQ = searchParams.get("q");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [databases, setDatabases] = useState<DatabaseConnection[]>([]);
  const [selectedDb, setSelectedDb] = useState<DatabaseConnection | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [input, setInput] = useState(prefilledQ || "");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<LoadingStage>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);
  const [userName, setUserName] = useState("there");
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: "single" | "all";
    conversationId?: string;
    title?: string;
  }>({ isOpen: false, type: "single" });
  const [deleting, setDeleting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const initAuth = async () => {
      const isAuth = await ensureAuthenticated();
      if (!isAuth) {
        router.push("/login");
        return;
      }
      setUserName(getCurrentUserName().split(" ")[0] || "there");
      loadSidebarData();
    };
    initAuth();
  }, []);

  useEffect(() => {
    if (dbId) loadDatabase(dbId);
    else if (conversationId) loadConversation(conversationId);
  }, [dbId, conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-send prefilled question
  useEffect(() => {
    if (prefilledQ && selectedDb && messages.length === 0) {
      setTimeout(() => handleSend(prefilledQ), 500);
    }
  }, [selectedDb]);

  const loadSidebarData = async () => {
    try {
      const [dbData, convData] = await Promise.all([
        databasesApi.listDatabases(),
        chatApi.listConversations(),
      ]);
      setDatabases(dbData.databases);
      setConversations(convData.conversations);
      if (!dbId && !conversationId && dbData.databases.length > 0) {
        setSelectedDb(dbData.databases[0]);
      }
    } catch { /* handled by interceptor */ }
  };

  const loadDatabase = async (id: string) => {
    try {
      const db = await databasesApi.getDatabase(id);
      setSelectedDb(db);
    } catch { /* */ }
  };

  const loadConversation = async (id: string) => {
    setLoadingHistory(true);
    try {
      const [db, msgData] = await Promise.all([
        chatApi.listConversations(),
        chatApi.getMessages(id),
      ]);
      setConversations(db.conversations);
      setCurrentConversationId(id);

      // Find the database for this conversation
      const conv = db.conversations.find((c) => c.id === id);
      if (conv) {
        const dbConn = await databasesApi.getDatabase(conv.database_id);
        setSelectedDb(dbConn);
      }

      setMessages(msgData.messages);
    } catch { /* */ } finally {
      setLoadingHistory(false);
    }
  };

  const openDeleteSingleModal = (convId: string, title: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeleteModal({
      isOpen: true,
      type: "single",
      conversationId: convId,
      title: title || "this conversation",
    });
  };

  const openDeleteAllModal = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeleteModal({
      isOpen: true,
      type: "all",
    });
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      if (deleteModal.type === "single" && deleteModal.conversationId) {
        await chatApi.deleteConversation(deleteModal.conversationId);
        setConversations((prev) => prev.filter((c) => c.id !== deleteModal.conversationId));
        if (currentConversationId === deleteModal.conversationId) {
          handleNewChat();
        }
      } else if (deleteModal.type === "all") {
        await chatApi.deleteAllConversations(selectedDb?.id);
        setConversations([]);
        handleNewChat();
      }
    } catch (err) {
      console.error("Failed to delete conversation(s):", err);
    } finally {
      setDeleting(false);
      setDeleteModal({ isOpen: false, type: "single" });
    }
  };

  const handleSend = async (overrideMessage?: string) => {
    const message = (overrideMessage || input).trim();
    if (!message || !selectedDb || loading) return;

    if (!overrideMessage) setInput("");

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      answer: message,
      insights: [],
      warnings: [],
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    // Simulate stages
    const stages: LoadingStage[] = [
      "understanding", "retrieving-schema", "generating-query",
      "validating", "executing", "analyzing", "visualizing"
    ];
    let si = 0;
    setStage(stages[si]);
    const stageInterval = setInterval(() => {
      si = Math.min(si + 1, stages.length - 1);
      setStage(stages[si]);
    }, 1800);

    try {
      const response = await chatApi.sendMessage({
        database_id: selectedDb.id,
        conversation_id: currentConversationId || undefined,
        message,
      });

      clearInterval(stageInterval);
      setStage(null);
      setCurrentConversationId(response.conversation_id);

      // Update conversations list
      const conv: Conversation = {
        id: response.conversation_id,
        title: response.conversation_title,
        database_id: selectedDb.id,
        database_name: selectedDb.name,
        message_count: (messages.length + 2),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setConversations((prev) => {
        const exists = prev.some((c) => c.id === conv.id);
        return exists ? prev.map((c) => c.id === conv.id ? conv : c) : [conv, ...prev];
      });

      setMessages((prev) => [...prev, response.message]);
    } catch (err: unknown) {
      clearInterval(stageInterval);
      setStage(null);
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        answer: (err as { response?: { data?: { error?: string } } })?.response?.data?.error
          || "Something went wrong. Please try again.",
        insights: [],
        warnings: [],
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setInput("");
    if (selectedDb) router.push(`/chat?db=${selectedDb.id}`);
  };

  const handleLogout = async () => {
    await authApi.logout();
    router.push("/");
  };

  const emptyState = messages.length === 0 && !loadingHistory;

  return (
    <div className="h-screen w-screen overflow-hidden flex" style={{ background: "var(--bg-void)" }}>
      {/* Sidebar */}
      <div className="sidebar w-64 h-full flex flex-col p-4 flex-shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2 px-2 py-3 mb-4 group">
          <img src="/duck.png" alt="DataDuck Logo" className="w-10 h-10 object-contain transition-transform group-hover:scale-105" />
          <div className="flex flex-col justify-center">
            <span className="font-bold text-lg text-gradient-silver leading-none">DataDuck</span>
            <span className="text-[10px] tracking-wider uppercase font-semibold text-gray-400 mt-0.5">Ask. Dig. Discover.</span>
          </div>
        </Link>

        <button onClick={handleNewChat}
          className="btn-primary w-full flex items-center gap-2 justify-center py-2.5 mb-5 text-sm">
          <Plus size={16} /> New Chat
        </button>

        {/* Database selector */}
        {databases.length > 0 && (
          <div className="mb-5">
            <p className="text-xs px-1 mb-2 uppercase tracking-wider" style={{ color: "#4A4A4A" }}>Database</p>
            {databases.map((db) => (
              <button key={db.id} onClick={() => { setSelectedDb(db); setMessages([]); setCurrentConversationId(null); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-smooth mb-1"
                style={{
                  background: selectedDb?.id === db.id ? "rgba(255,255,255,0.08)" : "transparent",
                  color: selectedDb?.id === db.id ? "#C7C7C7" : "#6B6B6B",
                  border: selectedDb?.id === db.id ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
                }}>
                <div className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.05)", color: "#8A8A8A" }}>
                  {db.db_type.slice(0, 1).toUpperCase()}
                </div>
                <span className="truncate text-xs">{db.name}</span>
                <div className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: db.is_connected ? "#22C55E" : "#6B6B6B" }} />
              </button>
            ))}
            <Link href="/databases"
              className="flex items-center gap-2 px-3 py-2 text-xs transition-smooth mt-1"
              style={{ color: "#4A4A4A" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#6B6B6B"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#4A4A4A"; }}>
              <Plus size={12} /> Add database
            </Link>
          </div>
        )}

        {/* Nav */}
        <nav className="space-y-1 mb-4">
          {[
            { icon: <BarChart3 size={15} />, label: "Dashboard", href: "/dashboard" },
            { icon: <Database size={15} />, label: "Databases", href: "/databases" },
            { icon: <Settings size={15} />, label: "Settings", href: "/settings" },
          ].map((item) => (
            <Link key={item.label} href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-smooth"
              style={{ color: "#4A4A4A" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#8A8A8A"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#4A4A4A"; e.currentTarget.style.background = "transparent"; }}>
              {item.icon} {item.label}
            </Link>
          ))}
        </nav>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="flex items-center justify-between px-1 mb-2">
            <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: "#4A4A4A" }}>Conversations</p>
            {conversations.length > 0 && (
              <button
                onClick={openDeleteAllModal}
                className="text-[11px] text-neutral-500 hover:text-red-400 flex items-center gap-1 transition-smooth px-1.5 py-0.5 rounded hover:bg-red-500/10"
                title="Delete all conversations"
              >
                <Trash2 size={11} /> Clear all
              </button>
            )}
          </div>
          {conversations.length === 0 ? (
            <p className="text-xs px-2 py-3 text-neutral-600 italic">No conversations yet</p>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => loadConversation(conv.id)}
                className="group relative w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-smooth mb-1 cursor-pointer"
                style={{
                  background: currentConversationId === conv.id ? "rgba(255,255,255,0.06)" : "transparent",
                  color: currentConversationId === conv.id ? "#E2E8F0" : "#6B7280",
                  border: currentConversationId === conv.id ? "1px solid rgba(255,255,255,0.08)" : "1px solid transparent",
                }}
                onMouseEnter={(e) => {
                  if (currentConversationId !== conv.id) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                    e.currentTarget.style.color = "#94A3B8";
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentConversationId !== conv.id) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#6B7280";
                  }
                }}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1 mr-1">
                  <MessageSquare size={13} className="flex-shrink-0" />
                  <span className="text-xs truncate">{conv.title}</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => openDeleteSingleModal(conv.id, conv.title, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-smooth flex-shrink-0"
                  title="Delete conversation"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
        </div>

        <button onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-smooth mt-4"
          style={{ color: "#4A4A4A" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#EF4444"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#4A4A4A"; }}>
          <LogOut size={15} /> Logout
        </button>
      </div>

      {/* Chat main area */}
      <div className="flex-1 flex flex-col h-full min-h-0 min-w-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-3">
            {selectedDb ? (
              <>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#8A8A8A" }}>
                  {selectedDb.db_type.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#E5E7EB" }}>{selectedDb.name}</p>
                  <p className="text-xs capitalize" style={{ color: "#4A4A4A" }}>{selectedDb.db_type} · {selectedDb.database_name || selectedDb.host || "Connected"}</p>
                </div>
              </>
            ) : (
              <p className="text-sm" style={{ color: "#4A4A4A" }}>Select a database to begin</p>
            )}
          </div>
          {selectedDb && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSchemaModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-neutral-300 hover:text-white border border-neutral-800 hover:border-neutral-700 bg-neutral-900/60 hover:bg-neutral-800/80 transition-smooth shadow-sm"
                title="Open interactive Schema Explorer and ER diagram"
              >
                <Database size={13} className="text-emerald-400" />
                <span>Schema Explorer</span>
              </button>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 px-2.5 py-1 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Read-Only
              </div>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 min-h-0">
          {loadingHistory ? (
            <div className="text-center py-20">
              <Loader2 size={24} className="animate-spin mx-auto mb-3" style={{ color: "#4A4A4A" }} />
              <p className="text-sm" style={{ color: "#4A4A4A" }}>Loading conversation...</p>
            </div>
          ) : emptyState && selectedDb ? (
            <div className="max-w-2xl mx-auto text-center py-16">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <MessageSquare size={28} style={{ color: "#4A4A4A" }} />
              </div>
              <h2 className="text-xl font-bold mb-2 text-gradient-silver">Ask anything about your data</h2>
              <p className="text-sm mb-8" style={{ color: "#6B6B6B" }}>
                Connected to <strong style={{ color: "#AFAFAF" }}>{selectedDb.name}</strong>.
                Ask questions in plain English — query data, explore schemas, and generate ER diagrams.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                {[
                  "Explain my database schema",
                  "Show database ER diagram",
                  "What tables are in my database?",
                  "Show table relationships",
                  "What are the top 10 customers by revenue?",
                  "Are there any NULL values in my data?",
                ].map((q, i) => (
                  <button key={i} onClick={() => handleSend(q)}
                    className="text-xs sm:text-sm px-4 py-3 rounded-xl text-left transition-smooth"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      color: "#8A8A8A",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                      e.currentTarget.style.color = "#E5E7EB";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                      e.currentTarget.style.color = "#8A8A8A";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                    }}>
                    &quot;{q}&quot;
                  </button>
                ))}
              </div>
            </div>
          ) : emptyState && !selectedDb ? (
            <div className="text-center py-16">
              <Database size={32} className="mx-auto mb-4" style={{ color: "#2A2A2A" }} />
              <h2 className="text-xl font-bold mb-2" style={{ color: "#4A4A4A" }}>No database selected</h2>
              <Link href="/databases" className="btn-primary inline-flex items-center gap-2 mt-4">
                <Plus size={16} /> Connect a Database
              </Link>
            </div>
          ) : (
            messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)
          )}
          {stage && <LoadingIndicator stage={stage} />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {selectedDb && (
          <div className="px-6 pb-6 flex-shrink-0">
            <div className="max-w-4xl mx-auto">
              <div className="relative" style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 16,
              }}>
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything about your database, schema, or tables..."
                  disabled={loading}
                  className="w-full bg-transparent resize-none outline-none py-4 pl-5 pr-16 text-sm"
                  style={{
                    color: "#C7C7C7",
                    minHeight: "56px",
                    maxHeight: "200px",
                    overflowY: "auto",
                  }}
                />
                <button onClick={() => handleSend()}
                  disabled={!input.trim() || loading}
                  className="absolute right-3 bottom-3 w-9 h-9 rounded-xl flex items-center justify-center transition-smooth disabled:opacity-30"
                  style={{ background: "linear-gradient(135deg, #E5E7EB, #C7C7C7)" }}>
                  {loading
                    ? <Loader2 size={16} className="animate-spin" style={{ color: "#050505" }} />
                    : <Send size={16} style={{ color: "#050505" }} />}
                </button>
              </div>
              <p className="text-xs text-center mt-2" style={{ color: "#2A2A2A" }}>
                Read-only mode — DataDuck can never modify your data. Press ⏎ to send, Shift+⏎ for new line.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Schema Explorer Modal */}
      {selectedDb && (
        <SchemaExplorerModal
          databaseId={selectedDb.id}
          databaseName={selectedDb.name}
          isOpen={isSchemaModalOpen}
          onClose={() => setIsSchemaModalOpen(false)}
          onAskAboutTable={(tableName, prompt) => {
            handleSend(prompt || `Explain the ${tableName} table`);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-md p-6 rounded-2xl border shadow-2xl animate-scale-in"
            style={{
              background: "#111318",
              borderColor: "rgba(255, 255, 255, 0.1)",
            }}
          >
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-500/10 border border-red-500/20 text-red-400 flex-shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">
                  {deleteModal.type === "all" ? "Delete All Conversations?" : "Delete Conversation?"}
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                  {deleteModal.type === "all"
                    ? `This will permanently remove all ${conversations.length} conversation history entries. This action cannot be undone.`
                    : `Are you sure you want to delete "${deleteModal.title}"? This cannot be undone.`}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, type: "single" })}
                disabled={deleting}
                className="px-4 py-2 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800/60 hover:bg-neutral-800 rounded-xl border border-neutral-700/50 transition-smooth"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-xl shadow-lg shadow-red-950/50 transition-smooth disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={13} /> Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div style={{ background: "#050505", minHeight: "100vh" }} />}>
      <ChatContent />
    </Suspense>
  );
}
