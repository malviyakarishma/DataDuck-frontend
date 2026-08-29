"use client";
import React, { useState, useEffect } from "react";
import {
  X, Database, Key, Link2, Search, Table2, GitFork,
  CheckCircle2, RefreshCw, Loader2, Sparkles, ArrowRight, ShieldCheck, ChevronDown, ChevronRight
} from "lucide-react";
import { databasesApi, getApiErrorMessage } from "@/lib/api";
import type { FullSchemaResponse, TableDetail, ColumnDetail, RelationshipInfo } from "@/lib/types";
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
      // Expand the first 3 tables by default
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      style={{ background: "rgba(0, 0, 0, 0.85)", backdropFilter: "blur(12px)" }}
    >
      <div
        className="w-full max-w-5xl h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden animate-scale-in"
        style={{
          background: "linear-gradient(180deg, #111111, #080808)",
          borderColor: "rgba(255, 255, 255, 0.1)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{ borderColor: "rgba(255, 255, 255, 0.08)", background: "rgba(255, 255, 255, 0.02)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
              style={{
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "#E5E7EB",
              }}
            >
              <Database size={18} className="text-neutral-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gradient-silver">{databaseName}</h2>
                {schemaData && (
                  <span className="badge badge-info text-xs capitalize">{schemaData.db_type}</span>
                )}
                <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                  <ShieldCheck size={11} /> Read-Only
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Database Schema Explorer & Entity-Relationship Architecture
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-neutral-400 hover:text-neutral-200 border border-neutral-800 hover:border-neutral-700 transition-smooth"
              title="Re-analyze database schema"
            >
              <RefreshCw size={13} className={refreshing ? "animate-spin text-emerald-400" : ""} />
              <span>{refreshing ? "Analyzing..." : "Refresh Schema"}</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-neutral-400 hover:text-white border border-transparent hover:border-neutral-800 hover:bg-neutral-900 transition-smooth"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          className="flex items-center justify-between px-6 border-b flex-shrink-0"
          style={{ borderColor: "rgba(255, 255, 255, 0.06)", background: "rgba(255, 255, 255, 0.01)" }}
        >
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("tables")}
              className={`flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition-smooth ${
                activeTab === "tables"
                  ? "border-emerald-400 text-white"
                  : "border-transparent text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Table2 size={15} />
              <span>Tables & Columns</span>
              {schemaData && (
                <span className="text-[11px] px-1.5 py-0.2 rounded-md bg-neutral-800 text-neutral-300">
                  {schemaData.total_tables}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("relationships")}
              className={`flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition-smooth ${
                activeTab === "relationships"
                  ? "border-emerald-400 text-white"
                  : "border-transparent text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <GitFork size={15} />
              <span>Relationships</span>
              {schemaData && (
                <span className="text-[11px] px-1.5 py-0.2 rounded-md bg-neutral-800 text-neutral-300">
                  {schemaData.total_relationships}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("er_diagram")}
              className={`flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition-smooth ${
                activeTab === "er_diagram"
                  ? "border-emerald-400 text-white"
                  : "border-transparent text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Sparkles size={15} className="text-amber-400" />
              <span>Visual ER Diagram</span>
            </button>
          </div>

          {activeTab === "tables" && schemaData && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleAll(true)}
                className="text-xs text-neutral-400 hover:text-neutral-200 transition-smooth"
              >
                Expand All
              </button>
              <span className="text-neutral-600">·</span>
              <button
                onClick={() => toggleAll(false)}
                className="text-xs text-neutral-400 hover:text-neutral-200 transition-smooth"
              >
                Collapse All
              </button>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-neutral-500">
              <Loader2 size={28} className="animate-spin text-emerald-400" />
              <p className="text-sm">Inspecting database schema metadata...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <div className="w-12 h-12 rounded-xl bg-red-950/30 border border-red-800/40 flex items-center justify-center text-red-400">
                <X size={20} />
              </div>
              <p className="text-sm font-semibold text-red-400">{error}</p>
              <button onClick={loadSchema} className="btn-primary text-xs px-4 py-2 mt-2">
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
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500"
                    />
                    <input
                      type="text"
                      placeholder="Search tables or columns..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-neutral-900/60 border border-neutral-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-smooth"
                    />
                  </div>

                  {filteredTables.length === 0 ? (
                    <div className="text-center py-12 text-neutral-500 text-sm">
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
                          className="rounded-xl border transition-all duration-200 overflow-hidden"
                          style={{
                            background: "rgba(255, 255, 255, 0.02)",
                            borderColor: isExpanded ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.05)",
                          }}
                        >
                          {/* Table Header Row */}
                          <div
                            onClick={() => toggleTable(table.name)}
                            className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-neutral-800/30 transition-smooth"
                          >
                            <div className="flex items-center gap-3">
                              {isExpanded ? (
                                <ChevronDown size={16} className="text-neutral-400" />
                              ) : (
                                <ChevronRight size={16} className="text-neutral-400" />
                              )}
                              <span className="font-mono text-sm font-semibold text-neutral-200">
                                {table.name}
                              </span>
                              <span className="text-xs text-neutral-500 font-mono">
                                ({table.columns.length} columns)
                              </span>
                              {table.row_count !== null && table.row_count !== undefined && (
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-800/80 text-neutral-400">
                                  ~{table.row_count.toLocaleString()} rows
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {pkCount > 0 && (
                                <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-amber-950/40 border border-amber-800/30 text-amber-300">
                                  <Key size={10} /> {pkCount} PK
                                </span>
                              )}
                              {fkCount > 0 && (
                                <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-blue-950/40 border border-blue-800/30 text-blue-300">
                                  <Link2 size={10} /> {fkCount} FK
                                </span>
                              )}
                              {onAskAboutTable && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onAskAboutTable(table.name, `Explain the ${table.name} table and its columns`);
                                    onClose();
                                  }}
                                  className="text-xs px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center gap-1 transition-smooth ml-2"
                                  title={`Ask DataDuck to explain ${table.name}`}
                                >
                                  <span>Ask DataDuck</span>
                                  <ArrowRight size={11} />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Expanded Columns Table */}
                          {isExpanded && (
                            <div className="border-t border-neutral-800/60 overflow-x-auto">
                              <table className="w-full text-left text-xs">
                                <thead>
                                  <tr className="bg-neutral-900/40 text-neutral-400 font-medium">
                                    <th className="py-2.5 px-4">Column</th>
                                    <th className="py-2.5 px-4">Data Type</th>
                                    <th className="py-2.5 px-4">Constraints</th>
                                    <th className="py-2.5 px-4">Nullable</th>
                                    <th className="py-2.5 px-4">Default</th>
                                    <th className="py-2.5 px-4">References</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-800/40 text-neutral-300">
                                  {table.columns.map((col) => (
                                    <tr key={col.name} className="hover:bg-neutral-800/20 transition-colors">
                                      <td className="py-2.5 px-4 font-mono font-medium text-neutral-200">
                                        <div className="flex items-center gap-1.5">
                                          {col.is_primary_key && (
                                            <Key size={12} className="text-amber-400 flex-shrink-0" />
                                          )}
                                          {col.is_foreign_key && (
                                            <Link2 size={12} className="text-blue-400 flex-shrink-0" />
                                          )}
                                          <span>{col.name}</span>
                                        </div>
                                      </td>
                                      <td className="py-2.5 px-4 font-mono text-neutral-400">
                                        <span className="px-1.5 py-0.5 rounded bg-neutral-800/60 text-neutral-300">
                                          {col.data_type}
                                          {col.max_length ? `(${col.max_length})` : ""}
                                        </span>
                                      </td>
                                      <td className="py-2.5 px-4">
                                        <div className="flex gap-1">
                                          {col.is_primary_key && (
                                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold">
                                              PRIMARY KEY
                                            </span>
                                          )}
                                          {col.is_foreign_key && (
                                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-semibold">
                                              FOREIGN KEY
                                            </span>
                                          )}
                                          {!col.is_primary_key && !col.is_foreign_key && (
                                            <span className="text-neutral-500">-</span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="py-2.5 px-4">
                                        {col.is_nullable ? (
                                          <span className="text-neutral-400">Nullable</span>
                                        ) : (
                                          <span className="text-emerald-400 font-medium">NOT NULL</span>
                                        )}
                                      </td>
                                      <td className="py-2.5 px-4 font-mono text-neutral-400">
                                        {col.default_value ? (
                                          <span className="text-neutral-300">{col.default_value}</span>
                                        ) : (
                                          <span className="text-neutral-600">-</span>
                                        )}
                                      </td>
                                      <td className="py-2.5 px-4 font-mono text-xs">
                                        {col.references_table ? (
                                          <span className="text-blue-400 flex items-center gap-1">
                                            <span>{col.references_table}</span>
                                            <span className="text-neutral-500">.</span>
                                            <span>{col.references_column || "id"}</span>
                                          </span>
                                        ) : (
                                          <span className="text-neutral-600">-</span>
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
                  <p className="text-xs text-neutral-400">
                    Foreign key dependencies and connections across database tables.
                  </p>

                  {schemaData.relationships && schemaData.relationships.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {schemaData.relationships.map((rel, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl border flex flex-col gap-2"
                          style={{
                            background: "rgba(255, 255, 255, 0.02)",
                            borderColor: "rgba(255, 255, 255, 0.06)",
                          }}
                        >
                          <div className="flex items-center justify-between text-xs text-neutral-400">
                            <span className="font-medium text-neutral-300">Foreign Key Relationship</span>
                            {rel.constraint_name && (
                              <span className="font-mono text-[10px] text-neutral-500">
                                {rel.constraint_name}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 my-1">
                            <div className="flex-1 p-2 rounded-lg bg-neutral-900/60 border border-neutral-800 font-mono text-xs">
                              <p className="text-neutral-400 text-[10px] uppercase tracking-wider">From Table</p>
                              <p className="font-bold text-neutral-200 mt-0.5">{rel.from_table}</p>
                              <p className="text-blue-400 text-[11px] mt-0.5">.{rel.from_column}</p>
                            </div>

                            <div className="flex flex-col items-center justify-center text-neutral-500">
                              <ArrowRight size={16} />
                            </div>

                            <div className="flex-1 p-2 rounded-lg bg-neutral-900/60 border border-neutral-800 font-mono text-xs">
                              <p className="text-neutral-400 text-[10px] uppercase tracking-wider">To (Referenced)</p>
                              <p className="font-bold text-neutral-200 mt-0.5">{rel.to_table}</p>
                              <p className="text-amber-400 text-[11px] mt-0.5">.{rel.to_column}</p>
                            </div>
                          </div>

                          {onAskAboutTable && (
                            <button
                              onClick={() => {
                                onAskAboutTable(
                                  rel.from_table,
                                  `How are ${rel.from_table} and ${rel.to_table} related?`
                                );
                                onClose();
                              }}
                              className="text-[11px] text-neutral-400 hover:text-neutral-200 flex items-center gap-1 mt-1 transition-smooth"
                            >
                              <span>Ask DataDuck about this connection</span>
                              <ArrowRight size={10} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-neutral-500 text-sm">
                      No foreign key relationships detected in this database schema.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ER Diagram */}
              {activeTab === "er_diagram" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-neutral-200">
                        Interactive Entity-Relationship Diagram
                      </h3>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Generated dynamically from live schema catalog constraints and tables.
                      </p>
                    </div>
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
