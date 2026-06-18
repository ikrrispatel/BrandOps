# ARCHITECTURE.md — BrandOps: Multi-Agent Brand Compliance Engine

---

## Chosen Stack and Why

| Technology | Choice | Reason |
|---|---|---|
| Framework | Next.js 14+ App Router | Full-stack in one repo; API routes handle all server logic; no separate backend needed |
| Language | TypeScript | Type safety on agent output schemas is non-negotiable given multi-agent JSON parsing |
| Styling | Tailwind CSS | Utility-first; fast to iterate in a hackathon; no context switching |
| UI Components | shadcn/ui | Pre-built accessible components; consistent design system out of the box |
| Database | MongoDB Atlas or local MongoDB | Sponsor alignment; flexible document schema matches agent output shape well |
| AI API | OpenInfer Responses API | Required by hackathon; streaming-only responses API |
| Image handling | Base64 in-memory | Avoids storing raw assets; required for OpenInfer multimodal input format |
| State | React state + fetch | No Redux or Zustand needed; keep client state local to components |
| No LangChain | N/A | Adds complexity with no benefit at this scale; use direct OpenInfer calls |
| No queues | N/A | Agents run in parallel via `Promise.allSettled`; simple and reliable for demo |

---

## Folder Structure

```
brandops/
├── app/
│   ├── page.tsx                        # Upload / setup screen
│   ├── review/
│   │   └── [id]/
│   │       └── page.tsx                # Agent running + results dashboard
│   └── api/
│       └── reviews/
│           ├── route.ts                # POST /api/reviews — create review
│           └── [id]/
│               ├── route.ts            # GET /api/reviews/[id] — fetch review + agent runs
│               └── run/
│                   └── route.ts        # POST /api/reviews/[id]/run — run agents
├── components/
│   ├── upload-form.tsx                 # Brand guide + image upload + metadata form
│   ├── agent-status-list.tsx           # Real-time agent running status indicators
│   ├── score-card.tsx                  # Individual agent score display card
│   ├── results-dashboard.tsx           # Overall score + all cards + violations
│   ├── violations-table.tsx            # Tabular violations list with severity
│   └── agent-trace-table.tsx           # Agent trace: model, latency, cost, raw output
├── lib/
│   ├── openinfer.ts                    # Single OpenInfer streaming wrapper
│   ├── agents.ts                       # Agent definitions and prompt construction
│   ├── scoring.ts                      # Score weighting and cap logic
│   ├── mongodb.ts                      # Single MongoDB client module
│   ├── validation.ts                   # File type, size, text length validation
│   ├── types.ts                        # All shared TypeScript types and interfaces
│   └── demo-fallback.ts               # Clearly labeled synthetic fallback data
├── .env.local                          # Never read, printed, edited, or committed
├── .gitignore                          # Must include .env.local
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── PRD.md
├── ARCHITECTURE.md
├── AI_RULES.md
└── PLAN.md
```

---

## Data Flow

```
Browser (client)
    |
    | 1. User submits form (brand guide text + image file + metadata)
    |
    v
POST /api/reviews                          [server-side]
    |
    | 2. Validate inputs (type, size, length)
    | 3. Convert image to base64 string
    | 4. Compute assetHash (SHA-256 of base64) — for dedup reference only
    | 5. Create reviews document in MongoDB (status: "pending")
    | 6. Return { reviewId }
    |
    v
Browser redirects to /review/[id]
    |
    | 7. Page loads; client calls POST /api/reviews/[id]/run
    |
    v
POST /api/reviews/[id]/run                 [server-side]
    |
    | 8. Fetch review record from MongoDB
    | 9. Reconstruct base64 image from session (or accept re-upload via body)
    | 10. Run 4 agents in parallel via Promise.allSettled:
    |       - Brand Consistency Agent  → openinfer.ts (multimodal)
    |       - Accessibility Agent      → openinfer.ts (multimodal)
    |       - Visual Hierarchy Agent   → openinfer.ts (multimodal)
    |       - Risk Agent               → openinfer.ts (text or multimodal)
    | 11. Parse each agent's JSON output; validate schema
    | 12. Compute overall score via scoring.ts
    | 13. Write agent_runs documents to MongoDB
    | 14. Update reviews document (status: "completed", scores, completedAt)
    | 15. Return aggregated results
    |
    v
GET /api/reviews/[id]                      [server-side]
    |
    | 16. Fetch review + agent_runs from MongoDB
    | 17. Return combined result shape
    |
    v
Browser renders results dashboard + agent trace table
```

