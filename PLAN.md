# PLAN.md — BrandOps Build Plan

**STRICT RULE: Complete exactly one step at a time. Stop after each step. Wait for human approval before proceeding to the next step. Do not read ahead and implement future steps. Do not parallelize steps. Update this file after each completed step.**

---

## Step Status Legend

- `[ ]` Not started
- `[~]` In progress
- `[x]` Complete

---

## Step 0 — Confirm Repo State and Environment Assumptions

**Status:** `[ ]`

### Goal
Verify the project scaffolding, Node.js version, and required environment variables are in place before writing any code. Ensure `npm run dev` can start (even with a blank app).

### Files Touched
- Read: `package.json`, `tsconfig.json`, `next.config.*`, `tailwind.config.*`
- Write: None (this step is read-only and confirmatory)
- Create: `.gitignore` if not present (must include `.env.local`)

### Actions
1. Confirm Node.js version is 18+.
2. Confirm Next.js App Router is the project structure (i.e., `app/` directory exists, not `pages/`).
3. Confirm Tailwind CSS is installed and configured.
4. Confirm TypeScript is configured.
5. Confirm `.env.local` is listed in `.gitignore`.
6. Report which shadcn/ui components are already available, if any.
7. Report whether MongoDB driver is installed (`mongodb` package).
8. Do NOT read, print, or display the contents of `.env.local`.
9. Do NOT install anything yet.

### Acceptance Criteria
- [ ] Node.js ≥ 18 confirmed
- [ ] App Router structure confirmed (`app/` directory)
- [ ] Tailwind configured
- [ ] TypeScript configured
- [ ] `.env.local` in `.gitignore`
- [ ] Report of existing dependencies (mongodb, shadcn, etc.)

### Manual Test
Run `npm run dev` and confirm it starts without errors on the default page.

### Stop Condition
Stop and report findings. Wait for human to confirm or adjust before Step 1.

---

## Step 1 — Create App Shell and UI Layout

**Status:** `[ ]`

### Goal
Create the top-level layout with a consistent header/nav, set up global styles, and ensure the home page and review page routes exist and render without errors.

### Files Touched
- Create or modify: `app/layout.tsx`
- Create: `app/page.tsx` (placeholder content only)
- Create: `app/review/[id]/page.tsx` (placeholder content only)
- Modify: `tailwind.config.ts` if needed for custom tokens

### Actions
1. Set up `app/layout.tsx` with: `<html>`, `<body>`, Tailwind base classes, a `<header>` with "BrandOps" name and tagline, and a `<main>` slot.
2. Create `app/page.tsx` with placeholder text: "Upload form goes here — Step 2."
3. Create `app/review/[id]/page.tsx` with placeholder text: "Results dashboard goes here — Step 9."
4. Ensure both routes render in the browser without TypeScript errors.
5. Do NOT add form logic, API calls, or state yet.

### Acceptance Criteria
- [ ] `npm run dev` starts cleanly
- [ ] `/` renders with the BrandOps header and placeholder text
- [ ] `/review/test-id` renders without a 500 error
- [ ] No TypeScript errors in the shell files
- [ ] Tailwind styles visible in the browser

### Manual Test
Visit `http://localhost:3000` and `http://localhost:3000/review/test-id`. Both should render without errors.

### Stop Condition
Stop and show the human the two rendered pages (describe what is visible). Wait for approval before Step 2.

---

## Step 2 — Build Upload / Setup Form with Local State

**Status:** `[ ]`

### Goal
Build the complete upload form UI with all fields, client-side state, and basic validation feedback. No API calls yet — form submits to a console.log only.

### Files Touched
- Modify: `app/page.tsx` — replace placeholder with real form
- Create: `components/upload-form.tsx`

### Actions
1. Create `components/upload-form.tsx` as a client component (`"use client"`).
2. Fields: brand name (text), target audience (text), platform (select: Instagram, Facebook, LinkedIn, Twitter/X, Email, Other), campaign goal (text), brand guide (textarea for paste OR file upload for .txt), creative asset (file upload: PNG, JPEG, WebP only, with client-side mime type check).
3. Show file name and size after upload.
4. Show image preview using `URL.createObjectURL` after image is selected.
5. "Run Review" button — on click, log form state to console. Do NOT call any API.
6. Basic required field validation: show inline error messages for empty required fields.
7. Import and render `<UploadForm />` in `app/page.tsx`.

