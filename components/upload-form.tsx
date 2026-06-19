"use client";

import Image from "next/image";
import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

type CreateReviewResponse = {
  reviewId: string;
  assetBase64: string;
  assetMimeType: string;
};

type Violation = {
  title: string;
  severity: "low" | "medium" | "high";
  evidence: string;
  whyItMatters: string;
  suggestedFix: string;
};

type SuggestedFix = {
  priority: number;
  fix: string;
  expectedImpact: string;
};

type AgentRun = {
  agentName: string;
  model: string;
  score: number;
  confidence: number;
  summary: string;
  violations: Violation[];
  suggestedFixes: SuggestedFix[];
  beforeAfter: {
    before: string;
    after: string;
  };
  latencyMs: number;
  estimatedCost: string;
  status: "completed" | "failed";
  errorMessage: string | null;
};

type MemoryUsed = {
  used: boolean;
  count: number;
  summary: string;
  recurringViolations: string[];
  lastScore: number | null;
};

type RunResponse = {
  reviewId: string;
  status: string;
  overallScore: number;
  agentRun: AgentRun;
  agentRuns?: AgentRun[];
  memoryUsed?: MemoryUsed;
};

const DEMO_CONTEXTS = [
  {
    label: "OpenInfer",
    brandName: "OpenInfer",
    targetAudience: "AI builders, startup founders, and hackathon judges",
    platform: "LinkedIn",
    campaignGoal:
      "Show that OpenInfer powers reliable multi-agent brand review with visible inference traces.",
    brandGuide: `Brand voice: technical, confident, concise, and infrastructure-focused. Avoid generic AI hype.

Visual style: dark background, high contrast, clean spacing, sharp typography, electric blue accent, and subtle glow. The design should feel premium, developer-first, modern, and trustworthy.

Messaging rules:
- Lead with infrastructure value, not generic productivity claims.
- Mention agents, model routing, latency, traces, reliability, or distributed inference when relevant.
- Avoid vague phrases like "AI magic", "10x your workflow", "revolutionary", or "game changer".
- Keep copy short and precise.

Creative rules:
- Use one clear headline.
- Keep enough padding around logos and main text.
- Body text must be readable on dark backgrounds.
- Use electric blue sparingly as an accent.
- Avoid cluttered layouts.
- Do not overload the asset with too many claims.`,
  },
  {
    label: "LumaFlow",
    brandName: "LumaFlow",
    targetAudience: "Busy young professionals looking for calm daily wellness habits",
    platform: "Instagram",
    campaignGoal:
      "Promote a calming wellness app that helps users build simple recovery routines.",
    brandGuide: `Brand voice: warm, calm, emotionally supportive, and simple. Avoid technical jargon, pressure, urgency, or productivity-hustle language.

Visual style: soft cream or warm beige background, gentle green accent, rounded shapes, soft natural lighting, relaxed spacing, and human-centered imagery.

Messaging rules:
- Lead with calm and emotional relief.
- Use phrases like "small daily reset", "feel lighter", "build gentle routines", and "recover your energy".
- Avoid words like "optimize", "crush", "maximize", "performance", or "AI-powered domination".
- Keep copy soft and minimal.

Creative rules:
- Use a soft, warm color palette.
- Typography should feel gentle and readable.
- Avoid harsh contrast unless needed for readability.
- Include a clear emotional benefit.
- The asset should feel calming within 2 seconds.`,
  },
  {
    label: "VoltBank",
    brandName: "VoltBank",
    targetAudience: "Security-conscious small business owners and finance teams",
    platform: "Website hero",
    campaignGoal:
      "Convince business owners that VoltBank is a secure, modern banking platform for managing company cash flow.",
    brandGuide: `Brand voice: trustworthy, direct, secure, modern, and professional. Avoid playful language, vague startup hype, or overly casual copy.

Visual style: deep navy background, white text, emerald trust accent, strong grid alignment, clean financial UI elements, and professional spacing.

Messaging rules:
- Lead with trust, security, and control.
- Mention cash flow, fraud protection, account visibility, or secure payments when relevant.
- Avoid unrealistic promises like "guaranteed returns", "risk-free growth", or "instant wealth".
- Copy should feel credible to business owners.

Creative rules:
- Use strong contrast and readable text.
- Include a clear headline and trust signal.
- Avoid chaotic layouts or meme-like visuals.
- Financial claims must be conservative and credible.
- Visuals should feel stable, not experimental.`,
  },
] as const;