**Note on image passing:** The creative image is sent from browser → POST /api/reviews as a form field. The server converts it to base64, stores only the hash and mime type in MongoDB, and keeps the base64 string in memory for the duration of the run request. The base64 data is passed directly to the /run handler in the same request body (or cached briefly in server memory). Raw image bytes are never written to disk or stored in MongoDB.

---

## API Routes

### `POST /api/reviews`
- **Input:** FormData — `brandName`, `targetAudience`, `platform`, `campaignGoal`, `brandGuideText`, `creativeAsset` (file)
- **Server actions:**
  1. Validate file type and size
  2. Validate brand guide text length
  3. Convert image to base64
  4. Compute SHA-256 hashes
  5. Insert `reviews` document (status: `"pending"`)
- **Output:** `{ reviewId: string, assetBase64: string }` — base64 is returned to client temporarily so the /run route can receive it
- **Errors:** 400 on validation failure, 500 on DB error

### `GET /api/reviews/[id]`
- **Input:** Path param `id`
- **Server actions:**
  1. Fetch `reviews` document by `_id`
  2. Fetch all `agent_runs` documents by `reviewId`
- **Output:** Combined `ReviewResult` shape
- **Errors:** 404 if not found, 500 on DB error

### `POST /api/reviews/[id]/run`
- **Input:** JSON body — `{ assetBase64: string, assetMimeType: string, brandGuideText: string }` (metadata fetched from DB)
- **Server actions:**
  1. Fetch review metadata from MongoDB
  2. Run 4 agents in parallel (`Promise.allSettled`)
  3. Parse and validate each agent JSON output
  4. Compute overall score
  5. Insert 4 `agent_runs` documents
  6. Update `reviews` document to `"completed"`
- **Output:** Full `ReviewResult` shape
- **Errors:** 404 if review not found, 500 on agent failure (falls back to demo data if `DEMO_MODE=true`)

---

## MongoDB Collections

### Collection: `reviews`

```typescript
{
  _id: ObjectId,
  brandName: string,
  targetAudience: string,
  platform: string,
  campaignGoal: string,
  brandGuidePreview: string,     // First 500 chars only
  brandGuideHash: string,        // SHA-256
  assetName: string,
  assetMimeType: string,
  assetHash: string,             // SHA-256 of base64
  overallScore: number | null,
  status: "pending" | "running" | "completed" | "failed",
  createdAt: Date,
  completedAt: Date | null,
}
```

### Collection: `agent_runs`

```typescript
{
  _id: ObjectId,
  reviewId: ObjectId,
  agentName: string,
  model: string,
  score: number,
  confidence: number,
  summary: string,
  violations: Violation[],
  suggestedFixes: SuggestedFix[],
  beforeAfter: { before: string, after: string },
  latencyMs: number,
  estimatedCost: string,         // Placeholder string e.g. "$0.008"
  status: "completed" | "failed",
  rawOutputPreview: string,      // First 500 chars of raw model output
  errorMessage: string | null,
  createdAt: Date,
}
```

### Indexes
- `agent_runs.reviewId` — basic index for lookup by review

---

## OpenInfer Wrapper Design (`lib/openinfer.ts`)

Single exported async function:

```typescript
async function callOpenInfer(options: {
  systemPrompt: string;
  userText: string;
  imageBase64?: string;
  imageMimeType?: string;
}): Promise<{ text: string; latencyMs: number }>
```

**Internals:**
- Reads `OPENINFER_API_KEY` from `process.env` — server-side only
- Endpoint: `https://studio.openinfer.io/openai/v1/responses`
- Model: `@oi/beta`
- Always sends `"stream": true`
- For text-only input: sends `input` as a string
- For multimodal input: sends `input` as a message array with `input_image` and `input_text` content parts
- Reads the SSE stream, accumulates `response.output_text.delta` events
- Resolves on `response.completed` event
- Records `latencyMs` from call start to completion
- Never logs image data, API keys, or full prompt content
- Throws a typed error on API failure; caller handles fallback

---

## Agent Orchestration Design (`lib/agents.ts`)

Four agent definitions, each exporting:

```typescript
type AgentRunner = (input: AgentInput) => Promise<AgentOutput>
```

Where `AgentInput` includes: `brandGuideText`, `assetBase64`, `assetMimeType`, `brandName`, `targetAudience`, `platform`, `campaignGoal`.

