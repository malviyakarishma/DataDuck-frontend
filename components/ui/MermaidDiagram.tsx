"use client";
import React, { useEffect, useRef, useState } from "react";
import { ZoomIn, ZoomOut, RotateCcw, Copy, Check, Maximize2, Minimize2, Code, Eye } from "lucide-react";

interface MermaidDiagramProps {
  chart: string;
  title?: string;
  className?: string;
}

export default function MermaidDiagram({ chart, title, className = "" }: MermaidDiagramProps) {
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

        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          themeVariables: {
            darkMode: true,
            background: "#0d0d0d",
            primaryColor: "#2a2a2a",
            primaryTextColor: "#f3f4f6",
            primaryBorderColor: "rgba(255,255,255,0.2)",
            lineColor: "#9ca3af",
            secondaryColor: "#1f2937",
            tertiaryColor: "#111827",
            fontFamily: "var(--font-sans, Inter, sans-serif)",
            fontSize: "13px",
          },
          er: {
            useMaxWidth: false,
            layoutDirection: "TB",
            entityPadding: 15,
            fill: "#171717",
            stroke: "#404040",
          },
          securityLevel: "loose",
        });

        // Clean chart string
        let cleanedChart = chart.trim();
        // Remove markdown code fences if wrapped
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
  }, [chart]);

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
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        isFullScreen
          ? "fixed inset-4 z-50 flex flex-col shadow-2xl"
          : "relative my-3"
      } ${className}`}
      style={{
        background: "linear-gradient(180deg, rgba(20, 20, 20, 0.95), rgba(10, 10, 10, 0.98))",
        borderColor: "rgba(255, 255, 255, 0.08)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Header Toolbar */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b"
        style={{ borderColor: "rgba(255, 255, 255, 0.06)", background: "rgba(255, 255, 255, 0.02)" }}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
            {title || "Entity Relationship Diagram"}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Zoom controls */}
          <div className="flex items-center rounded-lg p-0.5 border" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.3)" }}>
            <button
              onClick={handleZoomOut}
              className="p-1 rounded text-neutral-400 hover:text-white transition-smooth"
              title="Zoom out"
            >
              <ZoomOut size={13} />
            </button>
            <span className="text-[11px] font-mono px-1.5 text-neutral-400">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1 rounded text-neutral-400 hover:text-white transition-smooth"
              title="Zoom in"
            >
              <ZoomIn size={13} />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1 rounded text-neutral-400 hover:text-white transition-smooth ml-0.5"
              title="Reset zoom"
            >
              <RotateCcw size={12} />
            </button>
          </div>

          {/* Toggle Syntax / Diagram */}
          <button
            onClick={() => setShowCode(!showCode)}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border text-neutral-400 hover:text-neutral-200 transition-smooth"
            style={{ borderColor: "rgba(255,255,255,0.08)", background: showCode ? "rgba(255,255,255,0.08)" : "transparent" }}
          >
            {showCode ? <Eye size={12} /> : <Code size={12} />}
            <span>{showCode ? "View Visual" : "View Code"}</span>
          </button>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg border text-neutral-400 hover:text-white transition-smooth"
            style={{ borderColor: "rgba(255,255,255,0.08)" }}
            title="Copy Mermaid Syntax"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          </button>

          {/* Fullscreen toggle */}
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-1.5 rounded-lg border text-neutral-400 hover:text-white transition-smooth"
            style={{ borderColor: "rgba(255,255,255,0.08)" }}
            title={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullScreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </div>

      {/* Main Diagram Area */}
      <div
        ref={containerRef}
        className={`w-full overflow-auto flex items-center justify-center p-6 ${
          isFullScreen ? "flex-1 min-h-0" : "min-h-[300px] max-h-[550px]"
        }`}
        style={{ background: "#080808" }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-neutral-500">
            <div className="w-6 h-6 border-2 border-neutral-600 border-t-emerald-400 rounded-full animate-spin" />
            <span className="text-xs">Rendering ER Diagram...</span>
          </div>
        ) : error ? (
          <div className="max-w-md p-4 rounded-xl border border-red-500/20 bg-red-950/20 text-center">
            <p className="text-xs font-semibold text-red-400 mb-1">Failed to render visual diagram</p>
            <p className="text-[11px] text-neutral-400 mb-3">{error}</p>
            <button
              onClick={() => setShowCode(true)}
              className="text-xs px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-200 hover:bg-neutral-700"
            >
              View Raw Diagram Syntax
            </button>
          </div>
        ) : showCode ? (
          <pre
            className="w-full h-full text-xs font-mono p-4 rounded-xl text-neutral-300 overflow-auto whitespace-pre leading-relaxed"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            {chart}
          </pre>
        ) : (
          <div
            className="transition-transform duration-150 ease-out origin-center select-none"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "center center",
            }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        )}
      </div>
    </div>
  );
}
