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
};

export type BrandConsistencyRunResult = {
  output: AgentOutput;
  rawOutputPreview: string;
  latencyMs: number;
  status: "completed" | "failed";
  errorMessage: string | null;
};

function fallbackBrandConsistencyOutput(reason: string): AgentOutput {
  return {
    __brand: "AgentOutput",
    agentName: "Brand Consistency",
    score: 70,
    confidence: 0.35,
    summary: `Fallback result: BrandOps could not fully validate the model output. ${reason}`,
    violations: [
      {
        title: "Manual review recommended",
        severity: "medium",
        evidence: "The model response could not be safely parsed into the required agent schema.",
        whyItMatters: "Brand review results must be structured and traceable before launch.",
        suggestedFix: "Review the asset manually and rerun the Brand Consistency agent.",
      },
    ],
    suggestedFixes: [
      {
        priority: 1,
        fix: "Rerun the agent and verify the asset against the uploaded brand guide.",
        expectedImpact: "Improves reliability of the final brand compliance score.",
      },
    ],
    beforeAfter: {
      before: "Asset requires structured brand review.",
      after: "Asset should clearly align with brand tone, visual identity, platform, and campaign goal.",
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

function buildBrandConsistencyPrompt(input: BrandConsistencyInput): string {
  return `
You are the Brand Consistency agent for BrandOps.

Review the uploaded creative asset against the provided brand context. Evaluate whether the asset matches the brand identity, target audience, platform, and campaign goal.

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
  "agentName": "Brand Consistency",
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
- Be specific about visual style, copy, tone, audience fit, and platform fit.
- If the asset mostly aligns, still identify at least one improvement.
`.trim();
}

export async function runBrandConsistencyAgent(
  input: BrandConsistencyInput,
): Promise<BrandConsistencyRunResult> {
  try {
    const result = await runOpenInfer({
      prompt: buildBrandConsistencyPrompt(input),
      imageBase64: input.assetBase64,
      imageMimeType: input.assetMimeType,
      maxOutputTokens: 1200,
      temperature: 0.2,
    });

    const rawOutputPreview = result.text.slice(0, 500);
    const parsed = extractJsonObject(result.text);

    if (!validateAgentOutput(parsed)) {
      return {
        output: fallbackBrandConsistencyOutput("Invalid JSON schema returned by model."),
        rawOutputPreview,
        latencyMs: result.latencyMs,
        status: "failed",
        errorMessage: "Model output failed AgentOutput validation.",
      };
    }

    return {
      output: parsed as AgentOutput,
      rawOutputPreview,
      latencyMs: result.latencyMs,
      status: "completed",
      errorMessage: null,
    };
  } catch (error) {
    return {
      output: fallbackBrandConsistencyOutput(
        error instanceof Error ? error.message : "Unknown agent failure.",
      ),
      rawOutputPreview: "",
      latencyMs: 0,
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown agent failure.",
    };
  }
}
