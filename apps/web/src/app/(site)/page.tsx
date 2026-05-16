import Link from "next/link";
import { ArrowRight, Eye, GitCompareArrows, MousePointerClick, Paintbrush } from "lucide-react";

const agentPanel = [
  { name: "Omar", role: "Revenue", verdict: "I can see the commercial idea. I still need the exact revenue leak and the next fix." },
  { name: "Leo", role: "Design", verdict: "The product stage is more memorable now. I want stronger hierarchy before I call it premium." },
  { name: "Ivy", role: "Low vision", verdict: "The contrast is mostly workable. The small labels still need to carry less meaning." },
  { name: "Maya", role: "Buyer", verdict: "I understand the promise faster. Show me one concrete before-and-after outcome." },
];

const useCases: Array<{ icon: React.ElementType; title: string; copy: string; image: string; alt: string }> = [
  {
    icon: MousePointerClick,
    title: "Find the moment people bounce",
    copy: "Critics land on the page, say what they think, and flag the exact step where motivation drops.",
    image: "/use-case-bounce.jpg",
    alt: "A funnel chart with a sharp drop-off highlighted in red, showing where users leave.",
  },
  {
    icon: Eye,
    title: "Catch ugly or unreadable UI",
    copy: "Low-vision and design critics call out tiny text, weak contrast, and anything hard to read.",
    image: "/use-case-ui.jpg",
    alt: "Side-by-side comparison of a website before and after contrast and typography fixes.",
  },
  {
    icon: GitCompareArrows,
    title: "Compare against better sites",
    copy: "Give Snoopy competitor pages and the critics explain where your site is behind, ahead, or different.",
    image: "/use-case-compare.jpg",
    alt: "Two website previews side by side with annotation arrows highlighting differences.",
  },
  {
    icon: Paintbrush,
    title: "Get the better version",
    copy: "Reports sketch the next screen: clearer headline, stronger proof, sharper offer, better hierarchy.",
    image: "/use-case-fix.jpg",
    alt: "A prioritised fix queue panel with numbered actionable recommendations.",
  },
];

