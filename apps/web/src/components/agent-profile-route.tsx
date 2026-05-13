"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ArrowRight, BookOpen, Brain, Check, Eye, MessageSquareQuote, Mic2, Save, ShieldCheck, UserRoundCog } from "lucide-react";
import type { GeneratedAgent } from "@/lib/agent-generator";
import { AGENT_RUN_HISTORY_UPDATED_EVENT, readAgentRunHistory, type AgentRunHistoryEntry } from "@/lib/agent-run-history";
import { captureClientEvent } from "@/lib/client-analytics";
import { findCoreAgentProfile, type CoreAgentProfile } from "@/lib/core-agent-profiles";
import { completePersonalityFacets, CORE_CAST_PERSONALITY } from "@/lib/personality-coverage";
import { SAVED_AGENTS_STORAGE_KEY } from "@/components/agent-generator-panel";
import { Badge, Button, Card, Heading, Input, Section, Textarea } from "@snoopy/ui";

type DisplayAgent = {
  id: string;
  name: string;
  role: string;
  face: string;
  voice: string;
  backstory: string;
  memories: string[];
  tastes: string[];
  blindSpots?: string[];
  critiqueLens: string[];
  sourceDiet: string[];
  dayPlan: string[];
  personalityFacets?: GeneratedAgent["personalityFacets"];
  customerRelationship?: string;
  privateExclusive?: boolean;
  customerOwned: boolean;
  quote: string;
};

type AgentJudgmentTrailItem = {
  label: string;
  title: string;
  quote: string;
  evidence: string;
};

type AgentConversationMemoryItem = {
  personaId: string;
  personaName: string;
  total: number;
  supports: number;
  extends: number;
  pushbacks: number;
  improvements: number;
  latest: AgentRunHistoryEntry;
};

const workingReceipts = [
  {
    label: "Profile route",
    value: "/agents/{agentId}",
    copy: "The agent is no longer hidden prompt text. It has a durable page with voice, memory, taste, source diet, and activity.",
  },
  {
    label: "Run payload",
    value: "Can join a run",
    copy: "Saved customer agents are selectable in run setup and travel with the included panel into the report payload.",
  },
  {
    label: "Report memory",
    value: "Fields preserved",
    copy: "Reports keep face initials, customer-owned status, source diet, day plan, memories, and critique lenses visible.",
  },
];

