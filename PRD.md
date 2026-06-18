# PRD.md — BrandOps: Multi-Agent Brand Compliance Engine

---

## Project Summary

BrandOps is a multi-agent brand compliance engine for creative teams. Users upload or paste a brand guide and upload a creative asset (ad, social post, screenshot, or product image). Four specialized AI agents evaluate the asset for brand consistency, accessibility, visual hierarchy, and marketing/compliance risk. The system returns an overall readiness score, per-agent scores, violations, suggested fixes, before/after recommendations, and a full agent trace showing latency, model, status, estimated cost, and raw output previews.

**Hackathon:** OpenInfer Hackathon
**Build window:** 6–7 hours
**Positioning:** "SonarQube for brand/design quality" — evaluates creative assets, not generates them.

---

## Problem

Creative teams publish assets that violate their own brand guidelines, fail accessibility standards, bury key messages, or carry compliance risk — often because review is slow, manual, and inconsistent. There is no fast, structured QA layer between "asset created" and "asset published."

Most AI tools in this space are generators. BrandOps is a **reviewer**: it reads what you have, compares it to what you said you wanted, and tells you whether it is ready to publish.

---

## Target Users

- **Primary:** In-house creative/marketing teams at SMBs or agencies
- **Secondary:** Solo designers and freelancers managing brand standards
- **Hackathon demo persona:** A marketing manager who uploads a draft social ad before sending it to the client

---

## Hackathon Goals

1. Demonstrate real multi-agent orchestration using the OpenInfer Responses API.
2. Show that cost, latency, routing, and traceability are product features, not implementation details.
3. Produce a polished, demo-ready MVP that works end-to-end in a live presentation.
4. Use MongoDB for persistence as a sponsor-aligned choice.
5. Differentiate from "builder" tools by being a quality gate, not a content generator.

---

## MVP User Flow

1. User lands on the home page.
2. User fills in: brand name, target audience, platform, campaign goal.
3. User pastes or uploads a brand guide (text or file).
4. User uploads a creative image (PNG, JPEG, or WebP).
5. User clicks **Run Review**.
6. System creates a review record in MongoDB and redirects to the review page.
7. Review page shows four agents running in real time with status indicators.
8. As each agent completes, its score card updates.
9. Once all agents finish, the results dashboard renders:
   - Overall readiness score + status label
   - Four per-agent score cards
   - Violations table
   - Suggested fixes list
   - Before/after recommendation panel
   - Uploaded image preview
10. Agent trace table shows model, latency, confidence, estimated cost, and raw output preview.
11. Review is persisted; user can return to the URL.

---

## In-Scope Features (MVP)

- Brand guide input: paste text or upload a text file (extracted as string)
- Creative asset input: PNG, JPEG, or WebP image upload
- Campaign metadata form: brand name, audience, platform, goal
- Four AI agents: Brand Consistency, Accessibility, Visual Hierarchy, Risk
- Per-agent JSON output conforming to the required schema
- Overall weighted readiness score with risk cap
- Results dashboard: score, status, violations, fixes, before/after
- Agent trace table: name, model, latency, cost placeholder, status, confidence, raw output preview
- MongoDB persistence: `reviews` and `agent_runs` collections
- Demo fallback mode: clearly labeled synthetic data if API fails
- Single-page upload flow + per-review results page

---

## Out-of-Scope Features (Not MVP)

- User authentication or accounts
- Payments or billing
- Team workspaces or multi-user collaboration
- Asset generation or editing
- PDF brand guide parsing (MVP only accepts text/paste or plain text file)
- Version history or diff comparison between reviews
- Slack/Figma/CMS integrations
- Batch review of multiple assets
- Custom agent configuration
- Audience Fit Agent (stretch only)
- Real cost tracking (placeholder values only)
- Production-grade security hardening
- GDPR/SOC2/enterprise compliance

---

## Security and Privacy Boundaries

**These are hackathon MVP boundaries. This is not a production security posture.**

- No authentication in MVP.
- No API keys in client code or `NEXT_PUBLIC_*` environment variables.
- No hardcoded secrets anywhere in source code.
- `.env` file is never read, printed, edited, or committed.
- All OpenInfer API calls happen server-side only (API routes or server actions).
- Creative images are processed as base64 in memory and passed to OpenInfer; they are not stored on disk or in the database.
- Only review metadata, scores, violations, summaries, agent traces, filename, and file hash are stored in MongoDB.
- No full base64 image data, no raw uploaded file bytes, no full prompt content is logged.
- Brand guide text is trimmed to a maximum length before processing.
- File type validation: only `image/png`, `image/jpeg`, `image/webp` accepted.
- File size limit enforced server-side.
- Demo mode is clearly labeled in code and UI; fallback data is synthetic and never presented as real agent output.

---

## Success Criteria

| Criterion | Target |
|---|---|
| End-to-end flow works in live demo | Yes, no crash |
| All four agents run and return valid JSON | Yes |
| Overall score computed and displayed | Yes |
| Agent trace visible with latency data | Yes |
| MongoDB stores review + agent runs | Yes |
| Fallback demo mode works if API is down | Yes |
| UI is polished enough for a 5-minute demo | Yes |
| No secrets in client code | Yes |
| No hardcoded API keys | Yes |

---

## Demo Story

**Persona:** Maya, a marketing manager at a DTC brand.

Maya's team just finished a new Instagram ad for their summer product launch. Before sending it to the client for final approval, she uploads it to BrandOps along with the brand guide. In under 30 seconds, BrandOps runs four AI agents and tells her: the brand colors are mostly correct, but the CTA text is not in the approved brand font, the contrast ratio on the subtitle fails WCAG AA, the visual hierarchy buries the product name, and the promotional copy uses a vague superlative that could create compliance risk. She gets a readiness score of 61 — "Needs Revision" — with specific, actionable fixes. She fixes the issues before the client ever sees the draft.

**Demo talking points:**
- Multi-agent, not single prompt
- Evaluates, doesn't generate
- Latency and cost are visible product features
- MongoDB makes reviews persistent and auditable

---

## Stretch Features (Post-Hackathon or Time Permitting)

- Audience Fit Agent (5th agent, optional)
- PDF brand guide parsing
- Side-by-side image annotation overlay for violations
- Export review as PDF report
- Shareable review link with read-only view
- Figma plugin integration
- Real token-based cost tracking from OpenInfer response metadata

---

## What This Project Is Not

- **Not a content generator.** BrandOps does not write copy, generate images, or suggest new creative directions from scratch.
- **Not a design tool.** BrandOps does not edit or redraw assets.
- **Not an enterprise compliance platform.** It does not provide legal advice or regulatory compliance certification.
- **Not a production SaaS.** It is a hackathon MVP. Security, auth, payments, and scalability belong post-hackathon.
- **Not a fake dashboard.** All scores, violations, and agent outputs are real AI outputs from real inference. The fallback mode is clearly labeled as demo fallback.
- **Not overbuilt.** Every feature added beyond the hard MVP increases demo risk for zero presentation value.
