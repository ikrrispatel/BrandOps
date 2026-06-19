import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BrandOps — Multi-Agent Brand Compliance Engine",
  description: "QA for creative teams. Evaluate assets against brand guidelines.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black py-4 px-6 sticky top-0 z-10">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">BrandOps</h1>
            <span className="text-sm text-zinc-500 dark:text-zinc-400 hidden sm:inline">
              Multi-Agent Brand Compliance Engine
            </span>
          </div>
        </header>
        <main className="flex flex-1 w-full max-w-3xl mx-auto">{children}</main>
      </body>
    </html>
  );
}
