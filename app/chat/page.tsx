"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Database, MessageSquare, Plus, Settings, LogOut, Send, ArrowUp, Loader2,
  ChevronDown, ChevronUp, BarChart3, AlertTriangle, Code2, Trash2
} from "lucide-react";
import { chatApi, databasesApi, authApi, ensureAuthenticated, getApiErrorMessage } from "@/lib/api";
import { type ChatMessage, type Conversation, type DatabaseConnection, type LoadingStage, getConnectionBadge } from "@/lib/types";
import DataVisualization from "@/components/charts/DataVisualization";
import DataTable from "@/components/ui/DataTable";
import MermaidDiagram from "@/components/ui/MermaidDiagram";
import SchemaExplorerModal from "@/components/ui/SchemaExplorerModal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/Toast";
import ThemeToggle from "@/components/ui/ThemeToggle";

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
    <div
      className="flex items-center gap-3 px-5 py-3 animate-fade-in rounded-xl border shadow-sm"
      style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
    >
      <div className="loading-dots">
        {[0, 1, 2].map((i) => (
          <div key={i} className="loading-dot" style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
      <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
        {STAGE_LABELS[stage]}
      </span>
    </div>
  );
}

function QueryBlock({ query }: { query: { display: boolean; language: string; content: string } }) {
  const [open, setOpen] = useState(false);
  if (!query.display || !query.content) return null;
  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs font-semibold transition-smooth py-1 hover:opacity-80"
        style={{ color: "var(--text-secondary)" }}
      >
        <Code2 size={13} style={{ color: "var(--accent-emerald)" }} />
        {open ? "Hide" : "View"} generated {query.language.toUpperCase()} query
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {open && (
        <div className="mt-2 animate-fade-in">
          <pre className="code-block shadow-inner">{query.content}</pre>
        </div>
      )}
    </div>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end mb-4 animate-fade-in">
        <div className="chat-bubble-user px-5 py-4 max-w-2xl shadow-sm">
          <p className="text-sm leading-relaxed">{msg.answer}</p>
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
        return <span className="badge badge-info text-[10px]">SCHEMA</span>;
      case "WRITE_REQUEST":
        return <span className="badge badge-error text-[10px]">READ-ONLY BLOCKED</span>;
      case "CASUAL_CHAT":
        return <span className="badge badge-info text-[10px]">CHAT</span>;
      default:
        return null;
    }
  };

  return (
    <div className="flex justify-start mb-6 animate-fade-in">
      <div className="w-full max-w-3xl space-y-4">
        {/* Main answer bubble */}
        <div className="chat-bubble-ai px-5 py-4 border shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 overflow-hidden border"
              style={{ background: "var(--accent-emerald-pale)", borderColor: "var(--accent-emerald-border)" }}
            >
              <img src="/duck.png" alt="DataDuck Logo" className="w-4 h-4 object-contain" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--accent-emerald)" }}>
              DataDuck Analyst
            </span>
            {getIntentBadge()}
            {msg.result?.execution_time_ms && (
              <span className="text-xs ml-auto font-mono" style={{ color: "var(--text-muted)" }}>
                {msg.result.execution_time_ms.toFixed(0)}ms
              </span>
            )}
          </div>

          {cleanAnswer && (
            <div className="text-sm leading-relaxed mb-3 whitespace-pre-wrap font-normal" style={{ color: "var(--text-primary)" }}>
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
                  <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}

          <QueryBlock query={msg.query || { display: false, language: "sql", content: "" }} />
        </div>

        {/* Data Visualization */}
        {hasViz && msg.visualization && msg.result && (
          <div className="card-glass p-5 border shadow-sm">
            <DataVisualization spec={msg.visualization} data={msg.result.rows} />
          </div>
        )}

        {/* ER Diagram */}
        {isErDiagram && rawMermaid && (
          <div className="card-glass p-4 border shadow-sm">
            <MermaidDiagram chart={rawMermaid} title={msg.visualization?.title || "Database Schema Diagram"} />
          </div>
        )}

        {/* Data Table */}
        {showTable && msg.result && (
          <div className="card-glass p-4 border shadow-sm">
            <DataTable
              columns={msg.result.columns}
              rows={msg.result.rows}
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
  const toast = useToast();
  const searchParams = useSearchParams();
  const initialDbId = searchParams.get("db");
  const initialConvId = searchParams.get("conversation");
  const initialQuestion = searchParams.get("q");

  const [databases, setDatabases] = useState<DatabaseConnection[]>([]);
  const [selectedDb, setSelectedDb] = useState<DatabaseConnection | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<LoadingStage>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);
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
    const init = async () => {
      const isAuth = await ensureAuthenticated();
      if (!isAuth) {
        router.push("/login");
        return;
      }
      loadInitialData();
    };
    init();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, stage]);

  const loadInitialData = async () => {
    try {
      const [dbData, convData] = await Promise.all([
        databasesApi.listDatabases(),
        chatApi.listConversations(),
      ]);
      setDatabases(dbData.databases);
      setConversations(convData.conversations);

      let targetDb: DatabaseConnection | undefined;
      if (initialDbId) {
        targetDb = dbData.databases.find((d) => d.id === initialDbId);
      } else if (dbData.databases.length > 0) {
        targetDb = dbData.databases[0];
      }

      if (targetDb) setSelectedDb(targetDb);

      if (initialConvId) {
        loadConversation(initialConvId);
      } else if (initialQuestion && targetDb) {
        handleSend(initialQuestion, targetDb);
      }
    } catch {
      /* handled */
    }
  };

  const loadConversation = async (convId: string) => {
    setLoadingHistory(true);
    try {
      const data = await chatApi.getMessages(convId);
      setCurrentConversationId(convId);
      setMessages(data.messages);
      const conv = conversations.find((c) => c.id === convId);
      if (conv) {
        const db = databases.find((d) => d.id === conv.database_id);
        if (db) setSelectedDb(db);
      }
    } catch {
      /* handled */
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setInput("");
    inputRef.current?.focus();
  };

  const handleLogout = async () => {
    await authApi.logout();
    router.push("/");
  };

  const openDeleteSingleModal = (convId: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteModal({
      isOpen: true,
      type: "single",
      conversationId: convId,
      title,
    });
  };

  const openDeleteAllModal = (e: React.MouseEvent) => {
    e.stopPropagation();
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
        toast.success("Conversation deleted", `Deleted "${deleteModal.title}"`);
      } else if (deleteModal.type === "all") {
        await chatApi.deleteAllConversations(selectedDb?.id);
        setConversations([]);
        handleNewChat();
        toast.success("All conversations cleared");
      }
    } catch (err) {
      toast.error("Failed to delete conversation", getApiErrorMessage(err));
    } finally {
      setDeleting(false);
      setDeleteModal({ isOpen: false, type: "single" });
    }
  };

  const handleSend = async (overrideMessage?: string, explicitDb?: DatabaseConnection) => {
    const dbToUse = explicitDb || selectedDb;
    const message = (overrideMessage || input).trim();
    if (!message || !dbToUse || loading) return;

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
    setStage("understanding");

    const stageTimeouts: NodeJS.Timeout[] = [
      setTimeout(() => setStage("retrieving-schema"), 600),
      setTimeout(() => setStage("generating-query"), 1200),
      setTimeout(() => setStage("validating"), 1800),
      setTimeout(() => setStage("executing"), 2400),
      setTimeout(() => setStage("analyzing"), 3200),
    ];

    try {
      const response = await chatApi.sendMessage({
        database_id: dbToUse.id,
        message,
        conversation_id: currentConversationId || undefined,
      });

      stageTimeouts.forEach(clearTimeout);
      setStage(null);

      if (!currentConversationId) {
        setCurrentConversationId(response.conversation_id);
        const convList = await chatApi.listConversations();
        setConversations(convList.conversations);
      }

      const messageData = response.message || (response as unknown as ChatMessage);
      const aiMsg: ChatMessage = {
        id: messageData.id || (Date.now() + 1).toString(),
        role: "assistant",
        answer: messageData.answer,
        insights: messageData.insights || [],
        warnings: messageData.warnings || [],
        intent: messageData.intent,
        query: messageData.query,
        result: messageData.result,
        visualization: messageData.visualization,
        created_at: messageData.created_at || new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: unknown) {
      stageTimeouts.forEach(clearTimeout);
      setStage(null);

      const errorMessage =
        err instanceof Error ? err.message : "An error occurred while analyzing your database.";

      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        answer: errorMessage,
        insights: [],
        warnings: ["Request could not be completed. Please try rephrasing your question."],
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const emptyState = messages.length === 0;

  return (
    <div className="h-screen w-screen overflow-hidden flex" style={{ background: "var(--bg-void)" }}>
      {/* Sidebar */}
      <div className="sidebar w-64 h-full flex flex-col p-4 flex-shrink-0">
        <div className="flex items-center justify-between px-2 py-3 mb-3">
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

        <button
          onClick={handleNewChat}
          className="btn-primary w-full flex items-center gap-2 justify-center py-2.5 mb-5 text-sm font-semibold shadow-sm"
        >
          <Plus size={16} /> New Chat
        </button>

        {/* Database selector */}
        {databases.length > 0 && (
          <div className="mb-5">
            <p className="text-xs px-1 mb-2 uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>
              Database
            </p>
            {databases.map((db) => (
              <button
                key={db.id}
                onClick={() => {
                  setSelectedDb(db);
                  setMessages([]);
                  setCurrentConversationId(null);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-smooth mb-1 font-medium"
                style={{
                  background: selectedDb?.id === db.id ? "var(--accent-emerald-pale)" : "transparent",
                  color: selectedDb?.id === db.id ? "var(--accent-emerald-dark)" : "var(--text-secondary)",
                  border: selectedDb?.id === db.id ? "1px solid var(--accent-emerald-border)" : "1px solid transparent",
                }}
              >
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0 border"
                  style={{
                    background: selectedDb?.id === db.id ? "var(--accent-emerald-pale)" : "var(--bg-card-raised)",
                    borderColor: selectedDb?.id === db.id ? "var(--accent-emerald-border)" : "var(--border-subtle)",
                    color: selectedDb?.id === db.id ? "var(--accent-emerald-dark)" : "var(--text-primary)",
                  }}
                >
                  {getConnectionBadge(db.name)}
                </div>
                <span className="truncate text-xs">{db.name}</span>
              </button>
            ))}
            <Link
              href="/databases"
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold transition-smooth mt-1 hover:text-[var(--accent-emerald)]"
              style={{ color: "var(--text-muted)" }}
            >
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
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-smooth hover:bg-[var(--bg-card-hover)]"
              style={{ color: "var(--text-secondary)" }}
            >
              {item.icon} {item.label}
            </Link>
          ))}
        </nav>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="flex items-center justify-between px-1 mb-2">
            <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>
              Conversations
            </p>
            {conversations.length > 0 && (
              <button
                onClick={openDeleteAllModal}
                className="text-[11px] font-medium text-neutral-400 hover:text-red-500 flex items-center gap-1 transition-smooth px-1.5 py-0.5 rounded hover:bg-red-500/10"
                title="Delete all conversations"
              >
                <Trash2 size={11} /> Clear all
              </button>
            )}
          </div>
          {conversations.length === 0 ? (
            <p className="text-xs px-2 py-3 italic" style={{ color: "var(--text-muted)" }}>
              No conversations yet
            </p>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => loadConversation(conv.id)}
                className="group relative w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-smooth mb-1 cursor-pointer hover:bg-[var(--bg-card-hover)]"
                style={{
                  background: currentConversationId === conv.id ? "var(--accent-emerald-pale)" : "transparent",
                  color: currentConversationId === conv.id ? "var(--accent-emerald-dark)" : "var(--text-secondary)",
                  border: currentConversationId === conv.id ? "1px solid var(--accent-emerald-border)" : "1px solid transparent",
                }}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1 mr-1">
                  <MessageSquare size={13} className="flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                  <span className="text-xs truncate font-medium">{conv.title}</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => openDeleteSingleModal(conv.id, conv.title, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-neutral-400 hover:text-red-500 hover:bg-red-500/10 transition-smooth flex-shrink-0"
                  title="Delete conversation"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-smooth mt-4 hover:text-red-600 hover:bg-red-500/10"
          style={{ color: "var(--text-muted)" }}
        >
          <LogOut size={15} /> Logout
        </button>
      </div>

      {/* Chat Main Area */}
      <div className="flex-1 flex flex-col h-full min-h-0 min-w-0 overflow-hidden" style={{ background: "var(--bg-void)" }}>
        {/* Top Header */}
        <div
          className="px-6 py-4 flex items-center justify-between flex-shrink-0 border-b"
          style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
        >
          <div className="flex items-center gap-3">
            {selectedDb ? (
              <>
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold border"
                  style={{
                    background: "var(--accent-emerald-pale)",
                    borderColor: "var(--accent-emerald-border)",
                    color: "var(--accent-emerald-dark)",
                  }}
                >
                  {getConnectionBadge(selectedDb.name)}
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{selectedDb.name}</p>
                  <p className="text-xs capitalize font-medium" style={{ color: "var(--text-muted)" }}>
                    {selectedDb.db_type} · {selectedDb.database_name || selectedDb.host || "Connected"}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Select a database to begin</p>
            )}
          </div>
          {selectedDb && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSchemaModalOpen(true)}
                className="btn-ghost flex items-center gap-1.5 py-1.5 px-3.5 text-xs font-semibold shadow-sm"
                title="Open interactive Schema Explorer and ER diagram"
              >
                <Database size={13} style={{ color: "var(--accent-emerald)" }} />
                <span>Schema Explorer</span>
              </button>
              <div className="badge badge-emerald text-xs py-1 px-3">
                <span className="w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse" style={{ background: "var(--accent-emerald)" }} />
                Read-Only
              </div>
            </div>
          )}
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto px-6 py-6 min-h-0">
          {loadingHistory ? (
            <div className="text-center py-20">
              <Loader2 size={24} className="animate-spin mx-auto mb-3" style={{ color: "var(--accent-emerald)" }} />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading conversation...</p>
            </div>
          ) : emptyState && selectedDb ? (
            <div className="max-w-2xl mx-auto text-center py-16">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border shadow-sm"
                style={{ background: "var(--accent-emerald-pale)", borderColor: "var(--accent-emerald-border)" }}
              >
                <MessageSquare size={28} style={{ color: "var(--accent-emerald)" }} />
              </div>
              <h2 className="text-2xl font-extrabold mb-2 tracking-tight" style={{ color: "var(--text-primary)" }}>
                Ask anything about your data
              </h2>
              <p className="text-sm mb-8 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Connected to <strong style={{ color: "var(--text-primary)" }}>{selectedDb.name}</strong>.
                Ask questions in plain English — query data, audit data quality, and generate schema ER diagrams.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                {[
                  "Explain my database schema",
                  "Show database ER diagram",
                  "What tables are in my database?",
                  "Show table relationships",
                  "What are the top 10 customers by revenue?",
                  "Are there any NULL values in my data?",
                ].map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(q)}
                    className="text-xs sm:text-sm px-4 py-3 rounded-xl text-left transition-smooth border shadow-sm hover:border-[var(--accent-emerald-border)] hover:bg-[var(--accent-emerald-pale)] hover:text-[var(--accent-emerald-dark)]"
                    style={{
                      background: "var(--bg-card)",
                      borderColor: "var(--border-subtle)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    &quot;{q}&quot;
                  </button>
                ))}
              </div>
            </div>
          ) : emptyState && !selectedDb ? (
            <div className="text-center py-16">
              <Database size={36} className="mx-auto mb-4" style={{ color: "var(--text-muted)" }} />
              <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>No database selected</h2>
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

        {/* Input Bar */}
        {selectedDb && (
          <div className="px-6 pb-6 flex-shrink-0">
            <div className="max-w-4xl mx-auto">
              <div
                className="flex items-center border rounded-2xl shadow-sm transition-all focus-within:border-[var(--accent-emerald)] focus-within:ring-2 focus-within:ring-[var(--accent-emerald-pale)] p-1.5 pl-4"
                style={{
                  background: "var(--bg-card)",
                  borderColor: "var(--border-dim)",
                }}
              >
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 180) + "px";
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything about your database, schema, or tables..."
                  disabled={loading}
                  className="flex-1 bg-transparent resize-none outline-none py-2 pr-2 text-sm font-medium leading-relaxed block self-center"
                  style={{
                    color: "var(--text-primary)",
                    minHeight: "36px",
                    maxHeight: "180px",
                    overflowY: "auto",
                  }}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || loading}
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 flex-shrink-0 self-center"
                  style={{
                    background: input.trim() && !loading ? "var(--accent-emerald)" : "var(--bg-card-raised)",
                    color: input.trim() && !loading ? "#FFFFFF" : "var(--text-muted)",
                    cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                    border: input.trim() && !loading ? "none" : "1px solid var(--border-subtle)",
                    boxShadow: input.trim() && !loading ? "0 2px 8px rgba(8, 127, 91, 0.35)" : "none",
                  }}
                  aria-label="Send query"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <ArrowUp size={17} strokeWidth={2.5} />
                  )}
                </button>
              </div>
              <p className="text-[11px] text-center mt-2 font-medium" style={{ color: "var(--text-muted)" }}>
                Read-only mode · DataDuck never modifies your database. Press ⏎ to send, Shift+⏎ for new line.
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
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => {
          if (!deleting) setDeleteModal({ isOpen: false, type: "single" });
        }}
        onConfirm={confirmDelete}
        title={deleteModal.type === "all" ? "Delete All Conversations?" : "Delete Conversation?"}
        description={
          deleteModal.type === "all"
            ? `This will permanently remove all ${conversations.length} conversation history entries. This action cannot be undone.`
            : `Are you sure you want to delete "${deleteModal.title}"? This action cannot be undone.`
        }
        confirmText={deleteModal.type === "all" ? "Delete All" : "Delete Conversation"}
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div style={{ background: "var(--bg-void)", minHeight: "100vh" }} />}>
      <ChatContent />
    </Suspense>
  );
}
