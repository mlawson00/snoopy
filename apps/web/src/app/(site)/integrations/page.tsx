import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Braces, CheckCircle2, ClipboardList, FileDown, GitCompareArrows, MessageSquareQuote, ShieldCheck, Sparkles } from "lucide-react";
import { Badge, Card, Heading, Section } from "@snoopy/ui";

const handoffSteps = [
  {
    label: "1",
    title: "Run the page",
    copy: "Snoopy opens the URL, lets the persistent cast react, and keeps each agent's evidence attached to the route and device with a clear security/privacy boundary.",
  },
  {
    label: "2",
    title: "Turn reactions into work",
    copy: "The report keeps first-person thoughts, stances, findings, recommendations, before/after direction, and affected screen regions together.",
  },
  {
    label: "3",
    title: "Hand it to the next agent",
    copy: "Copy or fetch the implementation plan so another agent can ship the fix without rereading the whole report.",
  },
];

const visibleOutputs = [
  {
    icon: MessageSquareQuote,
    title: "Conversation",
    copy: "Every run preserves what each agent thought, who they responded to, and why the critique mattered.",
  },
  {
    icon: GitCompareArrows,
    title: "Before and after",
    copy: "Recommendations describe what the current page communicates and what the improved page should make obvious.",
  },
  {
    icon: ClipboardList,
    title: "Fix handoff",
    copy: "Each task carries evidence, affected region, implementation steps, and acceptance checks.",
  },
  {
    icon: FileDown,
    title: "Markdown artifact",
    copy: "Teams can copy the whole plan, download it, or let an agent fetch the markdown endpoint.",
  },
];

const contractRows = [
  ["Create a run", "POST", "/api/runs", "Start with a URL and a goal. Customer-owned agents can join the run."],
  ["Read a report", "GET", "/api/runs/{runId}", "Fetch findings, reactions, stances, recommendations, and report artifacts."],
  ["Fetch the plan", "GET", "/api/runs/{runId}/implementation-queue", "Give another agent the markdown work list for implementation."],
  ["Generate an agent", "POST", "/api/agents/generate", "Create a structured customer-owned profile with voice, memories, source diet, and day plan."],
  ["Open a profile", "GET", "/agents/{agentId}", "Inspect a durable agent page instead of treating the agent as a hidden prompt."],
];

const exampleContracts = [
  {
    eyebrow: "Start the review",
    method: "POST",
    path: "/api/runs",
    request: ["targetUrl: https://example.com", "goal: Show buyers the product output first", "comparisonUrls: hotjar.com, vwo.com", "maxPages: 3"],
    response: ["report.summary", "report.reactions[]", "report.recommendations[]", "events[]", "persistence.reference.runId"],
    payoff: "One call returns the agent conversation, visual evidence, and a plan another agent can implement.",
  },
  {
    eyebrow: "Add a customer mind",
    method: "POST",
    path: "/api/agents/generate",
    request: ["brief: Low-vision conversion reviewer", "voice: direct, practical", "sourceDiet: competitor sites + prior reports", "personalityFacets: weighted coverage"],
    response: ["agent.profile", "agent.memories[]", "agent.blindSpots[]", "generation.status", "saved profile can join additionalPersonas"],
    payoff: "The customer can create reviewers with durable taste, memory, voice, and a reason to disagree.",
  },
  {
    eyebrow: "Ship the fixes",
    method: "GET",
    path: "/api/runs/{runId}/implementation-queue",
    request: ["accept: text/markdown", "runId: from persistence.reference", "consumer: coding agent, PM, designer"],
    response: ["affected region", "evidence", "implementation steps", "acceptance criteria", "source conversation"],
    payoff: "The output is not a vibe. It is a work packet with enough context to change the website.",
  },
];

const fieldContracts = [
  ["targetUrl", "required URL for the page under review"],
  ["generatedAgent.personalityFacets", "weighted taste profile, not a label"],
  ["reaction.responseReasonDetail", "why this agent answered another agent"],
  ["recommendation.implementationWorkItem", "the exact fix another agent can pick up"],
];

const boundaryItems = [
  "Production credentials stay server-side.",
  "Customer-owned agents are private workspace data.",
  "Read-only audits block destructive browser actions.",
  "Report artifacts keep the evidence and fix list together.",
];

