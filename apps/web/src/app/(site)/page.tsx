import Link from "next/link";
import { ArrowRight, Eye, Flame, GitCompareArrows, MessageSquareQuote, MousePointerClick, Paintbrush, Sparkles, type LucideIcon } from "lucide-react";

const agentPanel = [
  {
    name: "Omar",
    role: "Revenue",
    verdict: "I can see the commercial idea. I still need the exact revenue leak and the next fix.",
    heat: "warm",
  },
  {
    name: "Leo",
    role: "Design",
    verdict: "The product stage is more memorable now. I want stronger hierarchy before I call it premium.",
    heat: "sharp",
  },
  {
    name: "Ivy",
    role: "Low vision",
    verdict: "The contrast is mostly workable. The small labels still need to carry less meaning.",
    heat: "sharp",
  },
  {
    name: "Maya",
    role: "Buyer",
    verdict: "I understand the promise faster. Show me one concrete before-and-after outcome.",
    heat: "warm",
  },
  {
    name: "Nora",
    role: "Founder",
    verdict: "The critique feels real when it shows evidence. Keep proof attached to every claim.",
    heat: "cool",
  },
  {
    name: "Quinn",
    role: "Agent builder",
    verdict: "This gets useful when I can see who agreed, who pushed back, and what changed next.",
    heat: "cool",
  },
  {
    name: "MIKE",
    role: "Creator",
    verdict: "This is the premise: different people thinking in public, not one voice repeated.",
    heat: "sharp",
  },
];

const useCases: Array<[LucideIcon, string, string]> = [
  [MousePointerClick, "Find the moment people bounce", "Critics land on the page, say what they think, and flag the exact step where motivation drops."],
  [Eye, "Catch ugly or unreadable UI", "Low-vision and design critics call out tiny text, weak contrast, dull screenshots, cramped layouts, and anything hard to read."],
  [GitCompareArrows, "Compare against better sites", "Give Snoopy competitor pages or news context and the critics explain where your site is behind, ahead, or just different."],
  [Paintbrush, "Get the better version", "Reports do not stop at criticism. They sketch the next screen: clearer headline, stronger proof, sharper offer, better hierarchy."],
];

const teardown = [
  { label: "Page", shape: "square" },
  { label: "Voices", shape: "bolt" },
  { label: "Fix", shape: "diamond" },
];

const fixQueue = [
  "Replace infrastructure copy with visible critique output.",
  "Show named agents reacting, agreeing, pushing back, and building on each other.",
  "Put before and after screens side by side.",
  "Make run setup URL-first, with edits tucked away.",
];

const boundaryReceipts = [
  ["Security/privacy boundary", "Customer-owned agents are private workspace data; generated demo profiles stay in this browser."],
  ["Production boundary", "Production credentials stay server-side, while reports keep evidence and fixes together for the customer handoff."],
];

const commercialScopes = [
  ["Pilot", "1 route, 7 core agents, 4 devices, report handoff", "Use when a team needs one public page torn down and a fix queue to ship."],
  ["Production", "Persisted runs, customer-owned agents, expanded panels", "Use when Snoopy becomes a recurring website improvement workspace."],
];

