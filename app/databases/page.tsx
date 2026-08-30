"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Database, Plus, Trash2, RefreshCw, CheckCircle2, XCircle,
  Loader2, Server, ChevronRight, Copy, Eye, EyeOff, ArrowLeft
} from "lucide-react";
import { databasesApi, getApiErrorMessage } from "@/lib/api";
import { type DatabaseConnection, type TestConnectionResponse, getConnectionBadge } from "@/lib/types";

import SchemaExplorerModal from "@/components/ui/SchemaExplorerModal";
import AddConnectionModal from "@/components/ui/AddConnectionModal";

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
            {getConnectionBadge(conn.name)}
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

export default function DatabasesPage() {
  const router = useRouter();
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedSchemaDb, setSelectedSchemaDb] = useState<DatabaseConnection | null>(null);

  useEffect(() => {
    loadConnections();
    if (typeof window !== "undefined" && (window.location.search.includes("add=true") || window.location.hash === "#add")) {
      setShowModal(true);
    }
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
