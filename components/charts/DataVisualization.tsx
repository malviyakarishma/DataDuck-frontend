"use client";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import type { VisualizationSpec } from "@/lib/types";

const CHART_COLORS = [
  "#8B8FA8", "#A8A8B3", "#6B7280", "#C4C4CC", "#5A5F7A",
  "#9CA3AF", "#B0B3C1", "#7B7F95", "#D1D5DB", "#4A4E6A",
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
    <div className="kpi-card max-w-sm mx-auto">
      {spec.title && <p className="text-sm mb-2" style={{ color: "#6B6B6B" }}>{spec.title}</p>}
      <div className="kpi-value">{formatValue(value, spec.format)}</div>
      {spec.description && <p className="text-xs mt-2" style={{ color: "#6B6B6B" }}>{spec.description}</p>}
    </div>
  );
}

const tooltipStyle = {
  contentStyle: { background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 },
  labelStyle: { color: "#C7C7C7" },
  itemStyle: { color: "#AFAFAF" },
};

export default function DataVisualization({ spec, data, className = "" }: DataVisualizationProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8" style={{ color: "#4A4A4A" }}>
        <p className="text-sm">No data to visualize.</p>
      </div>
    );
  }

  const xKey = spec.x_key || Object.keys(data[0])[0];
  const yKeys = spec.y_keys || [Object.keys(data[0]).find(k => k !== xKey) || Object.keys(data[0])[1]];
  const height = 280;

  const chartProps = {
    data,
    margin: { top: 10, right: 20, left: 10, bottom: 20 },
  };

  const chartTitle = spec.title && (
    <p className="text-sm font-semibold mb-4" style={{ color: "#C7C7C7" }}>{spec.title}</p>
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
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey={xKey} tick={{ fill: "#6B6B6B", fontSize: 11 }} />
              <YAxis tick={{ fill: "#6B6B6B", fontSize: 11 }} tickFormatter={(v) => formatValue(v, spec.format)} />
              <Tooltip {...tooltipStyle} formatter={(v) => [formatValue(v, spec.format)]} />
              {yKeys.length > 1 && <Legend wrapperStyle={{ color: "#6B6B6B", fontSize: 12 }} />}
              {yKeys.map((key, i) => (
                <Bar key={key} dataKey={key} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[3, 3, 0, 0]} />
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
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey={xKey} tick={{ fill: "#6B6B6B", fontSize: 11 }} />
              <YAxis tick={{ fill: "#6B6B6B", fontSize: 11 }} tickFormatter={(v) => formatValue(v, spec.format)} />
              <Tooltip {...tooltipStyle} formatter={(v) => [formatValue(v, spec.format)]} />
              {yKeys.length > 1 && <Legend wrapperStyle={{ color: "#6B6B6B", fontSize: 12 }} />}
              {yKeys.map((key, i) => (
                <Line key={key} type="monotone" dataKey={key}
                  stroke={CHART_COLORS[i % CHART_COLORS.length]}
                  strokeWidth={2} dot={{ r: 3, fill: CHART_COLORS[i % CHART_COLORS.length] }} />
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
                    <stop offset="5%" stopColor={CHART_COLORS[i]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS[i]} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey={xKey} tick={{ fill: "#6B6B6B", fontSize: 11 }} />
              <YAxis tick={{ fill: "#6B6B6B", fontSize: 11 }} tickFormatter={(v) => formatValue(v, spec.format)} />
              <Tooltip {...tooltipStyle} formatter={(v) => [formatValue(v, spec.format)]} />
              {yKeys.length > 1 && <Legend wrapperStyle={{ color: "#6B6B6B", fontSize: 12 }} />}
              {yKeys.map((key, i) => (
                <Area key={key} type="monotone" dataKey={key}
                  stroke={CHART_COLORS[i]} strokeWidth={2}
                  fill={`url(#grad-${key})`} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      );

    case "pie":
    case "donut": {
      const labelKey = spec.label_key || xKey;
      const valueKey = spec.value_key || yKeys[0];
      const innerRadius = spec.type === "donut" ? "55%" : "0%";
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
                outerRadius="70%"
                innerRadius={innerRadius}
                paddingAngle={2}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} formatter={(v) => [formatValue(v, spec.format)]} />
              <Legend wrapperStyle={{ color: "#6B6B6B", fontSize: 12 }} />
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
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey={xK} name={xK} tick={{ fill: "#6B6B6B", fontSize: 11 }} />
              <YAxis dataKey={yK} name={yK} tick={{ fill: "#6B6B6B", fontSize: 11 }} />
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