**Agent list:**
1. `brandConsistencyAgent` — compares visual asset to brand guide; checks colors, fonts, logo usage, tone
2. `accessibilityAgent` — evaluates contrast ratios, text size readability, alt-text implications, WCAG signals
3. `visualHierarchyAgent` — evaluates layout, focal point, CTA prominence, information hierarchy
4. `riskAgent` — scans for claims, superlatives, compliance risk phrases, platform policy concerns

**Orchestrator in `/run` route:**
```typescript
const results = await Promise.allSettled([
  brandConsistencyAgent(input),
  accessibilityAgent(input),
  visualHierarchyAgent(input),
  riskAgent(input),
])
```

Each agent:
1. Builds a system prompt with role definition and strict JSON-only output instruction
2. Calls `callOpenInfer` with multimodal input
3. Strips any markdown code fences from the raw output
4. Parses JSON
5. Validates schema against `AgentOutput` type
6. Returns result or throws with descriptive error

Agents are independent; failure of one does not block others. `Promise.allSettled` ensures all complete (or fail gracefully) before scoring.

---

## Scoring Logic (`lib/scoring.ts`)

```
overallScore =
  0.30 * brandConsistency
  + 0.25 * accessibility
  + 0.25 * visualHierarchy
  + 0.20 * risk
```

**Risk cap:** If `risk < 60`, cap `overallScore` at `70`.

**Status labels:**

| Score | Label |
|---|---|
| 90–100 | Publish-Ready |
| 75–89 | Mostly Strong |
| 60–74 | Needs Revision |
| 40–59 | Significant Issues |
| 0–39 | Not Ready to Publish |

---

## Error Handling Strategy

- All API routes return typed error responses: `{ error: string, code: string }`
- Agent failures are caught individually; failed agents write an `agent_runs` record with `status: "failed"` and an `errorMessage`
- If an agent fails, its score is excluded from the weighted average (denominators adjust)
- If all agents fail, the review is marked `status: "failed"`
- Malformed JSON from model: log the raw output prefix (non-sensitive) and throw; do not silently return a zero score
- DB connection failures bubble up as 500 errors with generic client message; full error logged server-side only

---

## Fallback Demo Strategy (`lib/demo-fallback.ts`)

- Activated by `DEMO_MODE=true` in environment OR when `callOpenInfer` throws
- Returns clearly labeled synthetic `AgentOutput` objects for all four agents
- Synthetic data is realistic (scores, violations, fixes) but marked with `// DEMO FALLBACK` in code
- A `isDemoFallback: true` flag is included in the API response so the UI can display a banner
- Demo fallback is never silently injected; it is always opt-in or clearly error-triggered

---

## Security Architecture

| Concern | Approach |
|---|---|
| API key exposure | `OPENINFER_API_KEY` in `.env.local` only; read server-side in `lib/openinfer.ts` only |
| Client-side secrets | Zero `NEXT_PUBLIC_*` secrets; API routes are the only external callers |
| Image storage | Base64 in memory only; hash stored in DB for reference; no disk write |
| Brand guide storage | First 500 chars stored as preview; full text never persisted; hash stored |
| Input validation | `lib/validation.ts` enforces mime type, file size, text length before any processing |
| Logging | Server logs include agent name, latency, status; never log base64 data, prompts, or keys |
| MongoDB | Connection string in `.env.local`; single client instance in `lib/mongodb.ts` |
| .env | Never read, printed, modified, or committed in any file or script |

---

## What Must Stay Server-Side

- All calls to `lib/openinfer.ts`
- All calls to `lib/mongodb.ts`
- All environment variable reads (`OPENINFER_API_KEY`, `MONGODB_URI`)
- Image-to-base64 conversion
- Agent JSON parsing and validation
- Score computation
- Any logging that includes model output or user input

---

## What May Run Client-Side

- Form state and validation UX (visual feedback only; re-validated server-side)
- Polling or fetching review status from `/api/reviews/[id]`
- Rendering score cards, violations table, agent trace table from API response
- Image preview (object URL from uploaded file, never re-uploaded to client)

---

## Deployment Assumptions

- **Hackathon demo:** Run locally with `npm run dev`
- **MongoDB:** MongoDB Atlas free tier OR local `mongod` instance
- **Environment:** Node.js 18+; `.env.local` with `OPENINFER_API_KEY` and `MONGODB_URI`
- **No Docker required** for hackathon demo
- **No Vercel deployment required** for hackathon (local demo is sufficient)
- If time permits: deploy to Vercel with environment variables set in dashboard
