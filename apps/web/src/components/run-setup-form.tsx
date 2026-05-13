"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { GeneratedAgent } from "@/lib/agent-generator";
import { AGENT_RUN_HISTORY_UPDATED_EVENT, readAgentRunHistory, rememberAgentRunHistory, type AgentRunHistoryEntry } from "@/lib/agent-run-history";
import { captureClientEvent, currentCycleId, posthogRequestHeaders } from "@/lib/client-analytics";
import { buildPersonalityCoverage, CORE_CAST_PERSONALITY } from "@/lib/personality-coverage";
import { SAVED_AGENTS_STORAGE_KEY } from "@/components/agent-generator-panel";
import type { Finding, PersonaProfile, Reaction, Recommendation, ReferenceSource, SimulationSnapshot } from "@snoopy/reports";
import { Button, Card, Heading, Input, Textarea } from "@snoopy/ui";

type RunResponse = {
  report: {
    summary: string;
    findings: Finding[];
    personas?: PersonaProfile[];
    reactions?: Reaction[];
    snapshots?: SimulationSnapshot[];
    recommendations?: Recommendation[];
    referenceSources?: ReferenceSource[];
    runId?: string;
  };
  events: Array<{
    type: string;
    message: string;
  }>;
  persistence?: {
    status: "persisted" | "generated" | "skipped" | "failed";
    reason?: string;
    reference?: {
      runId: string;
    };
  };
};

type AgentVoiceStyle = "professional" | "plainspoken" | "blunt";
type AgentProfanityLevel = "none" | "mild" | "moderate";
type AgentRelationshipPattern = {
  count: number;
  label: string;
};

const defaultCritics = [
  ["Omar", "money"],
  ["Leo", "taste"],
  ["Ivy", "readability"],
  ["Maya", "buyer"],
  ["Nora", "proof"],
  ["Quinn", "novelty"],
  ["MIKE", "creator"],
];

const previewFixQueue = [
  "Rewrite the hero around the buyer's pain.",
  "Replace vague proof with a visible before/after.",
  "Make the highest-value action impossible to miss.",
];

const transformationSteps = [
  ["Before", "Generic promise, buried proof, soft CTA.", "bg-red-100 text-red-950"],
  ["After", "Pain-first hero, visible proof, one next fix.", "bg-emerald-100 text-emerald-950"],
];

const proofFrameMetrics = [
  ["2s", "first doubt"],
  ["3", "missed claims"],
  ["1", "fix to ship"],
];

const trustReceipts = [
  ["Private agents", "Customer-owned agents are private workspace data."],
  ["Server-side credentials", "Production credentials stay server-side."],
  ["Demo storage", "Demo profiles stay in this browser."],
];

const personalityFacetLabels = {
  introversion: "introversion",
  extraversion: "extraversion",
  sensing: "sensing",
  intuition: "intuition",
  thinking: "thinking",
  feeling: "feeling",
  judging: "judging",
  perceiving: "perceiving",
} as const;

type PersonalityFacetKey = keyof typeof personalityFacetLabels;
type PersonaWithPersonalityFacets = {
  personalityFacets?: Partial<Record<PersonalityFacetKey, number>>;
};

function formatStance(stance: NonNullable<Reaction["stance"]>) {
  if (stance === "supports_prior") return "supports";
  if (stance === "extends_prior") return "extends";
  if (stance === "contradicts_prior") return "pushes back";
  if (stance === "improved_since_prior") return "improved since";
  return "independent";
}

function responseReasonLabel(reason: Reaction["responseReason"] | undefined) {
  if (reason === "same_run_reply") return "same run reply";
  if (reason === "prior_memory") return "prior memory";
  if (reason === "self_memory") return "self memory";
  if (reason === "same_evidence") return "same evidence";
  if (reason === "polarity_shift") return "polarity shift";
  if (reason === "prior_improvement") return "prior improvement";
  if (reason === "facet_contrast") return "facet contrast";
  return null;
}

function personaName(personas: Map<string, PersonaProfile>, id: string | undefined) {
  if (!id) return null;
  return personas.get(id)?.name ?? id;
}

