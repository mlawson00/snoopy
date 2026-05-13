"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Brain, Check, Loader2, Save, Sparkles, Trash2 } from "lucide-react";
import type { GeneratedAgent } from "@/lib/agent-generator";
import { captureClientEvent, currentCycleId, posthogRequestHeaders } from "@/lib/client-analytics";
import { Button, Card, Heading, Input, Textarea } from "@snoopy/ui";

export const SAVED_AGENTS_STORAGE_KEY = "snoopy.savedAgents";

type GenerateAgentResponse = {
  agent: GeneratedAgent;
  generation: {
    status: "llm" | "fallback" | "deterministic";
    reason?: string;
  };
};

const starterBrief =
  "Create a customer-owned brand guardian who cares about premium visual quality, homepage clarity, and whether Snoopy's agents sound like real people instead of repeated prompts.";

export function AgentGeneratorPanel() {
  const [brief, setBrief] = useState(starterBrief);
  const [customerName, setCustomerName] = useState("Acme Growth");
  const [tone, setTone] = useState<GeneratedAgent["voiceSettings"]["style"]>("plainspoken");
  const [savedAgents, setSavedAgents] = useState<GeneratedAgent[]>([]);
  const [generated, setGenerated] = useState<GeneratedAgent | null>(null);
  const [generationStatus, setGenerationStatus] = useState<GenerateAgentResponse["generation"] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSavedAgents(readSavedAgents());
    const params = new URLSearchParams(window.location.search);
    const prefillBrief = params.get("brief");
    const prefillTone = params.get("tone");
    const prefillCustomerName = params.get("customerName");

    if (prefillBrief && prefillBrief.trim().length >= 10) {
      setBrief(prefillBrief.slice(0, 1_200));
    }
    if (isAgentTone(prefillTone)) {
      setTone(prefillTone);
    }
    if (prefillCustomerName) {
      setCustomerName(prefillCustomerName.slice(0, 80));
    }
  }, []);

  const generatedIsSaved = useMemo(() => Boolean(generated && savedAgents.some((agent) => agent.id === generated.id)), [generated, savedAgents]);

  async function generateAgent() {
    setIsGenerating(true);
    setError(null);
    captureClientEvent("snoopy_agent_generation_form_submitted", {
      brief_length: brief.trim().length,
      customer_name_present: Boolean(customerName.trim()),
      saved_agent_count: savedAgents.length,
      tone,
    });

    try {
      const response = await fetch("/api/agents/generate", {
        method: "POST",
        headers: posthogRequestHeaders(),
        body: JSON.stringify({ brief, customerName, tone, customerOwned: true, cycleId: currentCycleId() }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const payload = (await response.json()) as GenerateAgentResponse;
      setGenerated(payload.agent);
      setGenerationStatus(payload.generation);
      captureClientEvent("snoopy_agent_generation_form_completed", {
        agent_id: payload.agent.id,
        critique_lens_count: payload.agent.critiqueLens.length,
        generation_status: payload.generation.status,
        private_exclusive: payload.agent.privateExclusive,
      });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Agent generation failed.";
      setError(message);
      captureClientEvent("snoopy_agent_generation_form_failed", {
        error_message: truncateAnalyticsText(message),
      });
    } finally {
      setIsGenerating(false);
    }
  }

  function saveGeneratedAgent() {
    if (!generated) return;
    const nextAgents = upsertAgent(savedAgents, generated);
    setSavedAgents(nextAgents);
    writeSavedAgents(nextAgents);
    captureClientEvent("snoopy_saved_agent_saved", {
      agent_id: generated.id,
      critique_lens_count: generated.critiqueLens.length,
      customer_owned: generated.customerOwned,
      private_exclusive: generated.privateExclusive,
      saved_agent_count: nextAgents.length,
    });
  }

  function deleteAgent(agentId: string) {
    const agent = savedAgents.find((item) => item.id === agentId);
    const nextAgents = savedAgents.filter((agent) => agent.id !== agentId);
    setSavedAgents(nextAgents);
    writeSavedAgents(nextAgents);
    captureClientEvent("snoopy_saved_agent_deleted", {
      agent_id: agentId,
      private_exclusive: agent?.privateExclusive,
      saved_agent_count: nextAgents.length,
    });
  }

  return (
    <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-[0.92fr_1.08fr]">
      <Card className="bg-white/88">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-mono text-sm font-semibold uppercase tracking-wide text-amber-900">Working generator</div>
            <Heading as="h2" className="mt-2 text-2xl">
              Create a customer-owned agent
            </Heading>
            <p className="mt-2 text-base leading-7 text-slate-700">
              This creates a structured agent profile with face, voice, backstory, tastes, blind spots, memories, source diet, relationship to the business, and a day plan.
              Saved agents can be included in the next website run.
            </p>
          </div>
          <Sparkles className="shrink-0 text-amber-900" size={22} />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4">
          <label htmlFor="agent-customer" className="block text-sm font-medium text-slate-700">
            Customer or workspace
            <Input id="agent-customer" className="mt-2" value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
          </label>

          <label htmlFor="agent-tone" className="block text-sm font-medium text-slate-700">
            Voice
            <select
              id="agent-tone"
              className="mt-2 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-slate-950"
              value={tone}
              onChange={(event) => setTone(event.target.value as GeneratedAgent["voiceSettings"]["style"])}
            >
              <option value="professional">Professional</option>
              <option value="plainspoken">Plainspoken</option>
              <option value="blunt">Blunt</option>
              <option value="warm">Warm</option>
              <option value="skeptical">Skeptical</option>
              <option value="visual">Visual</option>
            </select>
          </label>

          <label htmlFor="agent-brief" className="block text-sm font-medium text-slate-700">
            Agent brief
            <Textarea id="agent-brief" className="mt-2 min-h-32" value={brief} onChange={(event) => setBrief(event.target.value)} />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={() => void generateAgent()} disabled={isGenerating || brief.trim().length < 10}>
              {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Brain size={16} />}
              {isGenerating ? "Generating" : "Generate agent"}
            </Button>
            {generated ? (
              <Button type="button" variant="secondary" onClick={saveGeneratedAgent}>
                {generatedIsSaved ? <Check size={16} /> : <Save size={16} />}
                {generatedIsSaved ? "Saved" : "Save agent"}
              </Button>
            ) : null}
          </div>

          {generationStatus ? (
            <p className="rounded-lg bg-slate-100 p-3 text-base leading-7 text-slate-700">
              Generation: <span className="font-semibold">{generationStatus.status}</span>
              {generationStatus.reason ? ` - ${generationStatus.reason}` : ""}
            </p>
          ) : null}
          {error ? <p className="rounded-lg bg-red-50 p-3 text-base text-red-700">{error}</p> : null}
        </div>
      </Card>

      <div className="space-y-4">
        {generated ? <AgentProfileCard agent={generated} action={generatedIsSaved ? "Saved in this browser" : "Generated preview"} /> : null}

        <Card className="!bg-slate-950 text-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-mono text-sm font-semibold uppercase tracking-wide text-amber-200">Saved customer agents</div>
              <Heading as="h2" className="mt-2 text-2xl text-white">
                {savedAgents.length} saved
              </Heading>
            </div>
            <div className="rounded-full bg-amber-200 px-3 py-1 text-base font-semibold text-slate-950">usable in runs</div>
          </div>

          {savedAgents.length ? (
            <div className="mt-5 grid grid-cols-1 gap-3">
              {savedAgents.map((agent) => (
                <div key={agent.id} className="rounded-xl border border-white/10 bg-white/8 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <AgentFace agent={agent} />
                      <div>
                        <div className="text-lg font-semibold">{agent.name}</div>
                        <div className="text-base text-slate-100">{agent.role}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="rounded-full border border-white/15 p-2 text-slate-200 hover:bg-white/10"
                      aria-label={`Delete ${agent.name}`}
                      onClick={() => deleteAgent(agent.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <p className="mt-3 text-base leading-7 text-slate-100">{agent.backstory}</p>
                  {agent.customerRelationship ? <p className="mt-2 text-sm leading-6 text-slate-200">{agent.customerRelationship}</p> : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {agent.critiqueLens.slice(0, 4).map((lens) => (
                      <span key={lens} className="rounded-full border border-white/20 px-2 py-1 text-sm font-semibold text-white">
                        {lens}
                      </span>
                    ))}
                  </div>
                  <Link href={`/agents/${agent.id}`} className="mt-4 inline-flex text-sm font-semibold text-amber-200 underline-offset-4 hover:underline">
                    Open profile
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 rounded-xl bg-white/8 p-4 text-base leading-7 text-slate-100">
              No saved customer agents yet. Generate one, save it, then open a new run to include it beside the core cast.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}

function isAgentTone(value: string | null): value is GeneratedAgent["voiceSettings"]["style"] {
  return value === "professional" || value === "plainspoken" || value === "blunt" || value === "warm" || value === "skeptical" || value === "visual";
}

function truncateAnalyticsText(value: string) {
  return value.slice(0, 180);
}

function AgentProfileCard({ agent, action }: { agent: GeneratedAgent; action: string }) {
  return (
    <Card>
      <div className="flex items-start gap-4">
        <AgentFace agent={agent} dark={false} />
        <div>
          <div className="text-sm font-semibold uppercase tracking-wide text-amber-900">{action}</div>
          <Heading as="h2" className="mt-1 text-2xl">
            {agent.name}
          </Heading>
          <p className="mt-1 text-sm text-slate-600">{agent.role}</p>
        </div>
      </div>
      <div className="mt-4 rounded-lg bg-slate-950 p-3 text-base font-semibold leading-7 text-white">{agent.voice}</div>
      <p className="mt-4 text-base leading-7 text-slate-700">{agent.backstory}</p>
      {agent.customerRelationship ? (
        <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm font-semibold leading-6 text-emerald-950">
          {agent.privateExclusive ? "Private customer-exclusive. " : ""}
          {agent.customerRelationship}
        </p>
      ) : null}
      <ProfileList title="Tastes" items={agent.tastes} />
      <ProfileList title="Blind spots" items={readAgentList(agent.blindSpots)} />
      <ProfileList title="Memories" items={agent.memories} />
      <ProfileList title="Source diet" items={agent.sourceDiet} />
      <ProfileList title="Day plan" items={agent.dayPlan} />
      <FacetStrip facets={agent.personalityFacets} />
      <Link href={`/agents/${agent.id}`} className="mt-5 inline-flex text-sm font-semibold text-amber-900 underline-offset-4 hover:underline">
        Open profile
      </Link>
    </Card>
  );
}

function FacetStrip({ facets }: { facets: GeneratedAgent["personalityFacets"] }) {
  return (
    <div className="mt-4">
      <div className="text-base font-semibold uppercase tracking-wide text-slate-700">Personality facets</div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {[
          ["I", facets.introversion],
          ["E", facets.extraversion],
          ["S", facets.sensing],
          ["N", facets.intuition],
          ["T", facets.thinking],
          ["F", facets.feeling],
          ["J", facets.judging],
          ["P", facets.perceiving],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
            {label}: {Math.round(Number(value) * 100)}
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-4">
      <div className="text-base font-semibold uppercase tracking-wide text-slate-700">{title}</div>
      <ul className="mt-2 space-y-2 text-base leading-7 text-slate-700">
        {items.map((item) => (
          <li key={item} className="rounded-lg bg-slate-100 px-3 py-2">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function readAgentList(items: string[] | undefined) {
  return items?.length ? items : ["May over-index on the original brief.", "Needs another agent to challenge favorite patterns."];
}

function AgentFace({ agent, dark = true }: { agent: GeneratedAgent; dark?: boolean }) {
  return (
    <div
      className={
        dark
          ? "grid size-14 shrink-0 place-items-center rounded-2xl bg-amber-200 text-lg font-black text-slate-950"
          : "grid size-16 shrink-0 place-items-center rounded-2xl bg-slate-950 text-xl font-black text-white"
      }
    >
      {agent.face}
    </div>
  );
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

function writeSavedAgents(agents: GeneratedAgent[]) {
  window.localStorage.setItem(SAVED_AGENTS_STORAGE_KEY, JSON.stringify(agents));
  window.dispatchEvent(new CustomEvent("snoopy:saved-agents-updated"));
}

function upsertAgent(agents: GeneratedAgent[], agent: GeneratedAgent) {
  const existingIndex = agents.findIndex((item) => item.id === agent.id);
  if (existingIndex === -1) return [...agents, agent];
  return agents.map((item, index) => (index === existingIndex ? agent : item));
}
