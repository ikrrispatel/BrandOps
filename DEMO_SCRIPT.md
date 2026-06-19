# BrandOps Demo Script

## 20-second pitch

BrandOps is a multi-agent brand compliance engine. A brand team uploads guidelines and a creative asset. BrandOps runs an OpenInfer-backed agent, returns a compliance score, violations, suggested fixes, before/after guidance, inference traces, and remembers prior review context through the Brand Memory Vault.

## Demo Steps

1. Open the BrandOps app.
2. Enter demo brand context.

Brand Name:
OpenInfer

Target Audience:
AI builders, startup founders, and hackathon judges

Platform:
LinkedIn

Campaign Goal:
Show that OpenInfer powers reliable multi-agent brand review with visible inference traces.

Brand Guide:
Brand voice: technical, confident, concise, and infrastructure-focused. Avoid generic AI hype.

Visual style: dark background, high contrast, clean spacing, sharp typography, electric blue accent, subtle glow. The design should feel premium, developer-first, and trustworthy.

Messaging rules:
- Lead with infrastructure value, not generic productivity claims.
- Mention agents, model routing, latency, traces, or reliability when relevant.
- Avoid vague phrases like "AI magic", "10x your workflow", "revolutionary", or "game changer".
- Keep copy short and precise.

Creative rules:
- Use strong hierarchy with one clear headline.
- Keep enough padding around the logo and main headline.
- Body text must be readable on dark backgrounds.
- Use blue accent sparingly.
- Do not overload the asset with too many claims.

3. Upload a creative image.
4. Click Run Brand Review.
5. Show:
   - Overall score
   - Brand Consistency summary
   - Violations
   - Suggested fixes
   - Before / After
   - Inference trace

## Memory Demo

Run the same brand and platform twice.

First run:
Brand Memory Vault should be empty or unused.

Second run:
The `/api/reviews/[id]/run` response should include `memoryUsed.used: true`.

Narration:
BrandOps does not review every asset from scratch. It stores compact prior brand review memory and retrieves it on future reviews for the same brand and platform.

## Judge-facing explanation

BrandOps combines:
- Agentic brand review
- OpenInfer-backed execution
- Inference trace visibility
- Persistent brand memory
- A productized workflow for creative compliance

The MVP runs one live Brand Consistency agent. The interface shows the planned multi-agent expansion: Accessibility, Legal/Risk, Visual Hierarchy, and Audience Fit.
