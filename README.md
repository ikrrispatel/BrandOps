# BrandOps — Multi-Agent Brand Compliance Engine

BrandOps is a hackathon demo product that reviews creative assets against brand guidelines using an OpenInfer-backed agent workflow.

Companies upload brand context and a creative asset. BrandOps returns a brand compliance score, violations, suggested fixes, before/after guidance, inference trace, and persistent brand memory.

## Demo Flow

1. Upload brand context:
   - Brand name
   - Target audience
   - Platform
   - Campaign goal
   - Brand guide text or file

2. Upload a creative image.

3. Run Brand Review.

4. BrandOps returns:
   - Overall score
   - Brand Consistency agent verdict
   - Violations
   - Suggested fixes
   - Before / After guidance
   - Multi-agent inference trace
   - Brand Memory Vault context on repeat reviews

## Core Features

### Live OpenInfer Agent

BrandOps runs a real OpenInfer-backed Brand Consistency agent using the OpenInfer Responses API.

The agent reviews the uploaded creative asset against the provided brand guide and campaign context.

### Inference Trace

Each run stores and displays execution metadata:

- Agent name
- Model
- Latency
- Status
- Confidence
- Demo cost marker

### Brand Memory Vault

BrandOps remembers compact prior review context for the same brand and platform.

On future reviews, the agent receives prior issues and fixes so it does not treat every asset as a blank slate.

Stored memory includes:

- Brand name
- Platform
- Target audience
- Campaign goal
- Prior score
- Prior violations
- Prior suggested fixes

BrandOps does not store image base64, raw prompts, secrets, or full uploaded files in memory.

## Architecture

```txt
User Input
  -> Review Object
  -> MongoDB Persistence
  -> OpenInfer Brand Consistency Agent
  -> Agent Output Validation
  -> Agent Run Storage
  -> Brand Memory Vault
  -> Results Dashboard

```

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- MongoDB
- OpenInfer Responses API

## Important Routes

- `POST /api/reviews`
  - Creates a review object from form data and uploaded creative asset.

- `POST /api/reviews/[id]/run`
  - Runs the Brand Consistency agent.
  - Retrieves Brand Memory Vault context.
  - Saves agent output and memory.
  - Returns score, violations, fixes, trace, and memory metadata.

## Environment Variables

Required locally and in deployment:

```txt
OPENINFER_API_KEY=...
MONGODB_URI=...
MONGODB_DB=...
```

Do not expose secrets in client code.

## Hackathon Positioning

BrandOps is not a generic AI image generator.

It is agentic creative QA infrastructure for brand teams: a system that reviews assets, explains violations, recommends fixes, exposes inference traces, and remembers prior brand context.
