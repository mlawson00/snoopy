import Link from "next/link";
import { ArrowRight, Eye, GitCompareArrows, MousePointerClick, Paintbrush } from "lucide-react";

/* ── Data ─────────────────────────────────────────────────────────────── */

const trustNames = ["Indie founders", "Solo builders", "Design leads", "Growth teams", "Landing page devs"];

const agentPanel = [
  {
    name: "Omar",
    initials: "O",
    color: "bg-red-200 text-red-800",
    role: "Revenue",
    verdict:
      "I can see the commercial idea. I still need the exact revenue leak and the next fix before I can call it a conversion page.",
  },
  {
    name: "Leo",
    initials: "L",
    color: "bg-amber-200 text-amber-800",
    role: "Design",
    verdict:
      "The product stage is more memorable now. I want stronger visual hierarchy in the top third before I call it premium.",
  },
  {
    name: "Ivy",
    initials: "I",
    color: "bg-sky-200 text-sky-800",
    role: "Low vision",
    verdict:
      "Contrast is mostly workable. The small labels still carry too much meaning at 11px — bump them or strip the copy.",
  },
  {
    name: "Maya",
    initials: "M",
    color: "bg-emerald-200 text-emerald-800",
    role: "Buyer",
    verdict:
      "I understand the promise faster now. Show me one concrete before-and-after outcome and I would have clicked already.",
  },
];

const stats = [
  { value: "4", label: "Named agents" },
  { value: "~90s", label: "Per run" },
  { value: "JSON", label: "Export ready" },
];

