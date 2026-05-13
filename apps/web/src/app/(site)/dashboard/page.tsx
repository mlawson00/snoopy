import Link from "next/link";
import { AlertTriangle, Eye, FileText, ListChecks, MessageSquareQuote, PlayCircle } from "lucide-react";
import { RunHistory } from "@/components/run-history";
import { Badge, Card, Heading, Section } from "@snoopy/ui";

const productSignals = [
  ["Core", "persistent cast in every workspace"],
  ["4", "open fixes"],
  ["2", "before/after teardowns this week"],
];

const latestVoices = [
  ["Leo", "The page looks better, but I still see weak hierarchy in the dashboard."],
  ["Ivy", "I need fewer tiny labels and more contrast before I call this comfortable."],
  ["MIKE", "This is useful when the agents sound like different people and the fix is visible."],
];

const latestFixes = ["Make the next paid step obvious.", "Show comparison sources on every report.", "Turn bland dashboard panels into visible teardown output."];

export default function DashboardPage() {
  return (
    <Section>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_420px] lg:items-start">
        <div>
          <Badge>Workspace</Badge>
          <Heading as="h1" className="mt-3 text-4xl">
            Run dashboard
          </Heading>
          <p className="mt-2 text-base text-slate-700">Recent teardowns, critic reactions, and the fixes they produced.</p>
          <p className="mt-3 max-w-2xl text-base font-medium leading-7 text-slate-800">
            Every run keeps the screenshot evidence, agent conversation, before/after fixes, and implementation plan together.
          </p>
        </div>
        <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold uppercase text-amber-900">Proof receipt</div>
              <div className="mt-1 text-lg font-semibold text-slate-950">Latest reopened report</div>
            </div>
            <Link
              href="/runs/new"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-amber-200 px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm hover:bg-amber-100"
            >
              <PlayCircle size={16} />
              New teardown
            </Link>
          </div>
          <Link href="/runs/run_demo_pricing" className="mt-4 block rounded-lg border border-slate-200 bg-slate-50 p-3 hover:border-amber-300 hover:bg-amber-50">
            <div className="flex items-start gap-3">
              <FileText className="mt-1 shrink-0 text-slate-950" size={20} />
              <div>
                <div className="font-semibold text-slate-950">/settings/billing teardown</div>
                <p className="mt-1 text-sm leading-6 text-slate-700">7 voices, 2 findings, 3 fixes, and a markdown plan you can reopen.</p>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-700">Privacy proof: customer-owned agents stay private workspace data.</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {["agent conversation", "screen evidence", "implementation plan"].map((label) => (
                <span key={label} className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-sm font-semibold text-slate-700 ring-1 ring-black/5">
                  <ListChecks size={14} />
                  {label}
                </span>
              ))}
            </div>
          </Link>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        {productSignals.map(([value, label], index) => (
          <Card key={label} className="bg-white/86">
            {index === 0 ? <MessageSquareQuote className="text-amber-900" size={20} /> : index === 1 ? <AlertTriangle className="text-red-700" size={20} /> : <Eye className="text-slate-950" size={20} />}
            <div className="mt-4 text-3xl font-semibold">{value}</div>
            <p className="text-sm text-slate-600">{label}</p>
          </Card>
        ))}
      </div>

      <div className="mt-8 rounded-lg border border-black/10 bg-slate-950 p-5 text-white">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
          <div>
            <Heading as="h2" className="text-2xl text-white">
              What matters here
            </Heading>
            <p className="mt-2 max-w-2xl text-base leading-7 text-slate-200">The dashboard should feel like the latest website conversation, not a storage room for runs.</p>
          </div>
          <Link href="/runs/demo" className="inline-flex items-center gap-2 rounded-full bg-amber-200 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-100">
            Open live example
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {latestVoices.map(([name, quote]) => (
              <div key={name} className="relative rounded-2xl bg-white p-4 text-slate-950">
                <div className="absolute -bottom-2 left-8 size-4 rotate-45 bg-white" />
                <div className="font-semibold">{name}</div>
                <p className="mt-3 text-base leading-7">"{quote}"</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
            <div className="font-semibold text-amber-200">Fixes coming out of the run</div>
            <img
              src="/snoopy-report-preview.png"
              alt="Snoopy report preview showing critic reactions and evidence output."
              className="mt-3 aspect-[16/10] w-full rounded-lg border border-white/10 object-cover object-top"
            />
            <div className="mt-3 space-y-2">
              {latestFixes.map((fix) => (
                <div key={fix} className="rounded-lg bg-white p-3 text-sm font-semibold leading-6 text-slate-950">
                  {fix}
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Hotjar", "FullStory", "Cycle memory"].map((source) => (
                <span key={source} className="rounded-full border border-white/15 bg-slate-900 px-3 py-1 text-sm text-slate-100">
                  {source}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <RunHistory />
    </Section>
  );
}