### Acceptance Criteria
- [ ] All form fields render correctly
- [ ] Platform select has all six options
- [ ] Image preview appears after file selection
- [ ] Non-image files rejected with a visible error message
- [ ] Required field errors appear on submit attempt
- [ ] Console.log shows correct form state on submit
- [ ] No TypeScript errors

### Manual Test
Fill in the form, upload an image, click Run Review, and confirm all state is logged correctly. Try uploading a PDF — confirm it is rejected.

### Stop Condition
Stop and describe the form UI and console output to the human. Wait for approval before Step 3.

---

## Step 3 — Define Shared TypeScript Types and Validation

**Status:** `[ ]`

### Goal
Define all shared TypeScript types in one file and build the server-side validation module. This step has no UI changes — it is pure TypeScript infrastructure.

### Files Touched
- Create: `lib/types.ts`
- Create: `lib/validation.ts`

### Actions

**`lib/types.ts`:**
Define and export the following interfaces/types:
- `CampaignMetadata` — brandName, targetAudience, platform, campaignGoal
- `Violation` — title, severity (`"low" | "medium" | "high"`), evidence, whyItMatters, suggestedFix
- `SuggestedFix` — priority, fix, expectedImpact
- `BeforeAfter` — before, after
- `AgentOutput` — full required schema (agentName, score, confidence, summary, violations, suggestedFixes, beforeAfter)
- `AgentRunRecord` — full MongoDB `agent_runs` document shape
- `ReviewRecord` — full MongoDB `reviews` document shape
- `ReviewResult` — combined API response: review + agentRuns
- `AgentInput` — brandGuideText, assetBase64, assetMimeType, plus CampaignMetadata fields
- `RunReviewResponse` — overallScore, status, agentRuns, isDemoFallback

**`lib/validation.ts`:**
- `validateImageFile(file: File): { valid: boolean; error?: string }` — checks mime type and size (max 5MB)
- `validateBrandGuideText(text: string): { valid: boolean; error?: string }` — checks length (max 20,000 chars, min 10 chars)
- `validateCampaignMetadata(meta: Partial<CampaignMetadata>): { valid: boolean; errors: string[] }` — checks required fields
- `validateAgentOutput(raw: unknown): raw is AgentOutput` — type guard validating all required fields and types

### Acceptance Criteria
- [ ] `lib/types.ts` exports all listed types with no TypeScript errors
- [ ] `lib/validation.ts` exports all four validation functions
- [ ] `validateAgentOutput` correctly returns false for `null`, `{}`, missing fields, wrong types
- [ ] `validateImageFile` correctly rejects `application/pdf` and files over 5MB
- [ ] No `any` types used without a comment explaining why

### Manual Test
Write or run a quick type-check: `npx tsc --noEmit`. Confirm zero errors.

### Stop Condition
Stop and confirm `tsc --noEmit` is clean. Wait for approval before Step 4.

---

## Step 4 — Build MongoDB Connection and Review Persistence

**Status:** `[ ]`

### Goal
Build the MongoDB client module and implement the POST /api/reviews route that creates a review record. Prove MongoDB is connected by creating a real review document.

### Files Touched
- Create: `lib/mongodb.ts`
- Create: `app/api/reviews/route.ts`

### Actions

**`lib/mongodb.ts`:**
- Export a singleton `getMongoClient()` function that returns a connected `MongoClient`
- Use `MONGODB_URI` from `process.env` (never log it)
- Use connection caching to avoid reconnecting on every request (standard Next.js pattern)
- Export `getDb()` convenience function

**`app/api/reviews/route.ts` (POST handler):**
1. Accept FormData: metadata fields + brand guide text + creative asset file
2. Call `validateImageFile`, `validateBrandGuideText`, `validateCampaignMetadata` — return 400 on failure
3. Convert image file to base64 string
4. Compute SHA-256 hash of base64 and of brand guide text (use Node.js `crypto`)
5. Insert a `reviews` document with status `"pending"`
6. Return `{ reviewId, assetBase64, assetMimeType }` — base64 returned temporarily so the run route can receive it
7. Do NOT call OpenInfer in this route
8. Do NOT store base64 in MongoDB

