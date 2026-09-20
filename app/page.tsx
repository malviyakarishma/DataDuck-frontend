"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Database, MessageSquare, Shield, BarChart3, ChevronDown, ArrowRight,
  Lock, Eye, Zap, Server, CheckCircle, X, Cpu, Radio
} from "lucide-react";
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { isAuthenticated } from "@/lib/api";
import ThemeToggle from "@/components/ui/ThemeToggle";

// ── Mock chart data for product preview ──
const mockRevenueData = [
  { category: "Electronics", revenue: 428500 },
  { category: "Software", revenue: 312000 },
  { category: "Services", revenue: 285000 },
  { category: "Hardware", revenue: 198500 },
  { category: "Accessories", revenue: 94000 },
];

// ── Navbar ──────────────────────────────────────────────────────────────────
function Navbar({ loggedIn }: { loggedIn: boolean }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav className={`navbar transition-smooth ${scrolled ? "shadow-md" : ""}`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href={loggedIn ? "/dashboard" : "/"} className="flex items-center gap-2 group cursor-pointer">
          <img src="/duck.png" alt="DataDuck Logo" className="w-10 h-10 object-contain transition-transform group-hover:scale-105" />
          <div className="flex flex-col justify-center">
            <span className="font-bold text-xl tracking-tight leading-none" style={{ color: "var(--text-primary)" }}>DataDuck</span>
            <span className="text-[10px] tracking-wider uppercase font-semibold mt-0.5" style={{ color: "var(--text-muted)" }}>Doubt. Dig. Discover.</span>
          </div>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          {loggedIn ? (
            <>
              <Link href="/dashboard" className="text-sm font-medium transition-smooth" style={{ color: "var(--text-secondary)" }}>Dashboard</Link>
              <Link href="/chat" className="text-sm font-medium transition-smooth" style={{ color: "var(--text-secondary)" }}>Chat</Link>
              <Link href="/databases" className="text-sm font-medium transition-smooth" style={{ color: "var(--text-secondary)" }}>Databases</Link>
            </>
          ) : (
            ["Features", "How It Works", "Security"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replaceAll(" ", "-")}`}
                className="text-sm font-medium transition-smooth hover:opacity-80"
                style={{ color: "var(--text-secondary)" }}
              >
                {item}
              </a>
            ))
          )}
        </div>

        {/* Actions & Theme Toggle */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {loggedIn ? (
            <Link href="/dashboard" className="btn-primary text-sm py-2 px-5">Go to Dashboard</Link>
          ) : (
            <>
              <Link href="/login" className="btn-ghost text-sm py-2 px-4">Login</Link>
              <Link href="/signup" className="btn-primary text-sm py-2 px-5">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

// ── Hero ─────────────────────────────────────────────────────────────────────
function Hero({ loggedIn }: { loggedIn: boolean }) {
  return (
    <section className="hero-bg tech-grid-pattern min-h-[92vh] flex items-center justify-center relative overflow-hidden py-16">
      {/* Subtle radial glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] rounded-full opacity-30 pointer-events-none z-0"
        style={{ background: "radial-gradient(circle, var(--accent-emerald-pale) 0%, transparent 70%)", filter: "blur(80px)" }}
      />

      <div className="max-w-6xl mx-auto px-6 text-center relative z-10">
        {/* Support Badge */}
        <div className="inline-flex items-center gap-2 mb-8 badge badge-emerald animate-fade-in py-1.5 px-4 shadow-sm">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--accent-emerald)" }} />
          <span className="font-medium text-xs">Read-Only AI Analyst · PostgreSQL · MySQL · SQLite · MongoDB</span>
        </div>

        {/* Main Headline */}
        <h1
          className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 animate-fade-in tracking-tight"
          style={{ animationDelay: "0.1s", color: "var(--text-primary)" }}
        >
          Your Data Has Answers.
          <span className="block mt-2 font-black" style={{ color: "var(--accent-emerald)" }}>
            DataDuck Digs Them Out.
          </span>
        </h1>

        <p
          className="text-lg md:text-xl max-w-2xl mx-auto mb-10 animate-fade-in font-normal leading-relaxed"
          style={{ animationDelay: "0.2s", color: "var(--text-secondary)" }}
        >
          Connect your database, ask questions in plain English, uncover actionable insights,
          detect data-quality anomalies, and generate real-time visualizations — 100% read-only.
        </p>

        {/* CTAs */}
        <div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in mb-14"
          style={{ animationDelay: "0.3s" }}
        >
          {loggedIn ? (
            <>
              <Link href="/dashboard" className="btn-primary flex items-center gap-2 text-base py-3.5 px-8 shadow-md">
                Go to Dashboard
                <ArrowRight size={18} />
              </Link>
              <Link href="/chat" className="btn-ghost flex items-center gap-2 text-base py-3.5 px-8">
                Open Chat
                <MessageSquare size={18} />
              </Link>
            </>
          ) : (
            <>
              <Link href="/signup" className="btn-primary flex items-center gap-2 text-base py-3.5 px-8 shadow-md">
                Connect Your Database
                <ArrowRight size={18} />
              </Link>
              <a href="#how-it-works" className="btn-ghost flex items-center gap-2 text-base py-3.5 px-8">
                See How It Works
                <ChevronDown size={18} />
              </a>
            </>
          )}
        </div>

        {/* ── Platinum Database Card (Pearl Platinum Edition) ── */}
        <div className="max-w-xl mx-auto animate-scale-in" style={{ animationDelay: "0.35s" }}>
          <div className="card-luxury p-6 text-left border shadow-lg">
            <div className="flex items-center justify-between pb-4 mb-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                  style={{ background: "var(--accent-emerald-pale)", border: "1px solid var(--accent-emerald-border)" }}
                >
                  <Cpu size={20} style={{ color: "var(--accent-emerald)" }} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm tracking-wide" style={{ color: "var(--text-primary)" }}>
                      PRIMARY_DATASTORE
                    </span>
                    <span className="badge badge-success text-[10px] py-0.5 px-2">ACTIVE</span>
                  </div>
                  <span className="text-[11px] font-mono block" style={{ color: "var(--text-muted)" }}>
                    pg://analytics-cluster.internal:5432
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="badge badge-emerald text-[10px] py-0.5 px-2.5 font-bold uppercase tracking-wider">
                  Read-Only Enforced
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs mb-3 font-mono">
              <div className="p-2.5 rounded-lg border" style={{ background: "var(--bg-card-raised)", borderColor: "var(--border-subtle)" }}>
                <span className="block text-[10px] uppercase font-semibold" style={{ color: "var(--text-muted)" }}>Mode</span>
                <span className="font-bold" style={{ color: "var(--text-primary)" }}>AST Verified</span>
              </div>
              <div className="p-2.5 rounded-lg border" style={{ background: "var(--bg-card-raised)", borderColor: "var(--border-subtle)" }}>
                <span className="block text-[10px] uppercase font-semibold" style={{ color: "var(--text-muted)" }}>Encryption</span>
                <span className="font-bold" style={{ color: "var(--text-primary)" }}>Fernet AES-256</span>
              </div>
              <div className="p-2.5 rounded-lg border" style={{ background: "var(--bg-card-raised)", borderColor: "var(--border-subtle)" }}>
                <span className="block text-[10px] uppercase font-semibold" style={{ color: "var(--text-muted)" }}>Timeout</span>
                <span className="font-bold" style={{ color: "var(--text-primary)" }}>30s Limit</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-2" style={{ color: "var(--text-muted)" }}>
              <div className="flex items-center gap-1.5">
                <Radio size={12} className="text-emerald-600 animate-pulse" />
                <span>Encrypted connection channel ready</span>
              </div>
              <span className="font-mono text-[10px]">DataDuck v1.0 Platinum</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Interactive Product Preview ─────────────────────────────────────────────
function ProductPreview() {
  const [activeDemo, setActiveDemo] = useState(0);

  const demos = [
    {
      user: "Show revenue by product category.",
      ai: "Electronics generated the highest revenue at $428,500 — contributing 41.7% of total. Software followed at $312,000. Combined, these two categories account for 72.6% of all revenue.",
      hasChart: true,
    },
    {
      user: "Are there missing values in my customer data?",
      ai: "Yes. I found NULL values across 3 columns in the customers table.",
      hasChart: false,
      summary: [
        { column: "email", nulls: 428, pct: "3.4%" },
        { column: "phone_number", nulls: 7204, pct: "57.4%" },
        { column: "date_of_birth", nulls: 1892, pct: "15.1%" },
      ],
    },
  ];

  const current = demos[activeDemo];

  return (
    <section className="section" style={{ background: "var(--bg-card)" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 tracking-tight" style={{ color: "var(--text-primary)" }}>See It In Action</h2>
          <p className="text-lg" style={{ color: "var(--text-secondary)" }}>Watch DataDuck answer real database questions instantly.</p>
        </div>

        {/* Demo Selector Tabs */}
        <div className="flex gap-3 justify-center mb-8">
          {demos.map((d, i) => (
            <button
              key={i}
              onClick={() => setActiveDemo(i)}
              className="text-sm font-semibold py-2 px-5 rounded-full transition-smooth border"
              style={{
                background: activeDemo === i ? "var(--accent-emerald-pale)" : "transparent",
                borderColor: activeDemo === i ? "var(--accent-emerald-border)" : "var(--border-subtle)",
                color: activeDemo === i ? "var(--accent-emerald-dark)" : "var(--text-secondary)",
              }}
            >
              Demo {i + 1}: {i === 0 ? "Revenue Analytics" : "Data Quality Audit"}
            </button>
          ))}
        </div>

        <div className="card-luxury p-0 max-w-4xl mx-auto overflow-hidden border shadow-xl">
          {/* Chat Window Header */}
          <div
            className="px-6 py-4 flex items-center justify-between border-b"
            style={{ borderColor: "var(--border-subtle)", background: "var(--bg-card-raised)" }}
          >
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400/80" />
                <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: "var(--accent-emerald)" }} />
                <span className="text-xs font-mono font-medium" style={{ color: "var(--text-secondary)" }}>
                  production_analytics · PostgreSQL
                </span>
              </div>
            </div>
            <span className="badge badge-emerald text-[10px]">READ-ONLY</span>
          </div>

          <div className="p-6 space-y-5" style={{ background: "var(--bg-card)" }}>
            {/* User Message */}
            <div className="flex justify-end">
              <div className="chat-bubble-user p-4 max-w-lg shadow-sm">
                <p className="text-sm font-medium">{current.user}</p>
              </div>
            </div>

            {/* AI Response */}
            <div className="flex flex-col gap-3">
              <div className="chat-bubble-ai p-4 max-w-2xl border shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center overflow-hidden border"
                    style={{ background: "var(--accent-emerald-pale)", borderColor: "var(--accent-emerald-border)" }}
                  >
                    <img src="/duck.png" alt="DataDuck Logo" className="w-4 h-4 object-contain" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--accent-emerald)" }}>
                    DataDuck Analyst
                  </span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{current.ai}</p>
              </div>

              {/* Chart Output */}
              {current.hasChart && (
                <div
                  className="animate-scale-in p-6 rounded-xl border shadow-sm"
                  style={{ background: "var(--bg-card-raised)", borderColor: "var(--border-subtle)" }}
                >
                  <p className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                    Revenue by Product Category ($ USD)
                  </p>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={mockRevenueData} margin={{ left: 10, right: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                      <XAxis dataKey="category" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} angle={-15} textAnchor="end" />
                      <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 11 }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={{
                          background: "var(--bg-card)",
                          border: "1px solid var(--border-dim)",
                          borderRadius: 8,
                          color: "var(--text-primary)",
                        }}
                        labelStyle={{ color: "var(--text-primary)", fontWeight: 600 }}
                        formatter={(v: unknown) => [`$${Number(v).toLocaleString()}`, "Revenue"]}
                      />
                      <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                        {mockRevenueData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={["#087F5B", "#06B6D4", "#6366F1", "#F59E0B", "#667085"][index % 5]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* NULL Summary Quality Audit */}
              {!current.hasChart && current.summary && (
                <div
                  className="animate-scale-in p-6 rounded-xl border shadow-sm"
                  style={{ background: "var(--bg-card-raised)", borderColor: "var(--border-subtle)" }}
                >
                  <p className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
                    Data Quality Summary — customers table
                  </p>
                  <div className="space-y-2">
                    {current.summary.map((row) => (
                      <div
                        key={row.column}
                        className="flex items-center justify-between py-2.5 px-4 rounded-lg border"
                        style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
                      >
                        <code className="text-sm font-mono font-semibold" style={{ color: "var(--text-primary)" }}>
                          {row.column}
                        </code>
                        <div className="flex items-center gap-4">
                          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                            {row.nulls.toLocaleString()} NULL values
                          </span>
                          <span className="badge badge-warning">{row.pct} missing</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Features ──────────────────────────────────────────────────────────────────
function Features() {
  const features = [
    {
      icon: <MessageSquare size={22} style={{ color: "var(--accent-emerald)" }} />,
      title: "Natural Language Queries",
      desc: "Ask anything in plain English. DataDuck translates your question into safe SQL or MongoDB queries instantly.",
    },
    {
      icon: <BarChart3 size={22} style={{ color: "var(--accent-emerald)" }} />,
      title: "Automatic Visualizations",
      desc: "DataDuck picks the ideal chart type for your data — bar, line, pie, or scatter — generated without manual setup.",
    },
    {
      icon: <Eye size={22} style={{ color: "var(--accent-emerald)" }} />,
      title: "Data Quality Auditing",
      desc: "Detect NULL fields, orphaned foreign keys, duplicates, and statistical outliers across any table automatically.",
    },
    {
      icon: <Database size={22} style={{ color: "var(--accent-emerald)" }} />,
      title: "Multi-Database Support",
      desc: "Connect PostgreSQL, MySQL, SQLite, or MongoDB clusters. Dialect adjustments and schema parsing happen seamlessly.",
    },
    {
      icon: <Shield size={22} style={{ color: "var(--accent-emerald)" }} />,
      title: "Read-Only Architecture",
      desc: "Validated by multi-layer AST analyzers before execution. All INSERT, UPDATE, DELETE, and DROP commands are strictly blocked.",
    },
    {
      icon: <Zap size={22} style={{ color: "var(--accent-emerald)" }} />,
      title: "Conversational Context",
      desc: "Explore deeper with natural follow-up questions. DataDuck remembers thread context to refine queries on the fly.",
    },
  ];

  return (
    <section id="features" className="section" style={{ background: "var(--bg-void)" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 tracking-tight" style={{ color: "var(--text-primary)" }}>Everything You Need</h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: "var(--text-secondary)" }}>
            A complete AI database analyst designed for speed, clarity, and safety.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="feature-card animate-fade-in" style={{ animationDelay: `${i * 0.08}s` }}>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 border shadow-sm"
                style={{ background: "var(--accent-emerald-pale)", borderColor: "var(--accent-emerald-border)" }}
              >
                {f.icon}
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── How It Works ─────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { n: "01", title: "Create Account", desc: "Sign up securely with email and password protected by two-factor authentication." },
    { n: "02", title: "Connect Database", desc: "Paste your connection string. Credentials are encrypted at rest with AES-256 Fernet keys." },
    { n: "03", title: "Ask in Plain English", desc: 'Ask questions like "Who are top churn risks?" or "Show schema ER diagram" with no SQL knowledge required.' },
    { n: "04", title: "Analyze & Visualize", desc: "Receive AI insights, interactive data tables, KPI metrics, and responsive charts in real time." },
  ];

  return (
    <section id="how-it-works" className="section" style={{ background: "var(--bg-card)" }}>
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 tracking-tight" style={{ color: "var(--text-primary)" }}>How It Works</h2>
          <p className="text-lg" style={{ color: "var(--text-secondary)" }}>From connection to insight in under two minutes.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {steps.map((s, i) => (
            <div
              key={i}
              className="card-glass p-8 flex gap-5 animate-fade-in border shadow-sm"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="flex-shrink-0">
                <span className="text-4xl font-black font-mono opacity-20" style={{ color: "var(--accent-emerald)" }}>{s.n}</span>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Security Section ──────────────────────────────────────────────────────────
function SecuritySection() {
  const blocked = ["INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "TRUNCATE", "CREATE", "GRANT", "REVOKE", "MERGE"];
  const features2 = [
    { icon: <Lock size={16} />, text: "SQLGlot AST-level query validation" },
    { icon: <Shield size={16} />, text: "Strict read-only transaction isolation" },
    { icon: <Eye size={16} />, text: "Fernet AES symmetric encryption for credentials" },
    { icon: <CheckCircle size={16} />, text: "Database credentials never shared with AI model" },
    { icon: <Zap size={16} />, text: "30-second query execution timeout" },
    { icon: <Database size={16} />, text: "10,000 row retrieval safety cap" },
    { icon: <Server size={16} />, text: "Rate limiting on all endpoints" },
    { icon: <Lock size={16} />, text: "JWT authentication with HttpOnly cookies" },
  ];

  return (
    <section id="security" className="section" style={{ background: "var(--bg-void)" }}>
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 badge badge-emerald mb-6">
            <Lock size={12} />
            <span>Enterprise-Grade Security</span>
          </div>
          <h2 className="text-4xl font-bold mb-4 tracking-tight" style={{ color: "var(--text-primary)" }}>Security Is the Product</h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: "var(--text-secondary)" }}>
            DataDuck is architecturally read-only. Your production data cannot be modified — by design.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Blocked operations */}
          <div className="card-luxury p-8 border shadow-md">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <X size={18} className="text-red-500" />
              Operations Always Blocked
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {blocked.map((op) => (
                <div
                  key={op}
                  className="flex items-center gap-2 py-2 px-3 rounded-lg border"
                  style={{ background: "var(--error-pale)", borderColor: "var(--error-border)" }}
                >
                  <X size={12} className="text-red-500 flex-shrink-0" />
                  <code className="text-xs font-mono font-bold" style={{ color: "var(--error-red)" }}>{op}</code>
                </div>
              ))}
            </div>
          </div>

          {/* Security features */}
          <div className="card-luxury p-8 border shadow-md">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <Shield size={18} style={{ color: "var(--accent-emerald)" }} />
              Security Architecture
            </h3>
            <div className="space-y-3">
              {features2.map((f, i) => (
                <div key={i} className="flex items-center gap-3 py-1">
                  <div style={{ color: "var(--accent-emerald)" }}>{f.icon}</div>
                  <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>{f.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recommended notice */}
        <div
          className="mt-8 p-6 rounded-2xl border"
          style={{ background: "var(--warning-pale)", borderColor: "var(--warning-border)" }}
        >
          <p className="text-sm text-center" style={{ color: "var(--warning-amber)" }}>
            <strong>Recommended:</strong> Connect using a read-only database user for defense in depth.
            DataDuck enforces read-only verification at the AST and driver levels.
          </p>
        </div>
      </div>
    </section>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────
function Footer({ loggedIn }: { loggedIn: boolean }) {
  return (
    <footer style={{ background: "var(--bg-card)", borderTop: "1px solid var(--border-subtle)" }}>
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 cursor-pointer group">
            <img src="/duck.png" alt="DataDuck Logo" className="w-9 h-9 object-contain transition-transform group-hover:scale-105" />
            <div className="flex flex-col justify-center">
              <span className="font-bold text-lg leading-none" style={{ color: "var(--text-primary)" }}>DataDuck</span>
              <span className="text-[10px] tracking-wider uppercase font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>
                Doubt. Dig. Discover.
              </span>
            </div>
          </div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            © {new Date().getFullYear()} DataDuck. Doubt. Dig. Discover. Read-only. Secure.
          </p>
          <div className="flex items-center gap-6">
            {loggedIn ? (
              <>
                <Link href="/dashboard" className="text-sm font-medium transition-smooth" style={{ color: "var(--text-secondary)" }}>Dashboard</Link>
                <Link href="/chat" className="text-sm font-medium transition-smooth" style={{ color: "var(--text-secondary)" }}>Chat</Link>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium transition-smooth" style={{ color: "var(--text-secondary)" }}>Login</Link>
                <Link href="/signup" className="text-sm font-medium transition-smooth" style={{ color: "var(--text-secondary)" }}>Get Started</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(isAuthenticated());
  }, []);

  return (
    <div style={{ background: "var(--bg-void)", minHeight: "100vh" }}>
      <Navbar loggedIn={loggedIn} />
      <Hero loggedIn={loggedIn} />
      <ProductPreview />
      <Features />
      <HowItWorks />
      <SecuritySection />
      <Footer loggedIn={loggedIn} />
    </div>
  );
}
