"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Database, Plus, Trash2, Loader2, Server, ChevronRight, Eye, EyeOff, ArrowLeft
} from "lucide-react";
import { databasesApi } from "@/lib/api";
import { type DatabaseConnection, getConnectionBadge } from "@/lib/types";

import SchemaExplorerModal from "@/components/ui/SchemaExplorerModal";
import AddConnectionModal from "@/components/ui/AddConnectionModal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/Toast";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { getApiErrorMessage } from "@/lib/api";

function ConnectionCard({ conn, onRequestDelete, onChat, onExploreSchema }: {
  conn: DatabaseConnection;
  onRequestDelete: (conn: DatabaseConnection) => void;
  onChat: (id: string) => void;
  onExploreSchema: (conn: DatabaseConnection) => void;
}) {
  const [showConn, setShowConn] = useState(false);

  return (
    <div className="card-luxury p-6 animate-fade-in border shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-xs font-bold border shadow-sm"
            style={{
              background: "var(--accent-emerald-pale)",
              borderColor: "var(--accent-emerald-border)",
              color: "var(--accent-emerald-dark)",
            }}
          >
            {getConnectionBadge(conn.name)}
          </div>
          <div>
            <h3 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>{conn.name}</h3>
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
            className="btn-ghost flex items-center gap-1.5 py-1.5 px-3 text-xs font-semibold shadow-sm"
            title="Inspect schema tables, columns, constraints and ER diagram"
          >
            <Database size={13} style={{ color: "var(--accent-emerald)" }} />
            <span>Schema & ER</span>
          </button>
          <button
            onClick={() => onChat(conn.id)}
            className="btn-primary text-xs py-1.5 px-4 flex items-center gap-1 font-semibold"
          >
            Open Chat <ChevronRight size={14} />
          </button>
          <button
            onClick={() => onRequestDelete(conn)}
            className="btn-ghost p-2 text-red-500 hover:text-red-600 hover:bg-red-500/10 border-transparent"
            title="Delete database connection"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center justify-between">
          <div
            className="text-xs font-mono flex-1 truncate pr-4"
            style={{ color: showConn ? "var(--text-primary)" : "var(--text-muted)" }}
          >
            {showConn ? conn.masked_connection_string : "•".repeat(40)}
          </div>
          <button
            onClick={() => setShowConn(!showConn)}
            className="flex-shrink-0 hover:opacity-80"
            style={{ color: "var(--text-muted)" }}
            aria-label={showConn ? "Hide connection string" : "Show connection string"}
          >
            {showConn ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        <div className="flex flex-wrap gap-6 mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
          {conn.database_name && (
            <span>DB: <span className="font-medium" style={{ color: "var(--text-secondary)" }}>{conn.database_name}</span></span>
          )}
          {conn.host && (
            <span>Host: <span className="font-medium" style={{ color: "var(--text-secondary)" }}>{conn.host}</span></span>
          )}
          {conn.schema_analyzed_at && (
            <span>Schema analyzed: <span className="font-medium" style={{ color: "var(--text-secondary)" }}>
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
  const toast = useToast();
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedSchemaDb, setSelectedSchemaDb] = useState<DatabaseConnection | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DatabaseConnection | null>(null);
  const [deleting, setDeleting] = useState(false);

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
    toast.success("Database connected", `Successfully connected to "${conn.name}"`);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await databasesApi.deleteDatabase(deleteTarget.id);
      setConnections((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      toast.success("Database removed", `"${deleteTarget.name}" has been deleted.`);
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error("Failed to delete database", getApiErrorMessage(err));
    } finally {
      setDeleting(false);
    }
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
          <Link href="/dashboard" className="flex items-center gap-1.5 transition-smooth text-sm font-medium hover:opacity-80" style={{ color: "var(--text-secondary)" }}>
            <ArrowLeft size={16} /> <span>Dashboard</span>
          </Link>
          <div className="w-px h-5" style={{ background: "var(--border-subtle)" }} />
          <div className="flex items-center gap-2">
            <Database size={18} style={{ color: "var(--accent-emerald)" }} />
            <span className="font-bold" style={{ color: "var(--text-primary)" }}>Databases</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 py-2 px-5 text-sm font-semibold shadow-sm">
            <Plus size={16} /> Connect Database
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-20">
            <Loader2 size={32} className="animate-spin mx-auto mb-4" style={{ color: "var(--accent-emerald)" }} />
            <p style={{ color: "var(--text-muted)" }}>Loading connections...</p>
          </div>
        ) : connections.length === 0 ? (
          <div className="card-luxury p-12 text-center border shadow-md">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border"
              style={{ background: "var(--accent-emerald-pale)", borderColor: "var(--accent-emerald-border)" }}
            >
              <Server size={28} style={{ color: "var(--accent-emerald)" }} />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>No databases connected</h2>
            <p className="text-sm mb-8 max-w-sm mx-auto" style={{ color: "var(--text-secondary)" }}>
              Connect your first database to start asking questions in natural language.
            </p>
            <button onClick={() => setShowModal(true)} className="btn-primary inline-flex items-center gap-2 font-semibold">
              <Plus size={18} /> Connect Your First Database
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {connections.map((conn) => (
              <ConnectionCard
                key={conn.id}
                conn={conn}
                onRequestDelete={(c) => setDeleteTarget(c)}
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

      {/* Custom Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
        title={deleteTarget ? `Delete "${deleteTarget.name}"?` : "Delete Database?"}
        description={`This will permanently remove "${deleteTarget?.name}" and all associated chat conversations. This action cannot be undone.`}
        confirmText="Delete Database"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
