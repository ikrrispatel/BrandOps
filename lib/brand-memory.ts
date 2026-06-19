import type { Collection, Db } from "mongodb";

export type BrandMemoryDocument = {
  brandName: string;
  brandNameNormalized: string;
  platform: string;
  platformNormalized: string;
  targetAudience: string;
  campaignGoal: string;
  score: number;
  confidence: number;
  violationTitles: string[];
  suggestedFixes: string[];
  createdAt: Date;
};

export type BrandMemoryContext = {
  used: boolean;
  count: number;
  summary: string;
  recurringViolations: string[];
  lastScore: number | null;
};

type GetBrandMemoryInput = {
  brandName: string;
  platform: string;
};

type SaveBrandMemoryInput = {
  brandName: string;
  platform: string;
  targetAudience: string;
  campaignGoal: string;
  score: number;
  confidence: number;
  violations: { title: string }[];
  suggestedFixes: { fix: string }[];
};

function normalizeMemoryKey(value: string) {
  return value.trim().toLowerCase();
}

function memoryCollection(db: Db): Collection<BrandMemoryDocument> {
  return db.collection<BrandMemoryDocument>("brandMemories");
}

function compactStrings(values: string[], limit: number) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const cleaned = value.trim();

    if (!cleaned) {
      continue;
    }

    const key = normalizeMemoryKey(cleaned);

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(cleaned);

    if (result.length >= limit) {
      break;
    }
  }

  return result;
}

function findRecurringViolationTitles(memories: BrandMemoryDocument[]) {
  const counts = new Map<string, { title: string; count: number }>();

  for (const memory of memories) {
    for (const title of memory.violationTitles) {
      const cleaned = title.trim();

      if (!cleaned) {
        continue;
      }

      const key = normalizeMemoryKey(cleaned);
      const current = counts.get(key);

      counts.set(key, {
        title: current?.title ?? cleaned,
        count: (current?.count ?? 0) + 1,
      });
    }
  }

  return Array.from(counts.values())
    .filter((item) => item.count > 1)
    .map((item) => item.title)
    .slice(0, 3);
}

export async function getBrandMemoryContext(
  db: Db,
  input: GetBrandMemoryInput,
): Promise<BrandMemoryContext> {
  const brandNameNormalized = normalizeMemoryKey(input.brandName);
  const platformNormalized = normalizeMemoryKey(input.platform);

  if (!brandNameNormalized || !platformNormalized) {
    return {
      used: false,
      count: 0,
      summary: "",
      recurringViolations: [],
      lastScore: null,
    };
  }

  const memories = await memoryCollection(db)
    .find({ brandNameNormalized, platformNormalized })
    .sort({ createdAt: -1 })
    .limit(5)
    .toArray();

  if (memories.length === 0) {
    return {
      used: false,
      count: 0,
      summary: "",
      recurringViolations: [],
      lastScore: null,
    };
  }

  const latestMemory = memories[0];
  const recurringViolations = findRecurringViolationTitles(memories);

  const fallbackIssues = compactStrings(
    memories.flatMap((memory) => memory.violationTitles),
    3,
  );

  const priorFixes = compactStrings(
    memories.flatMap((memory) => memory.suggestedFixes),
    3,
  );

  const issueList =
    recurringViolations.length > 0 ? recurringViolations : fallbackIssues;

  const issueSentence =
    issueList.length > 0 ? `Known issues: ${issueList.join(", ")}.` : "";

  const fixSentence =
    priorFixes.length > 0 ? `Prior fixes: ${priorFixes.join(", ")}.` : "";

  return {
    used: true,
    count: memories.length,
    summary: [
      `Brand Memory Vault: ${memories.length} prior ${
        memories.length === 1 ? "review" : "reviews"
      } found for ${latestMemory.brandName} on ${latestMemory.platform}.`,
      `Last score: ${latestMemory.score}.`,
      issueSentence,
      fixSentence,
    ]
      .filter(Boolean)
      .join(" "),
    recurringViolations,
    lastScore: latestMemory.score,
  };
}

export async function saveBrandMemory(
  db: Db,
  input: SaveBrandMemoryInput,
): Promise<void> {
  const brandName = input.brandName.trim();
  const platform = input.platform.trim();

  if (!brandName || !platform) {
    return;
  }

  const violationTitles = compactStrings(
    input.violations.map((violation) => violation.title),
    3,
  );

  const suggestedFixes = compactStrings(
    input.suggestedFixes.map((suggestedFix) => suggestedFix.fix),
    3,
  );

  await memoryCollection(db).insertOne({
    brandName,
    brandNameNormalized: normalizeMemoryKey(brandName),
    platform,
    platformNormalized: normalizeMemoryKey(platform),
    targetAudience: input.targetAudience.trim(),
    campaignGoal: input.campaignGoal.trim(),
    score: input.score,
    confidence: input.confidence,
    violationTitles,
    suggestedFixes,
    createdAt: new Date(),
  });
}