### Acceptance Criteria
- [ ] `lib/mongodb.ts` connects without errors (MONGODB_URI must be set in `.env.local`)
- [ ] POST `/api/reviews` returns `{ reviewId }` with a valid MongoDB ObjectId
- [ ] Review document appears in MongoDB with status `"pending"`
- [ ] Invalid file type returns 400
- [ ] Oversized brand guide returns 400
- [ ] No base64 data stored in MongoDB document

### Manual Test
Use curl or the browser's devtools Network tab to POST to `/api/reviews` with test FormData. Confirm the document in MongoDB (MongoDB Compass or Atlas UI).

### Stop Condition
Stop and confirm the MongoDB document is visible and correct. Wait for approval before Step 5.

---

## Step 5 — Build OpenInfer Streaming Wrapper

**Status:** `[ ]`

### Goal
Build the `lib/openinfer.ts` module that handles streaming SSE responses from the OpenInfer Responses API. Prove it works with a simple text-only test call.

### Files Touched
- Create: `lib/openinfer.ts`
- Create (temporary, delete after): `app/api/test-openinfer/route.ts` — simple test route

### Actions

**`lib/openinfer.ts`:**
1. Export `callOpenInfer(options: OpenInferOptions): Promise<{ text: string; latencyMs: number }>`
2. Read `OPENINFER_API_KEY` from `process.env` only — never expose to client
3. Endpoint: `https://studio.openinfer.io/openai/v1/responses`
4. Model: `@oi/beta`
5. Always send `"stream": true`
6. For text-only input (no image): `input` is a string
7. For multimodal input (image present): `input` is an array of `{ type: "input_image", image_url: "data:..." }` and `{ type: "input_text", text: "..." }` parts
8. Parse SSE stream: accumulate text from events where `type === "response.output_text.delta"`
9. Resolve on `response.completed` event
10. Record `latencyMs` from call start to completion signal
11. Never log image data, API key, or full prompt
12. Throw a typed `OpenInferError` on HTTP error or stream failure

**Test route (temporary):**
- POST `/api/test-openinfer` with `{ prompt: string }`
- Calls `callOpenInfer` with text-only input
- Returns `{ text, latencyMs }`
- Delete this route before Step 6 is marked complete

### Acceptance Criteria
- [ ] `callOpenInfer` returns a non-empty string and a positive `latencyMs`
- [ ] Streaming works (response accumulates correctly from SSE deltas)
- [ ] A multimodal call (with a small test image) also works
- [ ] Error from bad API key returns a typed `OpenInferError`, not an unhandled rejection
- [ ] No API key in any source file
- [ ] Test route deleted before step is marked done

### Manual Test
POST to `/api/test-openinfer` with `{ "prompt": "Say hello in 5 words." }`. Confirm the response text and a latency value in the JSON response.

### Stop Condition
Stop and show the human the API response from the test call. Wait for approval before Step 6. Delete the test route.

---

## Step 6 — Build One Brand Consistency Agent End-to-End

**Status:** `[ ]`

### Goal
Build the full pipeline for one agent: prompt construction → OpenInfer call → JSON parsing → validation → database write. Prove the entire end-to-end chain works before building all four agents.

### Files Touched
- Create: `lib/agents.ts` (Brand Consistency Agent only)
- Create: `app/api/reviews/[id]/run/route.ts` (one-agent version)
- Create: `app/api/reviews/[id]/route.ts` (GET handler)

### Actions

**`lib/agents.ts` (Brand Consistency Agent only):**
1. Define `AgentInput` type (imported from `lib/types.ts`)
2. Build `brandConsistencyAgent(input: AgentInput): Promise<AgentOutput>`
3. System prompt: role = brand compliance specialist; instructs model to return ONLY valid JSON matching the `AgentOutput` schema; no extra text, no markdown fences
4. User message content: multimodal — brand guide text + image
5. Call `callOpenInfer`
6. Strip markdown code fences from raw output
7. Parse JSON with `JSON.parse`
8. Validate with `validateAgentOutput` from `lib/validation.ts`
9. Throw descriptive error on failure

