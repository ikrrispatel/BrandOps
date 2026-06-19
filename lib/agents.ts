import { runOpenInfer } from "@/lib/openinfer";
import type { AgentOutput } from "@/lib/types";
import { validateAgentOutput } from "@/lib/validation";

export type BrandConsistencyInput = {
  brandName: string;
  targetAudience: string;
  platform: string;
  campaignGoal: string;
  brandGuidePreview: string;
  assetBase64: string;
  assetMimeType: string;
  brandMemorySummary?: string;
};

export type BrandConsistencyRunResult = {
  output: AgentOutput;
  rawOutputPreview: string;
  latencyMs: number;
  status: "completed" | "failed";
  errorMessage: string | null;
};

export type BrandOpsAgentName =
  | "Brand Consistency"
  | "Accessibility"
  | "Legal / Risk"
  | "Visual Hierarchy"
  | "Audience Fit";

const BRANDOPS_AGENT_NAMES: BrandOpsAgentName[] = [
  "Brand Consistency",
  "Accessibility",
  "Legal / Risk",
  "Visual Hierarchy",
  "Audience Fit",
];

const AGENT_FOCUS: Record<BrandOpsAgentName, string> = {
  "Brand Consistency":
    "Evaluate whether the asset matches the brand identity, tone, visual system, platform, and campaign goal.",
  Accessibility:
    "Evaluate readability, contrast, text legibility, visual accessibility, image clarity, and whether the creative can be understood quickly by a broad audience.",
  "Legal / Risk":
    "Evaluate potential brand safety, misleading claims, compliance risk, unsupported promises, unsafe language, and reputational risk. Do not provide legal advice; flag practical marketing risk.",
  "Visual Hierarchy":
    "Evaluate layout, spacing, typography, focal point, information hierarchy, logo placement, clutter, and whether the viewer understands the message in seconds.",
  "Audience Fit":
    "Evaluate whether the asset fits the target audience, platform expectations, campaign goal, message clarity, and buyer/user psychology.",
};

function fallbackAgentOutput(agentName: BrandOpsAgentName, reason: string): AgentOutput {
  return {
    __brand: "AgentOutput",
    agentName,
    score: 70,
    confidence: 0.35,
    summary: `Fallback result: BrandOps could not fully validate the ${agentName} model output. ${reason}`,
    violations: [
      {
        title: "Manual review recommended",
        severity: "medium",
        evidence: "The model response could not be safely parsed into the required agent schema.",
        whyItMatters: "Brand review results must be structured and traceable before launch.",
        suggestedFix: `Review the asset manually and rerun the ${agentName} agent.`,
      },
    ],
    suggestedFixes: [
      {
        priority: 1,
        fix: `Rerun the ${agentName} agent and verify the asset against the uploaded brand guide.`,
        expectedImpact: "Improves reliability of the final brand compliance score.",
      },
    ],
    beforeAfter: {
      before: "Asset requires structured brand review.",
      after: "Asset should clearly align with brand, audience, platform, and campaign goal.",
    },
  };
}

function stripMarkdownFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function extractJsonObject(text: string): unknown {
  const cleaned = stripMarkdownFences(text);

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start === -1 || end === -1 || end <= start) {
      throw new Error("No JSON object found in model output");
    }

    return JSON.parse(cleaned.slice(start, end + 1));
  }
}

function buildAgentPrompt(input: BrandConsistencyInput, agentName: BrandOpsAgentName): string {
  return `
You are the ${agentName} agent for BrandOps.

Agent focus:
${AGENT_FOCUS[agentName]}

Review the uploaded creative asset against the provided brand context.

Brand Memory Vault:
${input.brandMemorySummary || "No prior memory found for this brand/platform."}

Use this memory to avoid treating the asset as a blank slate. If memory mentions recurring violations, check whether they appear again. Do not invent account IDs, channel IDs, handles, or private metadata.

Brand context:
Brand name: ${input.brandName}
Target audience: ${input.targetAudience}
Platform: ${input.platform}
Campaign goal: ${input.campaignGoal}

Brand guide preview:
${input.brandGuidePreview}

Return strict JSON only. No markdown. No commentary.

Required JSON shape:
{
  "agentName": "${agentName}",
  "score": number,
  "confidence": number,
  "summary": string,
  "violations": [
    {
      "title": string,
      "severity": "low" | "medium" | "high",
      "evidence": string,
      "whyItMatters": string,
      "suggestedFix": string
    }
  ],
  "suggestedFixes": [
    {
      "priority": number,
      "fix": string,
      "expectedImpact": string
    }
  ],
  "beforeAfter": {
    "before": string,
    "after": string
  }
}

Rules:
- score must be 0-100.
- confidence must be 0-1.
- Be specific and practical.
- If the asset mostly aligns, still identify at least one improvement.
- Keep violations relevant to the ${agentName} agent focus.
`.trim();
}

export async function runBrandOpsAgent(
  input: BrandConsistencyInput,
  agentName: BrandOpsAgentName,
): Promise<BrandConsistencyRunResult> {
  try {
    const result = await runOpenInfer({
      prompt: buildAgentPrompt(input, agentName),
      imageBase64: input.assetBase64,
      imageMimeType: input.assetMimeType,
      maxOutputTokens: 1000,
      temperature: 0.2,
    });

    const rawOutputPreview = result.text.slice(0, 500);
    const parsed = extractJsonObject(result.text);

    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new Error("Model output JSON was not an object");
    }

    const brandedOutput = {
      ...parsed,
      agentName,
      __brand: "AgentOutput" as const,
    };

    if (!validateAgentOutput(brandedOutput)) {
      return {
        output: fallbackAgentOutput(agentName, "Invalid JSON schema returned by model."),
        rawOutputPreview,
        latencyMs: result.latencyMs,
        status: "failed",
        errorMessage: "Model output failed AgentOutput validation.",
      };
    }

    return {
      output: brandedOutput as AgentOutput,
      rawOutputPreview,
      latencyMs: result.latencyMs,
      status: "completed",
      errorMessage: null,
    };
  } catch (error) {
    return {
      output: fallbackAgentOutput(
        agentName,
        error instanceof Error ? error.message : "Unknown agent failure.",
      ),
      rawOutputPreview: "",
      latencyMs: 0,
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown agent failure.",
    };
  }
}

export async function runBrandConsistencyAgent(
  input: BrandConsistencyInput,
): Promise<BrandConsistencyRunResult> {
  return runBrandOpsAgent(input, "Brand Consistency");
}

export async function runAllBrandOpsAgents(
  input: BrandConsistencyInput,
): Promise<BrandConsistencyRunResult[]> {
  const results = await Promise.allSettled(
    BRANDOPS_AGENT_NAMES.map((agentName) => runBrandOpsAgent(input, agentName)),
  );

  return results.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    }

    return {
      output: fallbackAgentOutput(
        BRANDOPS_AGENT_NAMES[index],
        result.reason instanceof Error ? result.reason.message : "Unknown agent failure.",
      ),
      rawOutputPreview: "",
      latencyMs: 0,
      status: "failed",
      errorMessage: result.reason instanceof Error ? result.reason.message : "Unknown agent failure.",
    };
  });
}
