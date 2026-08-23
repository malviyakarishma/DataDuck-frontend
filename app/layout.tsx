import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DataDuck — Ask. Dig. Discover.",
  description:
    "DataDuck: Ask. Dig. Discover. Connect your database securely and turn natural-language questions into real-time analysis, insights, and visualizations.",
  keywords: ["DataDuck", "AI database analyst", "SQL chatbot", "database analytics", "natural language SQL"],
  authors: [{ name: "DataDuck" }],
  openGraph: {
    title: "DataDuck — Ask. Dig. Discover.",
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
