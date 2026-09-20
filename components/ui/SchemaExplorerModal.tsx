"use client";

import React, { useState, useEffect } from "react";
import {
  X, Database, Key, Link2, Search, Table2, GitFork,
  RefreshCw, Loader2, Sparkles, ArrowRight, ShieldCheck, ChevronDown, ChevronRight
} from "lucide-react";
import { databasesApi, getApiErrorMessage } from "@/lib/api";
import type { FullSchemaResponse } from "@/lib/types";
import MermaidDiagram from "./MermaidDiagram";

interface SchemaExplorerModalProps {
  databaseId: string;
  databaseName: string;
  isOpen: boolean;
  onClose: () => void;
  onAskAboutTable?: (tableName: string, promptText?: string) => void;
}

export default function SchemaExplorerModal({
  databaseId,
  databaseName,
  isOpen,
  onClose,
  onAskAboutTable,
}: SchemaExplorerModalProps) {
  const [schemaData, setSchemaData] = useState<FullSchemaResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"tables" | "relationships" | "er_diagram">("tables");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen && databaseId) {
      loadSchema();
    }
  }, [isOpen, databaseId]);

  const loadSchema = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await databasesApi.getFullSchema(databaseId);
      setSchemaData(data);
      if (data.tables && data.tables.length > 0) {
        const initialExpanded: Record<string, boolean> = {};
        data.tables.slice(0, 3).forEach((t) => {
          initialExpanded[t.name] = true;
        });
        setExpandedTables(initialExpanded);
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await databasesApi.analyzeSchema(databaseId);
      await loadSchema();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setRefreshing(false);
    }
  };

  const toggleTable = (tableName: string) => {
    setExpandedTables((prev) => ({
      ...prev,
      [tableName]: !prev[tableName],
    }));
  };

  const toggleAll = (expand: boolean) => {
    if (!schemaData?.tables) return;
    const next: Record<string, boolean> = {};
    schemaData.tables.forEach((t) => {
      next[t.name] = expand;
    });
    setExpandedTables(next);
  };

  if (!isOpen) return null;

  const filteredTables = schemaData?.tables.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.columns.some((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-fade-in"
    >
      <div
        className="w-full max-w-5xl h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden animate-scale-in"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border-subtle)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{ borderColor: "var(--border-subtle)", background: "var(--bg-card-raised)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border shadow-sm"
              style={{
                background: "var(--accent-emerald-pale)",
                borderColor: "var(--accent-emerald-border)",
                color: "var(--accent-emerald-dark)",
              }}
            >
              <Database size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{databaseName}</h2>
                {schemaData && (
                  <span className="badge badge-info text-xs capitalize">{schemaData.db_type}</span>
                )}
                <span className="badge badge-emerald text-xs">
                  <ShieldCheck size={12} className="mr-1" /> Read-Only
                </span>
              </div>
              <p className="text-xs mt-0.5 font-medium" style={{ color: "var(--text-muted)" }}>
                Database Schema Explorer & Entity-Relationship Architecture
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="btn-ghost flex items-center gap-1.5 py-1.5 px-3 text-xs font-semibold shadow-sm"
              title="Re-analyze database schema"
            >
              <RefreshCw size={13} className={refreshing ? "animate-spin text-emerald-500" : ""} />
              <span>{refreshing ? "Analyzing..." : "Refresh Schema"}</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[var(--bg-card-hover)] transition-smooth"
              style={{ color: "var(--text-muted)" }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          className="flex items-center justify-between px-6 border-b flex-shrink-0"
          style={{ borderColor: "var(--border-subtle)", background: "var(--bg-card)" }}
        >
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("tables")}
              className="flex items-center gap-2 py-3 px-4 text-sm font-bold border-b-2 transition-smooth"
              style={{
                borderColor: activeTab === "tables" ? "var(--accent-emerald)" : "transparent",
                color: activeTab === "tables" ? "var(--text-primary)" : "var(--text-muted)",
              }}
            >
              <Table2 size={15} style={{ color: activeTab === "tables" ? "var(--accent-emerald)" : "inherit" }} />
              <span>Tables & Columns</span>
              {schemaData && (
                <span className="text-[11px] px-2 py-0.5 rounded-full font-mono border" style={{ background: "var(--bg-card-raised)", borderColor: "var(--border-subtle)" }}>
                  {schemaData.total_tables}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("relationships")}
              className="flex items-center gap-2 py-3 px-4 text-sm font-bold border-b-2 transition-smooth"
              style={{
                borderColor: activeTab === "relationships" ? "var(--accent-emerald)" : "transparent",
                color: activeTab === "relationships" ? "var(--text-primary)" : "var(--text-muted)",
              }}
            >
              <GitFork size={15} style={{ color: activeTab === "relationships" ? "var(--accent-emerald)" : "inherit" }} />
              <span>Relationships</span>
              {schemaData && (
                <span className="text-[11px] px-2 py-0.5 rounded-full font-mono border" style={{ background: "var(--bg-card-raised)", borderColor: "var(--border-subtle)" }}>
                  {schemaData.total_relationships}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("er_diagram")}
              className="flex items-center gap-2 py-3 px-4 text-sm font-bold border-b-2 transition-smooth"
              style={{
                borderColor: activeTab === "er_diagram" ? "var(--accent-emerald)" : "transparent",
                color: activeTab === "er_diagram" ? "var(--text-primary)" : "var(--text-muted)",
              }}
            >
              <Sparkles size={15} className="text-amber-500" />
              <span>Visual ER Diagram</span>
            </button>
          </div>

          {activeTab === "tables" && schemaData && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleAll(true)}
                className="text-xs font-semibold hover:opacity-80 transition-smooth"
                style={{ color: "var(--text-muted)" }}
              >
                Expand All
              </button>
              <span style={{ color: "var(--border-dim)" }}>·</span>
              <button
                onClick={() => toggleAll(false)}
                className="text-xs font-semibold hover:opacity-80 transition-smooth"
                style={{ color: "var(--text-muted)" }}
              >
                Collapse All
              </button>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0" style={{ background: "var(--bg-void)" }}>
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: "var(--text-muted)" }}>
              <Loader2 size={30} className="animate-spin text-emerald-500" />
              <p className="text-sm font-medium">Inspecting database schema catalog...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center border"
                style={{ background: "var(--error-pale)", borderColor: "var(--error-border)", color: "var(--error-red)" }}
              >
                <X size={20} />
              </div>
              <p className="text-sm font-semibold" style={{ color: "var(--error-red)" }}>{error}</p>
              <button onClick={loadSchema} className="btn-primary text-xs px-4 py-2 mt-2 font-semibold">
                Retry
              </button>
            </div>
          ) : schemaData ? (
            <>
              {/* TAB 1: Tables & Columns */}
              {activeTab === "tables" && (
                <div className="space-y-4">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2"
                      style={{ color: "var(--text-muted)" }}
                    />
                    <input
                      type="text"
                      placeholder="Search tables or columns..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full border rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:outline-none transition-smooth shadow-sm"
                      style={{
                        background: "var(--bg-card)",
                        borderColor: "var(--border-subtle)",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>

                  {filteredTables.length === 0 ? (
                    <div className="text-center py-12 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                      No tables found matching &quot;{searchQuery}&quot;
                    </div>
                  ) : (
                    filteredTables.map((table) => {
                      const isExpanded = !!expandedTables[table.name];
                      const pkCount = table.columns.filter((c) => c.is_primary_key).length;
                      const fkCount = table.columns.filter((c) => c.is_foreign_key).length;

                      return (
                        <div
                          key={table.name}
                          className="rounded-xl border transition-all duration-200 overflow-hidden shadow-sm"
                          style={{
                            background: "var(--bg-card)",
                            borderColor: isExpanded ? "var(--border-dim)" : "var(--border-subtle)",
                          }}
                        >
                          {/* Table Header Row */}
                          <div
                            onClick={() => toggleTable(table.name)}
                            className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[var(--bg-card-hover)] transition-smooth"
                          >
                            <div className="flex items-center gap-3">
                              {isExpanded ? (
                                <ChevronDown size={16} style={{ color: "var(--text-muted)" }} />
                              ) : (
                                <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />
                              )}
                              <span className="font-mono text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                                {table.name}
                              </span>
                              <span className="text-xs font-mono font-medium" style={{ color: "var(--text-muted)" }}>
                                ({table.columns.length} columns)
                              </span>
                              {table.row_count !== null && table.row_count !== undefined && (
                                <span className="badge badge-info text-[10px]">
                                  ~{table.row_count.toLocaleString()} rows
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {pkCount > 0 && (
                                <span className="badge badge-warning text-[10px]">
                                  <Key size={10} className="mr-1" /> {pkCount} PK
                                </span>
                              )}
                              {fkCount > 0 && (
                                <span className="badge badge-info text-[10px]">
                                  <Link2 size={10} className="mr-1" /> {fkCount} FK
                                </span>
                              )}
                              {onAskAboutTable && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onAskAboutTable(table.name, `Explain the ${table.name} table and its schema columns`);
                                    onClose();
                                  }}
                                  className="btn-ghost text-xs py-1 px-2.5 ml-2 font-semibold shadow-sm"
                                  title={`Ask DataDuck to explain ${table.name}`}
                                >
                                  <span>Ask DataDuck</span>
                                  <ArrowRight size={11} className="ml-1" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Expanded Columns Table */}
                          {isExpanded && (
                            <div className="border-t overflow-x-auto" style={{ borderColor: "var(--border-subtle)" }}>
                              <table className="w-full text-left text-xs data-table">
                                <thead>
                                  <tr>
                                    <th>Column</th>
                                    <th>Data Type</th>
                                    <th>Constraints</th>
                                    <th>Nullable</th>
                                    <th>Default</th>
                                    <th>References</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {table.columns.map((col) => (
                                    <tr key={col.name}>
                                      <td className="font-mono font-semibold" style={{ color: "var(--text-primary)" }}>
                                        <div className="flex items-center gap-1.5">
                                          {col.is_primary_key && (
                                            <Key size={12} className="text-amber-500 flex-shrink-0" />
                                          )}
                                          {col.is_foreign_key && (
                                            <Link2 size={12} className="text-blue-500 flex-shrink-0" />
                                          )}
                                          <span>{col.name}</span>
                                        </div>
                                      </td>
                                      <td className="font-mono">
                                        <span className="px-1.5 py-0.5 rounded border text-[11px]" style={{ background: "var(--bg-card-raised)", borderColor: "var(--border-subtle)" }}>
                                          {col.data_type}
                                          {col.max_length ? `(${col.max_length})` : ""}
                                        </span>
                                      </td>
                                      <td>
                                        <div className="flex gap-1">
                                          {col.is_primary_key && (
                                            <span className="badge badge-warning text-[9px] py-0 px-1.5">PRIMARY KEY</span>
                                          )}
                                          {col.is_foreign_key && (
                                            <span className="badge badge-info text-[9px] py-0 px-1.5">FOREIGN KEY</span>
                                          )}
                                          {!col.is_primary_key && !col.is_foreign_key && (
                                            <span style={{ color: "var(--text-muted)" }}>-</span>
                                          )}
                                        </div>
                                      </td>
                                      <td>
                                        {col.is_nullable ? (
                                          <span style={{ color: "var(--text-muted)" }}>Nullable</span>
                                        ) : (
                                          <span className="font-bold" style={{ color: "var(--accent-emerald)" }}>NOT NULL</span>
                                        )}
                                      </td>
                                      <td className="font-mono" style={{ color: "var(--text-secondary)" }}>
                                        {col.default_value || "-"}
                                      </td>
                                      <td className="font-mono text-xs">
                                        {col.references_table ? (
                                          <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1 font-semibold">
                                            <span>{col.references_table}</span>
                                            <span>.</span>
                                            <span>{col.references_column || "id"}</span>
                                          </span>
                                        ) : (
                                          <span style={{ color: "var(--text-muted)" }}>-</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* TAB 2: Relationships */}
              {activeTab === "relationships" && (
                <div className="space-y-4">
                  <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                    Foreign key dependencies and entity linkages across schema tables.
                  </p>

                  {schemaData.relationships && schemaData.relationships.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {schemaData.relationships.map((rel, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl border flex flex-col gap-2 shadow-sm"
                          style={{
                            background: "var(--bg-card)",
                            borderColor: "var(--border-subtle)",
                          }}
                        >
                          <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                            <span className="font-semibold" style={{ color: "var(--text-primary)" }}>Foreign Key Link</span>
                            {rel.constraint_name && (
                              <span className="font-mono text-[10px]">
                                {rel.constraint_name}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 my-1">
                            <div className="flex-1 p-2.5 rounded-lg border font-mono text-xs" style={{ background: "var(--bg-card-raised)", borderColor: "var(--border-subtle)" }}>
                              <p className="text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--text-muted)" }}>From Table</p>
                              <p className="font-bold mt-0.5" style={{ color: "var(--text-primary)" }}>{rel.from_table}</p>
                              <p className="text-blue-600 dark:text-blue-400 font-semibold text-[11px] mt-0.5">.{rel.from_column}</p>
                            </div>

                            <div className="flex flex-col items-center justify-center" style={{ color: "var(--text-muted)" }}>
                              <ArrowRight size={16} />
                            </div>

                            <div className="flex-1 p-2.5 rounded-lg border font-mono text-xs" style={{ background: "var(--bg-card-raised)", borderColor: "var(--border-subtle)" }}>
                              <p className="text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--text-muted)" }}>To (Referenced)</p>
                              <p className="font-bold mt-0.5" style={{ color: "var(--text-primary)" }}>{rel.to_table}</p>
                              <p className="text-amber-600 dark:text-amber-400 font-semibold text-[11px] mt-0.5">.{rel.to_column}</p>
                            </div>
                          </div>

                          {onAskAboutTable && (
                            <button
                              onClick={() => {
                                onAskAboutTable(
                                  rel.from_table,
                                  `How are ${rel.from_table} and ${rel.to_table} related in this database?`
                                );
                                onClose();
                              }}
                              className="text-[11px] font-semibold flex items-center gap-1 mt-1 transition-smooth hover:opacity-80"
                              style={{ color: "var(--accent-emerald)" }}
                            >
                              <span>Ask DataDuck about this relation</span>
                              <ArrowRight size={10} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                      No explicit foreign key relationships found in this schema.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ER Diagram */}
              {activeTab === "er_diagram" && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                      Interactive Entity-Relationship Diagram
                    </h3>
                    <p className="text-xs mt-0.5 font-medium" style={{ color: "var(--text-muted)" }}>
                      Generated dynamically from catalog table structures and foreign key references.
                    </p>
                  </div>

                  <MermaidDiagram
                    chart={schemaData.mermaid_er_diagram}
                    title={`${schemaData.database_name} Architecture`}
                    className="w-full"
                  />
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