const useCases: Array<{
  icon: React.ElementType;
  title: string;
  copy: string;
  image: string;
  alt: string;
  wide?: boolean;
}> = [
  {
    icon: MousePointerClick,
    title: "Find the moment people bounce",
    copy: "Critics land on the page, say what they think, and flag the exact step where motivation drops — with a reason attached.",
    image: "/use-case-bounce.jpg",
    alt: "A funnel chart with a sharp drop-off highlighted in amber, showing where users leave.",
    wide: true,
  },
  {
    icon: Eye,
    title: "Catch ugly or unreadable UI",
    copy: "Low-vision and design critics call out tiny text, weak contrast, and anything hard to read.",
    image: "/use-case-ui.jpg",
    alt: "Side-by-side UI with red annotation overlays flagging contrast and font issues.",
  },
  {
    icon: GitCompareArrows,
    title: "Compare against better sites",
    copy: "Give Snoopy competitor pages and the critics explain where your site is behind, ahead, or simply different.",
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

/* ── Page ─────────────────────────────────────────────────────────────── */

export default function HomePage() {
  return (
    <main>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="px-4 pb-6 pt-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">

          {/* Trust pill row */}
          <div className="mb-8 flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-semibold uppercase tracking-widest text-slate-400">
              Used by
            </span>
            {trustNames.map((name) => (
              <span
                key={name}
                className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-slate-600"
              >
                {name}
              </span>
            ))}
          </div>

          {/* Headline */}
          <h1 className="max-w-4xl text-5xl font-semibold leading-[1.06] tracking-tight text-slate-950 text-balance sm:text-7xl">
            Your page goes in.
            <br />
            <span className="text-amber-700">The agents respond.</span>
            <br />
            A better page comes out.
          </h1>

          {/* Sub + CTA row */}
          <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <p className="max-w-lg text-lg leading-relaxed text-slate-600">
              Named AI agents — each with a different motive — read your page, argue in public, and hand you a fix queue. First teardown in 90 seconds.
            </p>
            <div className="flex shrink-0 flex-col gap-2 sm:items-end">
              <div className="flex items-center gap-3">
                <Link
                  href="/runs/new"
                  className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-amber-800"
                >
                  Run a teardown <ArrowRight size={15} />
                </Link>
                <Link
                  href="/runs/demo"
                  className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-100"
                >
                  See demo
                </Link>
              </div>
              <p className="text-right text-xs text-slate-400">
                No account needed &middot; Local mode available
              </p>
            </div>
          </div>

          {/* Hero product image */}
          <div className="mt-10 overflow-hidden rounded-2xl border border-black/10 shadow-lg">
            <img
              src="/hero-product.jpg"
              alt="Snoopy agent panel — four named AI critics each giving a sharp verdict on a webpage."
              className="w-full object-cover object-top"
            />
          </div>
        </div>
      </section>

      {/* ── Agent panel ───────────────────────────────────────────────── */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-sm font-semibold uppercase tracking-widest text-amber-700">
                Live output
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-950">
                One page. Four perspectives.
              </h2>
            </div>
            <Link
              href="/runs/demo"
              className="hidden shrink-0 items-center gap-2 text-sm font-semibold text-slate-950 transition-colors hover:text-amber-800 sm:inline-flex"
            >
              Open full report <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {agentPanel.map((agent) => (
              <div
                key={agent.name}
                className="card-hover rounded-2xl border border-black/10 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {/* Colour-coded avatar */}
                    <span
                      aria-hidden
                      className={`flex size-8 items-center justify-center rounded-full text-xs font-bold ${agent.color}`}
                    >
                      {agent.initials}
                    </span>
                    <div>
                      <span className="text-sm font-semibold text-slate-950">{agent.name}</span>
                      {/* Animated "live" indicator */}
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="relative flex size-1.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
                        </span>
                        <span className="text-xs text-slate-400">active</span>
                      </div>
                    </div>
                  </div>
                  <span className="rounded-full border border-black/10 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {agent.role}
                  </span>
                </div>
                <p className="mt-4 text-base leading-relaxed text-slate-700">
                  &ldquo;{agent.verdict}&rdquo;
                </p>
              </div>
            ))}
          </div>

          {/* Stats bar */}
          <div className="mt-4 grid grid-cols-3 divide-x divide-black/10 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
            {stats.map(({ value, label }) => (
              <div key={label} className="p-5">
                <div className="text-2xl font-semibold text-slate-950">{value}</div>
                <div className="mt-1 text-sm text-slate-500">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Before / After ────────────────────────────────────────────── */}
      <section className="bg-slate-950 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-sm font-semibold uppercase tracking-widest text-amber-300">
            Before &amp; after
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-white">
            What changes when you run a teardown
          </h2>

          <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Before */}
            <div className="card-hover rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-red-400">
                Before
              </p>
              <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
                <img
                  src="/snoopy-home-before-cycle-013.png"
                  alt="Previous Snoopy homepage — technical copy, repeated sections, no visible agent output."
                  className="aspect-video w-full object-cover object-top"
                />
              </div>
              <ul className="mt-6 space-y-2.5 text-sm leading-relaxed text-slate-300">
                {[
                  "Value hidden behind setup language",
                  "No visible agent conversation",
                  "Unclear next action for the visitor",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-red-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* After */}
            <div className="card-hover rounded-2xl border border-amber-300/25 bg-white/5 p-6 ring-1 ring-amber-300/20">
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-amber-300">
                After
              </p>
              <div className="mt-4 overflow-hidden rounded-xl border border-amber-300/20">
                <img
                  src="/snoopy-report-preview.png"
                  alt="Updated Snoopy page — named agent critiques, a visible fix queue, and a clear CTA."
                  className="aspect-video w-full object-cover object-top"
                />
              </div>
              <ul className="mt-6 space-y-2.5 text-sm leading-relaxed text-slate-300">
                {[
                  "Named agents visible, arguing in public",
                  "Fix queue attached to every claim",
                  "Single clear next step: run the teardown",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Use cases ─────────────────────────────────────────────────── */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-sm font-semibold uppercase tracking-widest text-amber-700">
                What it does
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-950">
                What agents actually find
              </h2>
            </div>
            <Link
              href="/runs/new"
              className="hidden shrink-0 items-center gap-2 text-sm font-semibold text-slate-950 transition-colors hover:text-amber-800 sm:inline-flex"
            >
              Run the teardown <ArrowRight size={14} />
            </Link>
          </div>

          {/* First card spans full width */}
          <div className="grid grid-cols-1 gap-5">
            {useCases.map(({ icon: Icon, title, copy, image, alt, wide }) => (
              <div
                key={title}
                className={`card-hover overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm ${wide ? "grid grid-cols-1 lg:grid-cols-2" : "hidden"}`}
              >
                <div className="overflow-hidden">
                  <img
                    src={image}
                    alt={alt}
                    className="h-full w-full object-cover"
                    style={{ minHeight: "260px" }}
                  />
                </div>
                <div className="flex flex-col justify-center p-8 lg:p-10">
                  <span className="inline-flex size-10 items-center justify-center rounded-xl bg-amber-100">
                    <Icon className="text-amber-700" size={20} />
                  </span>
                  <h3 className="mt-4 text-2xl font-semibold text-slate-950">{title}</h3>
                  <p className="mt-3 text-base leading-relaxed text-slate-600">{copy}</p>
                  <Link
                    href="/runs/new"
                    className="mt-6 inline-flex w-fit items-center gap-2 text-sm font-semibold text-amber-700 transition-colors hover:text-slate-950"
                  >
                    Try it <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}

            {/* Remaining 3 in a grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              {useCases
                .filter((u) => !u.wide)
                .map(({ icon: Icon, title, copy, image, alt }) => (
                  <div
                    key={title}
                    className="card-hover overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm"
                  >
                    <img src={image} alt={alt} className="aspect-video w-full object-cover" />
                    <div className="p-6">
                      <span className="inline-flex size-8 items-center justify-center rounded-lg bg-amber-100">
                        <Icon className="text-amber-700" size={16} />
                      </span>
                      <h3 className="mt-3 text-base font-semibold text-slate-950">{title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">{copy}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="px-4 pb-20 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl bg-slate-950">
          <div className="px-8 py-16 text-center sm:px-16">
            <p className="font-mono text-sm font-semibold uppercase tracking-widest text-amber-300">
              Get started
            </p>
            <h2 className="mx-auto mt-4 max-w-2xl text-4xl font-semibold leading-tight text-white text-balance">
              Run your first teardown in 90 seconds.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-slate-400">
              Each agent speaks from a different motive, reads prior reactions, and can agree, extend, or push back with evidence.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/runs/new"
                className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-7 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-300"
              >
                Run a teardown <ArrowRight size={15} />
              </Link>
              <Link
                href="/runs/demo"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                See the demo first
              </Link>
            </div>
            <p className="mt-5 text-xs text-slate-500">
              No account needed &middot; Local mode available &middot; Runs in your browser
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-black/10 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
          {/* Brand */}
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-mono text-sm font-semibold uppercase tracking-[0.18em] text-slate-950"
            >
              <span aria-hidden className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-red-300" />
                <span className="size-2 rotate-45 bg-amber-300" />
                <span className="size-2 rounded-sm bg-sky-300" />
              </span>
              Snoopy
            </Link>
            <p className="mt-2 text-xs text-slate-400">
              &copy; {new Date().getFullYear()} Snoopy. All rights reserved.
            </p>
          </div>

          {/* Nav links */}
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
            {[
              { href: "/runs/demo", label: "Demo" },
              { href: "/agents", label: "Agents" },
              { href: "/trust", label: "Trust" },
              { href: "/settings/billing", label: "Pricing" },
              { href: "/dashboard", label: "Dashboard" },
            ].map(({ href, label }) => (
              <Link key={href} href={href} className="transition-colors hover:text-slate-950">
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </main>
  );
}
