# BrandOps 🎯

> Multi-Agent Brand Compliance Engine

---

## What is it?

BrandOps is an AI-powered **brand compliance reviewer** for creative teams.

You give it your **brand guide** and a **creative asset** (ad, social post, image) — it tells you whether that asset is ready to publish.

It **evaluates**. It does not generate.

---

## The Problem

Creative teams publish assets that break their own brand rules, fail accessibility standards, or carry compliance risk — because review is slow, manual, and inconsistent. BrandOps is the QA gate between *"asset created"* and *"asset published."*

---

## Target Audience

- In-house creative and marketing teams at SMBs or agencies
- Solo designers managing brand standards
- Freelancers doing client work

---

## How It Works

1. Paste your brand guide + upload a creative image
2. Fill in: brand name, audience, platform, campaign goal
3. Click **Run Review**
4. Four AI agents analyze the asset in parallel
5. Get a readiness score, violations, and actionable fixes

---

## The Four Agents

| Agent | What It Checks |
|---|---|
| Brand Consistency | Colors, fonts, logo, tone vs. brand guide |
| Accessibility | Contrast, text size, WCAG AA signals |
| Visual Hierarchy | Layout, CTA placement, focal point |
| Risk | Vague claims, superlatives, policy concerns |

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | MongoDB |
| AI API | OpenInfer Responses API |

---

## Built For

OpenInfer Hackathon — 6–7 hour build window.