**`app/api/reviews/[id]/run/route.ts` (POST — one agent):**
1. Accept `{ assetBase64, assetMimeType, brandGuideText }` in request body
2. Fetch review metadata from MongoDB
3. Run only `brandConsistencyAgent` (all four in Step 7)
4. Write one `agent_runs` document
5. Update `reviews` document to status `"completed"`, set `overallScore` temporarily to the agent score
6. Return the `ReviewResult` shape

**`app/api/reviews/[id]/route.ts` (GET):**
1. Fetch `reviews` document by `_id`
2. Fetch all `agent_runs` by `reviewId`
3. Return combined `ReviewResult`

### Acceptance Criteria
- [ ] Brand Consistency Agent returns valid `AgentOutput` JSON
- [ ] `agent_runs` document written to MongoDB with correct fields
- [ ] `reviews` document updated to `"completed"`
- [ ] GET `/api/reviews/[id]` returns the review + one agent run
- [ ] Malformed JSON from model is caught and throws a typed error (test by temporarily breaking the prompt)
- [ ] No `any` types; no secrets in source code

### Manual Test
Run the full flow: create a review via POST `/api/reviews`, then POST to `/api/reviews/[id]/run` with base64 + brand guide. Check MongoDB for both documents. GET `/api/reviews/[id]` and confirm the response shape.

### Stop Condition
Stop and show the human the MongoDB agent_run document and the GET response. Wait for approval before Step 7.

---

## Step 7 — Build Four-Agent Orchestrator

**Status:** `[ ]`

### Goal
Add the remaining three agents, run all four in parallel via `Promise.allSettled`, and handle partial failures gracefully.

### Files Touched
- Modify: `lib/agents.ts` — add Accessibility, Visual Hierarchy, Risk agents
- Modify: `app/api/reviews/[id]/run/route.ts` — run all four agents

### Actions

**`lib/agents.ts` — add three agents:**

`accessibilityAgent`:
- Focus: contrast ratios, text size readability, visual text hierarchy signals, WCAG AA signals
- Multimodal input

`visualHierarchyAgent`:
- Focus: focal point, CTA prominence, information hierarchy, clutter, white space
- Multimodal input

`riskAgent`:
- Focus: superlatives, unverifiable claims, platform policy risk phrases, legal/compliance language
- Can be text-focused (brand guide + any visible text in image description context)
- Multimodal input

Each agent follows the same structure as `brandConsistencyAgent`.

**`app/api/reviews/[id]/run/route.ts` — orchestrator:**
1. Run all four agents with `Promise.allSettled`
2. For each settled result:
   - If `fulfilled`: write `agent_runs` doc with `status: "completed"`
   - If `rejected`: write `agent_runs` doc with `status: "failed"`, `errorMessage` set, `score: 0`
3. Import `computeOverallScore` from `lib/scoring.ts` (stub only — full scoring in Step 8)
4. Update `reviews` document with `overallScore` and `status: "completed"`
5. Return full `ReviewResult`

### Acceptance Criteria
- [ ] All four agents run and return valid outputs
- [ ] `Promise.allSettled` used — one failure does not crash the others
- [ ] Four `agent_runs` documents in MongoDB after a run
- [ ] Failed agent writes a `"failed"` status doc with error message
- [ ] Response includes all four agent results
- [ ] `latencyMs` recorded for each agent individually

### Manual Test
Run a full review end-to-end. Check MongoDB for all four `agent_runs` documents. Temporarily break one agent's prompt to confirm the others still succeed.

### Stop Condition
Stop and show the human all four MongoDB agent documents. Wait for approval before Step 8.

---

## Step 8 — Build Scoring Logic and Status Labels

**Status:** `[ ]`

### Goal
Implement the weighted scoring formula, the risk cap, and status label assignment in a dedicated module.

### Files Touched
- Create: `lib/scoring.ts`
- Modify: `app/api/reviews/[id]/run/route.ts` — replace scoring stub with real call

### Actions

**`lib/scoring.ts`:**

```
computeOverallScore(scores: {
  brandConsistency: number;
  accessibility: number;
  visualHierarchy: number;
  risk: number;
}): number
```