export default function HomePage() {
  return (
    <main>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="px-4 pb-6 pt-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Eyebrow */}
          <p className="font-mono text-sm font-semibold uppercase tracking-widest text-amber-700">
            Website teardown
          </p>

          {/* Headline */}
          <h1 className="mt-4 max-w-4xl text-5xl font-semibold leading-[1.05] tracking-tight text-slate-950 text-balance sm:text-7xl">
            Your page goes in. The agents respond. A better page comes out.
          </h1>

          {/* Sub + CTA row */}
          <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl text-lg leading-relaxed text-slate-600">
              Named AI agents — each with a different motive — read your page, argue in public, and hand you a fix queue.
            </p>
            <div className="flex shrink-0 items-center gap-3">
              <Link
                href="/runs/new"
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-amber-800 transition-colors"
              >
                Run a teardown <ArrowRight size={15} />
              </Link>
              <Link
                href="/runs/demo"
                className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-100 transition-colors"
              >
                See demo
              </Link>
            </div>
          </div>

          {/* Hero product image */}
          <div className="mt-10 overflow-hidden rounded-2xl border border-black/10 shadow-md">
            <img
              src="/hero-product.jpg"
              alt="Snoopy agent panel showing four named AI critics — Omar, Leo, Ivy and Maya — each giving a different verdict on a webpage."
              className="w-full object-cover object-top"
            />
          </div>
        </div>
      </section>

      {/* ── Agent panel preview ──────────────────────────────────────── */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-sm font-semibold uppercase tracking-widest text-amber-700">Live output</p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-950">One page. Four perspectives.</h2>
            </div>
            <Link
              href="/runs/demo"
              className="hidden shrink-0 items-center gap-2 text-sm font-semibold text-slate-950 hover:text-amber-800 transition-colors sm:inline-flex"
            >
              Open full report <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {agentPanel.map((agent, i) => (
              <div
                key={agent.name}
                className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className={
                        i % 3 === 0
                          ? "size-2.5 rounded-full bg-red-300"
                          : i % 3 === 1
                            ? "size-2.5 rotate-45 bg-amber-300"
                            : "size-2.5 rounded-sm bg-sky-300"
                      }
                    />
                    <span className="text-sm font-semibold text-slate-950">{agent.name}</span>
                  </div>
                  <span className="rounded-full border border-black/10 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {agent.role}
                  </span>
                </div>
                <p className="mt-4 text-base leading-relaxed text-slate-700">&ldquo;{agent.verdict}&rdquo;</p>
              </div>
            ))}
          </div>

          {/* Stats bar */}
          <div className="mt-4 grid grid-cols-3 divide-x divide-black/10 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
            <div className="p-5">
              <div className="text-2xl font-semibold text-slate-950">35</div>
              <div className="mt-1 text-sm text-slate-500">Agent calls per run</div>
            </div>
            <div className="p-5">
              <div className="text-2xl font-semibold text-slate-950">Fix queue</div>
              <div className="mt-1 text-sm text-slate-500">Copy, export, or hand to an agent</div>
            </div>
            <div className="p-5">
              <Link href="/runs/new" className="inline-flex items-center gap-2 text-sm font-semibold text-amber-800 hover:text-slate-950 transition-colors">
                Start a run <ArrowRight size={14} />
              </Link>
              <div className="mt-1 text-sm text-slate-500">URL-first setup, no config needed</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Before / After ───────────────────────────────────────────── */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 bg-slate-950">
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-sm font-semibold uppercase tracking-widest text-amber-300">Before &amp; after</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">What changes when you run a teardown</h2>

          <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Before */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-red-400">Before</p>
              <img
                src="/snoopy-home-before-cycle-013.png"
                alt="Previous Snoopy homepage with technical copy, repeated sections and no visible agent output."
                className="mt-4 w-full rounded-xl border border-white/10 object-cover object-top aspect-video"
              />
              <ul className="mt-5 space-y-2 text-sm leading-relaxed text-slate-300">
                <li>Value hidden behind setup language</li>
                <li>No visible agent conversation</li>
                <li>Unclear next action for the visitor</li>
              </ul>
            </div>

            {/* After */}
            <div className="rounded-2xl border border-amber-300/20 bg-white/5 p-6">
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-amber-300">After</p>
              <img
                src="/snoopy-report-preview.png"
                alt="Updated Snoopy page with named agent critiques, a visible fix queue, and a clear call to action."
                className="mt-4 w-full rounded-xl border border-white/10 object-cover object-top aspect-video"
              />
              <ul className="mt-5 space-y-2 text-sm leading-relaxed text-slate-300">
                <li>Named agents visible, arguing in public</li>
                <li>Fix queue attached to every claim</li>
                <li>Single clear next step: run the teardown</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Use cases ────────────────────────────────────────────────── */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-sm font-semibold uppercase tracking-widest text-amber-700">What it does</p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-950">Where the money is</h2>
            </div>
            <Link
              href="/runs/new"
              className="hidden shrink-0 items-center gap-2 text-sm font-semibold text-slate-950 hover:text-amber-800 transition-colors sm:inline-flex"
            >
              Run the teardown <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {useCases.map(({ icon: Icon, title, copy, image, alt }) => (
              <div key={title} className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
                <img
                  src={image}
                  alt={alt}
                  className="aspect-video w-full object-cover"
                />
                <div className="p-6">
                  <Icon className="text-amber-700" size={20} />
                  <h3 className="mt-3 text-lg font-semibold text-slate-950">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-2xl bg-slate-950 px-8 py-14 text-center">
          <p className="font-mono text-sm font-semibold uppercase tracking-widest text-amber-300">Get started</p>
          <h2 className="mx-auto mt-4 max-w-2xl text-4xl font-semibold leading-tight text-white text-balance">
            Not a chorus. A visible conversation.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-400">
            Each agent speaks from a different motive, reads prior reactions, and can agree, extend, or push back with evidence.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/runs/new"
              className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-7 py-3 text-sm font-semibold text-slate-950 hover:bg-amber-300 transition-colors"
            >
              Run a teardown <ArrowRight size={15} />
            </Link>
            <Link
              href="/runs/demo"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-7 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              See the demo first
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
