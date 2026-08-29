"use client";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import type { VisualizationSpec } from "@/lib/types";

// Curated modern color palette tailored for dark theme: colorful, distinct, elegant
const CHART_COLORS = [
  "#6366F1", // Indigo / Iris
  "#06B6D4", // Cyan / Teal
  "#10B981", // Emerald
  "#F59E0B", // Amber / Warm Gold
  "#EC4899", // Rose / Pink
  "#8B5CF6", // Purple / Violet
  "#3B82F6", // Blue
  "#F97316", // Warm Orange
  "#14B8A6", // Teal
  "#A855F7", // Bright Violet
  "#84CC16", // Lime
  "#E11D48", // Crimson
];

interface DataVisualizationProps {
  spec: VisualizationSpec;
  data: Record<string, unknown>[];
  className?: string;
}

function formatValue(value: unknown, format?: string | null): string {
  if (value === null || value === undefined) return "NULL";
  const num = Number(value);
  if (isNaN(num)) return String(value);

  switch (format) {
    case "currency":
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(num);
    case "percentage":
      return `${num.toFixed(1)}%`;
    case "number":
      return new Intl.NumberFormat("en-US", { notation: "compact" }).format(num);
    default:
      return num % 1 === 0 ? num.toLocaleString() : num.toFixed(2);
  }
}

function KPICard({ spec, data }: { spec: VisualizationSpec; data: Record<string, unknown>[] }) {
  const value = data[0]?.[spec.value_key || spec.y_keys?.[0] || Object.keys(data[0] || {})[0]];
  return (
    <div className="kpi-card max-w-sm mx-auto p-5 rounded-xl border"
      style={{
        background: "linear-gradient(145deg, rgba(99, 102, 241, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)",
        borderColor: "rgba(99, 102, 241, 0.2)",
      }}>
      {spec.title && <p className="text-xs uppercase tracking-wider font-medium mb-1.5" style={{ color: "#94A3B8" }}>{spec.title}</p>}
      <div className="text-3xl font-bold tracking-tight" style={{ color: "#F8FAFC" }}>{formatValue(value, spec.format)}</div>
      {spec.description && <p className="text-xs mt-2" style={{ color: "#64748B" }}>{spec.description}</p>}
    </div>
  );
}

const tooltipStyle = {
  contentStyle: {
    background: "rgba(18, 20, 29, 0.95)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: 8,
    boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
    padding: "8px 12px",
  },
  labelStyle: { color: "#F1F5F9", fontWeight: 600, fontSize: "12px", marginBottom: "4px" },
  itemStyle: { color: "#CBD5E1", fontSize: "12px" },
};