export function AgentProfileRoute({ agentId }: { agentId: string }) {
  const [savedAgents, setSavedAgents] = useState<GeneratedAgent[]>([]);
  const [runHistory, setRunHistory] = useState<AgentRunHistoryEntry[]>([]);

  useEffect(() => {
    function loadProfileState() {
      setSavedAgents(readSavedAgents());
      setRunHistory(readAgentRunHistory());
    }

    loadProfileState();
    window.addEventListener("storage", loadProfileState);
    window.addEventListener("snoopy:saved-agents-updated", loadProfileState);
    window.addEventListener(AGENT_RUN_HISTORY_UPDATED_EVENT, loadProfileState);
    return () => {
      window.removeEventListener("storage", loadProfileState);
      window.removeEventListener("snoopy:saved-agents-updated", loadProfileState);
      window.removeEventListener(AGENT_RUN_HISTORY_UPDATED_EVENT, loadProfileState);
    };
  }, []);

  const agent = useMemo(() => {
    const saved = savedAgents.find((item) => item.id === agentId);
    if (saved) return generatedToDisplayAgent(saved);
    const core = findCoreAgentProfile(agentId);
    return core ? coreToDisplayAgent(core) : null;
  }, [agentId, savedAgents]);
  const savedAgent = useMemo(() => savedAgents.find((item) => item.id === agentId), [agentId, savedAgents]);
  const agentRunHistory = useMemo(() => runHistory.filter((entry) => entry.personaId === agentId), [agentId, runHistory]);
  const conversationMemory = useMemo(() => buildConversationMemory(agentRunHistory), [agentRunHistory]);
  const inboundConversationMemory = useMemo(() => buildInboundConversationMemory(runHistory, agentId), [agentId, runHistory]);

  function updateSavedAgent(updatedAgent: GeneratedAgent) {
    const nextAgents = savedAgents.map((item) => (item.id === updatedAgent.id ? updatedAgent : item));
    setSavedAgents(nextAgents);
    writeSavedAgents(nextAgents);
    captureClientEvent("snoopy_saved_agent_profile_updated", {
      agent_id: updatedAgent.id,
      critique_lens_count: updatedAgent.critiqueLens.length,
      memory_count: updatedAgent.memories.length,
      private_exclusive: updatedAgent.privateExclusive,
      saved_agent_count: nextAgents.length,
      source_diet_count: updatedAgent.sourceDiet.length,
    });
  }

  if (!agent) {
    return (
      <Section>
        <Card>
          <Badge>Agent profile</Badge>
          <Heading as="h1" className="mt-3 text-4xl">
            Agent not found
          </Heading>
          <p className="mt-3 text-base leading-7 text-slate-700">Saved customer agents live in this browser. Generate or save the agent first, then open the profile again.</p>
          <Link href="/agents" className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
            Back to agents <ArrowRight size={16} />
          </Link>
        </Card>
      </Section>
    );
  }

  return (
    <Section className="space-y-6">
      <div className="overflow-hidden rounded-lg border border-black/10 bg-slate-950 text-white shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-[0.86fr_1.14fr]">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col items-start gap-4 sm:flex-row">
              <div className="grid size-20 shrink-0 place-items-center rounded-lg bg-amber-200 text-2xl font-black text-slate-950">{agent.face}</div>
              <div className="min-w-0">
                <Badge className="bg-amber-200 text-slate-950">{agent.customerOwned ? "Customer-owned" : "Core cast"}</Badge>
                <Heading as="h1" className="mt-3 break-words text-4xl text-white sm:text-5xl">
                  {agent.name}
                </Heading>
                <p className="mt-2 text-lg leading-7 text-slate-100">{agent.role}</p>
              </div>
            </div>

            <div className="mt-7 rounded-lg bg-white p-5 text-slate-950">
              <div className="flex items-center gap-2 font-mono text-sm font-semibold uppercase tracking-wide text-amber-900">
                <MessageSquareQuote size={17} />
                Current voice
              </div>
              <p className="mt-3 text-2xl font-semibold leading-9">{agent.voice}</p>
              <p className="mt-4 border-l-4 border-amber-300 pl-4 text-base font-semibold leading-7 text-slate-800">"{agent.quote}"</p>
            </div>

            <p className="mt-6 text-lg leading-8 text-slate-100">{agent.backstory}</p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <ProofPill icon={<ShieldCheck size={18} />} title="Privacy boundary" copy="Customer-owned context is private workspace data; production credentials stay server-side." />
              <ProofPill icon={<Eye size={18} />} title="Readable critique" copy="Hard-to-see issues stay visible" />
              <ProofPill icon={<Brain size={18} />} title="Next run ready" copy="Can respond to prior output" />
            </div>

            <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Link href="/runs/new" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-amber-200 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-100">
                Use in a run <ArrowRight size={16} />
              </Link>
              <Link href="/agents" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
                Back to cast
              </Link>
            </div>
          </div>

          <div className="border-t border-white/10 bg-white p-4 lg:border-l lg:border-t-0">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-mono text-sm font-semibold uppercase tracking-wide text-slate-600">Visible output</div>
                  <div className="text-lg font-semibold text-slate-950">The report this agent feeds</div>
                </div>
                <Badge>Proof</Badge>
              </div>
              <Image
                src="/snoopy-report-preview.png"
                alt="Snoopy report preview showing agent reactions, route evidence, and recommendation cards"
                width={1366}
                height={2048}
                priority
                className="max-h-[34rem] w-full rounded-lg object-cover object-top shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Badge>Recent judgment trail</Badge>
            <Heading as="h2" className="mt-3 text-3xl">
              {agentRunHistory.length ? "This agent remembers the last run." : "This agent has a saved point of view."}
            </Heading>
          </div>
          <div className="rounded-full bg-slate-950 px-3 py-1 text-sm font-semibold text-white">{agentRunHistory.length ? "session run memory" : "current saved state"}</div>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
          {buildJudgmentTrail(agent, agentRunHistory).map((item) => (
            <div key={item.label} className="rounded-xl border border-black/10 bg-slate-50 p-4">
              <div className="font-mono text-sm font-semibold uppercase tracking-wide text-amber-900">{item.label}</div>
              <div className="mt-2 text-xl font-semibold text-slate-950">{item.title}</div>
              <p className="mt-3 rounded-lg bg-white p-3 text-base font-semibold leading-7 text-slate-950 shadow-sm">"{item.quote}"</p>
              <p className="mt-3 text-sm leading-6 text-slate-700">{item.evidence}</p>
            </div>
          ))}
        </div>
      </div>

      {conversationMemory.length ? (
        <div className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <Badge>Conversation memory</Badge>
              <Heading as="h2" className="mt-3 text-3xl">
                Who this agent reacts to.
              </Heading>
            </div>
            <div className="rounded-full bg-slate-950 px-3 py-1 text-sm font-semibold text-white">{conversationMemory.length} relationships</div>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
            {conversationMemory.map((item) => (
              <div key={item.personaId} className="rounded-xl border border-black/10 bg-slate-50 p-4">
                <div className="font-mono text-sm font-semibold uppercase tracking-wide text-amber-900">Often responds to</div>
                <div className="mt-2 text-xl font-semibold text-slate-950">{item.personaName}</div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-semibold text-slate-700">
                  <div className="rounded-lg bg-white px-3 py-2">supports {item.supports}</div>
                  <div className="rounded-lg bg-white px-3 py-2">extends {item.extends}</div>
                  <div className="rounded-lg bg-white px-3 py-2">pushes back {item.pushbacks}</div>
                  <div className="rounded-lg bg-white px-3 py-2">improved {item.improvements}</div>
                </div>
                <p className="mt-3 rounded-lg bg-white p-3 text-base font-semibold leading-7 text-slate-950">"{formatRunStance(item.latest)}"</p>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  {responseReasonLabel(item.latest.responseReason) ?? "Saved stance"} from {displayTarget(item.latest.targetUrl)}
                  {item.latest.responseReasonDetail ? `: ${item.latest.responseReasonDetail}` : "."}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {inboundConversationMemory.length ? (
        <div className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <Badge>Conversation memory</Badge>
              <Heading as="h2" className="mt-3 text-3xl">
                Who reacts to this agent.
              </Heading>
            </div>
            <div className="rounded-full bg-slate-950 px-3 py-1 text-sm font-semibold text-white">{inboundConversationMemory.length} inbound relationships</div>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
            {inboundConversationMemory.map((item) => (
              <div key={item.personaId} className="rounded-xl border border-black/10 bg-slate-50 p-4">
                <div className="font-mono text-sm font-semibold uppercase tracking-wide text-sky-800">Often hears from</div>
                <div className="mt-2 text-xl font-semibold text-slate-950">{item.personaName}</div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-semibold text-slate-700">
                  <div className="rounded-lg bg-white px-3 py-2">supports {item.supports}</div>
                  <div className="rounded-lg bg-white px-3 py-2">extends {item.extends}</div>
                  <div className="rounded-lg bg-white px-3 py-2">pushes back {item.pushbacks}</div>
                  <div className="rounded-lg bg-white px-3 py-2">improved {item.improvements}</div>
                </div>
                <p className="mt-3 rounded-lg bg-white p-3 text-base font-semibold leading-7 text-slate-950">"{formatInboundRunStance(item.latest, agent.name)}"</p>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  {responseReasonLabel(item.latest.responseReason) ?? "Saved stance"} from {displayTarget(item.latest.targetUrl)}
                  {item.latest.responseReasonDetail ? `: ${item.latest.responseReasonDetail}` : "."}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.88fr_1.12fr]">
        <div className="space-y-5">
          {savedAgent?.customerOwned ? <CustomerAgentEditor agent={savedAgent} onSave={updateSavedAgent} /> : null}

          <Card className="!bg-white/95">
            <Badge>Working receipts</Badge>
            <Heading as="h2" className="mt-4 text-3xl">
              This profile is a usable thing.
            </Heading>
            <div className="mt-5 grid grid-cols-1 gap-3">
              {workingReceipts.map((receipt) => (
                <div key={receipt.label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-950 px-3 py-1 text-sm font-semibold text-white">{receipt.label}</span>
                    <span className="text-lg font-semibold text-slate-950">{receipt.value}</span>
                  </div>
                  <p className="mt-2 text-base leading-7 text-slate-700">{receipt.copy}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="!bg-slate-950 text-white">
            <div className="font-mono text-sm font-semibold uppercase tracking-wide text-amber-200">How this agent judges a page</div>
            <div className="mt-4 flex flex-wrap gap-2">
              {agent.critiqueLens.map((lens) => (
                <span key={lens} className="rounded-full border border-white/20 px-3 py-1 text-sm font-semibold text-white">
                  {lens}
                </span>
              ))}
            </div>
            <p className="mt-5 text-base leading-7 text-slate-100">
              The lens is attached to runs so the agent can praise, push back, or change its mind from a stable point of view.
            </p>
          </Card>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ProfileSection icon={<Brain size={21} />} title="Memories" items={agent.memories} />
            <ProfileSection icon={<UserRoundCog size={21} />} title="Tastes" items={agent.tastes} />
            <ProfileSection icon={<Eye size={21} />} title="Blind spots" items={agent.blindSpots ?? []} />
            <ProfileSection icon={<BookOpen size={21} />} title="Source diet" items={agent.sourceDiet} />
            <ProfileSection icon={<Mic2 size={21} />} title="Day plan" items={agent.dayPlan} />
            {agent.personalityFacets ? <FacetSummary facets={agent.personalityFacets} /> : null}
            {agent.personalityFacets ? <FacetDifferenceCard agent={agent} /> : null}
          </div>

          {agent.customerRelationship ? (
            <Card>
              <Heading as="h2" className="text-2xl">
                Relationship to this business
              </Heading>
              <p className="mt-3 text-base leading-7 text-slate-700">{agent.customerRelationship}</p>
              {agent.privateExclusive ? <p className="mt-3 text-sm font-semibold uppercase tracking-wide text-emerald-800">Private customer-exclusive agent</p> : null}
            </Card>
          ) : null}

          <Card>
            <Heading as="h2" className="text-2xl">
              What happens next
            </Heading>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              {["Read the current page", "React to another agent", "Leave a fix for the next run"].map((step, index) => (
                <div key={step} className="rounded-lg bg-slate-100 p-4">
                  <div className="grid size-8 place-items-center rounded-full bg-amber-200 text-sm font-black text-slate-950">{index + 1}</div>
                  <div className="mt-3 text-base font-semibold leading-6 text-slate-950">{step}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </Section>
  );
}

function CustomerAgentEditor({ agent, onSave }: { agent: GeneratedAgent; onSave: (agent: GeneratedAgent) => void }) {
  const [name, setName] = useState(agent.name);
  const [role, setRole] = useState(agent.role);
  const [face, setFace] = useState(agent.face);
  const [voice, setVoice] = useState(agent.voice);
  const [backstory, setBackstory] = useState(agent.backstory);
  const [memories, setMemories] = useState(agent.memories.join("\n"));
  const [tastes, setTastes] = useState(agent.tastes.join("\n"));
  const [blindSpots, setBlindSpots] = useState(readAgentList(agent.blindSpots).join("\n"));
  const [critiqueLens, setCritiqueLens] = useState(agent.critiqueLens.join("\n"));
  const [sourceDiet, setSourceDiet] = useState(agent.sourceDiet.join("\n"));
  const [dayPlan, setDayPlan] = useState(agent.dayPlan.join("\n"));
  const [personalityFacets, setPersonalityFacets] = useState(readPersonalityFacets(agent.personalityFacets));
  const [customerRelationship, setCustomerRelationship] = useState(agent.customerRelationship ?? "");
  const [privateExclusive, setPrivateExclusive] = useState(agent.privateExclusive ?? true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(agent.name);
    setRole(agent.role);
    setFace(agent.face);
    setVoice(agent.voice);
    setBackstory(agent.backstory);
    setMemories(agent.memories.join("\n"));
    setTastes(agent.tastes.join("\n"));
    setBlindSpots(readAgentList(agent.blindSpots).join("\n"));
    setCritiqueLens(agent.critiqueLens.join("\n"));
    setSourceDiet(agent.sourceDiet.join("\n"));
    setDayPlan(agent.dayPlan.join("\n"));
    setPersonalityFacets(readPersonalityFacets(agent.personalityFacets));
    setCustomerRelationship(agent.customerRelationship ?? "");
    setPrivateExclusive(agent.privateExclusive ?? true);
  }, [agent]);

  useEffect(() => {
    setSaved(false);
  }, [agent.id]);

  function saveChanges() {
    onSave({
      ...agent,
      name: name.trim() || agent.name,
      role: role.trim() || agent.role,
      face: face.trim().slice(0, 4).toUpperCase() || agent.face,
      voice: voice.trim() || agent.voice,
      backstory: backstory.trim() || agent.backstory,
      memories: parseLines(memories, agent.memories).slice(0, 5),
      tastes: parseLines(tastes, agent.tastes).slice(0, 6),
      blindSpots: parseLines(blindSpots, readAgentList(agent.blindSpots)).slice(0, 5),
      critiqueLens: parseLines(critiqueLens, agent.critiqueLens).slice(0, 7),
      sourceDiet: parseLines(sourceDiet, agent.sourceDiet).slice(0, 6),
      dayPlan: parseLines(dayPlan, agent.dayPlan).slice(0, 5),
      personalityFacets,
      customerRelationship: customerRelationship.trim() || agent.customerRelationship || "Private customer-owned reviewer for this workspace.",
      privateExclusive,
    });
    setSaved(true);
  }

  return (
    <Card className="!bg-amber-50">
      <Badge>Owner controls</Badge>
      <Heading as="h2" className="mt-4 text-3xl">
        Customize this agent.
      </Heading>
      <p className="mt-3 text-base leading-7 text-slate-700">
        These edits update the saved browser profile used by the next run, so the agent's taste and memory can evolve instead of staying frozen.
      </p>

      <details className="mt-5 rounded-lg border border-black/10 bg-white p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-950">Edit full profile</summary>
        <p className="mt-2 text-sm leading-6 text-slate-600">The defaults are already usable. Open this when the agent needs sharper memory, taste, or customer context.</p>

        <div className="mt-5 grid grid-cols-1 gap-4">
          <label htmlFor="agent-name" className="block text-sm font-semibold text-slate-700">
            Name
            <Input id="agent-name" className="mt-2 text-base" value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label htmlFor="agent-role" className="block text-sm font-semibold text-slate-700">
            Role
            <Input id="agent-role" className="mt-2 text-base" value={role} onChange={(event) => setRole(event.target.value)} />
          </label>
          <label htmlFor="agent-face" className="block text-sm font-semibold text-slate-700">
            Face initials
            <Input id="agent-face" className="mt-2 max-w-28 text-base" value={face} onChange={(event) => setFace(event.target.value)} />
          </label>
          <label htmlFor="agent-voice" className="block text-sm font-semibold text-slate-700">
            Voice
            <Input id="agent-voice" className="mt-2 text-base" value={voice} onChange={(event) => setVoice(event.target.value)} />
          </label>
          <label htmlFor="agent-backstory" className="block text-sm font-semibold text-slate-700">
            Backstory
            <Textarea id="agent-backstory" className="mt-2 min-h-24 text-base" value={backstory} onChange={(event) => setBackstory(event.target.value)} />
          </label>
          <label htmlFor="agent-relationship" className="block text-sm font-semibold text-slate-700">
            Relationship to this business
            <Textarea
              id="agent-relationship"
              className="mt-2 min-h-20 text-base"
              value={customerRelationship}
              onChange={(event) => setCustomerRelationship(event.target.value)}
            />
          </label>
          <label htmlFor="agent-private-exclusive" className="flex items-start gap-3 rounded-lg border border-black/10 bg-white p-3 text-sm font-semibold text-slate-700">
            <input
              id="agent-private-exclusive"
              type="checkbox"
              className="mt-1 size-4"
              checked={privateExclusive}
              onChange={(event) => setPrivateExclusive(event.target.checked)}
            />
            <span>
              Private or customer-exclusive
              <span className="block text-sm font-medium leading-6 text-slate-600">Mark this agent as owned by this workspace, not part of the public core cast.</span>
            </span>
          </label>
          <EditableList id="agent-memories" label="Edit memories" value={memories} onChange={setMemories} />
          <EditableList id="agent-tastes" label="Edit tastes" value={tastes} onChange={setTastes} />
          <EditableList id="agent-blind-spots" label="Edit blind spots" value={blindSpots} onChange={setBlindSpots} />
          <EditableList id="agent-lenses" label="Edit critique lenses" value={critiqueLens} onChange={setCritiqueLens} />
          <EditableList id="agent-sources" label="Edit source diet" value={sourceDiet} onChange={setSourceDiet} />
          <EditableList id="agent-day-plan" label="Edit day plan" value={dayPlan} onChange={setDayPlan} />
          <FacetEditor facets={personalityFacets} onChange={setPersonalityFacets} />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button type="button" onClick={saveChanges}>
            {saved ? <Check size={16} /> : <Save size={16} />}
            {saved ? "Saved changes" : "Save changes"}
          </Button>
          <span className="text-sm font-semibold text-slate-600">Saved agents remain private workspace data in this browser.</span>
        </div>
      </details>
    </Card>
  );
}

function FacetEditor({ facets, onChange }: { facets: GeneratedAgent["personalityFacets"]; onChange: (facets: GeneratedAgent["personalityFacets"]) => void }) {
  return (
    <div className="rounded-lg border border-black/10 bg-slate-50 p-4">
      <div className="text-sm font-semibold uppercase tracking-wide text-slate-700">Personality facets</div>
      <p className="mt-2 text-sm leading-6 text-slate-600">Tune how this agent thinks so it does not collapse into the core cast.</p>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        {PERSONALITY_FACETS.map((facet) => (
          <label key={facet.key} htmlFor={`agent-facet-${facet.key}`} className="block rounded-lg bg-white p-3 text-sm font-semibold text-slate-700">
            <span className="flex items-center justify-between gap-3">
              <span>{facet.label}</span>
              <span className="font-mono text-slate-950">{Math.round(facets[facet.key] * 100)}</span>
            </span>
            <input
              id={`agent-facet-${facet.key}`}
              type="range"
              min="0"
              max="1"
              step="0.01"
              className="mt-3 w-full accent-slate-950"
              value={facets[facet.key]}
              onChange={(event) => onChange({ ...facets, [facet.key]: Number(event.target.value) })}
            />
          </label>
        ))}
      </div>
    </div>
  );
}

function EditableList({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label htmlFor={id} className="block text-sm font-semibold text-slate-700">
      {label}
      <Textarea id={id} className="mt-2 min-h-24 text-base" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function ProfileSection({ icon, title, items }: { icon: ReactNode; title: string; items: string[] }) {
  if (!items.length) return null;

  return (
    <Card>
      <div className="text-amber-900">{icon}</div>
      <Heading as="h2" className="mt-4 text-xl">
        {title}
      </Heading>
      <ul className="mt-3 space-y-2 text-base leading-7 text-slate-700">
        {items.map((item) => (
          <li key={item} className="rounded-lg bg-slate-100 px-3 py-2">
            {item}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function FacetSummary({ facets }: { facets: GeneratedAgent["personalityFacets"] }) {
  return (
    <Card>
      <div className="text-amber-900">
        <UserRoundCog size={21} />
      </div>
      <Heading as="h2" className="mt-4 text-xl">
        Personality facets
      </Heading>
      <div className="mt-3 space-y-3">
        {PERSONALITY_AXES.map((axis) => (
          <div key={axis.left} className="rounded-lg bg-slate-100 p-3">
            <div className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-700">
              <span>{axis.leftLabel}</span>
              <span>{axis.rightLabel}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-slate-950" style={{ width: `${Math.round(facets[axis.right] * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function FacetDifferenceCard({ agent }: { agent: DisplayAgent }) {
  if (!agent.personalityFacets) return null;
  const contrasts = buildFacetContrasts(agent);

  return (
    <Card>
      <div className="text-amber-900">
        <Brain size={21} />
      </div>
      <Heading as="h2" className="mt-4 text-xl">
        Difference from the panel
      </Heading>
      <p className="mt-3 text-base leading-7 text-slate-700">
        {agent.name}'s weights explain why this agent should notice different things before the cast collapses into one generic reviewer.
      </p>
      <div className="mt-4 space-y-3">
        {contrasts.map((contrast) => (
          <div key={contrast.axis} className="rounded-lg bg-slate-100 p-3">
            <div className="text-sm font-semibold uppercase tracking-wide text-amber-900">{contrast.axis}</div>
            <div className="mt-1 text-base font-semibold text-slate-950">Leans {contrast.lean}</div>
            <p className="mt-2 text-sm leading-6 text-slate-700">{contrast.detail}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ProofPill({ icon, title, copy }: { icon: ReactNode; title: string; copy: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/8 p-3">
      <div className="flex items-center gap-2 text-amber-200">
        {icon}
        <span className="text-sm font-semibold text-white">{title}</span>
      </div>
      <p className="mt-2 text-sm leading-5 text-slate-200">{copy}</p>
    </div>
  );
}

function buildJudgmentTrail(agent: DisplayAgent, runHistory: AgentRunHistoryEntry[]): AgentJudgmentTrailItem[] {
  const [latest, previous] = runHistory;
  if (latest) {
    return [
      {
        label: "Latest run reaction",
        title: `What ${agent.name} said after seeing ${displayTarget(latest.targetUrl)}`,
        quote: latest.thought,
        evidence: `Saved from run ${latest.runId} on ${latest.deviceId}. ${latest.personaRole ? `${latest.personaRole}. ` : ""}`,
      },
      {
        label: "Run evidence",
        title: "What their judgment leaned on",
        quote: latest.evidence,
        evidence: latest.critiqueAxis ? `Critique axis: ${latest.critiqueAxis}.` : "This evidence came from the generated report reaction.",
      },
      {
        label: previous ? "Prior reaction" : "Conversation stance",
        title: previous ? `Previous memory from ${displayTarget(previous.targetUrl)}` : "How they entered the conversation",
        quote: previous?.thought ?? formatRunStance(latest),
        evidence: previous ? `Saved from run ${previous.runId} on ${previous.deviceId}.` : "This comes from the reaction stance saved with the generated run.",
      },
    ];
  }

  return [
    {
      label: "Memory update",
      title: "What this agent remembers first",
      quote: agent.memories[0] ?? "No saved memory yet.",
      evidence: "This comes from the saved profile and travels into runs instead of being regenerated from an empty prompt.",
    },
    {
      label: "Source habit",
      title: "What they compare against",
      quote: agent.sourceDiet.slice(0, 2).join(" + ") || "No source diet saved yet.",
      evidence: "The source diet tells the next run what outside context or prior material this point of view should lean on.",
    },
    {
      label: "Next disagreement",
      title: "How they enter the next run",
      quote: agent.dayPlan[1] ?? agent.dayPlan[0] ?? "No next-run behavior saved yet.",
      evidence: "This is the planned behavior for the next critique, so the agent can respond instead of acting like a one-run prompt.",
    },
  ];
}

function buildConversationMemory(runHistory: AgentRunHistoryEntry[]): AgentConversationMemoryItem[] {
  const grouped = new Map<string, AgentConversationMemoryItem>();

  for (const entry of runHistory) {
    if (!entry.respondsToPersonaId || !entry.stance || entry.stance === "independent") continue;
    const existing = grouped.get(entry.respondsToPersonaId) ?? {
      personaId: entry.respondsToPersonaId,
      personaName: entry.respondsToPersonaName ?? entry.respondsToPersonaId,
      total: 0,
      supports: 0,
      extends: 0,
      pushbacks: 0,
      improvements: 0,
      latest: entry,
    };

    existing.total += 1;
    if (entry.stance === "supports_prior") existing.supports += 1;
    if (entry.stance === "extends_prior") existing.extends += 1;
    if (entry.stance === "contradicts_prior") existing.pushbacks += 1;
    if (entry.stance === "improved_since_prior") existing.improvements += 1;
    if (entry.completedAt > existing.latest.completedAt) existing.latest = entry;
    grouped.set(entry.respondsToPersonaId, existing);
  }

  return Array.from(grouped.values())
    .toSorted((left, right) => right.total - left.total || right.latest.completedAt.localeCompare(left.latest.completedAt))
    .slice(0, 3);
}

function buildInboundConversationMemory(runHistory: AgentRunHistoryEntry[], agentId: string): AgentConversationMemoryItem[] {
  const grouped = new Map<string, AgentConversationMemoryItem>();

  for (const entry of runHistory) {
    if (entry.respondsToPersonaId !== agentId || !entry.stance || entry.stance === "independent") continue;
    const existing = grouped.get(entry.personaId) ?? {
      personaId: entry.personaId,
      personaName: entry.personaName,
      total: 0,
      supports: 0,
      extends: 0,
      pushbacks: 0,
      improvements: 0,
      latest: entry,
    };

    existing.total += 1;
    if (entry.stance === "supports_prior") existing.supports += 1;
    if (entry.stance === "extends_prior") existing.extends += 1;
    if (entry.stance === "contradicts_prior") existing.pushbacks += 1;
    if (entry.stance === "improved_since_prior") existing.improvements += 1;
    if (entry.completedAt > existing.latest.completedAt) existing.latest = entry;
    grouped.set(entry.personaId, existing);
  }

  return Array.from(grouped.values())
    .toSorted((left, right) => right.total - left.total || right.latest.completedAt.localeCompare(left.latest.completedAt))
    .slice(0, 3);
}

function displayTarget(targetUrl: string) {
  if (targetUrl.startsWith("/")) return targetUrl;

  try {
    const url = new URL(targetUrl);
    return url.hostname.replace(/^www\./, "") + url.pathname.replace(/\/$/, "");
  } catch {
    return targetUrl;
  }
}

function formatRunStance(entry: AgentRunHistoryEntry) {
  if (entry.stance === "supports_prior") return `I supported ${entry.respondsToPersonaName ?? "another agent"} here.`;
  if (entry.stance === "extends_prior") return `I extended ${entry.respondsToPersonaName ?? "another agent"} with a different angle.`;
  if (entry.stance === "contradicts_prior") return `I pushed back on ${entry.respondsToPersonaName ?? "another agent"} because the evidence pointed elsewhere.`;
  if (entry.stance === "improved_since_prior") return "I saw improvement compared with the prior pass.";
  return `I gave an independent ${entry.emotion} read.`;
}

function formatInboundRunStance(entry: AgentRunHistoryEntry, agentName: string) {
  if (entry.stance === "supports_prior") return `${entry.personaName} supported ${agentName} here.`;
  if (entry.stance === "extends_prior") return `${entry.personaName} extended ${agentName} with another angle.`;
  if (entry.stance === "contradicts_prior") return `${entry.personaName} pushed back on ${agentName} because the evidence pointed elsewhere.`;
  if (entry.stance === "improved_since_prior") return `${entry.personaName} saw improvement after ${agentName}'s prior read.`;
  return `${entry.personaName} gave an independent ${entry.emotion} read.`;
}

function responseReasonLabel(reason: AgentRunHistoryEntry["responseReason"]) {
  if (reason === "same_run_reply") return "Same-run reply";
  if (reason === "prior_memory") return "Prior memory";
  if (reason === "self_memory") return "Self memory";
  if (reason === "same_evidence") return "Same evidence";
  if (reason === "polarity_shift") return "Polarity shift";
  if (reason === "prior_improvement") return "Prior improvement";
  if (reason === "facet_contrast") return "Facet contrast";
  return null;
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
  window.dispatchEvent(new Event("snoopy:saved-agents-updated"));
}

function parseLines(value: string, fallback: string[]) {
  const items = value
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length ? items : fallback;
}

function readAgentList(items: string[] | undefined) {
  return items?.length ? items : ["May over-index on the original brief.", "Needs another agent to challenge favorite patterns."];
}

function readPersonalityFacets(facets: GeneratedAgent["personalityFacets"] | undefined): GeneratedAgent["personalityFacets"] {
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

function generatedToDisplayAgent(agent: GeneratedAgent): DisplayAgent {
  return {
    id: agent.id,
    name: agent.name,
    role: agent.role,
    face: agent.face,
    voice: agent.voice,
    backstory: agent.backstory,
    memories: agent.memories,
    tastes: agent.tastes,
    blindSpots: readAgentList(agent.blindSpots),
    critiqueLens: agent.critiqueLens,
    sourceDiet: agent.sourceDiet,
    dayPlan: agent.dayPlan,
    personalityFacets: readPersonalityFacets(agent.personalityFacets),
    customerRelationship: agent.customerRelationship,
    privateExclusive: agent.privateExclusive,
    customerOwned: agent.customerOwned,
    quote: agent.goal,
  };
}

function coreToDisplayAgent(agent: CoreAgentProfile): DisplayAgent {
  return {
    ...agent,
    customerOwned: false,
    quote: agent.quote,
  };
}

function buildFacetContrasts(agent: DisplayAgent) {
  const panel = CORE_CAST_PERSONALITY.filter((persona) => persona.id !== agent.id).map((persona) => completePersonalityFacets(persona));
  const comparisonPanel = panel.length ? panel : CORE_CAST_PERSONALITY.map((persona) => completePersonalityFacets(persona));

  return PERSONALITY_AXES.map((axis) => {
    const agentOrientation = agent.personalityFacets![axis.right] - agent.personalityFacets![axis.left];
    const panelOrientation = average(comparisonPanel.map((facets) => facets[axis.right] - facets[axis.left]));
    const agentLean = agentOrientation >= 0 ? axis.rightLabel : axis.leftLabel;
    const panelLean = panelOrientation >= 0 ? axis.rightLabel : axis.leftLabel;
    const agentWeight = Math.max(agent.personalityFacets![axis.left], agent.personalityFacets![axis.right]);
    const panelWeight = Math.abs(panelOrientation);
    const contrast = Math.abs(agentOrientation - panelOrientation);

    return {
      axis: `${axis.leftLabel} / ${axis.rightLabel}`,
      lean: agentLean.toLowerCase(),
      contrast,
      detail: `${agent.name} shows ${Math.round(agentWeight * 100)}% ${agentLean.toLowerCase()} here; the remaining panel averages ${Math.round(panelWeight * 100)}% toward ${panelLean.toLowerCase()}.`,
    };
  })
    .toSorted((left, right) => right.contrast - left.contrast)
    .slice(0, 3);
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

const PERSONALITY_FACETS: Array<{ key: keyof GeneratedAgent["personalityFacets"]; label: string }> = [
  { key: "introversion", label: "Introversion" },
  { key: "extraversion", label: "Extraversion" },
  { key: "sensing", label: "Sensing" },
  { key: "intuition", label: "Intuition" },
  { key: "thinking", label: "Thinking" },
  { key: "feeling", label: "Feeling" },
  { key: "judging", label: "Judging" },
  { key: "perceiving", label: "Perceiving" },
];

const PERSONALITY_AXES: Array<{
  left: keyof GeneratedAgent["personalityFacets"];
  right: keyof GeneratedAgent["personalityFacets"];
  leftLabel: string;
  rightLabel: string;
}> = [
  { left: "introversion", right: "extraversion", leftLabel: "Introvert", rightLabel: "Extravert" },
  { left: "sensing", right: "intuition", leftLabel: "Sensing", rightLabel: "Intuition" },
  { left: "thinking", right: "feeling", leftLabel: "Thinking", rightLabel: "Feeling" },
  { left: "judging", right: "perceiving", leftLabel: "Judging", rightLabel: "Perceiving" },
];