Formula:
```
overallScore = (0.30 * brandConsistency) + (0.25 * accessibility) + (0.25 * visualHierarchy) + (0.20 * risk)
if risk < 60: overallScore = Math.min(overallScore, 70)
Round to nearest integer.
```

Handle missing scores (failed agents): exclude from weighted average (adjust denominator).

```
getStatusLabel(score: number): string
```

| Score | Label |
|---|---|
| 90–100 | Publish-Ready |
| 75–89 | Mostly Strong |
| 60–74 | Needs Revision |
| 40–59 | Significant Issues |
| 0–39 | Not Ready to Publish |

```
getStatusColor(score: number): string
```
Returns a Tailwind color class string for use in the UI.

### Acceptance Criteria
- [ ] `computeOverallScore` returns the correct weighted score for known inputs
- [ ] Risk cap correctly limits score to 70 when risk < 60
- [ ] Failed agents (score 0) handled without crashing
- [ ] `getStatusLabel` returns correct label for boundary values (60, 75, 90)
- [ ] `getStatusColor` returns a usable Tailwind class string
- [ ] `reviews` document updated with real computed score

### Manual Test
Write a quick unit test inline (console.log assertions) for `computeOverallScore` with: all 100s, all 50s, risk=55 with others=80. Confirm expected outputs.

### Stop Condition
Stop and show the scoring test results. Wait for approval before Step 9.

---

## Step 9 — Build Results Dashboard

**Status:** `[ ]`

### Goal
Build the full results UI: overall score, status label, per-agent score cards, violations table, suggested fixes, and before/after recommendation panel.

### Files Touched
- Modify: `app/review/[id]/page.tsx` — replace placeholder with full results page
- Create: `components/score-card.tsx`
- Create: `components/results-dashboard.tsx`
- Create: `components/violations-table.tsx`
- Create: `components/agent-status-list.tsx`

### Actions

**`components/score-card.tsx`:**
- Props: `agentName`, `score`, `confidence`, `summary`, `status`
- Shows: agent name, score (large number), confidence bar or badge, summary text, status color

**`components/violations-table.tsx`:**
- Props: `violations: Violation[]`
- Table with columns: Severity (badge), Title, Evidence, Why It Matters, Suggested Fix
- Severity color coding: red=high, yellow=medium, blue=low

**`components/results-dashboard.tsx`:**
- Props: `ReviewResult`
- Shows: overall score (large, color-coded), status label, four `<ScoreCard>` components, `<ViolationsTable>`, suggested fixes list (ordered by priority), before/after panel (two-column card), image preview (if available)

**`app/review/[id]/page.tsx`:**
- Server component: fetches from `/api/reviews/[id]`
- If review is `"pending"` or `"running"`: shows agent status list with running indicators
- If review is `"completed"`: shows `<ResultsDashboard>`
- If review is `"failed"`: shows error state

**`components/agent-status-list.tsx`:**
- Shows four agents with status icons: pending (gray spinner), running (animated), completed (green check), failed (red X)
- Props: list of agent statuses
- Used on the review page while agents are running

### Acceptance Criteria
- [ ] Full results page renders for a completed review
- [ ] Overall score displays correctly with status label and color
- [ ] Four score cards render per-agent data
- [ ] Violations table shows all violations with correct severity badges
- [ ] Suggested fixes list ordered by priority
- [ ] Before/after panel visible
- [ ] Image preview visible (if assetMimeType provided)
- [ ] Pending/running state shows agent status indicators
- [ ] No TypeScript errors

### Manual Test
Run a full review end-to-end. Navigate to `/review/[id]`. Confirm the results dashboard renders with real data.

### Stop Condition
Stop and describe (or screenshot-describe) the rendered dashboard. Wait for approval before Step 10.

---

## Step 10 — Build Agent Trace Table

**Status:** `[ ]`

### Goal
Add the agent trace section to the results page showing model, latency, cost placeholder, confidence, status, and raw output preview.

### Files Touched
- Create: `components/agent-trace-table.tsx`
- Modify: `components/results-dashboard.tsx` — include trace table
- Modify: `app/api/reviews/[id]/run/route.ts` — ensure `estimatedCost` placeholder is set

### Actions

