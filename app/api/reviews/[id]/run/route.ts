import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import { runBrandConsistencyAgent } from "@/lib/agents";
import { getDb } from "@/lib/mongodb";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid review id", code: "INVALID_REVIEW_ID" },
        { status: 400 },
      );
    }

    const body: unknown = await request.json();

    if (
      !isRecord(body) ||
      typeof body.assetBase64 !== "string" ||
      !body.assetBase64 ||
      typeof body.assetMimeType !== "string" ||
      !body.assetMimeType.startsWith("image/")
    ) {
      return NextResponse.json(
        { error: "assetBase64 and assetMimeType are required", code: "INVALID_INPUT" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const reviewObjectId = new ObjectId(id);

    const review = await db.collection("reviews").findOne({ _id: reviewObjectId });

    if (!review) {
      return NextResponse.json(
        { error: "Review not found", code: "REVIEW_NOT_FOUND" },
        { status: 404 },
      );
    }

    await db.collection("reviews").updateOne(
      { _id: reviewObjectId },
      { $set: { status: "running" } },
    );

    const agentResult = await runBrandConsistencyAgent({
      brandName: String(review.brandName ?? ""),
      targetAudience: String(review.targetAudience ?? ""),
      platform: String(review.originalPlatform ?? review.platform ?? ""),
      campaignGoal: String(review.campaignGoal ?? ""),
      brandGuidePreview: String(review.brandGuidePreview ?? ""),
      assetBase64: body.assetBase64,
      assetMimeType: body.assetMimeType,
    });

    const agentRun = {
      reviewId: id,
      agentName: agentResult.output.agentName,
      model: "@oi/beta",
      score: agentResult.output.score,
      confidence: agentResult.output.confidence,
      summary: agentResult.output.summary,
      violations: agentResult.output.violations,
      suggestedFixes: agentResult.output.suggestedFixes,
      beforeAfter: agentResult.output.beforeAfter,
      latencyMs: agentResult.latencyMs,
      estimatedCost: "demo",
      status: agentResult.status,
      rawOutputPreview: agentResult.rawOutputPreview.slice(0, 500),
      errorMessage: agentResult.errorMessage,
      createdAt: new Date(),
    };

    await db.collection("agentRuns").insertOne(agentRun);

    const finalStatus = "completed";
    const overallScore = agentResult.output.score;

    await db.collection("reviews").updateOne(
      { _id: reviewObjectId },
      {
        $set: {
          status: finalStatus,
          overallScore,
          completedAt: new Date(),
        },
      },
    );

    return NextResponse.json({
      reviewId: id,
      status: finalStatus,
      overallScore,
      agentRun,
    });
  } catch (error) {
    console.error(
      "Run Brand Consistency agent failed",
      error instanceof Error ? error.message : "Unknown error",
    );

    return NextResponse.json(
      { error: "Failed to run Brand Consistency agent", code: "RUN_AGENT_FAILED" },
      { status: 500 },
    );
  }
}
