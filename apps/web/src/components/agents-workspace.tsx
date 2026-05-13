"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, Brain, CheckCircle2, History, Mic2, MessageSquareQuote, Palette, Radar, Sparkles, UserRoundPlus } from "lucide-react";
import { AgentGeneratorPanel } from "@/components/agent-generator-panel";
import { SavedAgentCastRoom } from "@/components/saved-agent-cast-room";
import { coreAgentProfiles } from "@/lib/core-agent-profiles";
import { Card, Heading } from "@snoopy/ui";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "core", label: "Core cast" },
  { id: "custom", label: "Custom agents" },
  { id: "paid", label: "Paid panels" },
] as const;

type TabId = (typeof tabs)[number]["id"];

const paidModes = [
  {
    icon: UserRoundPlus,
    title: "Customer-exclusive agents",
    copy: "Create agents only your workspace owns: a skeptical CFO, a brand guardian, a founder, a legal reviewer, or your best customer.",
  },
  {
    icon: Palette,
    title: "Faces and character cards",
    copy: "Give each agent a portrait, role, habits, tastes, blind spots, and a profile page that makes their point of view memorable.",
  },
  {
    icon: Mic2,
    title: "Voice profiles",
    copy: "Tune how they speak: warm, clinical, blunt, visual, cautious, excited, skeptical, or direct without making everyone sound the same.",
  },
  {
    icon: BookOpen,
    title: "Reading lists and source diets",
    copy: "Paid agents can follow competitor sites, books, docs, news, prior reports, and customer examples before they judge a page.",
  },
  {
    icon: MessageSquareQuote,
    title: "Agent-to-agent conversation",
    copy: "Agents can respond to each other, challenge the prior run, support a useful point, or explain why another agent missed the real issue.",
  },
  {
    icon: Brain,
    title: "Expanded paid panels",
    copy: "The core cast is the entry tier. Larger paid panels can add specialist agents for deeper research, recurring watches, and high-stakes launches.",
  },
];

const castRoomSignals = [
  {
    icon: History,
    label: "Memory",
    title: "They keep useful memory.",
    copy: "Profiles keep failures, tastes, sources, and blind spots.",
  },
  {
    icon: MessageSquareQuote,
    label: "Conversation",
    title: "They answer each other.",
    copy: "Runs show who supported, extended, or challenged whom.",
  },
  {
    icon: Radar,
    label: "Expansion",
    title: "The cast can keep growing.",
    copy: "Add owned specialists, recurring watchers, or larger panels.",
  },
];

export function AgentsWorkspace() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("brief") || params.get("tone") || params.get("agentId")) {
      setActiveTab("custom");
    }
  }, []);

  return (
    <div className="mt-6">
      <div className="sticky top-3 z-10 -mx-1 overflow-x-auto rounded-full border border-black/10 bg-white/92 p-1 shadow-sm backdrop-blur">
        <div className="flex min-w-max gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              aria-pressed={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.id ? "bg-slate-950 text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        {activeTab === "overview" ? <OverviewPanel /> : null}
        {activeTab === "core" ? <CoreCastPanel /> : null}
        {activeTab === "custom" ? <CustomAgentsPanel /> : null}
        {activeTab === "paid" ? <PaidPanels /> : null}
      </div>
    </div>
  );
}

