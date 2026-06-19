import UploadForm from "@/components/upload-form";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-400">
              OpenInfer Hackathon Demo
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-6xl">
              Brand compliance, reviewed by agents.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400">
              Upload brand context and a creative asset. BrandOps runs an OpenInfer-backed
              brand consistency agent, returns violations and fixes, and exposes inference
              traces for model, latency, confidence, and status.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <p className="text-sm font-semibold text-zinc-200">Demo pipeline</p>
            <div className="mt-4 grid gap-3 text-sm text-zinc-400">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                1. Brand guide + creative asset
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                2. OpenInfer agent review
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                3. Score, violations, fixes, trace
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 shadow-2xl">
          <UploadForm />
        </div>
      </section>
    </main>
  );
}