**`components/agent-trace-table.tsx`:**
- Props: `agentRuns: AgentRunRecord[]`
- Table columns: Agent Name, Model, Latency (ms), Est. Cost, Status, Confidence, Raw Output Preview (truncated to 200 chars, monospace, expandable)
- Status badge: green for completed, red for failed
- Cost column: display `estimatedCost` string (e.g., `"~$0.008"`) — clearly labeled as placeholder

**Cost placeholder calculation in `/run` route:**
- Simple formula: `latencyMs / 1000 * 0.01` formatted as `"~$X.XXX"` — clearly marked `// PLACEHOLDER COST ESTIMATE`
- No real token counting; this is a demo display value

**Raw output preview:**
- Stored as `rawOutputPreview` in MongoDB: first 500 chars of the raw model string
- Display first 200 chars in the table; show "Expand" toggle for the rest

### Acceptance Criteria
- [ ] Trace table renders for all four agents
- [ ] Latency values are real (measured from OpenInfer wrapper)
- [ ] Cost column shows a placeholder value clearly marked as estimated
- [ ] Status badges correct for completed/failed agents
- [ ] Raw output preview truncated and expandable
- [ ] Table is readable and scannable

### Manual Test
Run a full review. Scroll to the agent trace table. Confirm all four rows appear with real latency numbers and the raw output preview.

### Stop Condition
Stop and confirm the trace table renders correctly. Wait for approval before Step 11.

---

## Step 11 — Add Fallback Demo Mode

**Status:** `[ ]`

### Goal
Build the demo fallback module so the app works reliably in a live demo even if the OpenInfer API is unavailable or slow. Clearly label all fallback data.

### Files Touched
- Create: `lib/demo-fallback.ts`
- Modify: `app/api/reviews/[id]/run/route.ts` — add fallback trigger
- Modify: `components/results-dashboard.tsx` — add fallback banner

### Actions

**`lib/demo-fallback.ts`:**
- Export `getDemoAgentOutputs(): AgentOutput[]` — returns realistic but clearly synthetic outputs for all four agents
- All demo scores should produce an interesting overall score (~65-72, "Needs Revision" range — most useful for demo storytelling)
- All data marked with `// DEMO FALLBACK` in comments
- Export `DEMO_FALLBACK_LATENCIES: Record<string, number>` — realistic fake latency values

**`/run` route update:**
- If `process.env.DEMO_MODE === "true"` OR if `callOpenInfer` throws after one retry: use demo fallback
- Include `isDemoFallback: true` in the response
- Still write agent_runs documents to MongoDB (with `status: "completed"` and fallback data)

**UI banner:**
- In `components/results-dashboard.tsx`: if `isDemoFallback` is true, show a yellow banner: "⚠️ Demo Mode: Results generated from synthetic fallback data. OpenInfer API unavailable."

### Acceptance Criteria
- [ ] Setting `DEMO_MODE=true` in `.env.local` triggers fallback mode
- [ ] Fallback produces all four agent outputs with valid schemas
- [ ] UI banner appears when fallback is active
- [ ] MongoDB documents still written in fallback mode
- [ ] `isDemoFallback: true` present in API response
- [ ] Fallback data produces a "Needs Revision" range score (~65)

### Manual Test
Set `DEMO_MODE=true`. Run a full review. Confirm fallback banner appears and results look realistic.

### Stop Condition
Stop and confirm fallback mode works and banner is visible. Wait for approval before Step 12.

---

## Step 12 — Polish UI and Demo Flow

**Status:** `[ ]`

### Goal
Refine the UI to be presentation-ready: clean layout, proper loading states, smooth transitions, mobile-readable (not mobile-first, but not broken), and compelling for a 5-minute demo.

### Files Touched
- Modify: `app/layout.tsx` — final header/footer polish
- Modify: `app/page.tsx` — hero text, upload form refinements
- Modify: `app/review/[id]/page.tsx` — loading state, polling if needed
- Modify any component as needed for visual polish
- Do NOT add new features

