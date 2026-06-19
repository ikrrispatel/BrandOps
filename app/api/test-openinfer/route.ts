import { NextRequest, NextResponse } from "next/server";
import { OpenInferError, runOpenInferText } from "@/lib/openinfer";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    if (!isRecord(body) || typeof body.prompt !== "string" || !body.prompt.trim()) {
      return NextResponse.json(
        { error: "Prompt is required", code: "INVALID_INPUT" },
        { status: 400 },
      );
    }

    const result = await runOpenInferText(body.prompt);

    return NextResponse.json({
      text: result.text,
      latencyMs: result.latencyMs,
    });
  } catch (error) {
    if (error instanceof OpenInferError) {
      const status =
        error.code === "INVALID_INPUT"
          ? 400
          : error.code === "MISSING_API_KEY"
            ? 500
            : error.status ?? 502;

      return NextResponse.json(
        { error: error.message, code: error.code },
        { status },
      );
    }

    console.error(
      "Unexpected OpenInfer test route error",
      error instanceof Error ? error.message : "Unknown error",
    );

    return NextResponse.json(
      { error: "Unexpected OpenInfer test failure", code: "UNEXPECTED_ERROR" },
      { status: 500 },
    );
  }
}
