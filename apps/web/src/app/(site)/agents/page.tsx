import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, GitCompareArrows, MessageSquareQuote } from "lucide-react";
import { AgentsWorkspace } from "@/components/agents-workspace";
import { Badge, Heading, Section } from "@snoopy/ui";

const disagreementRows = [
  {
    agent: "Leo",
    stance: "Craft risk",
    quote: "Needs visual proof before the craft claim.",
  },
  {
    agent: "Maya",
    stance: "Budget risk",
    quote: "Needs the package boundary before sales.",
  },
  {
    agent: "Omar",
    stance: "First fix",
    quote: "Proof, scope, run. In that order.",
  },
];

export default function AgentsPage() {
  return (
    <Section>
      <div className="grid grid-cols-1 gap-5">
        <div className="overflow-hidden rounded-[1.5rem] border border-slate-950 bg-slate-950 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-[1.12fr_0.88fr]">
            <ProductProofArtifact />

            <div className="order-1 bg-[#f7efe3] p-4 text-slate-950 sm:p-6 lg:order-2">
              <Badge>Website critique agents</Badge>
              <Heading as="h1" className="mt-3 text-3xl leading-tight text-slate-950 sm:text-5xl">
                The agents are the product asset.
              </Heading>
              <p className="mt-3 max-w-xl text-base leading-7 text-slate-700 sm:text-lg">
                Persistent agents keep taste, memory, and disagreement attached to every website-improvement run.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold sm:text-base">
                <div className="rounded-full bg-white px-3 py-2 text-emerald-950 shadow-sm">Starts with 7</div>
                <div className="rounded-full bg-white px-3 py-2 text-sky-950 shadow-sm">Can grow to hundreds</div>
                <div className="rounded-full bg-white px-3 py-2 text-amber-950 shadow-sm">Saved agents join runs</div>
              </div>
              <Link href="/runs/new" className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                Run the core cast <ArrowRight size={16} />
              </Link>

              <div className="mt-5 overflow-hidden rounded-xl border border-black/10 bg-slate-950 text-white shadow-sm">
                <div className="border-b border-white/10 p-4">
                  <div className="flex items-center gap-2 font-mono text-sm font-semibold uppercase tracking-wide text-amber-200">
                    <MessageSquareQuote size={17} /> Live disagreement
                  </div>
                  <Heading as="h2" className="mt-2 text-2xl text-white sm:text-3xl">
                    Same page. Different objections. One first fix.
                  </Heading>
                </div>
                <div className="grid grid-cols-1 divide-y divide-white/10">
                  {disagreementRows.map((row) => (
                    <div key={row.agent} className="grid grid-cols-[2.5rem_1fr] gap-3 p-3">
                      <div className="grid size-10 place-items-center rounded-full bg-amber-200 font-black text-slate-950">{row.agent.slice(0, 2)}</div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-semibold">{row.agent}</span>
                          <span className="rounded-full bg-white px-2 py-1 text-sm font-semibold text-slate-950">{row.stance}</span>
                        </div>
                        <p className="mt-1 text-sm leading-6 text-slate-200">{row.quote}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-white/10 bg-white p-4 text-slate-950">
                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                    <CheckCircle2 size={17} /> Fix path result
                  </div>
                  <p className="mt-2 text-base font-black leading-6">Show the report artifact first, then the package boundary, then the run action.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AgentsWorkspace />
    </Section>
  );
}

function ProductProofArtifact() {
  return (
    <div className="order-2 bg-slate-950 p-3 text-white sm:p-5 lg:order-1">
      <div className="overflow-hidden rounded-xl border border-white/10 bg-white shadow-sm">
        <div className="relative h-44 bg-slate-100 sm:h-64 lg:h-80">
          <Image
            src="/snoopy-report-preview.png"
            alt="Snoopy report preview used as the visual evidence behind the live agent disagreement"
            fill
            sizes="(min-width: 1024px) 56vw, 92vw"
            className="object-cover object-top"
            loading="eager"
            priority
          />
          <div className="absolute bottom-3 left-3 rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-950 shadow-sm">Report artifact before pitch</div>
        </div>

        <div className="bg-slate-950 p-3 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 font-mono text-sm font-semibold uppercase tracking-wide text-amber-200">
                <GitCompareArrows size={17} /> Fix artifact
              </div>
              <div className="mt-1 text-lg font-black leading-6 sm:text-xl">One objection becomes a changed screen.</div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[0.78fr_1.22fr]">
            <div className="overflow-hidden rounded-xl bg-white text-slate-950">
              <div className="relative h-24 border-b border-black/10 bg-slate-100">
                <Image
                  src="/snoopy-home-before-cycle-013.png"
                  alt="Before screen with weak proof that agents would mark for improvement"
                  fill
                  sizes="(min-width: 1024px) 22vw, 84vw"
                  className="object-cover object-top"
                />
                <div className="absolute left-3 top-3 rounded-full bg-red-100 px-3 py-1 text-sm font-black uppercase tracking-wide text-red-950">Before</div>
              </div>
              <div className="p-3">
                <div className="font-mono text-sm font-semibold uppercase tracking-wide text-slate-500">Agent objection</div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="grid size-9 place-items-center rounded-full bg-amber-200 text-sm font-black text-slate-950">Om</span>
                  <span className="text-base font-black">First fix</span>
                </div>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">Visible proof, a marked problem, and the next screen before another claim.</p>
              </div>
            </div>

            <div className="rounded-xl bg-white p-3 text-slate-950">
              <div className="font-mono text-sm font-semibold uppercase tracking-wide text-amber-900">Changed screen</div>
              <div className="mt-2 text-lg font-black leading-6">The report shows the argument, the marked screen, and the first fix.</div>
              <div className="mt-2 rounded-lg bg-slate-950 px-3 py-2 text-sm font-bold leading-5 text-white">Work item: put output before pitch.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
