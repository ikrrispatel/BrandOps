"use client";

import { useState } from "react";
import UploadForm from "@/components/upload-form";

const PRODUCT_TABS = {
  Agents: {
    eyebrow: "Agent Fleet",
    title: "Five specialized review agents",
    body:
      "BrandOps runs Brand Consistency, Accessibility, Legal/Risk, Visual Hierarchy, and Audience Fit agents against every uploaded asset.",
    stats: ["5 live agents", "Parallel execution", "Per-agent score"],
  },
  Memory: {
    eyebrow: "MongoDB Memory Vault",
    title: "Brand context persists across reviews",
    body:
      "Repeat reviews retrieve compact prior memory for the same brand and platform: previous scores, recurring issues, and prior fixes.",
    stats: ["Compact memory", "No raw image storage", "No secrets stored"],
  },
  Trace: {
    eyebrow: "OpenInfer Trace",
    title: "Every agent run is auditable",
    body:
      "BrandOps records model, latency, confidence, status, and cost marker for each agent, proving this is agent infrastructure rather than a generic AI wrapper.",
    stats: ["Model", "Latency", "Confidence"],
  },
} as const;

type ProductTab = keyof typeof PRODUCT_TABS;

export default function Home() {
  const [activeTab, setActiveTab] = useState<ProductTab>("Agents");
  const tab = PRODUCT_TABS[activeTab];

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#070707] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(95,132,255,0.26),transparent_30%),radial-gradient(circle_at_80%_18%,rgba(255,255,255,0.10),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.05),transparent_42%)]" />
        <div className="absolute inset-x-0 top-[420px] h-[420px] bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:56px_56px] opacity-35 [mask-image:linear-gradient(to_bottom,transparent,black,transparent)]" />
      </div>

      <header className="relative z-20 mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-6 px-6 py-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-sm font-semibold">
            B
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight">BrandOps</p>
            <p className="text-xs text-white/45">Multi-Agent Brand Compliance</p>
          </div>
        </div>

        <nav className="flex items-center rounded-full border border-white/10 bg-white/[0.035] p-1 text-sm text-white/55 backdrop-blur-xl">
          {(Object.keys(PRODUCT_TABS) as ProductTab[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setActiveTab(item)}
              className={`rounded-full px-5 py-2 transition ${
                activeTab === item
                  ? "bg-white text-black shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)]"
                  : "hover:text-white"
              }`}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-2">
          <div className="hidden rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/70 md:block">
            Secure Workspace
          </div>
          <div className="rounded-full bg-white px-5 py-2 text-sm font-medium text-black shadow-[inset_0_-2px_0_rgba(0,0,0,0.18),0_18px_60px_rgba(255,255,255,0.12)]">
            OpenInfer Live
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-16 pt-8">
        <div className="mx-auto mb-10 max-w-3xl rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 text-center shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.34em] text-blue-300">
            {tab.eyebrow}
          </p>
          <h2 className="mt-3 text-2xl font-medium tracking-tight text-white">
            {tab.title}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-white/52">
            {tab.body}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {tab.stats.map((stat) => (
              <span
                key={stat}
                className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/55"
              >
                {stat}
              </span>
            ))}
          </div>
        </div>

        <div className="mx-auto max-w-5xl text-center">
          <p className="mb-5 text-xs font-medium uppercase tracking-[0.46em] text-blue-300">
            Creative QA Infrastructure
          </p>

          <h1 className="text-[64px] font-medium leading-[0.94] tracking-[-0.075em] text-white md:text-[92px] lg:text-[112px]">
            Brand compliance
            <span className="block text-white/70">reviewed by</span>
            <span className="block bg-gradient-to-r from-white via-blue-100 to-blue-500 bg-clip-text text-transparent">
              agents.
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-white/58">
            Upload a brand guide and a campaign asset. BrandOps runs five OpenInfer-backed
            agents, returns fixes, stores memory, and exposes inference traces.
          </p>
        </div>

        <div className="relative mx-auto mt-14 max-w-6xl">
          <div className="absolute -inset-6 rounded-[3rem] bg-[radial-gradient(circle_at_50%_0%,rgba(80,120,255,0.25),transparent_45%)] blur-2xl" />
          <UploadForm />
        </div>
      </section>
    </main>
  );
}
