import type { PersonaProfile, Reaction } from "@snoopy/reports";

export const AGENT_RUN_HISTORY_STORAGE_KEY = "snoopy.agentRunHistory";
export const AGENT_RUN_HISTORY_UPDATED_EVENT = "snoopy:agent-run-history-updated";

export type AgentRunHistoryEntry = {
  id: string;
  runId: string;
  targetUrl: string;
  completedAt: string;
  personaId: string;
  personaName: string;
  personaRole?: string;
  deviceId: string;
  emotion: Reaction["emotion"];
  thought: string;
  evidence: string;
  critiqueAxis?: string;
  stance?: Reaction["stance"];
  respondsToPersonaId?: string;
  respondsToPersonaName?: string;
  responseReason?: Reaction["responseReason"];
  responseReasonDetail?: string;
};

export function readAgentRunHistory(): AgentRunHistoryEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(AGENT_RUN_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AgentRunHistoryEntry[];
    return Array.isArray(parsed) ? parsed.filter(isAgentRunHistoryEntry).sort(sortNewestFirst) : [];
  } catch {
    return [];
  }
}

export function rememberAgentRunHistory(input: {
  runId?: string;
  targetUrl: string;
  completedAt?: string;
  personas?: PersonaProfile[];
  reactions?: Reaction[];
}) {
  if (typeof window === "undefined" || !input.reactions?.length) return;

  const completedAt = input.completedAt ?? new Date().toISOString();
  const runId = input.runId || `session-${Date.now()}`;
  const personas = new Map(input.personas?.map((persona) => [persona.id, persona]) ?? []);
  const existing = readAgentRunHistory();
  const nextEntries = input.reactions.map((reaction, index): AgentRunHistoryEntry => {
    const persona = personas.get(reaction.personaId);
    const respondsToPersona = reaction.respondsToPersonaId ? personas.get(reaction.respondsToPersonaId) : undefined;

    return {
      id: `${runId}:${reaction.personaId}:${reaction.deviceId}:${index}`,
      runId,
      targetUrl: input.targetUrl,
      completedAt,
      personaId: reaction.personaId,
      personaName: persona?.name ?? reaction.personaId,
      personaRole: persona?.role,
      deviceId: reaction.deviceId,
      emotion: reaction.emotion,
      thought: reaction.thought,
      evidence: reaction.evidence,
      critiqueAxis: reaction.critiqueAxis,
      stance: reaction.stance,
      respondsToPersonaId: reaction.respondsToPersonaId,
      respondsToPersonaName: respondsToPersona?.name ?? reaction.respondsToPersonaId,
      responseReason: reaction.responseReason,
      responseReasonDetail: reaction.responseReasonDetail,
    };
  });

  const deduped = new Map([...nextEntries, ...existing].map((entry) => [entry.id, entry]));
  const limited = Array.from(deduped.values()).sort(sortNewestFirst).slice(0, 80);
  window.localStorage.setItem(AGENT_RUN_HISTORY_STORAGE_KEY, JSON.stringify(limited));
  window.dispatchEvent(new Event(AGENT_RUN_HISTORY_UPDATED_EVENT));
}

function isAgentRunHistoryEntry(value: AgentRunHistoryEntry) {
  return (
    Boolean(value) &&
    typeof value.id === "string" &&
    typeof value.runId === "string" &&
    typeof value.targetUrl === "string" &&
    typeof value.completedAt === "string" &&
    typeof value.personaId === "string" &&
    typeof value.personaName === "string" &&
    typeof value.deviceId === "string" &&
    typeof value.thought === "string" &&
    typeof value.evidence === "string"
  );
}

function sortNewestFirst(left: AgentRunHistoryEntry, right: AgentRunHistoryEntry) {
  return right.completedAt.localeCompare(left.completedAt);
}
