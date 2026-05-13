"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, History, MessageSquareQuote, Sparkles } from "lucide-react";
import type { GeneratedAgent } from "@/lib/agent-generator";
import { AGENT_RUN_HISTORY_UPDATED_EVENT, readAgentRunHistory, type AgentRunHistoryEntry } from "@/lib/agent-run-history";
import { SAVED_AGENTS_STORAGE_KEY } from "@/components/agent-generator-panel";
import { Card, Heading } from "@snoopy/ui";

export function SavedAgentCastRoom() {
  const [savedAgents, setSavedAgents] = useState<GeneratedAgent[]>([]);
  const [runHistory, setRunHistory] = useState<AgentRunHistoryEntry[]>([]);

  useEffect(() => {
    function loadAgentState() {
      setSavedAgents(readSavedAgents());
      setRunHistory(readAgentRunHistory());
    }

    loadAgentState();
    window.addEventListener("storage", loadAgentState);
    window.addEventListener("snoopy:saved-agents-updated", loadAgentState);
    window.addEventListener(AGENT_RUN_HISTORY_UPDATED_EVENT, loadAgentState);
    return () => {
      window.removeEventListener("storage", loadAgentState);
      window.removeEventListener("snoopy:saved-agents-updated", loadAgentState);
      window.removeEventListener(AGENT_RUN_HISTORY_UPDATED_EVENT, loadAgentState);
    };
  }, []);

  const latestRunHistoryByAgent = useMemo(() => {
    const latest = new Map<string, AgentRunHistoryEntry>();
    for (const entry of runHistory) {
      if (!latest.has(entry.personaId)) latest.set(entry.personaId, entry);
    }
    return latest;
  }, [runHistory]);

  if (!savedAgents.length) return null;

  return (
    <Card className="mt-8 !bg-slate-950 text-white">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-mono text-sm font-semibold uppercase tracking-wide text-amber-200">Customer-owned cast</div>
          <Heading as="h2" className="mt-2 text-3xl text-white">
            Your saved agents are in the room.
          </Heading>
          <p className="mt-2 max-w-3xl text-base leading-7 text-slate-200">
            These are not one-off prompts. They keep memory, taste, source habits, and a path into the next run.
          </p>
        </div>
        <div className="rounded-full bg-amber-200 px-3 py-1 text-sm font-semibold text-slate-950">{savedAgents.length} active</div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {savedAgents.map((agent) => {
          const latestRunHistory = latestRunHistoryByAgent.get(agent.id);

          return (
            <div key={agent.id} className="rounded-2xl border border-white/10 bg-white/8 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-amber-200 text-lg font-black text-slate-950">{agent.face}</div>
                  <div>
                    <div className="text-xl font-black leading-6">{agent.name}</div>
                    <div className="mt-1 text-base text-slate-100">{agent.role}</div>
                    {agent.privateExclusive ? <div className="mt-2 inline-flex rounded-full bg-white px-2 py-1 text-sm font-semibold text-slate-950">private customer agent</div> : null}
                  </div>
                </div>
                <Sparkles className="shrink-0 text-amber-200" size={20} />
              </div>

              <p className="mt-4 rounded-xl bg-white p-3 text-base font-semibold leading-7 text-slate-950">{agent.voice}</p>

              <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
                <SavedAgentSignal icon="memory" title="Memory" value={agent.memories[0] ?? "No saved memory yet."} />
                <SavedAgentSignal icon="source" title="Reads" value={agent.sourceDiet.slice(0, 2).join(" + ") || "Customer sources"} />
                <SavedAgentSignal icon="conversation" title="Likely to notice" value={agent.critiqueLens.slice(0, 2).join(" + ") || "customer-specific evidence"} />
                <SavedAgentSignal icon="memory" title="Today" value={agent.dayPlan[0] ?? "Join a run and leave one useful recommendation."} />
              </div>

              {latestRunHistory ? (
                <div className="mt-4 rounded-xl border border-sky-200/25 bg-sky-200 p-3 text-slate-950">
                  <div className="text-sm font-semibold uppercase tracking-wide text-sky-950">Latest run reaction</div>
                  <p className="mt-2 text-base font-semibold leading-7">"{latestRunHistory.thought}"</p>
                  <div className="mt-2 text-sm font-semibold text-sky-950">
                    {formatLatestRunSignal(latestRunHistory)}
                  </div>
                </div>
              ) : null}

              {agent.customerRelationship ? <p className="mt-4 text-sm font-semibold leading-6 text-slate-200">{agent.customerRelationship}</p> : null}

              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={`/runs/new?agentId=${encodeURIComponent(agent.id)}`}
                  className="inline-flex min-h-10 items-center gap-2 rounded-full bg-amber-200 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-100"
                >
                  Run with this agent <ArrowRight size={16} />
                </Link>
                <Link href={`/agents/${agent.id}`} className="inline-flex min-h-10 items-center rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
                  Open profile
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function SavedAgentSignal({ icon, title, value }: { icon: "memory" | "source" | "conversation"; title: string; value: string }) {
  const Icon = icon === "conversation" ? MessageSquareQuote : icon === "source" ? Sparkles : History;
  return (
    <div className="rounded-xl bg-white px-3 py-2 text-slate-950">
      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-600">
        <Icon size={14} /> {title}
      </div>
      <div className="mt-1 text-sm font-semibold leading-6">{value}</div>
    </div>
  );
}

function formatLatestRunSignal(entry: AgentRunHistoryEntry) {
  const target = entry.targetUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const stance = entry.stance === "extends_prior" ? "extended" : entry.stance === "supports_prior" ? "supported" : entry.stance === "contradicts_prior" ? "pushed back on" : "read";
  const respondent = entry.respondsToPersonaName ? ` ${entry.respondsToPersonaName}` : "";
  return `${stance}${respondent} on ${entry.critiqueAxis ?? "the page"} at ${target}.`;
}

function readSavedAgents(): GeneratedAgent[] {
  try {
    const raw = window.localStorage.getItem(SAVED_AGENTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as GeneratedAgent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
