"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Database, Plus, Trash2, RefreshCw, CheckCircle2, XCircle,
  Loader2, Server, ChevronRight, Copy, Eye, EyeOff, ArrowLeft
} from "lucide-react";
import { databasesApi, getApiErrorMessage } from "@/lib/api";
import type { DatabaseConnection, TestConnectionResponse } from "@/lib/types";

import SchemaExplorerModal from "@/components/ui/SchemaExplorerModal";

const DB_EXAMPLES: Record<string, string> = {
  postgresql: "postgresql://username:password@host:5432/database",
  mysql: "mysql://username:password@host:3306/database",
  sqlite: "sqlite:///path/to/database.db",
  mongodb: "mongodb+srv://username:password@cluster.mongodb.net/database",
};

const DB_ICONS: Record<string, string> = {
  postgresql: "PG",
  mysql: "MY",
  sqlite: "SQ",
  mongodb: "MG",
};

function ConnectionCard({ conn, onDelete, onChat, onExploreSchema }: {
  conn: DatabaseConnection;
  onDelete: (id: string) => void;
  onChat: (id: string) => void;
  onExploreSchema: (conn: DatabaseConnection) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [showConn, setShowConn] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete "${conn.name}"? This will also delete all conversations.`)) return;
    setDeleting(true);
    try {
      await databasesApi.deleteDatabase(conn.id);
      onDelete(conn.id);
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div className="card-luxury p-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xs font-bold"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#C7C7C7" }}>
            {DB_ICONS[conn.db_type] || "DB"}
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: "#E5E7EB" }}>{conn.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="badge badge-info capitalize text-xs">{conn.db_type}</span>
              {conn.is_connected ? (
                <span className="badge badge-success text-xs">Connected</span>
              ) : (
                <span className="badge badge-error text-xs">Offline</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onExploreSchema(conn)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-neutral-300 hover:text-white border border-neutral-800 hover:border-neutral-700 bg-neutral-900/60 hover:bg-neutral-800/80 transition-smooth"
            title="Inspect schema tables, columns, constraints and ER diagram"
          >
            <Database size={13} className="text-emerald-400" />
            <span>Schema & ER</span>
          </button>
          <button onClick={() => onChat(conn.id)}
            className="btn-primary text-xs py-1.5 px-4 flex items-center gap-1">
            Open Chat <ChevronRight size={14} />
          </button>
          <button onClick={handleDelete} disabled={deleting}
            className="btn-ghost p-2" style={{ color: "#EF4444" }}>
            {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
          </button>
        </div>
      </div>

      <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between">
          <div className="text-xs font-mono flex-1 truncate pr-4"
            style={{ color: showConn ? "#8A8A8A" : "#4A4A4A" }}>
            {showConn ? conn.masked_connection_string : "•".repeat(40)}
          </div>
          <button onClick={() => setShowConn(!showConn)} className="flex-shrink-0"
            style={{ color: "#4A4A4A" }}>
            {showConn ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        <div className="flex gap-6 mt-3 text-xs" style={{ color: "#4A4A4A" }}>
          {conn.database_name && <span>DB: <span style={{ color: "#6B6B6B" }}>{conn.database_name}</span></span>}
          {conn.host && <span>Host: <span style={{ color: "#6B6B6B" }}>{conn.host}</span></span>}
          {conn.schema_analyzed_at && (
            <span>Schema analyzed: <span style={{ color: "#6B6B6B" }}>
              {new Date(conn.schema_analyzed_at).toLocaleDateString()}
            </span></span>
          )}
        </div>
      </div>
    </div>
  );
}

function AddConnectionModal({ onClose, onAdded }: {
  onClose: () => void;
  onAdded: (conn: DatabaseConnection) => void;
}) {
  const [form, setForm] = useState({ name: "", connection_string: "" });
  const [testResult, setTestResult] = useState<TestConnectionResponse | null>(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedExample, setSelectedExample] = useState("postgresql");

  const detectedType = (() => {
    const cs = form.connection_string.toLowerCase();
    if (cs.startsWith("postgresql") || cs.startsWith("postgres")) return "postgresql";
    if (cs.startsWith("mysql")) return "mysql";
    if (cs.startsWith("sqlite")) return "sqlite";
    if (cs.startsWith("mongodb")) return "mongodb";
    return null;
  })();

  const handleTest = async () => {
    if (!form.connection_string.trim()) return;
    setTesting(true);
    setTestResult(null);
    setError("");
    try {
      const result = await databasesApi.testConnection(form.connection_string);
      setTestResult(result);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.connection_string.trim()) return;
    setSaving(true);
    setError("");
    try {
      const conn = await databasesApi.addDatabase(form);
      onAdded(conn);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
      <div className="card-luxury w-full max-w-2xl animate-scale-in" style={{ maxHeight: "90vh", overflowY: "auto" }}>
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gradient-silver">Connect Database</h2>
            <button onClick={onClose} style={{ color: "#6B6B6B" }} className="hover:text-white transition-smooth">✕</button>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#AFAFAF" }}>Connection Name</label>
              <input className="input-dark" placeholder="e.g. Production DB, Analytics DB"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#AFAFAF" }}>Connection String</label>
              <textarea className="input-dark font-mono text-sm" rows={3}
                placeholder="postgresql://username:password@host:5432/database"
                value={form.connection_string}
                onChange={(e) => setForm({ ...form, connection_string: e.target.value })}
                style={{ resize: "vertical" }} />
              {detectedType && (
                <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: "#22C55E" }}>
                  <CheckCircle2 size={12} />
                  Detected: {detectedType}
                </p>
              )}
            </div>

            {/* Examples */}
            <div>
              <p className="text-xs mb-2" style={{ color: "#6B6B6B" }}>Connection string examples:</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {Object.keys(DB_EXAMPLES).map((type) => (
                  <button key={type} onClick={() => setSelectedExample(type)}
                    className="text-xs py-1 px-2.5 rounded-md transition-smooth capitalize"
                    style={{
                      background: selectedExample === type ? "rgba(255,255,255,0.08)" : "transparent",
                      border: "1px solid",
                      borderColor: selectedExample === type ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)",
                      color: selectedExample === type ? "#C7C7C7" : "#4A4A4A",
                    }}>
                    {type}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <code className="text-xs flex-1" style={{ color: "#6B6B6B" }}>{DB_EXAMPLES[selectedExample]}</code>
                <button onClick={() => setForm({ ...form, connection_string: DB_EXAMPLES[selectedExample] })}
                  className="text-xs py-1 px-2 rounded" style={{ background: "rgba(255,255,255,0.06)", color: "#AFAFAF" }}>
                  Use
                </button>
              </div>
            </div>

            {/* Test result */}
            {testResult && (
              <div className={`p-4 rounded-xl ${testResult.success ? "badge-success" : "badge-error"} animate-fade-in`}
                style={{
                  background: testResult.success ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)",
                  border: `1px solid ${testResult.success ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
                }}>
                <div className="flex items-center gap-2 mb-1">
                  {testResult.success
                    ? <CheckCircle2 size={16} style={{ color: "#86EFAC" }} />
                    : <XCircle size={16} style={{ color: "#FCA5A5" }} />}
                  <p className="text-sm font-medium" style={{ color: testResult.success ? "#86EFAC" : "#FCA5A5" }}>
                    {testResult.success ? "Connection Successful" : "Connection Failed"}
                  </p>
                </div>
                <p className="text-xs ml-6" style={{ color: testResult.success ? "#6EE7B7" : "#FCA5A5" }}>
                  {testResult.message}
                </p>
                {testResult.db_type && (
                  <p className="text-xs ml-6 mt-1" style={{ color: "#6B6B6B" }}>
                    Database: {testResult.database_name} · Type: {testResult.db_type}
                  </p>
                )}
              </div>
            )}

            {error && (
              <div className="warning-box animate-fade-in">
                <p className="text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 flex gap-3">
          <button onClick={handleTest} disabled={testing || !form.connection_string.trim()}
            className="btn-ghost flex-1 flex items-center justify-center gap-2 py-3">
            {testing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            {testing ? "Testing..." : "Test Connection"}
          </button>
          <button onClick={handleSave} disabled={saving || !form.name.trim() || !form.connection_string.trim()}
            className="btn-primary flex-1 flex items-center justify-center gap-2 py-3">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            {saving ? "Connecting..." : "Connect & Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DatabasesPage() {
  const router = useRouter();
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedSchemaDb, setSelectedSchemaDb] = useState<DatabaseConnection | null>(null);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      const data = await databasesApi.listDatabases();
      setConnections(data.databases);
    } catch {
      // Auth error handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleAdded = (conn: DatabaseConnection) => {
    setConnections((prev) => [conn, ...prev]);
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== id));
  };

  const handleChat = (dbId: string) => {
    router.push(`/chat?db=${dbId}`);
  };

  const handleExploreSchema = (conn: DatabaseConnection) => {
    setSelectedSchemaDb(conn);
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-void)" }}>
      {/* Header */}
      <div className="navbar px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-1.5 transition-smooth" style={{ color: "#6B6B6B" }}>
            <ArrowLeft size={16} /> <span className="text-sm">Dashboard</span>
          </Link>
          <div className="w-px h-5" style={{ background: "rgba(255,255,255,0.08)" }} />
          <div className="flex items-center gap-2">
            <Database size={18} style={{ color: "#C7C7C7" }} />
            <span className="font-semibold" style={{ color: "#E5E7EB" }}>Databases</span>
          </div>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 py-2 px-5 text-sm">
          <Plus size={16} /> Connect Database
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-20">
            <Loader2 size={32} className="animate-spin mx-auto mb-4" style={{ color: "#4A4A4A" }} />
            <p style={{ color: "#4A4A4A" }}>Loading connections...</p>
          </div>
        ) : connections.length === 0 ? (
          <div className="card-luxury p-12 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Server size={28} style={{ color: "#4A4A4A" }} />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: "#E5E7EB" }}>No databases connected</h2>
            <p className="text-sm mb-8" style={{ color: "#6B6B6B" }}>
              Connect your first database to start asking questions in natural language.
            </p>
            <button onClick={() => setShowModal(true)} className="btn-primary inline-flex items-center gap-2">
              <Plus size={18} /> Connect Your First Database
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {connections.map((conn) => (
              <ConnectionCard
                key={conn.id}
                conn={conn}
                onDelete={handleDelete}
                onChat={handleChat}
                onExploreSchema={handleExploreSchema}
              />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <AddConnectionModal onClose={() => setShowModal(false)} onAdded={handleAdded} />
      )}

      {selectedSchemaDb && (
        <SchemaExplorerModal
          databaseId={selectedSchemaDb.id}
          databaseName={selectedSchemaDb.name}
          isOpen={!!selectedSchemaDb}
          onClose={() => setSelectedSchemaDb(null)}
          onAskAboutTable={(tableName, prompt) => {
            router.push(`/chat?db=${selectedSchemaDb.id}&q=${encodeURIComponent(prompt || `Explain the ${tableName} table`)}`);
          }}
        />
      )}
    </div>
  );
}
