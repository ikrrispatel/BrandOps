import UploadForm from "@/components/upload-form";

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-black text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(59,130,246,0.22),transparent_32%),radial-gradient(circle_at_92%_28%,rgba(255,255,255,0.08),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.045),transparent_38%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/70 to-transparent" />
      </div>

      <section className="relative mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-5 py-5">
        <header className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <p className="text-lg font-semibold tracking-tight text-white">BrandOps</p>
            <p className="text-xs text-zinc-500">Multi-Agent Brand Compliance Engine</p>
          </div>

          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-emerald-300">
              OpenInfer Live
            </span>
            <span className="rounded-full border border-white/10 px-3 py-1">
              Five-agent review
            </span>
          </div>
        </header>

        <div className="flex flex-1 pt-5">
          <UploadForm />
        </div>
      </section>
    </main>
  );
}