const AGENT_ORDER = [
  "Brand Consistency",
  "Accessibility",
  "Legal / Risk",
  "Visual Hierarchy",
  "Audience Fit",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCreateReviewResponse(value: unknown): value is CreateReviewResponse {
  return (
    isRecord(value) &&
    typeof value.reviewId === "string" &&
    typeof value.assetBase64 === "string" &&
    typeof value.assetMimeType === "string"
  );
}

async function readError(response: Response) {
  const text = await response.text();
  return text || `${response.status} ${response.statusText}`;
}

function severityClass(severity: Violation["severity"]) {
  if (severity === "high") {
    return "border-red-400/25 bg-red-500/10 text-red-200";
  }

  if (severity === "medium") {
    return "border-yellow-400/25 bg-yellow-500/10 text-yellow-200";
  }

  return "border-white/10 bg-white/10 text-zinc-200";
}

function statusClass(status: AgentRun["status"]) {
  return status === "completed"
    ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
    : "border-red-400/25 bg-red-400/10 text-red-300";
}

export default function UploadForm() {
  const [brandName, setBrandName] = useState<string>("");
  const [targetAudience, setTargetAudience] = useState<string>("");
  const [platform, setPlatform] = useState<string>("");
  const [campaignGoal, setCampaignGoal] = useState<string>("");
  const [brandGuide, setBrandGuide] = useState<string>("");
  const [brandGuideFile, setBrandGuideFile] = useState<File | null>(null);
  const [creativeAsset, setCreativeAsset] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [fileError, setFileError] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState("");
  const [result, setResult] = useState<RunResponse | null>(null);
  const [selectedAgentName, setSelectedAgentName] = useState("Brand Consistency");

  const visibleAgentRuns =
    result?.agentRuns?.length ? result.agentRuns : result ? [result.agentRun] : [];

  const orderedAgentRuns = [...visibleAgentRuns].sort(
    (a, b) => AGENT_ORDER.indexOf(a.agentName) - AGENT_ORDER.indexOf(b.agentName),
  );

  const selectedAgent =
    orderedAgentRuns.find((run) => run.agentName === selectedAgentName) ??
    orderedAgentRuns[0] ??
    null;

  const primaryAgent = result?.agentRun ?? selectedAgent;
  const displayScore = result?.overallScore ?? primaryAgent?.score ?? null;

  const applyDemoContext = (context: (typeof DEMO_CONTEXTS)[number]) => {
    setBrandName(context.brandName);
    setTargetAudience(context.targetAudience);
    setPlatform(context.platform);
    setCampaignGoal(context.campaignGoal);
    setBrandGuide(context.brandGuide);
    setBrandGuideFile(null);
    setResult(null);
    setRunError("");
    setSelectedAgentName("Brand Consistency");
  };

  const handleTextUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setBrandGuide(String(reader.result ?? ""));
      setBrandGuideFile(file);
    };

    reader.readAsText(file);
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const validTypes = ["image/png", "image/jpeg", "image/webp"];

    if (!validTypes.includes(file.type)) {
      setFileError("Invalid file type. Only PNG, JPEG, and WebP are accepted.");
      setCreativeAsset(null);
      setImagePreviewUrl("");
      return;
    }

    setFileError("");
    setCreativeAsset(file);
    setResult(null);

    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!creativeAsset) {
      setFileError("Creative image is required.");
      return;
    }

    setIsRunning(true);
    setRunError("");
    setResult(null);
    setSelectedAgentName("Brand Consistency");

    try {
      const formData = new FormData();
      formData.append("brandName", brandName);
      formData.append("targetAudience", targetAudience);
      formData.append("platform", platform);
      formData.append("campaignGoal", campaignGoal);
      formData.append("brandGuideText", brandGuide);
      formData.append("creativeAsset", creativeAsset);

      if (brandGuideFile) {
        formData.append("brandGuideFile", brandGuideFile);
      }

      const createResponse = await fetch("/api/reviews", {
        method: "POST",
        body: formData,
      });

      if (!createResponse.ok) {
        throw new Error(`Create review failed: ${await readError(createResponse)}`);
      }

      const createBody: unknown = await createResponse.json();

      if (!isCreateReviewResponse(createBody)) {
        throw new Error("Create review response was missing review data.");
      }

      const runResponse = await fetch(`/api/reviews/${createBody.reviewId}/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assetBase64: createBody.assetBase64,
          assetMimeType: createBody.assetMimeType,
        }),
      });

      if (!runResponse.ok) {
        throw new Error(`Run agent failed: ${await readError(runResponse)}`);
      }

      const runBody = (await runResponse.json()) as RunResponse;
      setResult(runBody);
    } catch (error) {
      setRunError(error instanceof Error ? error.message : "Unknown review error.");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid min-h-[calc(100vh-105px)] w-full min-w-0 grid-cols-[300px_minmax(500px,1fr)_380px] gap-4 rounded-[2.1rem] border border-white/10 bg-white/[0.035] p-4 shadow-[0_40px_160px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
    >
      <aside className="max-h-[calc(100vh-135px)] min-w-0 overflow-y-auto rounded-[1.7rem] border border-white/10 bg-black/50 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-zinc-500">Context</p>
            <h2 className="mt-2 text-2xl font-medium tracking-tight text-white">Review setup</h2>
          </div>
          <div className="h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_24px_rgba(96,165,250,0.9)]" />
        </div>

        <p className="mt-6 text-xs uppercase tracking-[0.22em] text-zinc-600">Demo presets</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {DEMO_CONTEXTS.map((context) => (
            <button
              key={context.brandName}
              type="button"
              onClick={() => applyDemoContext(context)}
              className={`rounded-full border px-3 py-2 text-xs transition ${
                brandName === context.brandName
                  ? "border-blue-400/60 bg-blue-500/15 text-blue-100"
                  : "border-white/10 bg-white/[0.03] text-zinc-500 hover:border-white/20 hover:text-zinc-200"
              }`}
            >
              {context.label}
            </button>
          ))}
        </div>

        <div className="mt-7 space-y-5">
          <div>
            <label htmlFor="brandName" className="mb-2 block text-xs uppercase tracking-[0.22em] text-zinc-500">
              Brand
            </label>
            <input
              id="brandName"
              value={brandName}
              onChange={(event) => setBrandName(event.target.value)}
              required
              className="w-full border-0 border-b border-white/10 bg-transparent py-2.5 text-base text-white outline-none placeholder:text-zinc-700 focus:border-blue-400"
              placeholder="e.g. OpenInfer"
            />
          </div>

          <div>
            <label htmlFor="platform" className="mb-2 block text-xs uppercase tracking-[0.22em] text-zinc-500">
              Platform
            </label>
            <select
              id="platform"
              value={platform}
              onChange={(event) => setPlatform(event.target.value)}
              required
              className="w-full rounded-full border border-white/10 bg-zinc-950 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-400"
            >
              <option value="">Select</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Instagram">Instagram</option>
              <option value="Website hero">Website hero</option>
              <option value="Website">Website</option>
              <option value="Mobile App">Mobile App</option>
              <option value="Email">Email</option>
              <option value="Social Media">Social Media</option>
            </select>
          </div>

          <div>
            <label htmlFor="targetAudience" className="mb-2 block text-xs uppercase tracking-[0.22em] text-zinc-500">
              Audience
            </label>
            <input
              id="targetAudience"
              value={targetAudience}
              onChange={(event) => setTargetAudience(event.target.value)}
              required
              className="w-full border-0 border-b border-white/10 bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-blue-400"
              placeholder="e.g. AI builders, founders, judges"
            />
          </div>

          <div>
            <label htmlFor="campaignGoal" className="mb-2 block text-xs uppercase tracking-[0.22em] text-zinc-500">
              Goal
            </label>
            <input
              id="campaignGoal"
              value={campaignGoal}
              onChange={(event) => setCampaignGoal(event.target.value)}
              required
              className="w-full border-0 border-b border-white/10 bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-blue-400"
              placeholder="e.g. Show reliable multi-agent review"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label htmlFor="brandGuideText" className="block text-xs uppercase tracking-[0.22em] text-zinc-500">
                Guide
              </label>
              <label
                htmlFor="textUpload"
                className="cursor-pointer rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400 transition hover:border-blue-400/50 hover:text-blue-200"
              >
                Upload .txt
              </label>
            </div>
            <textarea
              id="brandGuideText"
              value={brandGuide}
              onChange={(event) => setBrandGuide(event.target.value)}
              required
              rows={7}
              className="w-full resize-none rounded-[1.2rem] border border-white/10 bg-white/[0.03] px-4 py-3 text-xs leading-5 text-zinc-200 outline-none placeholder:text-zinc-700 focus:border-blue-400"
              placeholder="Paste the brand voice, visual style, messaging rules, and creative constraints here — or use a demo preset above."
            />
            <input
              id="textUpload"
              type="file"
              accept=".txt,text/plain"
              onChange={handleTextUpload}
              className="sr-only"
            />
          </div>
        </div>
      </aside>

      <section className="relative min-w-0 overflow-hidden rounded-[1.7rem] border border-white/10 bg-black/70 p-5">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(59,130,246,0.14),transparent_34%)]" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-zinc-500">Inspection Stage</p>
            <h2 className="mt-2 text-2xl font-medium tracking-tight text-white">Creative asset</h2>
          </div>
          <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-500">
            PNG · JPG · WebP
          </div>
        </div>

        <label
          htmlFor="imageUpload"
          className="group relative z-10 mt-5 flex min-h-[calc(100vh-350px)] cursor-pointer items-center justify-center overflow-hidden rounded-[1.45rem] border border-dashed border-white/15 bg-white/[0.025] transition hover:border-blue-400/70 hover:bg-blue-500/[0.04]"
        >
          <div className="pointer-events-none absolute left-5 top-5 h-8 w-8 border-l border-t border-blue-300/40" />
          <div className="pointer-events-none absolute right-5 top-5 h-8 w-8 border-r border-t border-blue-300/40" />
          <div className="pointer-events-none absolute bottom-5 left-5 h-8 w-8 border-b border-l border-blue-300/40" />
          <div className="pointer-events-none absolute bottom-5 right-5 h-8 w-8 border-b border-r border-blue-300/40" />

          {imagePreviewUrl ? (
            <Image
              src={imagePreviewUrl}
              alt="Uploaded creative preview"
              width={1100}
              height={760}
              unoptimized
              className="max-h-[calc(100vh-420px)] w-full rounded-2xl object-contain"
            />
          ) : (
            <div className="text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.5rem] border border-white/10 bg-white/[0.04] text-3xl text-zinc-500 transition group-hover:border-blue-400/60 group-hover:text-blue-200">
                +
              </div>
              <p className="mt-6 text-xl font-medium text-white">Drop campaign asset</p>
              <p className="mt-2 text-sm text-zinc-600">or click to select a creative file</p>
            </div>
          )}

          {isRunning && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/75 backdrop-blur-sm">
              <div className="text-center">
                <div className="mx-auto h-16 w-16 animate-pulse rounded-full border border-blue-300/40 bg-blue-500/10 shadow-[0_0_60px_rgba(59,130,246,0.45)]" />
                <p className="mt-5 text-sm uppercase tracking-[0.35em] text-blue-200">
                  Five agents scanning
                </p>
              </div>
            </div>
          )}
        </label>

        <input
          id="imageUpload"
          type="file"
          accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
          onChange={handleImageUpload}
          required
          className="sr-only"
        />

        <div className="relative z-10 mt-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            {fileError && <p className="text-sm text-red-300">{fileError}</p>}
            {creativeAsset && (
              <p className="text-sm text-zinc-500">
                {creativeAsset.name} · {(creativeAsset.size / 1024).toFixed(1)} KB
              </p>
            )}
            {runError && (
              <p className="mt-2 max-w-md rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
                {runError}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isRunning}
            className="rounded-full bg-blue-500 px-7 py-3 text-sm font-medium text-white shadow-[0_0_50px_rgba(59,130,246,0.42)] transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRunning ? "Agents reviewing..." : "Run Agent Review"}
          </button>
        </div>

        {result && (
          <div className="relative z-10 mt-5 rounded-[1.4rem] border border-white/10 bg-white/[0.035] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Inference trace</p>
              <p className="text-xs text-emerald-300">All agents completed live</p>
            </div>

            <div className="mt-3 grid gap-2 text-xs text-zinc-400 xl:grid-cols-5">
              {orderedAgentRuns.map((run) => (
                <button
                  key={run.agentName}
                  type="button"
                  onClick={() => setSelectedAgentName(run.agentName)}
                  className={`rounded-2xl border p-3 text-left transition ${
                    selectedAgent?.agentName === run.agentName
                      ? "border-blue-400/50 bg-blue-500/10"
                      : "border-white/10 bg-black/30 hover:border-white/20"
                  }`}
                >
                  <p className="truncate font-medium text-white">{run.agentName}</p>
                  <p className="mt-1 text-zinc-500">{run.model}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span>{(run.latencyMs / 1000).toFixed(1)}s</span>
                    <span className={run.status === "completed" ? "text-emerald-300" : "text-red-300"}>
                      {run.status}
                    </span>
                    <span>{(run.confidence * 100).toFixed(0)}%</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <aside className="max-h-[calc(100vh-135px)] min-w-0 overflow-y-auto rounded-[1.7rem] border border-white/10 bg-black/50 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-zinc-500">Verdict</p>
            <h2 className="mt-2 text-2xl font-medium tracking-tight text-white">Agent fleet</h2>
          </div>
          {displayScore !== null && (
            <div className="text-right">
              <p className="text-5xl font-semibold tracking-[-0.08em] text-white">{displayScore}</p>
              <p className="-mt-1 text-xs text-zinc-600">/100</p>
            </div>
          )}
        </div>

        <div className="mt-6 space-y-2">
          {(orderedAgentRuns.length ? orderedAgentRuns : AGENT_ORDER.map(() => null)).map((run, index) => {
            const name = run?.agentName ?? AGENT_ORDER[index];

            return (
              <button
                key={name}
                type="button"
                onClick={() => run && setSelectedAgentName(run.agentName)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  selectedAgent?.agentName === name
                    ? "border-blue-400/50 bg-blue-500/10"
                    : "border-white/10 bg-white/[0.025] hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-white">{name}</p>
                  {run ? (
                    <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase ${statusClass(run.status)}`}>
                      {run.status}
                    </span>
                  ) : (
                    <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase text-zinc-600">
                      Ready
                    </span>
                  )}
                </div>

                {run ? (
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-zinc-500">
                    <span>{run.score}/100</span>
                    <span>{(run.confidence * 100).toFixed(0)}%</span>
                    <span>{(run.latencyMs / 1000).toFixed(1)}s</span>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-zinc-600">Waiting for review</p>
                )}
              </button>
            );
          })}
        </div>

        {result?.memoryUsed && (
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Memory Vault</p>
              <span className={result.memoryUsed.used ? "text-xs text-blue-300" : "text-xs text-zinc-600"}>
                {result.memoryUsed.used ? `${result.memoryUsed.count} prior` : "new"}
              </span>
            </div>
            <p className="mt-3 text-xs leading-5 text-zinc-500">
              {result.memoryUsed.used
                ? result.memoryUsed.summary
                : "No prior memory found for this brand/platform."}
            </p>
          </div>
        )}

        {selectedAgent && (
          <div className="mt-5 space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Executive verdict</p>
              <p className="mt-3 text-sm leading-6 text-zinc-300">{selectedAgent.summary}</p>
            </div>

            <div className="space-y-3">
              {selectedAgent.violations.slice(0, 3).map((violation) => (
                <div key={`${selectedAgent.agentName}-${violation.title}`} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-white">{violation.title}</p>
                    <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase ${severityClass(violation.severity)}`}>
                      {violation.severity}
                    </span>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-zinc-500">{violation.evidence}</p>
                  <p className="mt-3 text-xs leading-5 text-blue-100/70">{violation.suggestedFix}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-3">
              {selectedAgent.suggestedFixes.slice(0, 2).map((fix) => (
                <div key={`${selectedAgent.agentName}-${fix.priority}-${fix.fix}`} className="rounded-2xl border border-blue-400/15 bg-blue-500/[0.055] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-blue-300">Fix {fix.priority}</p>
                  <p className="mt-2 text-sm leading-6 text-white">{fix.fix}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-3 text-xs leading-5 text-zinc-500">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <p className="mb-2 uppercase tracking-[0.2em] text-zinc-600">Before</p>
                {selectedAgent.beforeAfter.before}
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <p className="mb-2 uppercase tracking-[0.2em] text-zinc-600">After</p>
                {selectedAgent.beforeAfter.after}
              </div>
            </div>
          </div>
        )}
      </aside>
    </form>
  );
}