function OverviewPanel() {
  return (
    <section className="overflow-hidden rounded-[1.5rem] border border-black/10 bg-white shadow-sm">
      <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <div className="flex items-center gap-2 font-mono text-sm font-semibold uppercase tracking-wide text-amber-900">
            <Sparkles size={16} /> Report proof
          </div>
          <Heading as="h2" className="mt-2 max-w-xl text-2xl text-slate-950 sm:text-3xl">
            The report keeps disagreement usable.
          </Heading>
          <p className="mt-2 max-w-2xl text-base font-semibold leading-7 text-slate-700">Agents read the same screen and leave different evidence.</p>
          <Link href="/runs/new" className="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-base font-semibold text-white hover:bg-slate-800">
            Start a run <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {[
            ["Route evidence", "Screen, URL, device, and screenshot."],
            ["Agent stance", "Support, extension, pushback, or improvement."],
            ["First fix", "The first recommendation becomes a work item."],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-black/10 bg-slate-50 p-3">
              <div className="flex items-center gap-2 text-base font-semibold text-slate-950">
                <CheckCircle2 className="text-emerald-700" size={17} /> {label}
              </div>
              <p className="mt-1 text-sm leading-6 text-slate-700">{value}</p>
            </div>
          ))}
          {castRoomSignals.map(({ icon: Icon, label, title, copy }) => (
            <div key={label} className="rounded-xl bg-slate-950 p-3 text-white">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-amber-200">
                <Icon size={16} /> {label}
              </div>
              <div className="mt-1 text-base font-black leading-6 text-white">{title}</div>
              <p className="mt-1 text-sm leading-6 text-slate-300">{copy}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-black/10 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950">
        <span className="inline-flex items-center gap-2">
          <CheckCircle2 className="text-emerald-700" size={17} /> 28 reactions per run
        </span>
        <span className="inline-flex items-center gap-2">
          <CheckCircle2 className="text-emerald-700" size={17} /> Customer agents stay private
        </span>
        <Link href="/trust" className="inline-flex items-center gap-2 underline-offset-4 hover:underline">
          <CheckCircle2 className="text-emerald-700" size={17} /> Agent-readable handoff <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}

function CoreCastPanel() {
  return (
    <div className="rounded-[2rem] border border-black/10 bg-slate-950 p-5 text-white shadow-sm">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 px-1">
        <div>
          <div className="font-mono text-sm font-semibold uppercase tracking-wide text-amber-200">Persistent core cast</div>
          <Heading as="h2" className="mt-1 text-3xl text-white">
            A starting cast with different tastes.
          </Heading>
        </div>
        <div className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-950">not a chorus</div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {coreAgentProfiles.map((agent, index) => (
          <div key={agent.name} className="rounded-xl border border-white/10 bg-white/8 p-4">
            <div className="flex items-start gap-3">
              <div
                className={
                  index % 3 === 0
                    ? "grid size-14 shrink-0 place-items-center rounded-full bg-red-200 text-lg font-black text-red-950"
                    : index % 3 === 1
                      ? "grid size-14 shrink-0 place-items-center rounded-xl bg-amber-200 text-lg font-black text-slate-950"
                      : "grid size-14 shrink-0 place-items-center rounded-sm bg-sky-200 text-lg font-black text-sky-950"
                }
              >
                {agent.face}
              </div>
              <div>
                <div className="text-lg font-semibold">{agent.name}</div>
                <div className="text-base text-slate-100">{agent.role}</div>
              </div>
            </div>
            <div className="mt-4 rounded-2xl bg-white p-4 text-base font-semibold leading-7 text-slate-950">"{agent.quote}"</div>
            <div className="mt-3 rounded-lg border border-white/10 bg-slate-900 p-3 text-sm font-semibold leading-6 text-slate-100">{agent.voice}</div>
            <div className="mt-3 grid grid-cols-1 gap-2">
              <AgentSignal title="Memory" value={agent.memories[0] ?? "No saved memory yet."} />
              <AgentSignal title="Reads" value={agent.sourceDiet.slice(0, 2).join(" + ") || "Rendered pages + prior reports"} />
              <AgentSignal title="Today" value={agent.dayPlan[0] ?? "Judge the page and leave a reusable next step."} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {agent.tastes.map((taste) => (
                <span key={taste} className="rounded-full border border-white/20 px-2 py-1 text-sm font-semibold text-white">
                  {taste}
                </span>
              ))}
            </div>
            <Link href={`/agents/${agent.id}`} className="mt-4 inline-flex text-sm font-semibold text-amber-200 underline-offset-4 hover:underline">
              Open profile
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

function CustomAgentsPanel() {
  return (
    <div className="space-y-6">
      <SavedAgentCastRoom />
      <AgentGeneratorPanel />
    </div>
  );
}

function PaidPanels() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {paidModes.map(({ icon: Icon, title, copy }) => (
        <Card key={title}>
          <Icon className="text-amber-900" size={22} />
          <Heading as="h2" className="mt-4 text-xl">
            {title}
          </Heading>
          <p className="mt-3 text-base leading-7 text-slate-700">{copy}</p>
        </Card>
      ))}
    </div>
  );
}

function AgentSignal({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg bg-white px-3 py-2 text-slate-950">
      <div className="text-sm font-semibold uppercase tracking-wide text-slate-600">{title}</div>
      <div className="mt-1 text-sm font-semibold leading-6">{value}</div>
    </div>
  );
}
