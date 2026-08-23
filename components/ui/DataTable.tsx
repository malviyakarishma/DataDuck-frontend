"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DataTableProps {
  columns: string[];
  rows: Record<string, unknown>[];
  truncated?: boolean;
  rowCount?: number;
  maxRows?: number;
  className?: string;
}

const PAGE_SIZE = 50;

function formatCell(value: unknown): { display: string; isNull: boolean } {
  if (value === null || value === undefined) {
    return { display: "NULL", isNull: true };
  }
  if (typeof value === "boolean") return { display: value ? "true" : "false", isNull: false };
  if (typeof value === "object") return { display: JSON.stringify(value), isNull: false };
  return { display: String(value), isNull: false };
}

export default function DataTable({ columns, rows, truncated, rowCount, className = "" }: DataTableProps) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const pageRows = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (!columns.length || !rows.length) {
    return (
      <div className="text-center py-6" style={{ color: "#4A4A4A" }}>
        <p className="text-sm">No results returned.</p>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, ri) => (
              <tr key={ri}>
                {columns.map((col) => {
                  const { display, isNull } = formatCell(row[col]);
                  return (
                    <td key={col}>
                      {isNull ? (
                        <span className="null-value">NULL</span>
                      ) : (
                        <span className="font-mono text-sm">{display}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 px-1">
        <p className="text-xs" style={{ color: "#6B6B6B" }}>
          {truncated
            ? `Showing first ${rows.length.toLocaleString()} of ${rowCount?.toLocaleString() ?? rows.length.toLocaleString()}+ rows`
            : `${rows.length.toLocaleString()} row${rows.length !== 1 ? "s" : ""}`}
          {truncated && (
            <span className="ml-2" style={{ color: "#F59E0B" }}>
              (result truncated for performance)
            </span>
          )}
        </p>

        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
              className="p-1 rounded transition-smooth disabled:opacity-30"
              style={{ color: "#AFAFAF" }}>
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs" style={{ color: "#6B6B6B" }}>
              {page + 1} / {totalPages}
            </span>
            <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page === totalPages - 1}
              className="p-1 rounded transition-smooth disabled:opacity-30"
              style={{ color: "#AFAFAF" }}>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
