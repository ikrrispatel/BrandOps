type OpenInferErrorCode =
  | "MISSING_API_KEY"
  | "INVALID_INPUT"
  | "HTTP_ERROR"
  | "STREAM_ERROR"
  | "MALFORMED_STREAM"
  | "EMPTY_OUTPUT";

export class OpenInferError extends Error {
  readonly code: OpenInferErrorCode;
  readonly status?: number;

  constructor(message: string, code: OpenInferErrorCode, status?: number) {
    super(message);
    this.name = "OpenInferError";
    this.code = code;
    this.status = status;
  }
}

type OpenInferContentPart =
  | { type: "input_text"; text: string }
  | { type: "input_image"; image_url: string };

type OpenInferMessage = {
  role: "user";
  content: OpenInferContentPart[];
};

export type RunOpenInferOptions = {
  prompt: string;
  instructions?: string;
  imageBase64?: string;
  imageMimeType?: string;
  temperature?: number;
  maxOutputTokens?: number;
};

export type OpenInferResult = {
  text: string;
  latencyMs: number;
};

const OPENINFER_URL =
  process.env.OPENINFER_BASE_URL || "https://platform.openinfer.io/v1/responses";

const MODEL = "@oi/beta";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function buildInput(options: RunOpenInferOptions): string | OpenInferMessage[] {
  const prompt = options.prompt.trim();

  if (!prompt) {
    throw new OpenInferError("Prompt is required", "INVALID_INPUT");
  }

  if (!options.imageBase64) {
    return prompt;
  }

  if (!options.imageMimeType?.startsWith("image/")) {
    throw new OpenInferError("Valid image MIME type is required", "INVALID_INPUT");
  }

  return [
    {
      role: "user",
      content: [
        {
          type: "input_image",
          image_url: `data:${options.imageMimeType};base64,${options.imageBase64}`,
        },
        {
          type: "input_text",
          text: prompt,
        },
      ],
    },
  ];
}

function readDelta(event: unknown): string | null {
  if (!isRecord(event)) return null;
  if (event.type !== "response.output_text.delta") return null;
  return typeof event.delta === "string" ? event.delta : null;
}

function isCompletedEvent(event: unknown): boolean {
  return isRecord(event) && event.type === "response.completed";
}

async function readErrorBody(response: Response): Promise<string> {
  try {
    return (await response.text()).slice(0, 500);
  } catch {
    return "";
  }
}

export async function runOpenInfer(
  options: RunOpenInferOptions,
): Promise<OpenInferResult> {
  const apiKey = process.env.OPENINFER_API_KEY;

  if (!apiKey) {
    throw new OpenInferError("OPENINFER_API_KEY is not set", "MISSING_API_KEY");
  }

  const startTime = Date.now();

  const payload = {
    model: MODEL,
    stream: true,
    input: buildInput(options),
    instructions: options.instructions,
    temperature: options.temperature,
    max_output_tokens: options.maxOutputTokens ?? 800,
  };

  const response = await fetch(OPENINFER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "text/event-stream",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await readErrorBody(response);
    throw new OpenInferError(
      `OpenInfer HTTP ${response.status}${body ? `: ${body}` : ""}`,
      "HTTP_ERROR",
      response.status,
    );
  }

  if (!response.body) {
    throw new OpenInferError("OpenInfer response had no stream body", "STREAM_ERROR");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";
  let text = "";
  let completed = false;

  try {
    while (!completed) {
      const { value, done } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      buffer = buffer.replace(/\r\n/g, "\n");

      let boundary = buffer.indexOf("\n\n");

      while (boundary !== -1) {
        const rawEvent = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);

        const dataLines = rawEvent
          .split("\n")
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trim());

        for (const data of dataLines) {
          if (!data) continue;
          if (data === "[DONE]") {
            completed = true;
            break;
          }

          let parsed: unknown;

          try {
            parsed = JSON.parse(data);
          } catch {
            throw new OpenInferError("Malformed SSE JSON", "MALFORMED_STREAM");
          }

          const delta = readDelta(parsed);
          if (delta !== null) text += delta;

          if (isCompletedEvent(parsed)) {
            completed = true;
            break;
          }
        }

        boundary = buffer.indexOf("\n\n");
      }
    }
  } catch (error) {
    if (error instanceof OpenInferError) throw error;

    throw new OpenInferError(
      error instanceof Error ? error.message : "OpenInfer stream failed",
      "STREAM_ERROR",
    );
  }

  const finalText = text.trim();

  if (!completed) {
    throw new OpenInferError("OpenInfer stream ended before completion", "MALFORMED_STREAM");
  }

  if (!finalText) {
    throw new OpenInferError("OpenInfer returned empty output", "EMPTY_OUTPUT");
  }

  return {
    text: finalText,
    latencyMs: Date.now() - startTime,
  };
}

export async function runOpenInferText(prompt: string): Promise<OpenInferResult> {
  return runOpenInfer({ prompt });
}
