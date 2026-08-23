"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Database, MessageSquare, Shield, BarChart3, ChevronDown, ArrowRight, Lock, Eye, Zap, Server, CheckCircle, X } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

// ── Mock chart data for product preview ──
const mockRevenueData = [
  { category: "Electronics", revenue: 428500 },
  { category: "Software", revenue: 312000 },
  { category: "Services", revenue: 285000 },
  { category: "Hardware", revenue: 198500 },
  { category: "Accessories", revenue: 94000 },
];

// ── Navbar ──────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav className={`navbar transition-smooth ${scrolled ? "shadow-2xl" : ""}`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <img src="/duck.png" alt="DataDuck Logo" className="w-11 h-11 object-contain transition-transform group-hover:scale-105" />
          <div className="flex flex-col justify-center">
            <span className="font-bold text-xl tracking-tight text-gradient-silver leading-none">DataDuck</span>
            <span className="text-[10px] tracking-wider uppercase font-semibold text-gray-400 mt-0.5">Ask. Dig. Discover.</span>
          </div>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          {["Features", "How It Works", "Security"].map((item) => (
            <a key={item} href={`#${item.toLowerCase().replace(" ", "-")}`}
              className="text-sm transition-smooth"
              style={{ color: "#8A8A8A" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#C7C7C7")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#8A8A8A")}>
              {item}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-ghost text-sm py-2 px-4">Login</Link>
          <Link href="/signup" className="btn-primary text-sm py-2 px-5">Get Started</Link>
        </div>
      </div>
    </nav>
  );
}

// ── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="hero-bg min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

      {/* Radial glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, rgba(180,180,180,0.1) 0%, transparent 70%)", filter: "blur(40px)" }} />

      <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 mb-8 badge badge-info animate-fade-in">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span>Now supports PostgreSQL · MySQL · SQLite · MongoDB</span>
        </div>

        {/* Main headline */}
        <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 animate-fade-in"
          style={{ animationDelay: "0.1s" }}>
          <span className="text-gradient-silver block">Your Data Has Answers.</span>
          <span className="text-gradient-silver block mt-2 font-extrabold text-4xl md:text-6xl text-gray-300">
            DataDuck Digs Them Out.
          </span>
        </h1>

        <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10 animate-fade-in"
          style={{ color: "#8A8A8A", animationDelay: "0.2s" }}>
          Connect your database, ask questions in plain English, uncover insights,
          identify data-quality problems, and generate visualizations — without
          manually writing a single query.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in"
          style={{ animationDelay: "0.3s" }}>
          <Link href="/signup" className="btn-primary flex items-center gap-2 justify-center text-base py-4 px-8">
            Connect Your Database
            <ArrowRight size={18} />
          </Link>
          <a href="#how-it-works" className="btn-ghost flex items-center gap-2 justify-center text-base py-4 px-8">
            See How It Works
            <ChevronDown size={18} />
          </a>
        </div>

        {/* Visual DB → AI graphic */}
        <div className="mt-20 animate-fade-in" style={{ animationDelay: "0.5s" }}>
          <div className="card-luxury p-8 max-w-3xl mx-auto">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
                  <img src="/duck.png" alt="DataDuck" className="w-5 h-5 object-contain" />
                </div>
                <div>
                  <span className="text-xs font-semibold" style={{ color: "#6B6B6B" }}>DATADUCK ANALYST</span>
                  <div className="text-xs" style={{ color: "#6B6B6B" }}>PostgreSQL · Connected</div>
                </div>
              </div>

              <div className="flex-1 flex items-center justify-center">
                <div className="flex items-center gap-1">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="w-1 rounded-full"
                      style={{
                        height: `${8 + (i % 3) * 6}px`,
                        background: `rgba(200,200,200,${0.15 + i * 0.05})`,
                        animation: `dot-bounce ${1 + i * 0.15}s ease-in-out infinite`,
                      }} />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-semibold" style={{ color: "#C7C7C7" }}>DataDuck AI</div>
                  <div className="text-xs" style={{ color: "#6B6B6B" }}>Powered by Gemini</div>
                </div>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <img src="/duck.png" alt="DataDuck Logo" className="w-7 h-7 object-contain" />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl text-left" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="text-xs mb-1" style={{ color: "#6B6B6B" }}>USER</div>
              <p className="text-sm" style={{ color: "#C7C7C7" }}>"Who are my top 5 customers by total revenue?"</p>
            </div>

            <div className="mt-3 p-4 rounded-xl text-left" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="text-xs mb-1" style={{ color: "#6B6B6B" }}>DATADUCK</div>
              <p className="text-sm" style={{ color: "#AFAFAF" }}>
                "Acme Corp leads with $428,500 in total purchases, followed by TechStar at $312,000.
                Together your top 5 customers account for 61% of total revenue."
              </p>
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
      ai: 'Electronics generated the highest revenue at $428,500 — contributing 41.7% of total. Software followed at $312,000. Combined, these two categories account for 72.6% of all revenue.',
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
    <section className="section" style={{ background: "var(--bg-base)" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-gradient-silver">See It In Action</h2>
          <p className="text-lg" style={{ color: "#8A8A8A" }}>Watch DataDuck answer real database questions instantly.</p>
        </div>

        {/* Demo selector */}
        <div className="flex gap-3 justify-center mb-8">
          {demos.map((d, i) => (
            <button key={i} onClick={() => setActiveDemo(i)}
              className="text-sm py-2 px-4 rounded-full transition-smooth"
              style={{
                background: activeDemo === i ? "rgba(255,255,255,0.1)" : "transparent",
                border: "1px solid",
                borderColor: activeDemo === i ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)",
                color: activeDemo === i ? "#C7C7C7" : "#6B6B6B",
              }}>
              Demo {i + 1}
            </button>
          ))}
        </div>

        <div className="card-luxury p-0 max-w-4xl mx-auto overflow-hidden">
          {/* Chat header */}
          <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ background: "#2A2A2A" }} />
              <div className="w-3 h-3 rounded-full" style={{ background: "#2A2A2A" }} />
              <div className="w-3 h-3 rounded-full" style={{ background: "#2A2A2A" }} />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-sm" style={{ color: "#6B6B6B" }}>production_db · PostgreSQL</span>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* User message */}
            <div className="flex justify-end">
              <div className="chat-bubble-user p-4 max-w-lg">
                <p className="text-sm" style={{ color: "#C7C7C7" }}>{current.user}</p>
              </div>
            </div>

            {/* AI response */}
            <div className="flex flex-col gap-3">
              <div className="chat-bubble-ai p-4 max-w-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded flex items-center justify-center overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.08)" }}>
                    <img src="/duck.png" alt="DataDuck Logo" className="w-4 h-4 object-contain" />
                  </div>
                  <span className="text-xs font-semibold" style={{ color: "#6B6B6B" }}>DATADUCK ANALYST</span>
                </div>
                <p className="text-sm" style={{ color: "#AFAFAF" }}>{current.ai}</p>
              </div>

              {/* Chart */}
              {current.hasChart && (
                <div className="animate-scale-in" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "1.5rem" }}>
                  <p className="text-sm font-semibold mb-4" style={{ color: "#C7C7C7" }}>Revenue by Product Category</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={mockRevenueData} margin={{ left: 10, right: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="category" tick={{ fill: "#6B6B6B", fontSize: 11 }} angle={-20} textAnchor="end" />
                      <YAxis tick={{ fill: "#6B6B6B", fontSize: 11 }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                        labelStyle={{ color: "#C7C7C7" }}
                        formatter={(v: unknown) => [`$${Number(v).toLocaleString()}`, "Revenue"]}
                      />
                      <Bar dataKey="revenue" fill="#8B8FA8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* NULL summary */}
              {!current.hasChart && current.summary && (
                <div className="animate-scale-in" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "1.5rem" }}>
                  <p className="text-sm font-semibold mb-3" style={{ color: "#C7C7C7" }}>Data Quality Summary — customers table</p>
                  <div className="space-y-2">
                    {current.summary.map((row) => (
                      <div key={row.column} className="flex items-center justify-between py-2 px-3 rounded-lg"
                        style={{ background: "rgba(255,255,255,0.03)" }}>
                        <code className="text-sm" style={{ color: "#AFAFAF" }}>{row.column}</code>
                        <div className="flex items-center gap-4">
                          <span className="text-sm" style={{ color: "#6B6B6B" }}>{row.nulls.toLocaleString()} NULLs</span>
                          <span className="badge badge-warning">{row.pct}</span>
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
      icon: <MessageSquare size={22} style={{ color: "#C7C7C7" }} />,
      title: "Natural Language Queries",
      desc: "Ask anything in plain English. DataDuck translates your question into the correct SQL or MongoDB query automatically.",
    },
    {
      icon: <BarChart3 size={22} style={{ color: "#C7C7C7" }} />,
      title: "Automatic Visualizations",
      desc: "DataDuck selects the best chart type for your data — bar, line, pie, scatter — rendered instantly without manual configuration.",
    },
    {
      icon: <Eye size={22} style={{ color: "#C7C7C7" }} />,
      title: "Data Quality Analysis",
      desc: "Detect NULL values, missing fields, duplicate records, and orphaned data across your entire database with a single question.",
    },
    {
      icon: <Database size={22} style={{ color: "#C7C7C7" }} />,
      title: "Multi-Database Support",
      desc: "Connect PostgreSQL, MySQL, SQLite, or MongoDB. Each query uses the correct dialect and adapter automatically.",
    },
    {
      icon: <Shield size={22} style={{ color: "#C7C7C7" }} />,
      title: "Read-Only Enforcement",
      desc: "Every query is validated by an AST parser before execution. INSERT, UPDATE, DELETE, DROP — all blocked at multiple layers.",
    },
    {
      icon: <Zap size={22} style={{ color: "#C7C7C7" }} />,
      title: "Conversational Context",
      desc: "Ask follow-up questions naturally. DataDuck remembers conversation context and generates fresh, safe queries each time.",
    },
  ];

  return (
    <section id="features" className="section" style={{ background: "var(--bg-void)" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-gradient-silver">Everything You Need</h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: "#8A8A8A" }}>
            A complete AI database analyst in your browser.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div key={i} className="feature-card animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                {f.icon}
              </div>
              <h3 className="text-base font-semibold mb-2" style={{ color: "#E5E7EB" }}>{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#6B6B6B" }}>{f.desc}</p>
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
    { n: "01", title: "Create Account", desc: "Sign up securely with email and password. Your account is private and protected." },
    { n: "02", title: "Connect Database", desc: "Paste your database connection string. We detect the type automatically and store credentials encrypted." },
    { n: "03", title: "Ask Anything", desc: 'Type questions like "Who are my top customers?" or "Are there NULL values?" in plain English.' },
    { n: "04", title: "Analyze & Visualize", desc: "Receive AI-generated explanations, tables, KPI cards, and charts. All based on your real data." },
  ];

  return (
    <section id="how-it-works" className="section" style={{ background: "var(--bg-base)" }}>
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-gradient-silver">How It Works</h2>
          <p className="text-lg" style={{ color: "#8A8A8A" }}>From sign-up to insight in under two minutes.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {steps.map((s, i) => (
            <div key={i} className="card-glass p-8 flex gap-5 animate-fade-in"
              style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="flex-shrink-0">
                <span className="text-4xl font-black" style={{ color: "rgba(255,255,255,0.06)", fontVariantNumeric: "tabular-nums" }}>{s.n}</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: "#E5E7EB" }}>{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#6B6B6B" }}>{s.desc}</p>
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
    { icon: <Shield size={16} />, text: "Read-only transaction enforcement" },
    { icon: <Eye size={16} />, text: "Fernet encryption for stored credentials" },
    { icon: <CheckCircle size={16} />, text: "Credentials never sent to Gemini AI" },
    { icon: <Zap size={16} />, text: "30-second query timeout enforced" },
    { icon: <Database size={16} />, text: "10,000 row limit per query" },
    { icon: <Server size={16} />, text: "Rate limiting on all endpoints" },
    { icon: <Lock size={16} />, text: "JWT + HttpOnly cookie auth" },
  ];

  return (
    <section id="security" className="section" style={{ background: "var(--bg-void)" }}>
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 badge badge-info mb-6">
            <Lock size={12} />
            <span>Enterprise-Grade Security</span>
          </div>
          <h2 className="text-4xl font-bold mb-4 text-gradient-silver">Security Is the Product</h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: "#8A8A8A" }}>
            DataDuck is architecturally read-only. Your data cannot be modified through this platform — by design.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Blocked operations */}
          <div className="card-luxury p-8">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2" style={{ color: "#E5E7EB" }}>
              <X size={18} className="text-red-400" />
              Operations Always Blocked
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {blocked.map((op) => (
                <div key={op} className="flex items-center gap-2 py-2 px-3 rounded-lg"
                  style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.1)" }}>
                  <X size={12} className="text-red-400 flex-shrink-0" />
                  <code className="text-sm" style={{ color: "#FCA5A5" }}>{op}</code>
                </div>
              ))}
            </div>
          </div>

          {/* Security features */}
          <div className="card-luxury p-8">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2" style={{ color: "#E5E7EB" }}>
              <Shield size={18} style={{ color: "#86EFAC" }} />
              Security Architecture
            </h3>
            <div className="space-y-3">
              {features2.map((f, i) => (
                <div key={i} className="flex items-center gap-3 py-1">
                  <div style={{ color: "#86EFAC" }}>{f.icon}</div>
                  <span className="text-sm" style={{ color: "#AFAFAF" }}>{f.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recommend read-only credentials */}
        <div className="mt-8 p-6 rounded-2xl" style={{ background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.12)" }}>
          <p className="text-sm text-center" style={{ color: "#FDE68A" }}>
            <strong>Recommended:</strong> Connect using a read-only database user for maximum safety.
            DataDuck enforces read-only at the application level, but database-level restrictions add an extra layer of defense.
          </p>
        </div>
      </div>
    </section>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ background: "var(--bg-base)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <img src="/duck.png" alt="DataDuck Logo" className="w-9 h-9 object-contain" />
            <div className="flex flex-col justify-center">
              <span className="font-bold text-lg text-gradient-silver leading-none">DataDuck</span>
              <span className="text-[10px] tracking-wider uppercase font-medium text-gray-500 mt-0.5">Ask. Dig. Discover.</span>
            </div>
          </div>
          <p className="text-sm" style={{ color: "#4A4A4A" }}>
            © {new Date().getFullYear()} DataDuck. Ask. Dig. Discover. Read-only. Secure.
          </p>
          <div className="flex gap-6">
            <Link href="/login" className="text-sm transition-smooth" style={{ color: "#4A4A4A" }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = "#8A8A8A")}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = "#4A4A4A")}>Login</Link>
            <Link href="/signup" className="text-sm transition-smooth" style={{ color: "#4A4A4A" }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = "#8A8A8A")}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = "#4A4A4A")}>Get Started</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div style={{ background: "var(--bg-void)" }}>
      <Navbar />
      <Hero />
      <ProductPreview />
      <Features />
      <HowItWorks />
      <SecuritySection />
      <Footer />
    </div>
  );
}
