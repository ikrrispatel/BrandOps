export interface CampaignMetadata {
  brandName: string;
  targetAudience: string;
  platform: "web" | "mobile" | "social" | "email";
  campaignGoal: string;
}

export interface Violation {
  ruleId: string;
  severity: "error" | "warning";
  message: string;
}

export interface SuggestedFix {
  suggestion: string;
  confidence: number;
}

export interface BeforeAfter {
  before?: string;
  after: string;
}

export type AgentOutput = Record<string, unknown> & {
  __brand: "AgentOutput";
};

export interface AgentRunRecord {
  agentId: string;
  timestamp: number;
  output: AgentOutput | null;
  error?: string;
}

export interface ReviewRecord {
  id: string;
  assetPath: string;
  violations: Violation[];
  suggestions: SuggestedFix[];
  agentRuns: AgentRunRecord[];
}

export type ReviewResult = "pass" | "fail" | "pending";

export interface ReviewRecordWithResult extends ReviewRecord {
  result: ReviewResult;
}

export interface AgentInput {
  assetPath?: string;
  metadata?: CampaignMetadata;
  brandGuideText?: string;
}

export type RunReviewResponse = BeforeAfter & {
  violations: Violation[];
  suggestions: SuggestedFix[];
};