export default function HomePage() {
  return (
    <>
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="rounded-[2rem] border border-black/10 bg-white/76 p-7 shadow-sm sm:p-10">
            <p className="font-mono text-sm font-semibold uppercase tracking-wide text-amber-900">Website teardown</p>
            <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-[0.9] tracking-normal text-slate-950 sm:text-7xl">
              Your page goes in. The agent panel responds. A better page comes out.
            </h1>
            <div className="mt-8 grid grid-cols-3 overflow-hidden rounded-full border border-black/10 bg-slate-950 text-white">
              {teardown.map((item) => (
                <div key={item.label} className="flex items-center justify-center gap-2 border-r border-white/10 px-3 py-4 text-center text-sm font-semibold last:border-r-0">
                  <span
                    className={
                      item.shape === "square"
                        ? "size-4 rounded-sm border-2 border-amber-200"
                        : item.shape === "bolt"
                          ? "h-5 w-3 skew-x-[-18deg] bg-amber-200"
                          : "size-4 rotate-45 bg-amber-200"
                    }
                  />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {boundaryReceipts.map(([title, copy]) => (
                <div key={title} className="rounded-xl border border-black/10 bg-slate-50 p-4">
                  <div className="text-sm font-semibold uppercase tracking-wide text-slate-950">{title}</div>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{copy}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-[1.25rem] border border-amber-300 bg-amber-50 p-4">
              <div className="text-sm font-semibold uppercase tracking-wide text-amber-950">Commercial next step</div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {commercialScopes.map(([name, scope, copy]) => (
                  <div key={name} className="rounded-lg border border-amber-200 bg-white p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-lg font-semibold text-slate-950">{name}</div>
                      <Link href="/settings/billing" className="text-sm font-semibold text-amber-900 hover:text-slate-950">
                        Scope
                      </Link>
                    </div>
                    <div className="mt-2 text-sm font-semibold text-slate-800">{scope}</div>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{copy}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-8 rounded-[1.4rem] border border-black/10 bg-[#1b241d] p-4 text-white">
              <div className="grid grid-cols-[1fr_7.5rem] gap-3">
                <div className="rounded-lg bg-[#f7efe0] p-4 text-slate-950">
                  <div className="h-3 w-24 rounded-full bg-red-300" />
                  <div className="mt-5 h-10 rounded bg-slate-950" />
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="h-16 rounded border border-black/10 bg-white" />
                    <div className="h-16 rounded border border-black/10 bg-white" />
                    <div className="h-16 rounded border border-black/10 bg-white" />
                  </div>
                </div>
                <div className="flex min-w-28 flex-col justify-between gap-2">
                  <div className="rounded-lg bg-red-500/90 p-2 text-center text-sm font-bold">Concern</div>
                  <div className="rounded-lg bg-amber-300 p-2 text-center text-sm font-bold text-slate-950">Evidence</div>
                  <div className="rounded-lg bg-sky-300 p-2 text-center text-sm font-bold text-slate-950">Fix</div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-black/10 bg-slate-950 p-4 text-white shadow-sm">
            <div className="rounded-[1.45rem] border border-white/10 bg-white/7 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-mono text-sm uppercase tracking-wide text-amber-200">Live output</div>
                  <h2 className="mt-2 text-2xl font-semibold">Agent reactions, one visible conversation</h2>
                </div>
                <Link href="/runs/demo" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-100">
                  Open report
                </Link>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                {agentPanel.map((agent, index) => (
                  <div key={agent.name} className="rounded-lg border border-white/10 bg-slate-900 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-semibold">
                        <span
                          className={
                            index % 3 === 0
                              ? "size-3 rounded-full bg-red-300"
                              : index % 3 === 1
                                ? "size-3 rotate-45 bg-amber-200"
                                : "size-3 rounded-sm bg-sky-300"
                          }
                        />
                        {agent.name}
                      </div>
                      <span
                        className={
                          agent.heat === "hot"
                            ? "rounded-full bg-emerald-300/15 px-2 py-1 text-sm text-emerald-100"
                            : agent.heat === "sharp"
                              ? "rounded-full bg-amber-300/15 px-2 py-1 text-sm text-amber-100"
                              : "rounded-full bg-teal-300/15 px-2 py-1 text-sm text-teal-100"
                        }
                      >
                        {agent.role}
                      </span>
                    </div>
                    <p className="mt-3 text-base leading-6 text-slate-100">"{agent.verdict}"</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 border-t border-white/10 pt-4 sm:grid-cols-3">
                <div className="rounded-lg bg-white/10 p-3">
                  <div className="text-sm uppercase tracking-wide text-slate-300">Budgeted run</div>
                  <div className="mt-1 text-2xl font-semibold">35 calls</div>
                  <p className="mt-1 text-sm text-slate-300">Default single-route workflow.</p>
                </div>
                <div className="rounded-lg bg-white/10 p-3">
                  <div className="text-sm uppercase tracking-wide text-slate-300">Output</div>
                  <div className="mt-1 text-2xl font-semibold">Fix queue</div>
                  <p className="mt-1 text-sm text-slate-300">Copy, export, or hand to an agent.</p>
                </div>
                <div className="rounded-lg bg-white/10 p-3">
                  <div className="text-sm uppercase tracking-wide text-slate-300">Next step</div>
                  <Link href="/runs/new" className="mt-1 inline-flex items-center gap-2 text-lg font-semibold text-amber-100 hover:text-white">
                    Run review <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-black/10 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="font-mono text-sm font-semibold uppercase tracking-wide text-red-700">Before</p>
                  <h2 className="mt-1 text-2xl font-semibold">Before</h2>
                </div>
                <Flame className="text-red-700" size={22} />
              </div>
            <img
              src="/snoopy-home-before-cycle-013.png"
              alt="Previous Snoopy homepage screenshot with technical copy, pricing cards, and repeated sections."
              className="aspect-[16/11] w-full rounded-lg border border-black/10 object-cover object-top"
            />
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-red-50 p-3 text-red-950">Problem: the product value was hidden behind setup language.</div>
              <div className="rounded-lg bg-red-50 p-3 text-red-950">Missing: a visible agent conversation and the better page.</div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-black/10 bg-[#162019] p-5 text-white shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="font-mono text-sm font-semibold uppercase tracking-wide text-amber-200">After</p>
              <h2 className="mt-1 text-2xl font-semibold">After</h2>
              </div>
              <Sparkles className="text-amber-200" size={22} />
            </div>
            <div className="aspect-[16/11] rounded-lg border border-white/10 bg-[#f8f2e8] p-4 text-slate-950">
              <div className="rounded-full border border-black/10 bg-white px-4 py-3 font-mono text-sm font-semibold uppercase tracking-wide">
                Snoopy teardown
              </div>
              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-[1fr_0.9fr]">
                <div>
                  <div className="font-mono text-sm uppercase tracking-wide text-amber-900">Your page, reviewed</div>
                  <div className="mt-2 text-5xl font-semibold leading-[0.9]">This headline loses buyers.</div>
                  <p className="mt-4 text-base leading-7 text-slate-700">Omar wants money proof. Ivy wants readable text. Leo wants taste.</p>
                </div>
                <div className="rounded-lg bg-slate-950 p-4 text-white">
                  <div className="text-sm font-semibold text-amber-200">Fix preview</div>
                  <div className="mt-3 rounded-lg bg-white p-3 text-slate-950">
                    Show the offer. Show proof. Show the next screen.
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded bg-white/10 p-2">◆ hero</div>
                    <div className="rounded bg-white/10 p-2">▲ proof</div>
                    <div className="rounded bg-white/10 p-2">● action</div>
                    <div className="rounded bg-white/10 p-2">■ readable</div>
                  </div>
                </div>
              </div>
            </div>
            <ul className="mt-4 grid grid-cols-1 gap-2 text-sm leading-6 sm:grid-cols-2">
              {fixQueue.map((item) => (
                <li key={item} className="rounded-lg bg-white/8 px-3 py-2">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="font-mono text-sm font-semibold uppercase tracking-wide text-amber-900">What it does</p>
              <h2 className="mt-2 max-w-3xl text-4xl font-semibold leading-none">Where the money is</h2>
            </div>
            <Link href="/runs/new" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-950 hover:text-amber-800">
              Run the teardown <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {useCases.map(([Icon, title, copy]) => (
              <div key={title} className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
                <Icon className="text-amber-900" size={22} />
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-700">{copy}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-lg border border-black/10 bg-slate-950 p-5 text-white shadow-sm">
            <div className="flex items-center gap-3">
              <MessageSquareQuote className="text-amber-200" size={22} />
              <h3 className="text-xl font-semibold">Not a chorus. A visible conversation.</h3>
            </div>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-200">
              Each agent speaks from a different motive, reads prior reactions, and can agree, extend, or push back with evidence. Directness is one voice; useful disagreement is the product.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-200 px-3 py-1 text-sm font-semibold text-slate-950">
              <MessageSquareQuote size={15} />
              Start with the default cast. Add paid agent panels when you need more minds on the site.
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
