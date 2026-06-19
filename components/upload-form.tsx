"use client";

import Image from "next/image";
import { useState } from "react";

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

type RunResponse = {
  reviewId: string;
  status: string;
  overallScore: number;
  agentRun: AgentRun;
};

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

export default function UploadForm() {
  const [brandName, setBrandName] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [platform, setPlatform] = useState("");
  const [campaignGoal, setCampaignGoal] = useState("");
  const [brandGuide, setBrandGuide] = useState("");
  const [brandGuideFile, setBrandGuideFile] = useState<File | null>(null);
  const [creativeAsset, setCreativeAsset] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");
  const [fileError, setFileError] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState("");
  const [result, setResult] = useState<RunResponse | null>(null);

  const handleTextUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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

    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!creativeAsset) {
      setFileError("Creative image is required.");
      return;
    }

    setIsRunning(true);
    setRunError("");
    setResult(null);

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
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="brandName" className="mb-1 block text-sm font-medium">
            Brand Name *
          </label>
          <input
            id="brandName"
            type="text"
            value={brandName}
            onChange={(event) => setBrandName(event.target.value)}
            required
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="OpenInfer"
          />
        </div>

        <div>
          <label htmlFor="targetAudience" className="mb-1 block text-sm font-medium">
            Target Audience *
          </label>
          <input
            id="targetAudience"
            type="text"
            value={targetAudience}
            onChange={(event) => setTargetAudience(event.target.value)}
            required
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="AI builders and hackathon judges"
          />
        </div>

        <div>
          <label htmlFor="platform" className="mb-1 block text-sm font-medium">
            Platform *
          </label>
          <select
            id="platform"
            value={platform}
            onChange={(event) => setPlatform(event.target.value)}
            required
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a platform</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="Website">Website</option>
            <option value="Mobile App">Mobile App</option>
            <option value="Email">Email</option>
            <option value="Social Media">Social Media</option>
          </select>
        </div>

        <div>
          <label htmlFor="campaignGoal" className="mb-1 block text-sm font-medium">
            Campaign Goal *
          </label>
          <input
            id="campaignGoal"
            type="text"
            value={campaignGoal}
            onChange={(event) => setCampaignGoal(event.target.value)}
            required
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Show that BrandOps reviews creative assets with agent traces"
          />
        </div>

        <div>
          <label htmlFor="brandGuideText" className="mb-1 block text-sm font-medium">
            Brand Guide *
          </label>
          <textarea
            id="brandGuideText"
            value={brandGuide}
            onChange={(event) => setBrandGuide(event.target.value)}
            required
            rows={4}
            className="w-full resize-none rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Brand voice: technical, premium, infrastructure-focused, concise, confident. Visual style: dark, sharp, modern, high contrast."
          />
        </div>

        <div>
          <label htmlFor="textUpload" className="mb-1 block text-sm font-medium">
            Optional Brand Guide (.txt)
          </label>
          <input
            id="textUpload"
            type="file"
            accept=".txt,text/plain"
            onChange={handleTextUpload}
            className="block w-full cursor-pointer text-xs text-gray-500 file:mr-2 file:rounded-md file:bg-blue-100 file:text-sm file:font-medium hover:file:bg-blue-200"
          />
        </div>

        <div>
          <label htmlFor="imageUpload" className="mb-1 block text-sm font-medium">
            Creative Image *
          </label>
          <input
            id="imageUpload"
            type="file"
            accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
            onChange={handleImageUpload}
            required
            className={`block w-full cursor-pointer text-xs ${
              fileError ? "text-red-500 file:text-red-600" : "text-gray-500"
            } file:mr-2 file:rounded-md file:bg-purple-100 file:text-sm file:font-medium hover:file:bg-purple-200`}
          />
        </div>

        {fileError && <p className="text-xs text-red-600">{fileError}</p>}

        {imagePreviewUrl && (
          <div className="relative overflow-hidden rounded-lg border bg-black/5 p-2">
            <Image
              src={imagePreviewUrl}
              alt="Uploaded creative preview"
              width={900}
              height={500}
              unoptimized
              className="max-h-64 w-full rounded object-contain"
            />
          </div>
        )}

        {creativeAsset && (
          <p className="text-xs text-gray-500">
            Creative uploaded: {creativeAsset.name} ({(creativeAsset.size / 1024).toFixed(1)} KB)
          </p>
        )}

        <button
          type="submit"
          disabled={isRunning}
          className="rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isRunning ? "Running BrandOps agents..." : "Run Brand Review"}
        </button>

        {runError && (
          <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {runError}
          </p>
        )}
      </form>

      {result && (
        <section className="space-y-5 rounded-xl border bg-white p-5 text-black shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">BrandOps Review</p>
              <h2 className="text-2xl font-semibold">Overall Score: {result.overallScore}/100</h2>
            </div>
            <div className="rounded-full bg-gray-900 px-3 py-1 text-xs font-medium text-white">
              {result.status}
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold">{result.agentRun.agentName}</h3>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">
                Score {result.agentRun.score}/100
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-gray-700">{result.agentRun.summary}</p>
          </div>

          <div>
            <h3 className="mb-2 text-lg font-semibold">Violations</h3>
            <div className="space-y-3">
              {result.agentRun.violations.map((violation) => (
                <div key={violation.title} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-semibold">{violation.title}</h4>
                    <span className="rounded-full bg-red-50 px-2 py-1 text-xs uppercase text-red-700">
                      {violation.severity}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-700">{violation.evidence}</p>
                  <p className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">Why it matters:</span> {violation.whyItMatters}
                  </p>
                  <p className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">Suggested fix:</span> {violation.suggestedFix}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-lg font-semibold">Suggested Fixes</h3>
            <div className="space-y-2">
              {result.agentRun.suggestedFixes.map((fix) => (
                <div key={`${fix.priority}-${fix.fix}`} className="rounded-lg border p-4">
                  <p className="font-medium">
                    Priority {fix.priority}: {fix.fix}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">{fix.expectedImpact}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold">Before</h3>
              <p className="mt-2 text-sm text-gray-700">{result.agentRun.beforeAfter.before}</p>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold">After</h3>
              <p className="mt-2 text-sm text-gray-700">{result.agentRun.beforeAfter.after}</p>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-lg font-semibold">Inference Trace</h3>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Agent</th>
                    <th className="px-4 py-3">Model</th>
                    <th className="px-4 py-3">Latency</th>
                    <th className="px-4 py-3">Cost</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-3">{result.agentRun.agentName}</td>
                    <td className="px-4 py-3">{result.agentRun.model}</td>
                    <td className="px-4 py-3">{(result.agentRun.latencyMs / 1000).toFixed(1)}s</td>
                    <td className="px-4 py-3">{result.agentRun.estimatedCost}</td>
                    <td className="px-4 py-3">{result.agentRun.status}</td>
                    <td className="px-4 py-3">
                      {(result.agentRun.confidence * 100).toFixed(0)}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {result.agentRun.errorMessage && (
            <p className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
              Agent warning: {result.agentRun.errorMessage}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
