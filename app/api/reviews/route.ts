import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import type { CampaignMetadata } from "@/lib/types";
import {
  validateBrandGuideText,
  validateCampaignMetadata,
  validateImageFile,
} from "@/lib/validation";

function normalizePlatform(value: string): CampaignMetadata["platform"] {
  const platform = value.toLowerCase();

  if (platform.includes("email")) return "email";
  if (platform.includes("mobile")) return "mobile";
  if (
    platform.includes("instagram") ||
    platform.includes("facebook") ||
    platform.includes("linkedin") ||
    platform.includes("twitter") ||
    platform.includes("x") ||
    platform.includes("social")
  ) {
    return "social";
  }

  return "web";
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const rawPlatform = String(formData.get("platform") ?? "");

    const metadata: CampaignMetadata = {
      brandName: String(formData.get("brandName") ?? ""),
      targetAudience: String(formData.get("targetAudience") ?? ""),
      platform: normalizePlatform(rawPlatform),
      campaignGoal: String(formData.get("campaignGoal") ?? ""),
    };

    if (!validateCampaignMetadata(metadata)) {
      return NextResponse.json(
        { error: "Invalid campaign metadata", code: "INVALID_METADATA" },
        { status: 400 },
      );
    }

    const brandGuideText = String(formData.get("brandGuideText") ?? "");

    if (!validateBrandGuideText(brandGuideText)) {
      return NextResponse.json(
        { error: "Invalid brand guide text", code: "INVALID_BRAND_GUIDE" },
        { status: 400 },
      );
    }

    const creativeAsset = formData.get("creativeAsset");

    if (!(creativeAsset instanceof File)) {
      return NextResponse.json(
        { error: "Creative asset is required", code: "MISSING_ASSET" },
        { status: 400 },
      );
    }

    if (!validateImageFile(creativeAsset)) {
      return NextResponse.json(
        { error: "Invalid image file", code: "INVALID_IMAGE" },
        { status: 400 },
      );
    }

    const imageBuffer = Buffer.from(await creativeAsset.arrayBuffer());
    const assetBase64 = imageBuffer.toString("base64");

    const assetHash = createHash("sha256").update(assetBase64).digest("hex");
    const brandGuideHash = createHash("sha256").update(brandGuideText).digest("hex");

    const now = new Date();
    const db = await getDb();

    const insertResult = await db.collection("reviews").insertOne({
      ...metadata,
      originalPlatform: rawPlatform,
      brandGuidePreview: brandGuideText.slice(0, 500),
      brandGuideHash,
      assetName: creativeAsset.name,
      assetMimeType: creativeAsset.type,
      assetHash,
      overallScore: null,
      status: "pending",
      createdAt: now,
      completedAt: null,
    });

    return NextResponse.json({
      reviewId: insertResult.insertedId.toString(),
      assetBase64,
      assetMimeType: creativeAsset.type,
    });
  } catch (error) {
    console.error(
      "Create review failed",
      error instanceof Error ? error.message : "Unknown error",
    );

    return NextResponse.json(
      { error: "Failed to create review", code: "CREATE_REVIEW_FAILED" },
      { status: 500 },
    );
  }
}
