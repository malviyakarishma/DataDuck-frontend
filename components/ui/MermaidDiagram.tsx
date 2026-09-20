"use client";

import React, { useEffect, useRef, useState } from "react";
import { ZoomIn, ZoomOut, RotateCcw, Copy, Check, Maximize2, Minimize2, Code, Eye } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

interface MermaidDiagramProps {
  chart: string;
  title?: string;
  className?: string;
}

export default function MermaidDiagram({ chart, title, className = "" }: MermaidDiagramProps) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [showCode, setShowCode] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function renderChart() {
      if (!chart || !chart.trim()) {
        if (isMounted) {
          setError("No diagram content provided.");
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const mermaidModule = await import("mermaid");
        const mermaid = mermaidModule.default;

        const isDark = theme === "dark";

        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? "dark" : "default",
          themeVariables: isDark
            ? {
                darkMode: true,
                background: "#0d0d0d",
                primaryColor: "#2a2a2a",
                primaryTextColor: "#f3f4f6",
                primaryBorderColor: "rgba(255,255,255,0.2)",
                lineColor: "#10B981",
                secondaryColor: "#1f2937",
                tertiaryColor: "#111827",
                fontFamily: "var(--font-sans, Inter, sans-serif)",
                fontSize: "13px",
              }
            : {
                darkMode: false,
                background: "#FFFFFF",
                primaryColor: "#EAF7F1",
                primaryTextColor: "#16181D",
                primaryBorderColor: "#BAC2CE",
                lineColor: "#087F5B",
                secondaryColor: "#F7F7F4",
                tertiaryColor: "#F0F1F3",
                fontFamily: "var(--font-sans, Inter, sans-serif)",
                fontSize: "13px",
              },
          er: {
            useMaxWidth: false,
            layoutDirection: "TB",
            entityPadding: 15,
            fill: isDark ? "#171717" : "#FFFFFF",
            stroke: isDark ? "#404040" : "#BAC2CE",
          },
          securityLevel: "loose",
        });

        // Clean chart string
        let cleanedChart = chart.trim();
        cleanedChart = cleanedChart.replace(/^```mermaid\s*/i, "").replace(/^```\s*/i, "").replace(/```$/, "").trim();

        // Unique ID for rendering
        const id = `mermaid-svg-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(id, cleanedChart);

        if (isMounted) {
          setSvgContent(svg);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.error("Mermaid rendering error:", err);
          setError(err instanceof Error ? err.message : "Failed to render diagram");
          setLoading(false);
        }
      }
    }

    renderChart();

    return () => {
      isMounted = false;
    };
  }, [chart, theme]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(chart);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.2, 2.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.2, 0.4));
  const handleResetZoom = () => setZoom(1);

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-md ${
        isFullScreen
          ? "fixed inset-4 z-50 flex flex-col shadow-2xl"
          : "relative my-3"
      } ${className}`}
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border-subtle)",
      }}
    >
      {/* Header Toolbar */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b"
        style={{ borderColor: "var(--border-subtle)", background: "var(--bg-card-raised)" }}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--accent-emerald)" }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>
            {title || "Entity Relationship Diagram"}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Zoom controls */}
          <div
            className="flex items-center rounded-lg p-0.5 border"
            style={{ borderColor: "var(--border-subtle)", background: "var(--bg-card)" }}
          >
            <button
              onClick={handleZoomOut}
              className="p-1 rounded transition-smooth hover:bg-[var(--bg-card-hover)]"
              style={{ color: "var(--text-secondary)" }}
              title="Zoom out"
            >
              <ZoomOut size={13} />
            </button>
            <span className="text-[11px] font-mono px-1.5 font-medium" style={{ color: "var(--text-muted)" }}>
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1 rounded transition-smooth hover:bg-[var(--bg-card-hover)]"
              style={{ color: "var(--text-secondary)" }}
              title="Zoom in"
            >
              <ZoomIn size={13} />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1 rounded transition-smooth hover:bg-[var(--bg-card-hover)]"
              style={{ color: "var(--text-secondary)" }}
              title="Reset zoom"
            >
              <RotateCcw size={12} />
            </button>
          </div>

          {/* Toggle code view */}
          <button
            onClick={() => setShowCode(!showCode)}
            className="p-1.5 rounded-lg border transition-smooth hover:bg-[var(--bg-card-hover)]"
            style={{
              borderColor: "var(--border-subtle)",
              background: "var(--bg-card)",
              color: showCode ? "var(--accent-emerald)" : "var(--text-secondary)",
            }}
            title={showCode ? "Show visual diagram" : "Show Mermaid source code"}
          >
            {showCode ? <Eye size={13} /> : <Code size={13} />}
          </button>

          {/* Copy Mermaid code */}
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg border transition-smooth hover:bg-[var(--bg-card-hover)]"
            style={{
              borderColor: "var(--border-subtle)",
              background: "var(--bg-card)",
              color: copied ? "var(--accent-emerald)" : "var(--text-secondary)",
            }}
            title="Copy diagram markup"
          >
            {copied ? <Check size={13} style={{ color: "var(--accent-emerald)" }} /> : <Copy size={13} />}
          </button>

          {/* Fullscreen toggle */}
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-1.5 rounded-lg border transition-smooth hover:bg-[var(--bg-card-hover)]"
            style={{
              borderColor: "var(--border-subtle)",
              background: "var(--bg-card)",
              color: "var(--text-secondary)",
            }}
            title={isFullScreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullScreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </div>

      {/* Main Diagram Area */}
      <div
        ref={containerRef}
        className={`w-full overflow-auto p-4 flex items-center justify-center ${
          isFullScreen ? "flex-1" : "min-h-[300px] max-h-[550px]"
        }`}
        style={{ background: "var(--bg-void)" }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12" style={{ color: "var(--text-muted)" }}>
            <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium">Rendering architecture diagram...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center px-4">
            <span className="text-xs font-bold" style={{ color: "var(--error-red)" }}>Failed to render visual diagram</span>
            <span className="text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>{error}</span>
            <button
              onClick={() => setShowCode(true)}
              className="btn-ghost text-xs py-1 px-3 mt-2 font-semibold"
            >
              View Diagram Source Code
            </button>
          </div>
        ) : showCode ? (
          <pre className="code-block w-full text-xs font-mono max-h-[400px] overflow-auto">
            {chart}
          </pre>
        ) : (
          <div
            className="transition-transform duration-150 origin-center"
            style={{ transform: `scale(${zoom})` }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        )}
      </div>
    </div>
  );
}