export function RunSetupForm() {
  const [targetUrl, setTargetUrl] = useState("https://example.com");
  const [goal, setGoal] = useState("Find why a busy buyer would bounce before understanding the offer.");
  const [comparisonUrls, setComparisonUrls] = useState("");
  const [marketContext, setMarketContext] = useState(
    "Judge the page like a paid growth audit: be specific, constructive, and honest. Praise what works, challenge what does not, and explain where another critic is right or missing something.",
  );
  const [agentName, setAgentName] = useState("MIKE THE CREATOR");
  const [agentRole, setAgentRole] = useState("Constructive product owner who wants useful disagreement");
  const [agentAngle, setAgentAngle] = useState("commercial value, show don't tell, graphical design, constructive disagreement");
  const [agentVoiceStyle, setAgentVoiceStyle] = useState<AgentVoiceStyle>("plainspoken");
  const [agentProfanityLevel, setAgentProfanityLevel] = useState<AgentProfanityLevel>("none");
  const [customAgents, setCustomAgents] = useState<PersonaProfile[]>([]);
  const [savedAgents, setSavedAgents] = useState<GeneratedAgent[]>([]);
  const [agentRunHistory, setAgentRunHistory] = useState<AgentRunHistoryEntry[]>([]);
  const [selectedSavedAgentIds, setSelectedSavedAgentIds] = useState<string[]>([]);
  const [result, setResult] = useState<RunResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const didApplySavedAgentQueryRef = useRef(false);

  const personas = useMemo(() => new Map(result?.report.personas?.map((persona) => [persona.id, persona]) ?? []), [result?.report.personas]);
  const selectedSavedAgents = useMemo(
    () => savedAgents.filter((agent) => selectedSavedAgentIds.includes(agent.id)).map(generatedAgentToPersona),
    [savedAgents, selectedSavedAgentIds],
  );
  const unselectedSavedAgentCandidates = useMemo(
    () => savedAgents.filter((agent) => !selectedSavedAgentIds.includes(agent.id)).map(generatedAgentToPersona),
    [savedAgents, selectedSavedAgentIds],
  );
  const selectedPanelCoverage = useMemo(
    () => buildPersonalityCoverage([...CORE_CAST_PERSONALITY, ...customAgents, ...selectedSavedAgents].slice(0, 10), unselectedSavedAgentCandidates),
    [customAgents, selectedSavedAgents, unselectedSavedAgentCandidates],
  );
  const latestRunHistoryByAgent = useMemo(() => {
    const latest = new Map<string, AgentRunHistoryEntry>();
    for (const entry of agentRunHistory) {
      if (!latest.has(entry.personaId)) latest.set(entry.personaId, entry);
    }
    return latest;
  }, [agentRunHistory]);
  const relationshipPatternByAgent = useMemo(() => buildSavedAgentRelationshipPatterns(agentRunHistory), [agentRunHistory]);
  const layoutClassName = result ? "grid grid-cols-1 gap-5 lg:grid-cols-[0.9fr_1.1fr]" : "grid grid-cols-1";

  useEffect(() => {
    function loadAgentState() {
      const agents = readSavedAgents();
      setSavedAgents(agents);
      setAgentRunHistory(readAgentRunHistory());
      const queryAgentId = didApplySavedAgentQueryRef.current ? null : new URLSearchParams(window.location.search).get("agentId");
      setSelectedSavedAgentIds((current) => {
        const filtered = current.filter((id) => agents.some((agent) => agent.id === id));
        if (queryAgentId && agents.some((agent) => agent.id === queryAgentId) && !filtered.includes(queryAgentId)) {
          didApplySavedAgentQueryRef.current = true;
          return [...filtered, queryAgentId];
        }
        didApplySavedAgentQueryRef.current = true;
        return filtered;
      });
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

  function addCustomAgent() {
    const angles = agentAngle
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    setCustomAgents((agents) => [
      ...agents,
      buildCustomAgent(agents.length),
    ]);
    captureClientEvent("snoopy_custom_critic_added", {
      critique_lens_count: angles.length || 1,
      custom_agent_count: customAgents.length + 1,
      profanity_level: agentProfanityLevel,
      voice_style: agentVoiceStyle,
    });
  }

  function buildCustomAgent(index: number): PersonaProfile {
    const angles = agentAngle
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    return {
        id: `custom-${index + 1}`,
        name: agentName.trim() || `Custom ${index + 1}`,
        role: agentRole.trim() || "Custom critic",
        goal: goal.trim() || "Judge the website like a direct customer.",
        backstory: "Created by the user to add a specific point of view to the run.",
        memories: ["Gets impatient when product pages hide the actual value, but still notices what works."],
        tastes: angles.length ? angles : ["Commercial clarity", "Useful critique"],
        motivations: ["Find what the core cast may miss"],
        likes: ["Specific first-person reactions", "Screens that look worth paying for"],
        deviceHabits: ["Reviews the output on desktop"],
        skepticism: "Assumes agreement needs inspection unless each critic explains a different reason.",
        trustThreshold: 0.72,
        personalityFacets: {
          introversion: 0.5,
          extraversion: 0.5,
          sensing: 0.5,
          intuition: 0.5,
          thinking: 0.5,
          feeling: 0.5,
          judging: 0.5,
          perceiving: 0.5,
        },
        critiqueLens: angles.length ? angles : ["custom critique"],
        voice: {
          style: agentVoiceStyle,
          allowsMildProfanity: agentProfanityLevel !== "none",
          profanityLevel: agentProfanityLevel,
        },
      };
  }

  function toggleSavedAgentSelection(agent: GeneratedAgent, selected: boolean) {
    const nextIds = selected ? [...new Set([...selectedSavedAgentIds, agent.id])] : selectedSavedAgentIds.filter((id) => id !== agent.id);
    setSelectedSavedAgentIds(nextIds);
    captureClientEvent("snoopy_saved_agent_selection_changed", {
      agent_id: agent.id,
      selected,
      selected_saved_agent_count: nextIds.length,
      saved_agent_count: savedAgents.length,
    });
  }

  function parseUrlList(value: string) {
    return value
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  async function startRun() {
    setIsRunning(true);
    setError(null);
    setResult(null);
    const comparisonUrlList = parseUrlList(comparisonUrls);
    captureClientEvent("snoopy_run_form_submitted", {
      comparison_url_count: comparisonUrlList.length,
      custom_agent_count: customAgents.length,
      market_context_present: Boolean(marketContext.trim()),
      selected_saved_agent_count: selectedSavedAgents.length,
      target_url_host: targetUrlHost(targetUrl),
    });

    try {
      const response = await fetch("/api/runs", {
        method: "POST",
        headers: posthogRequestHeaders(),
        body: JSON.stringify({
          targetUrl,
          goal,
          comparisonUrls: comparisonUrlList,
          marketContext: marketContext.trim() || undefined,
          additionalPersonas: [...customAgents, ...selectedSavedAgents],
          maxPages: 1,
          cycleId: currentCycleId(),
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const payload = (await response.json()) as RunResponse;
      rememberAgentRunHistory({
        runId: payload.report.runId ?? payload.persistence?.reference?.runId,
        targetUrl,
        personas: payload.report.personas,
        reactions: payload.report.reactions,
      });
      setResult(payload);
      captureClientEvent("snoopy_run_form_completed", {
        finding_count: payload.report.findings.length,
        persistence_status: payload.persistence?.status,
        reaction_count: payload.report.reactions?.length ?? 0,
        recommendation_count: payload.report.recommendations?.length ?? 0,
        run_id: payload.report.runId ?? payload.persistence?.reference?.runId,
      });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Run failed.";
      setError(message);
      captureClientEvent("snoopy_run_form_failed", {
        error_message: truncateAnalyticsText(message),
        target_url_host: targetUrlHost(targetUrl),
      });
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className={layoutClassName}>
      <Card className="bg-white/88">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Heading as="h2" className="text-xl">
              Enter the URL
            </Heading>
            <p className="mt-1 text-sm text-slate-600">The persistent core cast reviews it first. Add more agents when the job needs more minds.</p>
          </div>
          <Button type="button" disabled={isRunning} onClick={startRun}>
            {isRunning ? "Running" : "Run review"}
          </Button>
        </div>

        <label htmlFor="target-url" className="mt-5 block text-sm font-medium text-slate-700">
          Website URL
          <Input id="target-url" className="mt-2 text-base" name="targetUrl" value={targetUrl} onChange={(event) => setTargetUrl(event.target.value)} />
        </label>

        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-mono text-sm font-semibold uppercase tracking-wide text-amber-900">Fix plan preview</div>
              <div className="mt-1 text-xl font-semibold text-slate-950">What the run should hand back</div>
            </div>
            <div className="rounded-full bg-slate-950 px-3 py-1 text-sm font-semibold text-white">URL → critics → fix</div>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-xl border border-black/10 bg-white p-3 shadow-sm">
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                <div
                  aria-label="Before teardown screen showing a vague website hero with weak proof."
                  className="min-h-64 rounded-lg border border-red-200 bg-red-50 p-4 text-red-950"
                >
                  <div className="flex items-center justify-between gap-3 text-sm font-semibold uppercase tracking-wide">
                    <span>Current screen</span>
                    <span className="rounded-full bg-red-200 px-2 py-1">bounce risk</span>
                  </div>
                  <img
                    src="/snoopy-report-preview.png"
                    alt="Snoopy report screenshot showing screen evidence, critic reactions, and recommendation cards."
                    className="mt-4 aspect-[4/3] w-full rounded-lg border border-red-200 bg-white object-cover object-top shadow-sm"
                  />
                  <div className="mt-5 rounded-lg border border-red-300 bg-white p-3 text-sm font-semibold leading-5">
                    "I still do not know why this matters."
                  </div>
                </div>
                <div
                  aria-label="After Snoopy screen showing a rewritten hero with visible proof and one clear fix."
                  className="min-h-64 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-950"
                >
                  <div className="flex items-center justify-between gap-3 text-sm font-semibold uppercase tracking-wide">
                    <span>Snoopy fix</span>
                    <span className="rounded-full bg-emerald-200 px-2 py-1">ready to ship</span>
                  </div>
                  <div className="mt-5 rounded-xl bg-slate-950 p-4 text-white">
                    <div className="text-sm font-semibold uppercase tracking-wide text-emerald-200">Buyer pain first</div>
                    <div className="mt-2 text-lg font-semibold leading-6">Show the fix before asking for trust.</div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {proofFrameMetrics.map(([value, label]) => (
                      <div key={label} className="rounded-lg bg-white p-2 text-center shadow-sm">
                        <div className="text-lg font-black">{value}</div>
                        <div className="text-sm leading-5">{label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 rounded-lg border border-emerald-300 bg-white p-3 text-sm font-semibold leading-5">
                    Next fix: move proof into the first decision point.
                  </div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-semibold">
                {transformationSteps.map(([label, copy, className]) => (
                  <div key={label} className={`rounded-lg p-3 ${className}`}>
                    <div className="uppercase tracking-wide">{label}</div>
                    <div className="mt-1 leading-5">{copy}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex h-full flex-col rounded-xl bg-slate-950 p-4 text-white shadow-sm">
              <div className="text-sm font-semibold uppercase tracking-wide text-amber-200">Implementation queue</div>
              <div className="mt-1 text-xl font-semibold">First fixes to hand off</div>
              <div className="mt-4 flex flex-col gap-2">
                {previewFixQueue.map((fix, index) => (
                  <div key={fix} className="rounded-lg border border-white/10 bg-white/10 p-3 text-sm font-semibold leading-6 text-white">
                    <span className="mr-2 text-amber-200">{index + 1}</span>
                    {fix}
                  </div>
                ))}
              </div>
              <div className="mt-auto pt-4 text-sm font-semibold leading-6 text-slate-200">Acceptance check: the next visitor sees proof before they need to trust the pitch.</div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {trustReceipts.map(([label, copy]) => (
            <div key={label} className="rounded-lg border border-black/10 bg-slate-50 p-3">
              <div className="text-sm font-semibold uppercase tracking-wide text-slate-950">{label}</div>
              <p className="mt-1 text-sm leading-6 text-slate-700">{copy}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {defaultCritics.map(([name, symbol], index) => (
            <div key={name} className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-slate-950 px-3 py-2 text-white">
              <span
                className={
                  index % 3 === 0
                    ? "size-3 rounded-full bg-red-300"
                    : index % 3 === 1
                      ? "size-3 rotate-45 bg-amber-200"
                      : "size-3 rounded-sm bg-sky-300"
                }
              />
              <span className="font-semibold">{name}</span>
              <span className="text-sm text-slate-300">{symbol}</span>
            </div>
          ))}
        </div>

        <PersonalityCoveragePanel coverage={selectedPanelCoverage} compact />

        <details className="mt-5 rounded-lg border border-black/10 bg-white p-4">
          <summary className="cursor-pointer text-sm font-semibold text-slate-950">Change the brief after the URL</summary>
          <div className="mt-4 space-y-4">
            <label htmlFor="simulation-goal" className="block text-sm font-medium text-slate-700">
              What should they judge?
              <Textarea id="simulation-goal" name="goal" className="mt-2" value={goal} onChange={(event) => setGoal(event.target.value)} />
            </label>
            <label htmlFor="comparison-urls" className="block text-sm font-medium text-slate-700">
              Comparison URLs
              <Textarea
                id="comparison-urls"
                name="comparisonUrls"
                className="mt-2"
                placeholder="https://competitor.example"
                value={comparisonUrls}
                onChange={(event) => setComparisonUrls(event.target.value)}
              />
            </label>
            <label htmlFor="market-context" className="block text-sm font-medium text-slate-700">
              Market context
              <Textarea
                id="market-context"
                name="marketContext"
                className="mt-2"
                placeholder="Paste competitor notes or current context."
                value={marketContext}
                onChange={(event) => setMarketContext(event.target.value)}
              />
            </label>
          </div>
        </details>

        <details className="mt-3 rounded-lg border border-black/10 bg-white p-4">
          <summary className="cursor-pointer text-sm font-semibold text-slate-950">Add a critic</summary>
          <div className="mt-4 grid grid-cols-1 gap-3">
            <label htmlFor="agent-name" className="block text-sm font-medium text-slate-700">
              Critic name
              <Input id="agent-name" className="mt-2" value={agentName} onChange={(event) => setAgentName(event.target.value)} />
            </label>
            <label htmlFor="agent-role" className="block text-sm font-medium text-slate-700">
              Point of view
              <Input id="agent-role" className="mt-2" value={agentRole} onChange={(event) => setAgentRole(event.target.value)} />
            </label>
            <label htmlFor="agent-angle" className="block text-sm font-medium text-slate-700">
              What do they care about?
              <Input id="agent-angle" className="mt-2" value={agentAngle} onChange={(event) => setAgentAngle(event.target.value)} />
            </label>
            <label htmlFor="agent-voice-style" className="block text-sm font-medium text-slate-700">
              Voice
              <select
                id="agent-voice-style"
                className="mt-2 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-slate-950"
                value={agentVoiceStyle}
                onChange={(event) => setAgentVoiceStyle(event.target.value as AgentVoiceStyle)}
              >
                <option value="professional">Professional</option>
                <option value="plainspoken">Plainspoken</option>
                <option value="blunt">Blunt</option>
              </select>
            </label>
            <label htmlFor="agent-profanity" className="block text-sm font-medium text-slate-700">
              Profanity
              <select
                id="agent-profanity"
                className="mt-2 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-slate-950"
                value={agentProfanityLevel}
                onChange={(event) => setAgentProfanityLevel(event.target.value as AgentProfanityLevel)}
              >
                <option value="none">None</option>
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
              </select>
            </label>
            <Button type="button" onClick={addCustomAgent}>
              Add critic
            </Button>
            {customAgents.length ? <div className="text-sm text-slate-600">Added: {customAgents.map((agent) => agent.name).join(", ")}</div> : null}
          </div>
        </details>

        {savedAgents.length ? (
          <details className="mt-3 rounded-lg border border-black/10 bg-white p-4" open>
            <summary className="cursor-pointer text-sm font-semibold text-slate-950">Saved customer agents</summary>
            <div className="mt-4 grid grid-cols-1 gap-2">
              {savedAgents.map((agent) => {
                const selected = selectedSavedAgentIds.includes(agent.id);
                const latestRunHistory = latestRunHistoryByAgent.get(agent.id);
                const relationshipPattern = relationshipPatternByAgent.get(agent.id);
                return (
                  <label key={agent.id} className="flex items-start gap-3 rounded-lg border border-black/10 bg-slate-50 p-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      className="mt-1 size-4"
                      aria-label={`Include ${agent.name} in this run`}
                      checked={selected}
                      onChange={(event) => toggleSavedAgentSelection(agent, event.target.checked)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-950 text-sm font-black text-white">{agent.face}</span>
                        <span>
                          <span className="block font-semibold text-slate-950">{agent.name}</span>
                          <span className="block">{agent.role}</span>
                        </span>
                      </span>
                      <span className="mt-2 block rounded-md bg-white px-3 py-2 text-slate-700">{agent.voice}</span>
                      {agent.customerRelationship ? <span className="mt-2 block text-sm leading-6 text-slate-700">{agent.customerRelationship}</span> : null}
                      <span className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-4">
                        <AgentReason label="Memory" items={agent.memories.slice(0, 1)} />
                        <AgentReason label="Lens" items={agent.critiqueLens.slice(0, 2)} />
                        <AgentReason label="Blind spot" items={readAgentList(agent.blindSpots).slice(0, 1)} />
                        <AgentReason label="Source diet" items={agent.sourceDiet.slice(0, 2)} />
                      </span>
                      {latestRunHistory ? (
                        <span className="mt-2 block rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold leading-6 text-amber-950">
                          Last run: {formatSavedAgentRunSignal(latestRunHistory)}
                        </span>
                      ) : null}
                      {relationshipPattern ? (
                        <span className="mt-2 block rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold leading-6 text-sky-950">
                          Pattern: {relationshipPattern.label}
                        </span>
                      ) : null}
                      <span className="mt-2 block rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm leading-6 text-emerald-950">
                        <span className="block font-semibold uppercase tracking-wide">Difference from panel</span>
                        <span className="mt-1 block">{savedAgentPanelDifference(agent)}</span>
                      </span>
                      <span className="mt-2 block text-sm font-semibold uppercase tracking-wide text-slate-600">
                        Include when this run needs {agent.tastes.slice(0, 2).join(" + ")}.
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
            <Link href="/agents" className="mt-3 inline-flex text-sm font-semibold text-amber-900 underline-offset-4 hover:underline">
              Create or edit agents
            </Link>
          </details>
        ) : (
          <Link href="/agents" className="mt-3 inline-flex text-sm font-semibold text-amber-900 underline-offset-4 hover:underline">
            Create a customer-owned agent
          </Link>
        )}

        {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
      </Card>

      {result ? (
        <Card className="!bg-slate-950 text-white lg:self-start">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-mono text-sm font-semibold uppercase tracking-wide text-amber-200">Generated run</div>
              <Heading as="h2" className="mt-2 text-2xl text-white">
                Critic results
              </Heading>
            </div>
            <div className="rounded-full bg-amber-200 px-3 py-1 text-sm font-semibold text-slate-950">Live output</div>
          </div>
          <div className="mt-4 space-y-4">
            {result.persistence?.reference?.runId ? (
              <Link
                href={`/runs/${result.persistence.reference.runId}`}
                className="inline-flex min-h-10 items-center rounded-full bg-amber-200 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-100"
              >
                Open full report
              </Link>
            ) : null}
            {result.report.personas?.length ? (
              <div className="rounded-lg bg-white/10 p-3 text-base text-slate-100">Critics: {result.report.personas.map((persona) => persona.name).join(", ")}</div>
            ) : null}
            {result.report.personas?.length ? <PersonalityCoveragePanel coverage={buildPersonalityCoverage(result.report.personas)} dark /> : null}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {result.report.reactions?.map((reaction) => {
                const persona = personas.get(reaction.personaId);
                return (
                  <div key={`${reaction.personaId}-${reaction.deviceId}-${reaction.url}-${reaction.thought}`} className="relative rounded-2xl bg-white p-4 text-slate-950">
                    <div className="absolute -bottom-2 left-8 size-4 rotate-45 bg-white" />
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold">{persona?.name ?? reaction.personaId}</div>
                        <div className="text-sm uppercase tracking-wide text-slate-700">{reaction.emotion}</div>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-sm text-slate-700">{reaction.deviceId}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-sm font-semibold uppercase tracking-wide">
                      {reaction.critiqueAxis ? <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">{reaction.critiqueAxis}</span> : null}
                      {reaction.stance ? (
                        <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-950">
                          {formatStance(reaction.stance)}
                          {reaction.respondsToPersonaId ? ` ${personaName(personas, reaction.respondsToPersonaId)}` : ""}
                        </span>
                      ) : null}
                      {responseReasonLabel(reaction.responseReason) ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-950">{responseReasonLabel(reaction.responseReason)}</span>
                      ) : null}
                    </div>
                    {reaction.responseReasonDetail ? <p className="mt-2 text-sm font-semibold leading-6 text-emerald-950">{reaction.responseReasonDetail}</p> : null}
                    <p className="mt-3 text-base leading-7">"{reaction.thought}"</p>
                  </div>
                );
              })}
            </div>
            {result.report.recommendations?.slice(0, 3).map((recommendation) => (
              <div key={recommendation.title} className="rounded-lg border border-white/10 bg-white/10 p-4">
                <div className="text-sm font-semibold uppercase tracking-wide text-amber-200">{recommendation.priority} fix</div>
                <div className="mt-1 font-semibold">{recommendation.title}</div>
                <p className="mt-2 text-base leading-7 text-slate-100">{recommendation.recommendation}</p>
              </div>
            ))}
            {result.report.findings.map((finding) => (
              <div key={finding.title} className="rounded-lg border border-red-300/20 bg-red-300/10 p-4">
                <div className="text-sm font-semibold uppercase tracking-wide text-red-100">{finding.severity} problem</div>
                <div className="mt-1 font-semibold">{finding.title}</div>
                <p className="mt-2 text-base leading-7 text-slate-100">{finding.recommendation}</p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}

function AgentReason({ label, items }: { label: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <span className="rounded-md border border-black/10 bg-white px-3 py-2">
      <span className="block text-sm font-semibold uppercase tracking-wide text-slate-600">{label}</span>
      <span className="mt-1 block text-slate-800">{items.join(" / ")}</span>
    </span>
  );
}

function targetUrlHost(value: string) {
  try {
    return new URL(value).host;
  } catch {
    return "invalid-url";
  }
}

function truncateAnalyticsText(value: string) {
  return value.slice(0, 180);
}

function PersonalityCoveragePanel({ coverage, dark = false, compact = false }: { coverage: ReturnType<typeof buildPersonalityCoverage>; dark?: boolean; compact?: boolean }) {
  const shellClass = dark ? "rounded-2xl border border-white/10 bg-white/10 p-4 text-white" : "mt-5 rounded-xl border border-black/10 bg-white p-4 text-slate-950";
  const chipClass = dark ? "rounded-full bg-amber-200 px-3 py-1 text-sm font-semibold text-slate-950" : "rounded-full bg-slate-950 px-3 py-1 text-sm font-semibold text-white";
  const mutedClass = dark ? "text-slate-200" : "text-slate-700";
  const axisClass = dark ? "rounded-lg bg-white p-3 text-slate-950" : "rounded-lg border border-black/10 bg-slate-50 p-3";

  return (
    <div className={shellClass}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className={dark ? "font-mono text-sm font-semibold uppercase tracking-wide text-amber-200" : "font-mono text-sm font-semibold uppercase tracking-wide text-amber-900"}>
            Panel personality coverage
          </div>
          <div className="mt-1 text-lg font-semibold">{coverage.coveredAxisCount} / {coverage.totalAxisCount} axes covered</div>
          <p className={`mt-1 text-sm leading-6 ${mutedClass}`}>{coverage.summary}</p>
        </div>
        <span className={chipClass}>
          {coverage.personaCount} agents{coverage.customerOwnedCount ? ` · ${coverage.customerOwnedCount} private` : ""}
        </span>
      </div>
      {compact ? (
        <div className="mt-3 flex flex-wrap gap-2 text-sm font-semibold text-slate-700">
          {coverage.axisSummaries.map((axis) => (
            <span key={axis.id} className="rounded-full border border-black/10 bg-slate-50 px-3 py-1">
              {axis.leftLabel}/{axis.rightLabel}: {axis.covered ? "covered" : "thin"}
            </span>
          ))}
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {coverage.axisSummaries.map((axis) => (
            <div key={axis.id} className={axisClass}>
              <div className="flex items-center justify-between gap-2 text-sm font-semibold">
                <span>
                  {axis.leftLabel}/{axis.rightLabel}
                </span>
                <span className={axis.covered ? "text-emerald-700" : "text-amber-800"}>{axis.covered ? "covered" : "thin"}</span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="font-semibold">{axis.leftName}</div>
                  <div className={dark ? "text-slate-700" : "text-slate-600"}>{axis.leftLead}</div>
                </div>
                <div>
                  <div className="font-semibold">{axis.rightName}</div>
                  <div className={dark ? "text-slate-700" : "text-slate-600"}>{axis.rightLead}</div>
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full bg-amber-400" style={{ width: `${Math.round(axis.leftAverage * 100)}%` }} />
              </div>
              <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Panel leans {axis.dominantLabel}</div>
            </div>
          ))}
        </div>
      )}
      {!compact && coverage.actionSuggestions.length ? (
        <div className={dark ? "mt-3 rounded-xl border border-amber-200/25 bg-slate-950 p-3" : "mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3"}>
          <div className={dark ? "text-sm font-semibold uppercase tracking-wide text-amber-200" : "text-sm font-semibold uppercase tracking-wide text-amber-900"}>Next agent to add</div>
          <div className="mt-2 grid grid-cols-1 gap-2">
            {coverage.actionSuggestions.map((suggestion) => (
              <div key={suggestion.id} className={dark ? "rounded-lg bg-white px-3 py-2 text-sm leading-6 text-slate-950" : "rounded-lg bg-white px-3 py-2 text-sm leading-6 text-slate-800"}>
                <span className="font-semibold text-slate-950">{suggestion.title}.</span> {suggestion.detail}
                {suggestion.source === "generated" && suggestion.generatorBrief ? (
                  <Link
                    href={agentGeneratorHref(suggestion.generatorBrief, suggestion.generatorTone)}
                    className="mt-2 inline-flex font-semibold text-amber-900 underline-offset-4 hover:underline"
                  >
                    Open prefilled generator
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function agentGeneratorHref(brief: string, tone = "plainspoken") {
  const params = new URLSearchParams({ brief, tone });
  return `/agents?${params.toString()}`;
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

function generatedAgentToPersona(agent: GeneratedAgent): PersonaProfile {
  return {
    id: agent.id,
    name: agent.name,
    role: agent.role,
    face: agent.face,
    goal: agent.goal,
    backstory: agent.backstory,
    memories: agent.memories,
    tastes: agent.tastes,
    blindSpots: readAgentList(agent.blindSpots),
    motivations: agent.motivations,
    likes: agent.likes,
    deviceHabits: agent.deviceHabits,
    skepticism: agent.skepticism,
    trustThreshold: 0.72,
    personalityFacets: readPersonalityFacets(agent.personalityFacets),
    critiqueLens: agent.critiqueLens,
    sourceDiet: agent.sourceDiet,
    dayPlan: agent.dayPlan,
    customerRelationship: agent.customerRelationship,
    privateExclusive: agent.privateExclusive,
    customerOwned: agent.customerOwned,
    voice: {
      style: mapGeneratedVoiceStyle(agent.voiceSettings.style),
      allowsMildProfanity: agent.voiceSettings.profanityLevel !== "none",
      profanityLevel: agent.voiceSettings.profanityLevel,
    },
  };
}

function readAgentList(items: string[] | undefined) {
  return items?.length ? items : ["May over-index on the original brief.", "Needs another agent to challenge favorite patterns."];
}

function savedAgentPanelDifference(agent: GeneratedAgent) {
  const facets = readPersonalityFacets(agent.personalityFacets);
  const coreAverages = averagePersonalityFacets(CORE_CAST_PERSONALITY);
  const differences = (Object.keys(personalityFacetLabels) as PersonalityFacetKey[])
    .map((facet) => ({
      facet,
      difference: facets[facet] - coreAverages[facet],
    }))
    .sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference))
    .slice(0, 2);

  if (!differences.length) return "Adds a saved customer point of view without changing the panel shape much.";

  return `Adds ${differences
    .map(({ facet, difference }) => `${difference >= 0 ? "more" : "less"} ${personalityFacetLabels[facet]} (${formatSignedPercent(difference)})`)
    .join(" and ")} than the core cast.`;
}

function averagePersonalityFacets(personas: PersonaWithPersonalityFacets[]) {
  const facetKeys = Object.keys(personalityFacetLabels) as PersonalityFacetKey[];
  const totals = Object.fromEntries(facetKeys.map((facet) => [facet, 0])) as Record<PersonalityFacetKey, number>;
  for (const persona of personas) {
    const facets = readPersonalityFacets(persona.personalityFacets);
    for (const facet of facetKeys) {
      totals[facet] += facets[facet];
    }
  }
  return Object.fromEntries(facetKeys.map((facet) => [facet, personas.length ? totals[facet] / personas.length : 0.5])) as Record<PersonalityFacetKey, number>;
}

function formatSignedPercent(value: number) {
  const percent = Math.round(value * 100);
  return `${percent >= 0 ? "+" : ""}${percent}`;
}

function buildSavedAgentRelationshipPatterns(entries: AgentRunHistoryEntry[]) {
  const grouped = new Map<string, { entry: AgentRunHistoryEntry; count: number }>();

  for (const entry of entries) {
    if (!entry.respondsToPersonaId || !entry.stance || entry.stance === "independent") continue;
    const key = `${entry.personaId}:${entry.stance}:${entry.respondsToPersonaId}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.count += 1;
      if (entry.completedAt > existing.entry.completedAt) existing.entry = entry;
    } else {
      grouped.set(key, { entry, count: 1 });
    }
  }

  const byAgent = new Map<string, AgentRelationshipPattern>();
  for (const item of grouped.values()) {
    if (item.count < 2) continue;
    const current = byAgent.get(item.entry.personaId);
    if (current && current.count >= item.count) continue;
    byAgent.set(item.entry.personaId, {
      count: item.count,
      label: formatSavedAgentRelationshipPattern(item.entry, item.count),
    });
  }

  return byAgent;
}

function formatSavedAgentRunSignal(entry: AgentRunHistoryEntry) {
  const target = entry.respondsToPersonaName ?? entry.respondsToPersonaId ?? "the prior read";
  const axis = entry.critiqueAxis ? ` on ${entry.critiqueAxis}` : "";

  if (entry.stance === "supports_prior") return `supported ${target}${axis}.`;
  if (entry.stance === "extends_prior") return `extended ${target}${axis}.`;
  if (entry.stance === "contradicts_prior") return `pushed back on ${target}${axis}.`;
  if (entry.stance === "improved_since_prior") return `saw improvement${axis}.`;
  return `left an independent ${entry.emotion} read${axis}.`;
}

function formatSavedAgentRelationshipPattern(entry: AgentRunHistoryEntry, count: number) {
  const target = entry.respondsToPersonaName ?? entry.respondsToPersonaId ?? "the prior read";
  const axis = entry.critiqueAxis ? ` on ${entry.critiqueAxis}` : "";
  const reads = `${count} ${count === 1 ? "read" : "reads"}`;

  if (entry.stance === "supports_prior") return `often supports ${target}${axis} (${reads}).`;
  if (entry.stance === "extends_prior") return `often extends ${target}${axis} (${reads}).`;
  if (entry.stance === "contradicts_prior") return `often pushes back on ${target}${axis} (${reads}).`;
  if (entry.stance === "improved_since_prior") return `often sees improvement${axis} (${reads}).`;
  return `often leaves an independent ${entry.emotion} read${axis} (${reads}).`;
}

function mapGeneratedVoiceStyle(style: GeneratedAgent["voiceSettings"]["style"]): AgentVoiceStyle {
  if (style === "professional" || style === "plainspoken" || style === "blunt") return style;
  if (style === "skeptical" || style === "visual") return "plainspoken";
  return "professional";
}

function readPersonalityFacets(facets: PersonaWithPersonalityFacets["personalityFacets"] | undefined) {
  return {
    introversion: facets?.introversion ?? 0.46,
    extraversion: facets?.extraversion ?? 0.54,
    sensing: facets?.sensing ?? 0.62,
    intuition: facets?.intuition ?? 0.38,
    thinking: facets?.thinking ?? 0.58,
    feeling: facets?.feeling ?? 0.42,
    judging: facets?.judging ?? 0.66,
    perceiving: facets?.perceiving ?? 0.34,
  };
}
