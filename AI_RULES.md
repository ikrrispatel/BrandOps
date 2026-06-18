# AI_RULES.md — BrandOps Governance Rules for Claude Code

These rules are non-negotiable. They govern every action Claude Code takes on this project. Violating any rule requires explicit written approval from the human operator before proceeding.

---

## 1. Work Discipline

- **Work one step at a time.** Follow PLAN.md exactly. Do not begin the next step until the human confirms the current step is complete.
- **Do not jump ahead in PLAN.md.** Even if the next step seems trivial, stop and wait.
- **Do not assume approval.** Silence is not approval. A question is not approval. Only an explicit "proceed" or "approved" counts.
- **Stop after each PLAN.md step** and report: what was done, what files were created or modified, and what the acceptance criteria status is.
- **Update PLAN.md** after each completed step by marking it done with a completion note.
- **Do not parallelize steps** unless the step explicitly says to do so.

---

## 2. File and Repository Safety

- **Do not delete files without explicit approval.** State what you want to delete and why; wait for confirmation.
- **Do not rename or move files without explicit approval.**
- **Do not modify Git history** (no `git rebase`, `git reset --hard`, `git commit --amend`) without explicit approval.
- **Do not push to GitHub** without explicit approval. Never push on behalf of the user unless directly instructed.
- **Do not create files outside the project folder** unless explicitly asked.
- **Do not overwrite existing files** without reading them first and stating what will change.

---

## 3. Secrets and Environment

- **Never read, print, display, edit, or commit `.env`, `.env.local`, or any environment file.** These files are off-limits in every context.
- **Never place API keys, tokens, or secrets in any source code file.**
- **Never use `NEXT_PUBLIC_*` environment variables for secrets.** `NEXT_PUBLIC_*` variables are exposed to the browser. Secrets must never use this prefix.
- **Never hardcode any API key, database URI, or token** anywhere in the codebase.
- **Never log secrets.** If a secret must be referenced, use a placeholder like `[REDACTED]` in log messages.

---

## 4. API and Network Safety

- **Never call the OpenInfer API from browser/client components.** All OpenInfer calls must happen inside `lib/openinfer.ts` invoked only from server-side code (API routes or server actions).
- **Never expose the OpenInfer API key to the client bundle.**
- **Never call any external API directly from a React component** unless it is a read-only public endpoint with no authentication.
- **All sensitive API calls must go through Next.js API routes** (`app/api/...`) or server actions.
- **Keep all OpenInfer calls in `lib/openinfer.ts`** or the server-side route that invokes it. Do not duplicate the call logic elsewhere.

---

## 5. Dependency Management

- **Do not install npm packages without explicit approval.** List what you want to install and why; wait for the human to confirm.
- **Do not install packages as workarounds** for problems that can be solved with built-in Node.js or Next.js capabilities.
- **Do not upgrade existing packages** unless a bug blocks progress and you have explicit approval.
- **Do not add dev dependencies that require build-time tooling changes** without explaining the impact.

---

## 6. UI and Styling

- **Use one UI system only: Tailwind CSS + shadcn/ui-style components.** Do not introduce Bootstrap, Material UI, Chakra UI, Ant Design, or any other CSS framework.
- **Do not mix arbitrary CSS files with Tailwind** unless using a CSS module for a specific scoped purpose that cannot be done with Tailwind.
- **Do not add CSS animations or transitions** that are not critical to the demo UX.
- **Do not over-style.** The goal is "polished and clean," not "impressive animation showcase."

---

## 7. Scope Discipline

- **Do not add authentication** (JWT, sessions, OAuth, magic links, etc.) in the MVP.
- **Do not add payments or billing** in the MVP.
- **Do not add user accounts, workspaces, teams, or roles** in the MVP.
- **Do not add email sending** in the MVP.
- **Do not add the Audience Fit Agent** unless Step 12 is complete and time permits.
- **Do not add any feature not listed in PLAN.md** without explicit approval.
- **When in doubt, do less.** A working MVP beats an overbuilt broken demo every time.

---

## 8. AI Output Handling

