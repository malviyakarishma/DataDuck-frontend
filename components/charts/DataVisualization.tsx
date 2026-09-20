"use client";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import type { VisualizationSpec } from "@/lib/types";
import { useTheme } from "@/components/ThemeProvider";

// Curated modern color palettes
const DARK_CHART_COLORS = [
  "#10B981", // Emerald
  "#6366F1", // Indigo / Iris
  "#06B6D4", // Cyan / Teal
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

const LIGHT_CHART_COLORS = [
  "#087F5B", // Deep Emerald
  "#2563EB", // Royal Blue
  "#0891B2", // Cyan
  "#D97706", // Warm Amber
  "#7C3AED", // Vivid Purple
  "#E11D48", // Rose Red
  "#059669", // Mint Green
  "#EA580C", // Vibrant Orange
  "#4F46E5", // Indigo
  "#0D9488", // Deep Teal
  "#65A30D", // Lime Green
  "#DB2777", // Pink
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

function KPICard({ spec, data, isDark }: { spec: VisualizationSpec; data: Record<string, unknown>[]; isDark: boolean }) {
  const value = data[0]?.[spec.value_key || spec.y_keys?.[0] || Object.keys(data[0] || {})[0]];
  return (
    <div className="kpi-card max-w-sm mx-auto p-5 rounded-xl border transition-all duration-200"
      style={{
        background: isDark
          ? "linear-gradient(145deg, rgba(16, 185, 129, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)"
          : "linear-gradient(145deg, rgba(8, 127, 91, 0.06) 0%, rgba(255, 255, 255, 0.9) 100%)",
        borderColor: isDark ? "rgba(16, 185, 129, 0.2)" : "rgba(8, 127, 91, 0.2)",
        boxShadow: isDark ? "none" : "0 4px 16px -2px rgba(8, 127, 91, 0.08)",
      }}>
      {spec.title && (
        <p className="text-xs uppercase tracking-wider font-semibold mb-1.5" style={{ color: isDark ? "#94A3B8" : "#667085" }}>
          {spec.title}
        </p>
      )}
      <div className="text-3xl font-bold tracking-tight" style={{ color: isDark ? "#F8FAFC" : "#16181D" }}>
        {formatValue(value, spec.format)}
      </div>
      {spec.description && (
        <p className="text-xs mt-2" style={{ color: isDark ? "#64748B" : "#667085" }}>
          {spec.description}
        </p>
      )}
    </div>
  );
}

export default function DataVisualization({ spec, data, className = "" }: DataVisualizationProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const colors = isDark ? DARK_CHART_COLORS : LIGHT_CHART_COLORS;

  const tooltipStyle = {
    contentStyle: {
      background: isDark ? "rgba(18, 20, 29, 0.96)" : "rgba(255, 255, 255, 0.98)",
      border: isDark ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid rgba(226, 228, 232, 0.9)",
      borderRadius: 8,
      boxShadow: isDark ? "0 8px 24px rgba(0,0,0,0.5)" : "0 10px 25px -4px rgba(0,0,0,0.1), 0 4px 8px -2px rgba(0,0,0,0.05)",
      padding: "8px 12px",
    },
    labelStyle: { color: isDark ? "#F1F5F9" : "#16181D", fontWeight: 600, fontSize: "12px", marginBottom: "4px" },
    itemStyle: { color: isDark ? "#CBD5E1" : "#475467", fontSize: "12px" },
  };

  const gridStroke = isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.06)";
  const tickColor = isDark ? "#94A3B8" : "#667085";
  const tickLineColor = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)";
  const titleColor = isDark ? "#E2E8F0" : "#16181D";
  const dotStroke = isDark ? "#0D0F12" : "#FFFFFF";

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8" style={{ color: isDark ? "#64748B" : "#667085" }}>
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
    <p className="text-sm font-semibold mb-4" style={{ color: titleColor }}>{spec.title}</p>
  );

  switch (spec.type) {
    case "kpi":
      return <KPICard spec={spec} data={data} isDark={isDark} />;

    case "bar":
      return (
        <div className={className}>
          {chartTitle}
          <ResponsiveContainer width="100%" height={height}>
            <BarChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis dataKey={xKey} tick={{ fill: tickColor, fontSize: 11 }} tickLine={{ stroke: tickLineColor }} />
              <YAxis tick={{ fill: tickColor, fontSize: 11 }} tickLine={{ stroke: tickLineColor }} tickFormatter={(v) => formatValue(v, spec.format)} />
              <Tooltip {...tooltipStyle} formatter={(v) => [formatValue(v, spec.format)]} cursor={{ fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }} />
              {yKeys.length > 1 && <Legend wrapperStyle={{ color: tickColor, fontSize: 12, paddingTop: 8 }} />}
              {yKeys.map((key, i) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={colors[i % colors.length]}
                  radius={[5, 5, 0, 0]}
                  maxBarSize={60}
                >
                  {yKeys.length === 1 && data.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={colors[index % colors.length]}
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
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis dataKey={xKey} tick={{ fill: tickColor, fontSize: 11 }} tickLine={{ stroke: tickLineColor }} />
              <YAxis tick={{ fill: tickColor, fontSize: 11 }} tickLine={{ stroke: tickLineColor }} tickFormatter={(v) => formatValue(v, spec.format)} />
              <Tooltip {...tooltipStyle} formatter={(v) => [formatValue(v, spec.format)]} />
              {yKeys.length > 1 && <Legend wrapperStyle={{ color: tickColor, fontSize: 12, paddingTop: 8 }} />}
              {yKeys.map((key, i) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[i % colors.length]}
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: colors[i % colors.length], stroke: dotStroke, strokeWidth: 1.5 }}
                  activeDot={{ r: 6, fill: colors[i % colors.length] }}
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
                    <stop offset="5%" stopColor={colors[i % colors.length]} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={colors[i % colors.length]} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis dataKey={xKey} tick={{ fill: tickColor, fontSize: 11 }} tickLine={{ stroke: tickLineColor }} />
              <YAxis tick={{ fill: tickColor, fontSize: 11 }} tickLine={{ stroke: tickLineColor }} tickFormatter={(v) => formatValue(v, spec.format)} />
              <Tooltip {...tooltipStyle} formatter={(v) => [formatValue(v, spec.format)]} />
              {yKeys.length > 1 && <Legend wrapperStyle={{ color: tickColor, fontSize: 12, paddingTop: 8 }} />}
              {yKeys.map((key, i) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[i % colors.length]}
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
                stroke={dotStroke}
                strokeWidth={2}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={colors[i % colors.length]} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} formatter={(v) => [formatValue(v, spec.format)]} />
              <Legend wrapperStyle={{ color: tickColor, fontSize: 12, paddingTop: 8 }} />
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
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey={xK} name={xK} tick={{ fill: tickColor, fontSize: 11 }} />
              <YAxis dataKey={yK} name={yK} tick={{ fill: tickColor, fontSize: 11 }} />
              <Tooltip {...tooltipStyle} />
              <Scatter data={data} fill={colors[0]} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      );
    }

    default:
      return null;
  }
}