export default function IntegrationsPage() {
  return (
    <>
      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 lg:grid-cols-[0.96fr_1.04fr]">
          <div className="rounded-[2rem] border border-black/10 bg-white/90 p-8 shadow-sm">
            <Badge>Agent handoff</Badge>
            <Heading as="h1" className="mt-4 max-w-3xl text-5xl">
              The report becomes work another agent can use.
            </Heading>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">
              Snoopy is useful when the critique does not die on the screen. The output keeps the conversation, evidence, better-page direction, and implementation plan together.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/runs/demo" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                Open demo report <ArrowRight size={16} />
              </Link>
              <Link href="/api/service-metadata" className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-100">
                Raw agent contract <Braces size={16} />
              </Link>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-3">
              {handoffSteps.map((step) => (
                <div key={step.label} className="grid grid-cols-[3rem_1fr] gap-3 rounded-xl border border-black/10 bg-slate-50 p-4">
                  <div className="grid size-10 place-items-center rounded-full bg-slate-950 font-semibold text-white">{step.label}</div>
                  <div>
                    <div className="text-lg font-semibold text-slate-950">{step.title}</div>
                    <p className="mt-1 text-sm leading-6 text-slate-700">{step.copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-black/10 bg-slate-950 p-5 text-white shadow-sm">
            <div className="rounded-2xl border border-white/10 bg-white/8 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-mono text-sm font-semibold uppercase tracking-wide text-amber-200">What the next agent receives</div>
                  <Heading as="h2" className="mt-3 text-3xl text-white">
                    Not a summary. A work packet.
                  </Heading>
                </div>
                <Sparkles className="text-amber-200" size={26} />
              </div>
              <div className="mt-5 rounded-xl bg-[#f8f2e8] p-4 text-slate-950">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[0.86fr_1.14fr]">
                  <div className="rounded-lg bg-slate-950 p-4 text-white">
                    <div className="font-mono text-sm font-semibold uppercase tracking-wide text-amber-200">Agent says</div>
                    <p className="mt-3 text-xl font-semibold leading-7">"The headline loses the buyer before the proof arrives."</p>
                    <p className="mt-3 text-sm leading-6 text-slate-200">Evidence, route, device, and stance stay attached.</p>
                  </div>
                  <div className="space-y-2">
                    <div className="rounded-lg bg-white p-3 text-sm font-semibold shadow-sm">Affected region: homepage hero</div>
                    <div className="rounded-lg bg-white p-3 text-sm font-semibold shadow-sm">Fix: put the product output before setup copy</div>
                    <div className="rounded-lg bg-white p-3 text-sm font-semibold shadow-sm">Accept when: before/after, agent reaction, and plan are visible</div>
                  </div>
                </div>
              </div>
              <div className="mt-5 overflow-hidden rounded-xl border border-white/10 bg-white">
                <Image
                  src="/snoopy-report-preview.png"
                  alt="Snoopy report preview showing agent reactions, recommendation cards, and implementation handoff output"
                  width={1366}
                  height={2048}
                  className="aspect-[16/8] w-full object-cover object-top"
                />
              </div>
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {visibleOutputs.map(({ icon: Icon, title, copy }) => (
                  <div key={title} className="rounded-xl border border-white/10 bg-white/8 p-4">
                    <Icon className="text-amber-200" size={20} />
                    <div className="mt-3 text-lg font-semibold">{title}</div>
                    <p className="mt-2 text-sm leading-6 text-slate-200">{copy}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Section className="pt-0">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.14fr_0.86fr]">
          <Card className="p-0">
            <div className="border-b border-black/10 p-5">
              <Badge>Machine-readable receipts</Badge>
              <Heading as="h2" className="mt-3 text-3xl">
                The contract agents can inspect.
              </Heading>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-700">
                Humans get the story above. Agents get predictable routes, fields, artifacts, and commands through the raw service metadata, with security, privacy, customer-data, and credential boundaries called out.
              </p>
            </div>
            <div className="divide-y divide-black/10">
              {contractRows.map(([title, method, path, copy]) => (
                <div key={path} className="grid grid-cols-1 gap-3 p-5 md:grid-cols-[0.74fr_0.34fr_1fr]">
                  <div className="text-lg font-semibold text-slate-950">{title}</div>
                  <div className="flex flex-wrap items-start gap-2">
                    <span className="rounded-full bg-slate-950 px-3 py-1 text-sm font-semibold text-white">{method}</span>
                    <span className="rounded-full bg-amber-100 px-3 py-1 font-mono text-sm font-semibold text-amber-950">{path}</span>
                  </div>
                  <p className="text-sm leading-6 text-slate-700">{copy}</p>
                </div>
              ))}
            </div>
          </Card>

          <div className="space-y-5">
            <Card className="!bg-slate-950 text-white">
              <ShieldCheck className="text-amber-200" size={22} />
              <Heading as="h2" className="mt-4 text-2xl text-white">
                Boundaries stay visible.
              </Heading>
              <div className="mt-4 grid grid-cols-1 gap-2">
                {boundaryItems.map((item) => (
                  <div key={item} className="flex gap-2 rounded-lg bg-white/8 p-3 text-sm font-semibold leading-6 text-slate-100">
                    <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-200" size={16} />
                    {item}
                  </div>
                ))}
              </div>
              <Link href="/trust" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-amber-200 underline-offset-4 hover:underline">
                Open trust boundaries <ArrowRight size={16} />
              </Link>
            </Card>

            <Card>
              <Braces className="text-amber-900" size={22} />
              <Heading as="h2" className="mt-4 text-2xl">
                For agents and technical operators
              </Heading>
              <p className="mt-3 text-base leading-7 text-slate-700">
                The raw metadata includes report fields, generated-agent fields, reaction stances, artifact types, self-audit commands, and localStorage fixture examples for testing browser-saved agents.
              </p>
              <Link href="/api/service-metadata" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-amber-900 underline-offset-4 hover:underline">
                Read service metadata <ArrowRight size={16} />
              </Link>
            </Card>
          </div>
        </div>
      </Section>

      <Section className="pt-0">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge>Working examples</Badge>
            <Heading as="h2" className="mt-3 text-3xl">
              The cool parts are callable.
            </Heading>
          </div>
          <p className="max-w-2xl text-base leading-7 text-slate-700">
            These are the same contracts exposed in service metadata, shown as product behavior instead of a raw JSON wall.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {exampleContracts.map((example) => (
            <div key={example.path} className="rounded-2xl border border-black/10 bg-white shadow-sm">
              <div className="border-b border-black/10 p-5">
                <div className="text-base font-semibold uppercase tracking-wide text-amber-900">{example.eyebrow}</div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-950 px-3 py-1 text-base font-semibold text-white">{example.method}</span>
                  <span className="rounded-full bg-amber-100 px-3 py-1 font-mono text-base font-semibold text-amber-950">{example.path}</span>
                </div>
                <p className="mt-4 text-base font-semibold leading-7 text-slate-800">{example.payoff}</p>
              </div>
              <div className="grid grid-cols-1 gap-4 p-5">
                <div>
                  <div className="text-base font-black text-slate-950">Send</div>
                  <div className="mt-2 space-y-2 rounded-xl bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100">
                    {example.request.map((line) => (
                      <div key={line}>{line}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-base font-black text-slate-950">Get back</div>
                  <div className="mt-2 grid grid-cols-1 gap-2">
                    {example.response.map((field) => (
                      <div key={field} className="rounded-lg bg-slate-100 px-3 py-2 font-mono text-sm font-semibold leading-6 text-slate-800">
                        {field}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-2xl border border-black/10 bg-[#f8f2e8] p-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[0.34fr_1fr]">
            <div>
              <div className="text-sm font-semibold uppercase tracking-wide text-amber-900">Field contracts</div>
              <p className="mt-2 text-sm leading-6 text-slate-700">The fields that stop a handoff from becoming guesswork.</p>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {fieldContracts.map(([field, meaning]) => (
                <div key={field} className="rounded-xl bg-white p-3 shadow-sm">
                  <div className="font-mono text-sm font-semibold text-slate-950">{field}</div>
                  <p className="mt-1 text-sm leading-6 text-slate-700">{meaning}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