export default function DataVisualization({ spec, data, className = "" }: DataVisualizationProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8" style={{ color: "#64748B" }}>
        <p className="text-sm">No data to visualize.</p>
      </div>
    );
  }

  const xKey = spec.x_key || Object.keys(data[0])[0];
  const yKeys = spec.y_keys || [Object.keys(data[0]).find(k => k !== xKey) || Object.keys(data[0])[1]];
  const height = 280;

  const chartProps = {
    data,
    margin: { top: 10, right: 20, left: 10, bottom: 25 },
  };

  const chartTitle = spec.title && (
    <p className="text-sm font-semibold mb-4" style={{ color: "#E2E8F0" }}>{spec.title}</p>
  );

  switch (spec.type) {
    case "kpi":
      return <KPICard spec={spec} data={data} />;

    case "bar":
      return (
        <div className={className}>
          {chartTitle}
          <ResponsiveContainer width="100%" height={height}>
            <BarChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey={xKey} tick={{ fill: "#94A3B8", fontSize: 11 }} tickLine={{ stroke: "rgba(255,255,255,0.1)" }} />
              <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} tickLine={{ stroke: "rgba(255,255,255,0.1)" }} tickFormatter={(v) => formatValue(v, spec.format)} />
              <Tooltip {...tooltipStyle} formatter={(v) => [formatValue(v, spec.format)]} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              {yKeys.length > 1 && <Legend wrapperStyle={{ color: "#94A3B8", fontSize: 12, paddingTop: 8 }} />}
              {yKeys.map((key, i) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={CHART_COLORS[i % CHART_COLORS.length]}
                  radius={[5, 5, 0, 0]}
                  maxBarSize={60}
                >
                  {/* For single-series bar charts, color each bar individually so it looks vibrant and colorful */}
                  {yKeys.length === 1 && data.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      );

    case "line":
      return (
        <div className={className}>
          {chartTitle}
          <ResponsiveContainer width="100%" height={height}>
            <LineChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey={xKey} tick={{ fill: "#94A3B8", fontSize: 11 }} tickLine={{ stroke: "rgba(255,255,255,0.1)" }} />
              <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} tickLine={{ stroke: "rgba(255,255,255,0.1)" }} tickFormatter={(v) => formatValue(v, spec.format)} />
              <Tooltip {...tooltipStyle} formatter={(v) => [formatValue(v, spec.format)]} />
              {yKeys.length > 1 && <Legend wrapperStyle={{ color: "#94A3B8", fontSize: 12, paddingTop: 8 }} />}
              {yKeys.map((key, i) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={CHART_COLORS[i % CHART_COLORS.length]}
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: CHART_COLORS[i % CHART_COLORS.length], stroke: "#0D0F12", strokeWidth: 1.5 }}
                  activeDot={{ r: 6, fill: CHART_COLORS[i % CHART_COLORS.length] }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      );

    case "area":
      return (
        <div className={className}>
          {chartTitle}
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart {...chartProps}>
              <defs>
                {yKeys.map((key, i) => (
                  <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey={xKey} tick={{ fill: "#94A3B8", fontSize: 11 }} tickLine={{ stroke: "rgba(255,255,255,0.1)" }} />
              <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} tickLine={{ stroke: "rgba(255,255,255,0.1)" }} tickFormatter={(v) => formatValue(v, spec.format)} />
              <Tooltip {...tooltipStyle} formatter={(v) => [formatValue(v, spec.format)]} />
              {yKeys.length > 1 && <Legend wrapperStyle={{ color: "#94A3B8", fontSize: 12, paddingTop: 8 }} />}
              {yKeys.map((key, i) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={CHART_COLORS[i % CHART_COLORS.length]}
                  strokeWidth={2.5}
                  fill={`url(#grad-${key})`}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      );

    case "pie":
    case "donut": {
      const labelKey = spec.label_key || xKey;
      const valueKey = spec.value_key || yKeys[0];
      const innerRadius = spec.type === "donut" ? "58%" : "0%";
      return (
        <div className={className}>
          {chartTitle}
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                dataKey={valueKey}
                nameKey={labelKey}
                cx="50%"
                cy="50%"
                outerRadius="72%"
                innerRadius={innerRadius}
                paddingAngle={3}
                stroke="#0D0F12"
                strokeWidth={2}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} formatter={(v) => [formatValue(v, spec.format)]} />
              <Legend wrapperStyle={{ color: "#94A3B8", fontSize: 12, paddingTop: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      );
    }

    case "scatter": {
      const xK = spec.x_key || Object.keys(data[0])[0];
      const yK = spec.y_keys?.[0] || Object.keys(data[0])[1];
      return (
        <div className={className}>
          {chartTitle}
          <ResponsiveContainer width="100%" height={height}>
            <ScatterChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey={xK} name={xK} tick={{ fill: "#94A3B8", fontSize: 11 }} />
              <YAxis dataKey={yK} name={yK} tick={{ fill: "#94A3B8", fontSize: 11 }} />
              <Tooltip {...tooltipStyle} />
              <Scatter data={data} fill={CHART_COLORS[0]} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      );
    }

    default:
      return null;
  }
}
