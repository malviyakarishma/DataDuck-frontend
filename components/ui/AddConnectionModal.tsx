"use client";
import { useState } from "react";
import { Plus, RefreshCw, CheckCircle2, XCircle, Loader2 } from "lucide-react";
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
                <code className="text-xs flex-1 break-all" style={{ color: "#6B6B6B" }}>{DB_EXAMPLES[selectedExample]}</code>
                <button type="button" onClick={() => setForm({ ...form, connection_string: DB_EXAMPLES[selectedExample] })}
                  className="text-xs py-1 px-2.5 rounded transition-smooth hover:text-white"
                  style={{ background: "rgba(255,255,255,0.08)", color: "#C7C7C7", border: "1px solid rgba(255,255,255,0.1)" }}>
                  Use
                </button>
              </div>
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
