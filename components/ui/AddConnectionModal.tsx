"use client";

import { useState } from "react";
import { Plus, RefreshCw, CheckCircle2, XCircle, Loader2, X, AlertCircle } from "lucide-react";
import { databasesApi, getApiErrorMessage } from "@/lib/api";
import type { DatabaseConnection, TestConnectionResponse } from "@/lib/types";

const DB_EXAMPLES: Record<string, string> = {
  postgresql: "postgresql://username:password@host:5432/database",
  mysql: "mysql://username:password@host:3306/database",
  sqlite: "sqlite:///path/to/database.db",
  mongodb: "mongodb+srv://username:password@cluster.mongodb.net/database",
};

interface AddConnectionModalProps {
  onClose: () => void;
  onAdded: (conn: DatabaseConnection) => void;
}

export default function AddConnectionModal({ onClose, onAdded }: AddConnectionModalProps) {
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in"
    >
      <div
        className="card-luxury w-full max-w-2xl animate-scale-in border shadow-2xl"
        style={{ maxHeight: "90vh", overflowY: "auto", background: "var(--bg-card)" }}
      >
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between mb-6 pb-3 border-b" style={{ borderColor: "var(--border-subtle)" }}>
            <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Connect Database</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg transition-smooth hover:bg-[var(--bg-card-hover)]"
              style={{ color: "var(--text-muted)" }}
            >
              ✕
            </button>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
                Connection Name
              </label>
              <input
                className="input-dark"
                placeholder="e.g. Production DB, Analytics DB"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            {/* Examples */}
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>
                Connection string examples:
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {Object.keys(DB_EXAMPLES).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedExample(type)}
                    className="text-xs font-semibold py-1 px-3 rounded-lg transition-smooth capitalize border"
                    style={{
                      background: selectedExample === type ? "var(--accent-emerald-pale)" : "var(--bg-card-raised)",
                      borderColor: selectedExample === type ? "var(--accent-emerald-border)" : "var(--border-subtle)",
                      color: selectedExample === type ? "var(--accent-emerald-dark)" : "var(--text-secondary)",
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <div
                className="flex items-center gap-2 p-3 rounded-xl border"
                style={{ background: "var(--bg-card-raised)", borderColor: "var(--border-subtle)" }}
              >
                <code className="text-xs flex-1 break-all font-mono" style={{ color: "var(--text-secondary)" }}>
                  {DB_EXAMPLES[selectedExample]}
                </code>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, connection_string: DB_EXAMPLES[selectedExample] })}
                  className="btn-ghost text-xs py-1 px-3 font-semibold"
                >
                  Use Example
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
                Connection String URL
              </label>
              <textarea
                className="input-dark font-mono text-xs"
                rows={3}
                placeholder="postgresql://username:password@host:5432/database"
                value={form.connection_string}
                onChange={(e) => setForm({ ...form, connection_string: e.target.value })}
                style={{ resize: "vertical" }}
              />
              {detectedType && (
                <p className="text-xs mt-1.5 flex items-center gap-1.5 font-bold" style={{ color: "var(--accent-emerald)" }}>
                  <CheckCircle2 size={13} />
                  Detected: {detectedType}
                </p>
              )}
            </div>

            {/* Test result */}
            {testResult && (
              <div
                className={`p-4 rounded-xl border animate-fade-in relative flex items-start justify-between gap-3 ${
                  testResult.success ? "badge-success" : "badge-error"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {testResult.success ? (
                      <CheckCircle2 size={16} style={{ color: "var(--accent-emerald)" }} />
                    ) : (
                      <XCircle size={16} style={{ color: "var(--error-red)" }} />
                    )}
                    <p className="text-sm font-bold">
                      {testResult.success ? "Connection Successful" : "Connection Failed"}
                    </p>
                  </div>
                  <p className="text-xs ml-6 font-medium leading-relaxed">
                    {testResult.message}
                  </p>
                  {testResult.db_type && (
                    <p className="text-xs ml-6 mt-1 font-mono font-medium opacity-80">
                      Database: {testResult.database_name} · Type: {testResult.db_type}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setTestResult(null)}
                  className="p-1 rounded-lg opacity-60 hover:opacity-100 transition-smooth flex-shrink-0 -mt-1 -mr-1"
                  aria-label="Dismiss test result"
                  title="Dismiss"
                >
                  <X size={15} />
                </button>
              </div>
            )}

            {error && (
              <div className="warning-box animate-fade-in relative flex items-start justify-between gap-3 p-3.5 rounded-xl border">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-amber-500" />
                  <p className="text-xs font-medium leading-relaxed">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setError("")}
                  className="p-1 rounded-lg opacity-60 hover:opacity-100 transition-smooth flex-shrink-0 -mt-1 -mr-1"
                  aria-label="Dismiss error"
                  title="Dismiss"
                >
                  <X size={15} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 flex gap-3 border-t mt-6" style={{ borderColor: "var(--border-subtle)" }}>
          <button
            onClick={handleTest}
            disabled={testing || !form.connection_string.trim()}
            className="btn-ghost flex-1 flex items-center justify-center gap-2 py-3 font-semibold"
          >
            {testing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            {testing ? "Testing..." : "Test Connection"}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.name.trim() || !form.connection_string.trim()}
            className="btn-primary flex-1 flex items-center justify-center gap-2 py-3 font-semibold shadow-md"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            {saving ? "Connecting..." : "Connect & Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