### Actions
1. Add a concise hero line above the upload form: "Brand QA for creative teams. Upload your asset and brand guide. Get a readiness score in seconds."
2. Ensure the Run Review button has a loading state while the review is being created.
3. Review page: if status is `"pending"`, auto-poll GET `/api/reviews/[id]` every 2 seconds until `"completed"` or `"failed"`.
4. Add a final "Review Another Asset" button on the results page that links back to `/`.
5. Score number styling: large, bold, color-coded (green ≥ 75, yellow 60–74, red < 60).
6. Violations table: ensure severity badges are visually distinct and table is scannable.
7. Agent trace table: ensure monospace raw output is readable.
8. Confirm there are no blank/white screens during loading transitions.
9. Do NOT add animations unless they are trivially simple.
10. Do NOT add auth, accounts, or any new features.

### Acceptance Criteria
- [ ] Hero text visible above the upload form
- [ ] Run Review button shows loading state
- [ ] Review page auto-polls and transitions from running to results
- [ ] Score color coding works for high, medium, and low ranges
- [ ] "Review Another Asset" link on results page
- [ ] No blank screens or unhandled states in the demo flow
- [ ] No TypeScript errors

### Manual Test
Run the complete user flow from home page to results page without touching the browser console. The flow should feel smooth and demo-ready.

### Stop Condition
Stop and confirm the end-to-end flow feels demo-ready. Wait for approval before Step 13.

---

## Step 13 — Final README and Demo Script Cleanup

**Status:** `[ ]`

### Goal
Write a concise README with setup instructions and create a demo script so anyone can run the demo confidently. Clean up any debug logs, test files, or TODO comments that should not be in the final demo.

### Files Touched
- Create or modify: `README.md`
- Delete: any temporary test routes (e.g., `/api/test-openinfer`)
- Modify: any file with leftover `console.log` debug statements

### Actions

**`README.md` must include:**
1. Project name and one-line description
2. What it does (evaluates, not generates)
3. Required environment variables: `OPENINFER_API_KEY`, `MONGODB_URI`, `DEMO_MODE` (optional)
4. Setup steps: clone → `npm install` → set `.env.local` → `npm run dev`
5. Demo walkthrough: exact steps to run the demo in 5 minutes
6. Stack summary (Next.js, TypeScript, Tailwind, MongoDB, OpenInfer)
7. Known limitations (hackathon MVP, no auth, placeholder costs)

**Cleanup:**
- Remove all `console.log` debug statements from route handlers and lib modules (keep `console.error` for genuine error paths)
- Remove any test routes
- Review all `// TODO` comments — move to README "Post-Hackathon" section or remove
- Confirm `.env.local` is not committed (check `.gitignore`)

### Acceptance Criteria
- [ ] README accurately describes setup in ≤ 10 steps
- [ ] Demo walkthrough is specific enough for someone else to follow
- [ ] No debug `console.log` remaining in production code paths
- [ ] No test routes remaining
- [ ] `.env.local` not committed
- [ ] `npm run dev` starts cleanly with a fresh clone and `.env.local` set
- [ ] Full demo flow works end-to-end one final time

### Manual Test
Follow the README setup steps from scratch (or simulate by confirming each step). Run the full demo flow. Confirm it is ready for a live presentation.

### Stop Condition
**This is the final step. BrandOps is demo-ready.**
Report completion to the human with a summary of: what was built, what is in scope, what is out of scope, and any known rough edges.

---

## Stretch Step A — Audience Fit Agent (Only if Step 13 is complete with time remaining)

**Status:** `[ ]`

Only implement if all 13 steps are complete, the demo works end-to-end, and there is at least 45 minutes remaining.

- Add `audienceFitAgent` to `lib/agents.ts`
- Update scoring to include a 5th agent (adjust weights accordingly)
- Add a 5th score card to the results dashboard
- Update MongoDB schema handling for a 5th agent run

Do not implement this stretch feature at the expense of demo stability.

---

## Progress Log

| Step | Status | Completed At | Notes |
|---|---|---|---|
| Step 0 | | | |
| Step 1 | | | |
| Step 2 | | | |
| Step 3 | | | |
| Step 4 | | | |
| Step 5 | | | |
| Step 6 | | | |
| Step 7 | | | |
| Step 8 | | | |
| Step 9 | | | |
| Step 10 | | | |
| Step 11 | | | |
| Step 12 | | | |
| Step 13 | | | |
