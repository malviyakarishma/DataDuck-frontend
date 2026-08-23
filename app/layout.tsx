import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "QueryMind — AI Database Analyst",
  description:
    "Connect your database securely and turn natural-language questions into real-time analysis, insights, and visualizations.",
  keywords: ["AI database", "SQL chatbot", "database analytics", "natural language SQL"],
  authors: [{ name: "QueryMind" }],
  openGraph: {
    title: "QueryMind — AI Database Analyst",
    description: "Talk to your database in plain English. Get insights, visualizations, and data-quality analysis instantly.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased" style={{ background: '#050505', color: '#E5E7EB' }}>
        {children}
      </body>
    </html>
  );
}
