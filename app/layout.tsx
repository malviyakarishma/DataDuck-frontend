import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/ui/Toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DataDuck — Doubt. Dig. Discover.",
  description:
    "DataDuck: Doubt. Dig. Discover. Connect your database securely and turn natural-language questions into real-time analysis, insights, and visualizations.",
  keywords: ["DataDuck", "AI database analyst", "SQL chatbot", "database analytics", "natural language SQL"],
  authors: [{ name: "DataDuck" }],
  openGraph: {
    title: "DataDuck — Doubt. Dig. Discover.",
    description: "Talk to your database in plain English. Get insights, visualizations, and data-quality analysis instantly.",
    type: "website",
  },
};

const themeScript = `
(function() {
  try {
    var saved = localStorage.getItem('dataduck-theme');
    var isDark = false;
    if (saved === 'dark') {
      isDark = true;
    } else if (saved === 'light') {
      isDark = false;
    } else {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    var root = document.documentElement;
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
