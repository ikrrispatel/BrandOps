import { CampaignMetadata } from "./types";

export const validateImageFile = (file: File): boolean => {
  const validTypes = ["image/png", "image/jpeg", "image/webp"];
  if (!validTypes.includes(file.type)) return false;
  if (file.size > 5 * 1024 * 1024) return false;
  return true;
};

export const validateBrandGuideText = (text: string): boolean => {
  const min = 10;
  const max = 20_000;
  if (text.length < min || text.length > max) return false;
  return true;
};

export const validateCampaignMetadata = (meta: Partial<CampaignMetadata>): meta is CampaignMetadata => {
  if (!meta.brandName?.trim()) return false;
  if (!meta.targetAudience?.trim()) return false;
  if (!["web", "mobile", "social", "email"].includes(meta.platform!)) return false;
  if (!meta.campaignGoal?.trim()) return false;
  return true;
};

export const validateAgentOutput = (raw: unknown): raw is Record<string, unknown> => {
  return typeof raw === "object" && raw !== null && "__brand" in raw;
};