- **Always validate agent JSON before trusting it.** Parse with try/catch. Never access `.score` or any field without confirming the parsed object matches the expected schema.
- **Handle malformed AI output explicitly.** If the model returns non-JSON, markdown-wrapped JSON, or an incomplete response, log the raw output prefix (no PII or full image data) and throw a typed error.
- **Strip markdown code fences before JSON parsing.** Models often wrap JSON in triple backticks. Always strip ` ```json ` and ` ``` ` before calling `JSON.parse`.
- **Do not silently return a default score** on parse failure. Fail loudly in logs; surface a meaningful error to the results dashboard.
- **Never trust the model to stay in schema.** Always validate that required fields (`agentName`, `score`, `violations`, etc.) are present and of the correct type.

---

## 9. Demo Fallback Rules

- **Add fallback demo data only in `lib/demo-fallback.ts`.** Never inline synthetic data in route handlers or components.
- **Always label fallback data clearly** in code with `// DEMO FALLBACK` comments.
- **Always include `isDemoFallback: true`** in the API response when fallback data is used.
- **Always display a UI banner** when demo fallback is active, so the reviewer knows the data is synthetic.
- **Never silently inject fallback data.** It must be triggered by an explicit condition: `DEMO_MODE=true` env var OR a caught API error.

---

## 10. Error Handling

- **Do not silently swallow errors.** Every catch block must either re-throw, log the error (without secrets), or return a typed error response.
- **Do not use empty catch blocks.** `catch (e) {}` is forbidden.
- **Log useful error information server-side:** agent name, error message, status code. Never log the full API key, full base64 image, full brand guide text, or user-identifying data.
- **Return typed error responses from API routes:** `{ error: string, code: string }` with appropriate HTTP status codes.
- **Do not let one agent failure crash the entire review.** Use `Promise.allSettled` for agent orchestration.

---

## 11. Code Quality

- **Keep functions small and typed.** If a function exceeds ~50 lines, it should probably be split.
- **Keep route handlers thin.** Route handlers call lib functions; they do not contain business logic.
- **Put all business logic in lib modules:** `lib/agents.ts`, `lib/scoring.ts`, `lib/validation.ts`, `lib/openinfer.ts`, `lib/mongodb.ts`.
- **Use TypeScript interfaces/types for all data shapes.** Define them in `lib/types.ts`. Do not use `any` except as a last resort, and document why.
- **Do not use `console.log` for debugging in production paths.** Use structured server logs or remove debug logs before marking a step complete.
- **Do not leave TODO comments** that reference unfinished security, auth, or payment features without clearly marking them `// POST-HACKATHON`.

---

## 12. Data Privacy

- **Do not store raw uploaded image bytes in MongoDB.**
- **Do not store the full brand guide text in MongoDB.** Store only a preview (first 500 chars) and a SHA-256 hash.
- **Do not log uploaded image data** at any log level.
- **Do not store or log full prompt content** sent to OpenInfer.
- **Store only:** review metadata, scores, violations, summaries, agent traces, filename, mime type, and hashes.

---

## 13. Demo Reliability First

- **Prefer demo reliability over architectural purity.** If a simpler approach reduces the risk of a live demo failure, choose the simpler approach.
- **Test the full user flow end-to-end** before marking any step as complete.
- **Do not leave broken UI states** (blank screens, uncaught promise rejections, unhandled loading states) at the end of any step.
- **Every step must leave the app in a runnable state.** Partial implementations that break `npm run dev` are not acceptable step completions.

---

## 14. Communication Rules

- **State clearly what you are about to do before doing it.**
- **Report what files were created or modified** at the end of every step.
- **Flag blockers immediately.** Do not attempt workarounds that violate these rules to avoid surfacing a problem.
- **Ask one question at a time** if clarification is needed. Do not ask multiple questions in a single message.
- **Do not reinterpret scope.** If the human's instruction is ambiguous, ask before acting.

---

## Summary Checklist (Before Every Action)

- [ ] Is this action in the current PLAN.md step?
- [ ] Does this action touch `.env`? → STOP.
- [ ] Does this action install a package? → Wait for approval.
- [ ] Does this action add auth/payments/accounts? → STOP.
- [ ] Does this action call OpenInfer from client code? → STOP.
- [ ] Does this action place a secret in source code? → STOP.
- [ ] Does this action log image data or full prompts? → STOP.
- [ ] Does this action leave the app in a broken state? → STOP.
- [ ] Have I validated AI JSON output before using it? → Required.
- [ ] Have I marked fallback data clearly? → Required if used.
