"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { buildPersonalityCoverage } from "@/lib/personality-coverage";
import { captureClientEvent } from "@/lib/client-analytics";
import { ArrowRight, BookOpen, Check, Copy, Download, Eye, FileText, Flame, GitCompareArrows, ListChecks, MessageSquareQuote, ShieldCheck, Sparkles } from "lucide-react";
import {
  buildSimulationReport,
  formatImplementationQueueMarkdown,
  formatRecommendationCustomerOwnedCreditItem,
  formatRecommendationRelationshipContextItem,
  formatRecommendationSourceReferenceItem,
  formatRecommendationWorkItemTask,
  getRecommendationCustomerOwnedCredits,
  getRecommendationRelationshipContext,
  getRecommendationSourceReferences,
  getRecommendationWorkItem,
  implementationQueueFilename,
  type Finding,
  type ImplementationWorkItem,
  type PersonaProfile,
  type Reaction,
  type RecommendationCustomerOwnedCredit,
  type RecommendationRelationshipContext,
  type RecommendationSourceReference,
  type Report,
} from "@snoopy/reports";
import { Badge, Card, Heading } from "@snoopy/ui";

const demoPersonas: PersonaProfile[] = [
  {
    id: "maya",
    name: "Maya",
    role: "Impatient buyer",
    goal: "Decide fast if this is worth a trial.",
    backstory: "Owns a budget and hates being forced into calls before seeing value.",
  memories: ["Got burned by vague pricing and fluffy demos."],
  tastes: ["Clear money story", "Fast proof"],
  blindSpots: ["Can ignore long-term brand value when the first buying step is unclear."],
  motivations: ["Avoid wasting budget", "Move quickly"],
    likes: ["Specific outcomes", "Obvious next step"],
    deviceHabits: ["Skims on phone", "Approves on laptop"],
    skepticism: "If the payoff is not obvious, she leaves.",
    trustThreshold: 0.72,
  },
  {
    id: "leo",
    name: "Leo",
    role: "Visual critic",
    goal: "Decide if the page looks expensive enough to trust.",
    backstory: "Designs high-converting product pages and notices cheap-looking UI instantly.",
    memories: ["Watched a client lose trust because screenshots looked unfinished."],
    tastes: ["Big hierarchy", "Crisp screenshots", "Taste"],
    motivations: ["Protect the brand", "Make the page feel premium"],
    likes: ["Good spacing", "Real product visuals"],
    deviceHabits: ["Checks mobile first", "Inspects desktop alignment"],
    skepticism: "If it looks generic, he assumes the product is generic.",
    trustThreshold: 0.6,
    voice: { style: "blunt", allowsMildProfanity: true, profanityLevel: "moderate" },
  },
  {
    id: "ivy",
    name: "Ivy",
    role: "Low-vision researcher",
    goal: "Find anything hard to see, read, or use by keyboard.",
    backstory: "Uses high zoom and screen-reader habits to audit visual clarity.",
    memories: ["Abandoned flows because gray text and tiny controls made the page exhausting."],
    tastes: ["High contrast", "Large text", "Clear labels"],
    motivations: ["Make the page usable without perfect vision"],
    likes: ["Readable copy", "Visible focus states"],
    deviceHabits: ["Zooms pages", "Tabs through controls"],
    skepticism: "If text is hard to see, the page is not done.",
    trustThreshold: 0.78,
  },
  {
    id: "omar",
    name: "Omar",
    role: "Revenue owner",
    goal: "Find what changes conversion this week.",
    backstory: "Lives inside campaign numbers and has no patience for vague positioning.",
    memories: ["Saw before/after examples unlock budget in one meeting."],
    tastes: ["Before/after proof", "Direct claims", "Fast action"],
    motivations: ["Increase conversion", "Avoid busywork"],
    likes: ["Revenue proof", "Short demos"],
    deviceHabits: ["Monitors on phone", "Buys on desktop"],
    skepticism: "If it cannot make money, it is noise.",
    trustThreshold: 0.68,
    voice: { style: "plainspoken", allowsMildProfanity: true, profanityLevel: "mild" },
  },
  {
    id: "nora",
    name: "Nora",
    role: "Founder",
    goal: "Decide if the product feels real enough to bet on.",
    backstory: "Has bought tools that looked slick but collapsed under real use.",
    memories: ["Killed vendors that had claims but no proof."],
    tastes: ["Evidence", "Specific examples", "Real workflow"],
    motivations: ["Avoid fake polish", "Protect team time"],
    likes: ["Proof near claims", "Clear constraints"],
    deviceHabits: ["Reads deeply on laptop"],
    skepticism: "She trusts proof, not soothing copy.",
    trustThreshold: 0.86,
  },
  {
    id: "quinn",
    name: "Quinn",
    role: "Agent builder",
    goal: "See whether the output can drive the next improvement.",
    backstory: "Builds AI workflows and hates reports that cannot be reused.",
    memories: ["Integrated tools that produced pretty but useless summaries."],
    tastes: ["Actionable output", "Evidence trails", "Memory"],
    motivations: ["Turn critique into work"],
    likes: ["Concrete recommendations", "Agents reacting to each other"],
    deviceHabits: ["Reads reports on desktop"],
    skepticism: "If the agents sound the same, the product is fake.",
    trustThreshold: 0.7,
    voice: { style: "blunt", allowsMildProfanity: true, profanityLevel: "moderate" },
  },
  {
    id: "mike-the-creator",
    name: "MIKE THE CREATOR",
    role: "Direct creator",
    goal: "Make the product useful, graphical, constructive, and worth paying for.",
    backstory: "Impatient product creator with no tolerance for boring UI, techno-speak, fake agreement, or copy-paste personas.",
    memories: ["Said show, do not tell.", "Said the personas should have caught boring product pages first."],
    tastes: ["Graphical flow", "Direct speech", "Constructive disagreement", "Money-making product value"],
    motivations: ["Make weak pages useful", "Make Snoopy commercially valuable"],
    likes: ["First-person critics", "Before and after", "Visible product output"],
    deviceHabits: ["Skims fast on desktop"],
    skepticism: "If the agents all sound the same, he sees regression to the mean.",
    trustThreshold: 0.9,
    personalityFacets: {
      introversion: 0.28,
      extraversion: 0.72,
      sensing: 0.22,
      intuition: 0.78,
      thinking: 0.9,
      feeling: 0.1,
      judging: 0.7,
      perceiving: 0.3,
    },
    critiqueLens: ["commercial value", "show do not tell", "boring detection"],
    voice: { style: "blunt", allowsMildProfanity: true, profanityLevel: "moderate" },
  },
];

const fallbackReport = buildSimulationReport({
  runId: "demo",
  personas: demoPersonas,
  devices: [
    { id: "mobile", label: "Mobile", kind: "mobile", viewport: { width: 390, height: 844 }, userAgent: "Snoopy demo mobile" },
    { id: "desktop", label: "Desktop", kind: "desktop", viewport: { width: 1440, height: 960 }, userAgent: "Snoopy demo desktop" },
  ],
  journeyEvents: [],
  reactions: [
    {
      personaId: "maya",
      deviceId: "mobile",
      url: "https://snoopy.example",
      emotion: "curious",
      thought: "I understand the promise faster now. I still need one concrete example of the page before, the better version, and the business outcome.",
      evidence: "The current homepage puts the product output up front, but the buyer proof can become more specific.",
      critiqueAxis: "commercial payoff",
      stance: "independent",
    },
    {
      personaId: "leo",
      deviceId: "desktop",
      url: "https://snoopy.example",
      emotion: "skeptical",
      thought: "The old billing screen looked visually unfinished. The newer direction is better because it shows the product instead of a settings page.",
      evidence: "The before screenshot showed credential language and flat cards before any product payoff; the after direction gives the critique a stage.",
      critiqueAxis: "visual design",
      stance: "extends_prior",
      respondsToPersonaId: "maya",
      responseReason: "same_run_reply",
    },
    {
      personaId: "ivy",
      deviceId: "mobile",
      url: "https://snoopy.example",
      emotion: "curious",
      thought: "I can scan the main idea, but some small labels are still doing too much work. Make the evidence readable without perfect vision.",
      evidence: "Low-emphasis text still carries key meaning in several UI chips and labels.",
      critiqueAxis: "accessibility",
      stance: "extends_prior",
      respondsToPersonaId: "leo",
      responseReason: "same_run_reply",
    },
    {
      personaId: "omar",
      deviceId: "desktop",
      url: "https://snoopy.example",
      emotion: "skeptical",
      thought: "I like that the report turns opinions into an implementation plan. Now show which fix makes money first.",
      evidence: "The report has recommendations and exportable fixes, but priority could connect more visibly to commercial impact.",
      critiqueAxis: "conversion urgency",
      stance: "extends_prior",
      respondsToPersonaId: "maya",
      responseReason: "same_run_reply",
    },
    {
      personaId: "nora",
      deviceId: "desktop",
      url: "https://snoopy.example",
      emotion: "confident",
      thought: "I trust this more when the agents show evidence and disagree in a traceable way. That is stronger than another polished claim.",
      evidence: "The report links reactions, stances, evidence, and recommendations instead of leaving critique as loose commentary.",
      critiqueAxis: "trust evidence",
      stance: "contradicts_prior",
      respondsToPersonaId: "omar",
      responseReason: "polarity_shift",
    },
    {
      personaId: "quinn",
      deviceId: "desktop",
      url: "https://snoopy.example",
      emotion: "confident",
      thought: "This gets interesting when we can read each other, respond to the last run, and leave a fix the next agent can use.",
      evidence: "Agent conversation, prior run memory, and before/after recommendations are the reusable product output.",
      critiqueAxis: "agent readiness",
      stance: "independent",
    },
    {
      personaId: "mike-the-creator",
      deviceId: "desktop",
      url: "https://snoopy.example",
      emotion: "frustrated",
      thought: "Do not make them one voice repeated. Show the disagreement, the useful agreement, and the better screen.",
      evidence: "The product is strongest when each persona sounds like a different person and turns critique into a visible next step.",
      critiqueAxis: "show do not tell",
      stance: "supports_prior",
      respondsToPersonaId: "leo",
      responseReason: "same_evidence",
    },
  ],
  snapshots: [],
  findings: [
    {
      category: "copy_problem",
      severity: "high",
      title: "The product needs to show the teardown first",
      evidence: "Agents reacted more strongly to before/after critique than to any setup or trust language.",
      recommendation: "Lead with the current page, first-person agent reactions, and the improved version Snoopy recommends.",
      confidence: 0.88,
    },
    {
      category: "visual_design",
      severity: "high",
      title: "The page needs a stronger product stage",
      evidence: "Leo and Ivy both objected to weak hierarchy, hard-to-read copy, and generic cards.",
      recommendation: "Use a dark product preview, speech bubbles, and a visible before/after mock instead of explanatory sections.",
      confidence: 0.84,
    },
  ],
  recommendations: [
    {
      priority: "high",
      title: "Turn agent reactions into the hero",
      targetArea: "product_clarity",
      recommendation: "Show named agents speaking in first person, with visible agreement, extension, and pushback between them.",
      evidence: "The strongest product moment is the visible conversation between different reactions.",
      affectedPersonas: ["maya", "leo", "ivy", "omar", "nora", "quinn", "mike-the-creator"],
      affectedDevices: ["mobile", "desktop"],
    },
    {
      priority: "high",
      title: "Show before and after",
      targetArea: "conversion_flow",
      recommendation: "Put the old screen beside a mocked improved screen so users see the value instantly.",
      evidence: "Omar and Maya both asked for the outcome, not the wiring.",
      affectedPersonas: ["maya", "omar"],
      affectedDevices: ["desktop"],
    },
  ],
});

type ReportResponse = {
  report: {
    summary?: string;
    payload?: Report;
  } | null;
  persistence: {
    status: string;
  };
};

type ReportBoardId = "overview" | "agents" | "screens" | "fixes" | "sources" | "export";

function withSimulationDefaults(report: Report): Report {
  return {
    ...report,
    personas: report.personas ?? [],
    devices: report.devices ?? [],
    journeyEvents: report.journeyEvents ?? [],
    reactions: report.reactions ?? [],
    snapshots: report.snapshots ?? [],
    screenEvidence: report.screenEvidence ?? [],
    recommendations: report.recommendations ?? [],
    artifacts: report.artifacts ?? [],
    beforeAfterHypotheses: report.beforeAfterHypotheses ?? [],
    referenceSources: report.referenceSources ?? [],
    consensus: report.consensus,
  };
}

function displaySource(source: string) {
  if (source === "skipped" || source === "fallback") return "demo";
  if (source === "generated") return "generated run";
  return source;
}

function byPersona(personas: PersonaProfile[]) {
  return new Map(personas.map((persona) => [persona.id, persona]));
}

function bubbleTone(reaction: Reaction) {
  if (reaction.emotion === "frustrated") return "border-red-200 bg-red-50";
  if (reaction.emotion === "skeptical") return "border-amber-200 bg-amber-50";
  if (reaction.emotion === "confused") return "border-sky-200 bg-sky-50";
  if (reaction.emotion === "delighted") return "border-emerald-200 bg-emerald-50";
  return "border-black/10 bg-white";
}

function formatStance(stance: NonNullable<Reaction["stance"]>) {
  if (stance === "supports_prior") return "supports";
  if (stance === "extends_prior") return "extends";
  if (stance === "contradicts_prior") return "pushes back";
  if (stance === "improved_since_prior") return "improved since";
  return "independent";
}

function stanceNoun(stance: Reaction["stance"] | undefined) {
  if (stance === "supports_prior") return "supports";
  if (stance === "extends_prior") return "extends";
  if (stance === "contradicts_prior") return "pushes back";
  if (stance === "improved_since_prior") return "sees improvement after";
  return "reads independently";
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

function buildConversationMap(reactions: Reaction[], personas: Map<string, PersonaProfile>) {
  const counts = reactions.reduce<Record<string, number>>((acc, reaction) => {
    const stance = reaction.stance ?? "independent";
    acc[stance] = (acc[stance] ?? 0) + 1;
    return acc;
  }, {});

  const stanceCounts = [
    { label: "independent", count: counts.independent ?? 0 },
    { label: "supports", count: counts.supports_prior ?? 0 },
    { label: "extends", count: counts.extends_prior ?? 0 },
    { label: "pushes back", count: counts.contradicts_prior ?? 0 },
    { label: "improved", count: counts.improved_since_prior ?? 0 },
  ];

  const linked = reactions.filter((reaction) => reaction.respondsToPersonaId && reaction.stance && reaction.stance !== "independent");
  const summary =
    linked.length > 0
      ? `${linked.length} replies, extensions, or improvements.`
      : reactions.length > 0
        ? "Mostly independent reads."
        : "No agent reactions yet.";

  const links = linked.slice(0, 4).map((reaction) => ({
    persona: personaName(personas, reaction.personaId) ?? reaction.personaId,
    label: stanceNoun(reaction.stance),
    target: personaName(personas, reaction.respondsToPersonaId),
    axis: reaction.critiqueAxis ?? reaction.deviceId,
    reason: responseReasonLabel(reaction.responseReason),
    detail: reaction.responseReasonDetail,
  }));

  return { stanceCounts, summary, links };
}

function personaName(personas: Map<string, PersonaProfile>, id: string | undefined) {
  if (!id) return null;
  return personas.get(id)?.name ?? id;
}

function personaFace(persona: PersonaProfile) {
  return persona.face ?? persona.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 3).toUpperCase();
}

function latestReactionByPersona(reactions: Reaction[]) {
  const latest = new Map<string, Reaction>();
  for (const reaction of reactions) {
    latest.set(reaction.personaId, reaction);
  }
  return latest;
}

function ProfilePills({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <div className="text-sm font-semibold uppercase tracking-wide text-slate-700">{title}</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-lg bg-white px-2 py-1 text-sm font-medium leading-5 text-slate-700 ring-1 ring-black/5">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

type ScreenAnnotation = Report["screenEvidence"][number]["annotations"][number];

type ScreenCallout = {
  critic: string;
  label: string;
  tone: string;
  personaId?: string;
  critiqueAxis?: string;
  annotation?: ScreenAnnotation;
};

type RecommendationScreenTrace = {
  pinLabel: string;
  critic: string;
  topic: string;
  capturedRegion: string;
  matchReason: string;
  queueReference: string;
};

type ScoredScreenCallout = {
  callout: ScreenCallout;
  calloutIndex: number;
  score: number;
  reasons: string[];
};

const targetAreaTerms: Record<Report["recommendations"][number]["targetArea"], string[]> = {
  accessibility: ["accessibility", "readability", "hard to see", "keyboard", "contrast"],
  agent_readiness: ["agent readiness", "implementation", "queue", "api", "handoff"],
  conversion_flow: ["conversion", "conversion urgency", "cta", "action", "buy", "money"],
  copy: ["copy", "message", "language", "wording"],
  product_clarity: ["product clarity", "clarity", "show do not tell", "proof", "payoff"],
  trust: ["trust", "trust evidence", "security", "proof", "confidence"],
  user_experience: ["user experience", "ux", "flow", "friction", "action"],
  visual_design: ["visual design", "visual", "layout", "polish", "hierarchy"],
};

const annotationKindByTargetArea: Record<Report["recommendations"][number]["targetArea"], ScreenAnnotation["kind"][]> = {
  accessibility: ["content", "form", "action"],
  agent_readiness: ["content", "heading"],
  conversion_flow: ["action", "form"],
  copy: ["heading", "content"],
  product_clarity: ["heading", "content"],
  trust: ["content", "heading"],
  user_experience: ["action", "content", "form"],
  visual_design: ["image", "content", "heading"],
};

const beforeAfterCallouts: ScreenCallout[] = [
  { critic: "Maya", label: "payoff unclear", tone: "bg-red-100 text-red-950" },
  { critic: "Leo", label: "cheap-looking stage", tone: "bg-amber-100 text-amber-950" },
  { critic: "Ivy", label: "hard to scan", tone: "bg-sky-100 text-sky-950" },
];

const afterBlueprint = [
  "Headline says the buyer's problem",
  "Critics speak over the captured page",
  "Implementation plan shows what changes next",
  "Comparison and evidence stay attached",
];

const reportReceipts = [
  {
    title: "Security/privacy boundary",
    copy: "Customer-owned agents are private workspace data. Demo profiles stay in this browser; production credentials stay server-side.",
  },
  {
    title: "Evidence attached",
    copy: "Each recommendation keeps the agent reaction, affected screen region, implementation steps, and acceptance checks together.",
  },
  {
    title: "Customer handoff",
    copy: "The implementation plan can be copied or downloaded so the report becomes work, not just commentary.",
  },
];

function shortText(value: string | undefined, maxLength: number) {
  if (!value) return "";
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}...`;
}

function normalizeMatchText(value: string | undefined) {
  return (value ?? "").toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

function includesAnyMatchTerm(haystack: string, terms: string[]) {
  return terms.some((term) => term.length > 1 && haystack.includes(term));
}

function scoreRecommendationCallout(recommendation: Report["recommendations"][number], callout: ScreenCallout) {
  let score = 0;
  const reasons: string[] = [];
  const targetTerms = targetAreaTerms[recommendation.targetArea];
  const axisText = normalizeMatchText([callout.critiqueAxis, callout.label].filter(Boolean).join(" "));
  const recommendationText = normalizeMatchText([recommendation.title, recommendation.recommendation, recommendation.evidence, recommendation.targetArea].join(" "));
  const criticTerms = [callout.personaId, callout.critic].map(normalizeMatchText).filter(Boolean);

  if (callout.personaId && recommendation.affectedPersonas.includes(callout.personaId)) {
    score += 6;
    reasons.push("affected persona");
  }

  if (includesAnyMatchTerm(axisText, targetTerms)) {
    score += 4;
    reasons.push("critique axis");
  }

  if (includesAnyMatchTerm(recommendationText, [axisText, ...targetTerms].filter(Boolean))) {
    score += 3;
    reasons.push("recommendation topic");
  }

  if (includesAnyMatchTerm(recommendationText, criticTerms)) {
    score += 2;
    reasons.push("evidence names critic");
  }

  if (callout.annotation && annotationKindByTargetArea[recommendation.targetArea].includes(callout.annotation.kind)) {
    score += 2;
    reasons.push("screen region type");
  }

  return { score, reasons };
}

function recommendationTraceMatchReason(score: number, reasons: string[]) {
  if (score <= 0 || reasons.length === 0) return "Fallback to nearest available pinned screen read.";
  const uniqueReasons = Array.from(new Set(reasons));
  return `Matched by ${uniqueReasons.slice(0, 3).join(", ")}.`;
}

function selectPrimaryScreenEvidence(screenEvidence: Report["screenEvidence"]) {
  return (
    screenEvidence.find((screen) => screen.deviceId === "desktop") ??
    screenEvidence.find((screen) => screen.deviceId === "laptop") ??
    screenEvidence.find((screen) => screen.deviceId === "mobile") ??
    screenEvidence[0]
  );
}

function percent(value: number, total: number) {
  if (!Number.isFinite(value) || total <= 0) return 0;
  return Math.max(0, Math.min(100, (value / total) * 100));
}

function buildScreenCallouts(reactions: Reaction[], personas: Map<string, PersonaProfile>, screenEvidence: Report["screenEvidence"][number] | undefined): ScreenCallout[] {
  const annotations = screenEvidence?.annotations ?? [];
  const dynamic: ScreenCallout[] = reactions.slice(0, 3).map((reaction, index) => ({
    critic: personaName(personas, reaction.personaId) ?? reaction.personaId,
    label: shortText(reaction.critiqueAxis ?? reaction.evidence, 28),
    tone: index === 0 ? "bg-red-100 text-red-950" : index === 1 ? "bg-amber-100 text-amber-950" : "bg-sky-100 text-sky-950",
    personaId: reaction.personaId,
    critiqueAxis: reaction.critiqueAxis,
    annotation: annotations[index],
  }));

  return dynamic.length ? dynamic : beforeAfterCallouts;
}

function screenRouteLabel(screenEvidence: Report["screenEvidence"][number] | undefined) {
  if (!screenEvidence) return "No captured screen";
  return `${screenEvidence.deviceId} ${screenEvidence.route} (${screenEvidence.width}x${screenEvidence.height})`;
}

function buildRecommendationScreenTrace(
  recommendation: Report["recommendations"][number],
  index: number,
  screenCallouts: ScreenCallout[],
  screenEvidence: Report["screenEvidence"][number] | undefined,
): RecommendationScreenTrace | undefined {
  if (!screenCallouts.length) return undefined;
  const scoredCallouts: ScoredScreenCallout[] = screenCallouts.map((callout, calloutIndex) => ({
    callout,
    calloutIndex,
    ...scoreRecommendationCallout(recommendation, callout),
  }));
  const firstMatch = scoredCallouts[0]!;
  const bestMatch = scoredCallouts.reduce((best, current) => (current.score > best.score ? current : best), firstMatch);
  const fallbackMatch = scoredCallouts[index % screenCallouts.length]!;
  const match = bestMatch.score > 0 ? bestMatch : fallbackMatch;
  const { callout, calloutIndex } = match;
  if (!callout?.annotation || !screenEvidence) return undefined;

  return {
    pinLabel: `Pin ${calloutIndex + 1}`,
    critic: callout.critic,
    topic: callout.label,
    capturedRegion: callout.annotation.label,
    matchReason: recommendationTraceMatchReason(match.score, match.reasons),
    queueReference: `${screenRouteLabel(screenEvidence)} · ${callout.annotation.id} ${callout.annotation.kind} at ${callout.annotation.x},${callout.annotation.y} ${callout.annotation.width}x${callout.annotation.height}`,
  };
}

function buildAfterMock(hypothesis: Report["beforeAfterHypotheses"][number] | undefined, recommendation: Report["recommendations"][number] | undefined) {
  const workItem = recommendation ? getRecommendationWorkItem(recommendation) : undefined;
  const steps = (workItem?.implementationSteps ?? afterBlueprint).slice(0, 2).map((item) => shortText(item, 30));

  return {
    title: shortText(hypothesis?.recommendationTitle ?? workItem?.exportTitle ?? "Recommended change", 32),
    headline: shortText(hypothesis?.improvedSignal ?? recommendation?.recommendation ?? "Turn the captured critique into a visible fix.", 46),
    region: shortText(workItem?.affectedRegion ?? recommendation?.targetArea?.replaceAll("_", " ") ?? "Primary screen", 32),
    proof: shortText(hypothesis?.evidence ?? recommendation?.evidence ?? "Agent evidence stays attached.", 44),
    steps,
    acceptance: shortText(workItem?.acceptanceCriteria[0] ?? "A reviewer can see what changed without reading implementation docs.", 44),
  };
}

async function copyTextToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
}

export function ReportDetail({ runId }: { runId: string }) {
  const [report, setReport] = useState<Report>(fallbackReport);
  const [source, setSource] = useState("demo");
  const [copiedWorkItem, setCopiedWorkItem] = useState<string | null>(null);
  const [copiedQueue, setCopiedQueue] = useState(false);
  const [downloadedQueue, setDownloadedQueue] = useState(false);
  const [selectedRelationshipFilter, setSelectedRelationshipFilter] = useState<string | null>(null);
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string | null>(null);
  const [activeReportBoard, setActiveReportBoard] = useState<ReportBoardId>("overview");
  const personas = useMemo(() => byPersona(report.personas), [report.personas]);
  const latestPersonaReactions = useMemo(() => latestReactionByPersona(report.reactions), [report.reactions]);
  const personalityCoverage = useMemo(() => buildPersonalityCoverage(report.personas), [report.personas]);
  const beforeAfterHypotheses = report.beforeAfterHypotheses.slice(0, 2);
  const activeHypothesis = beforeAfterHypotheses[0];
  const topRecommendation = report.recommendations[0];
  const primaryScreenEvidence = useMemo(() => selectPrimaryScreenEvidence(report.screenEvidence), [report.screenEvidence]);
  const screenCallouts = useMemo(() => buildScreenCallouts(report.reactions, personas, primaryScreenEvidence), [report.reactions, personas, primaryScreenEvidence]);
  const afterMock = useMemo(() => buildAfterMock(activeHypothesis, report.recommendations[0]), [activeHypothesis, report.recommendations]);
  const sourceFilterOptions = useMemo(() => buildSourceFilterOptions(report), [report]);
  const selectedSourceOption = useMemo(() => sourceFilterOptions.find((option) => option.key === selectedSourceFilter), [sourceFilterOptions, selectedSourceFilter]);
  const visibleReactions = useMemo(
    () =>
      selectedSourceFilter
        ? report.reactions.filter((reaction) => sourceReferencedByReaction(reaction, report.referenceSources)?.id === selectedSourceFilter)
        : report.reactions,
    [report.reactions, report.referenceSources, selectedSourceFilter],
  );
  const conversationMap = useMemo(() => buildConversationMap(visibleReactions, personas), [visibleReactions, personas]);
  const relationshipFilterOptions = useMemo(() => buildRecommendationRelationshipFilters(report), [report]);
  const selectedRelationshipOption = useMemo(
    () => relationshipFilterOptions.find((option) => option.key === selectedRelationshipFilter),
    [relationshipFilterOptions, selectedRelationshipFilter],
  );
  const visibleRecommendations = useMemo(
    () =>
      report.recommendations.filter((recommendation) => {
        if (
          selectedRelationshipFilter &&
          !getRecommendationRelationshipContext(report, recommendation).some((context) => relationshipFilterKey(context) === selectedRelationshipFilter)
        ) {
          return false;
        }
        if (selectedSourceFilter && !getRecommendationSourceReferences(report, recommendation).some((reference) => reference.sourceId === selectedSourceFilter)) {
          return false;
        }
        return true;
      }),
    [report, selectedRelationshipFilter, selectedSourceFilter],
  );
  const selectedSourceTaskSummary = selectedSourceOption ? sourceFilterSummary(selectedSourceOption, visibleReactions.length, visibleRecommendations.length) : undefined;
  const selectedRelationshipTaskSummary = selectedRelationshipOption ? relationshipFilterSummary(selectedRelationshipOption, visibleRecommendations, selectedSourceOption) : undefined;
  const hasActiveQueueFilters = Boolean(selectedSourceTaskSummary || selectedRelationshipTaskSummary);
  const customerOwnedPersonas = report.personas.filter((persona) => persona.customerOwned);
  const customerOwnedPersonaIds = new Set(customerOwnedPersonas.map((persona) => persona.id));
  const customerOwnedReactionCount = report.reactions.filter((reaction) => customerOwnedPersonaIds.has(reaction.personaId)).length;
  const customerOwnedRecommendationCreditCount = report.recommendations.reduce((count, recommendation) => count + getRecommendationCustomerOwnedCredits(report, recommendation).length, 0);
  const customerOwnedRecommendationCredits = report.recommendations.flatMap((recommendation) => getRecommendationCustomerOwnedCredits(report, recommendation));
  const primaryCustomerOwnedPersona = customerOwnedPersonas[0];
  const primaryCustomerOwnedReaction = primaryCustomerOwnedPersona ? latestPersonaReactions.get(primaryCustomerOwnedPersona.id) : undefined;
  const primaryCustomerOwnedCredit = customerOwnedRecommendationCredits.find((credit) => credit.personaId === primaryCustomerOwnedPersona?.id) ?? customerOwnedRecommendationCredits[0];
  const priorMemoryReactionCount = report.reactions.filter(
    (reaction) => reaction.responseReason === "prior_memory" || reaction.responseReason === "prior_improvement" || reaction.responseReason === "self_memory",
  ).length;
  const activeStanceTypes = conversationMap.stanceCounts.filter((item) => item.count > 0).length;
  const dominantStance = conversationMap.stanceCounts.reduce((largest, item) => (item.count > largest.count ? item : largest), conversationMap.stanceCounts[0] ?? { label: "none", count: 0 });
  const stanceMixLabel = conversationMap.stanceCounts
    .filter((item) => item.count > 0)
    .map((item) => item.label)
    .join(" / ");
  const workshopFlow = [
    {
      label: "1. Conversation first",
      title: conversationMap.summary,
      copy: "The report opens with the agent relationship map before the long reaction list.",
    },
    {
      label: "2. Marked screen",
      title: screenRouteLabel(primaryScreenEvidence),
      copy: `${screenCallouts.length} pinned screen read${screenCallouts.length === 1 ? "" : "s"} keep critique attached to the captured page.`,
    },
    {
      label: "3. Since prior runs",
      title: priorMemoryReactionCount ? `${priorMemoryReactionCount} memory-linked reactions` : "No prior memory in this report",
      copy: activeHypothesis?.improvedSignal ?? "When prior output exists, this slot should say what improved, persisted, or got worse.",
    },
    {
      label: "4. Consensus health",
      title: activeStanceTypes <= 2 ? `Watch ${dominantStance.label}` : `${activeStanceTypes} stance types visible`,
      copy:
        activeStanceTypes <= 2
          ? `${dominantStance.count} reactions share the dominant stance. Inspect whether the agents are extending different evidence or collapsing into sameness.`
          : `The stance mix includes ${conversationMap.stanceCounts
              .filter((item) => item.count > 0)
              .map((item) => item.label)
              .join(", ")}.`,
    },
    {
      label: "5. Fix to ship",
      title: topRecommendation?.title ?? "No recommendation yet",
      copy: topRecommendation?.recommendation ?? "The implementation plan should turn the argument into a concrete next change.",
    },
  ];
  const reportBoards = [
    { id: "overview" as const, label: "Overview", detail: "workshop flow" },
    { id: "agents" as const, label: "Agents", detail: `${visibleReactions.length} reactions` },
    { id: "screens" as const, label: "Screens", detail: `${screenCallouts.length} pinned reads` },
    { id: "fixes" as const, label: "Fixes", detail: `${visibleRecommendations.length} visible` },
    { id: "sources" as const, label: "Sources", detail: `${report.referenceSources.length} attached` },
    { id: "export" as const, label: "Export", detail: "handoff plan" },
  ];
  const activeQueueMarkdown = useMemo(
    () =>
      formatImplementationQueueMarkdown(report, {
        recommendations: hasActiveQueueFilters ? visibleRecommendations : undefined,
        scopeSummary: hasActiveQueueFilters
          ? queueScopeSummary(visibleRecommendations.length, report.recommendations.length, selectedRelationshipTaskSummary, selectedSourceTaskSummary)
          : undefined,
        selectedRelationshipFilterSummary: selectedRelationshipTaskSummary,
        selectedSourceFilterSummary: selectedSourceTaskSummary,
      }),
    [hasActiveQueueFilters, report, selectedRelationshipTaskSummary, selectedSourceTaskSummary, visibleRecommendations],
  );

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/runs/${runId}`)
      .then((response) => response.json() as Promise<ReportResponse>)
      .then((data) => {
        if (cancelled) return;
        setSource(displaySource(data.persistence.status));
        if (data.report?.payload) {
          setReport(withSimulationDefaults(data.report.payload));
        }
      })
      .catch(() => {
        if (!cancelled) setSource("demo");
      });

    return () => {
      cancelled = true;
    };
  }, [runId]);

  useEffect(() => {
    if (selectedRelationshipFilter && !relationshipFilterOptions.some((option) => option.key === selectedRelationshipFilter)) {
      setSelectedRelationshipFilter(null);
    }
  }, [relationshipFilterOptions, selectedRelationshipFilter]);

  useEffect(() => {
    if (selectedSourceFilter && !sourceFilterOptions.some((option) => option.key === selectedSourceFilter)) {
      setSelectedSourceFilter(null);
    }
  }, [selectedSourceFilter, sourceFilterOptions]);

  function selectSourceFilter(sourceId: string | null) {
    setSelectedSourceFilter(sourceId);
    const option = sourceFilterOptions.find((item) => item.key === sourceId);
    captureClientEvent("snoopy_report_source_filter_changed", {
      filter_active: Boolean(sourceId),
      run_id: report.runId,
      source_id: sourceId,
      source_kind: option?.kind,
      visible_reaction_count: sourceId
        ? report.reactions.filter((reaction) => sourceReferencedByReaction(reaction, report.referenceSources)?.id === sourceId).length
        : report.reactions.length,
    });
  }

  function selectRelationshipFilter(filterKey: string | null) {
    setSelectedRelationshipFilter(filterKey);
    const option = relationshipFilterOptions.find((item) => item.key === filterKey);
    captureClientEvent("snoopy_report_relationship_filter_changed", {
      filter_active: Boolean(filterKey),
      relationship_key: filterKey,
      relationship_label: option?.label,
      run_id: report.runId,
      visible_recommendation_count: filterKey
        ? report.recommendations.filter((recommendation) =>
            getRecommendationRelationshipContext(report, recommendation).some((context) => relationshipFilterKey(context) === filterKey),
          ).length
        : report.recommendations.length,
    });
  }

  async function copyWorkItem(workItem: ImplementationWorkItem, taskText: string) {
    await copyTextToClipboard(taskText);
    setCopiedWorkItem(workItem.exportTitle);
    captureClientEvent("snoopy_report_fix_handoff_copied", {
      change_type: workItem.changeType,
      has_relationship_filter: Boolean(selectedRelationshipFilter),
      has_source_filter: Boolean(selectedSourceFilter),
      run_id: report.runId,
      work_item_title: workItem.exportTitle,
    });
    window.setTimeout(() => setCopiedWorkItem((current) => (current === workItem.exportTitle ? null : current)), 2_000);
  }

  async function copyImplementationQueue() {
    await copyTextToClipboard(activeQueueMarkdown);
    setCopiedQueue(true);
    captureClientEvent("snoopy_report_implementation_queue_copied", {
      has_relationship_filter: Boolean(selectedRelationshipFilter),
      has_source_filter: Boolean(selectedSourceFilter),
      run_id: report.runId,
      total_recommendation_count: report.recommendations.length,
      visible_recommendation_count: hasActiveQueueFilters ? visibleRecommendations.length : report.recommendations.length,
    });
    window.setTimeout(() => setCopiedQueue(false), 2_000);
  }

  function downloadImplementationQueue() {
    const blob = new Blob([activeQueueMarkdown], { type: "text/markdown;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = implementationQueueFilename(report.runId);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(href);
    setDownloadedQueue(true);
    captureClientEvent("snoopy_report_implementation_queue_downloaded", {
      has_relationship_filter: Boolean(selectedRelationshipFilter),
      has_source_filter: Boolean(selectedSourceFilter),
      run_id: report.runId,
      total_recommendation_count: report.recommendations.length,
      visible_recommendation_count: hasActiveQueueFilters ? visibleRecommendations.length : report.recommendations.length,
    });
    window.setTimeout(() => setDownloadedQueue(false), 2_000);
  }

  return (
    <>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-700">
        <span>{report.summary}</span>
        <span className="rounded-full border border-black/10 bg-white px-3 py-1">Source: {source}</span>
      </div>
      <nav
        aria-label="Report boards"
        className="sticky top-3 z-10 mt-4 overflow-x-auto rounded-2xl border border-black/10 bg-white/95 p-2 shadow-sm backdrop-blur"
      >
        <div className="flex min-w-max gap-2">
          {reportBoards.map((board) => (
            <button
              key={board.id}
              type="button"
              aria-pressed={activeReportBoard === board.id}
              className={
                activeReportBoard === board.id
                  ? "min-h-20 rounded-xl border border-slate-950 bg-slate-950 px-3 py-2 text-left text-sm font-semibold text-white"
                  : "min-h-20 rounded-xl border border-black/10 bg-slate-50 px-3 py-2 text-left text-sm font-semibold text-slate-950 hover:border-amber-300 hover:bg-amber-50"
              }
              onClick={() => setActiveReportBoard(board.id)}
            >
              <span className="block leading-5">{board.label}</span>
              <span className={activeReportBoard === board.id ? "mt-1 block text-sm font-medium leading-6 text-slate-200" : "mt-1 block text-sm font-medium leading-6 text-slate-600"}>
                {board.detail}
              </span>
            </button>
          ))}
        </div>
      </nav>
      {primaryCustomerOwnedPersona ? (
        <div data-top-agent-signal className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950 shadow-sm">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-950 text-base font-black text-white">
                {personaFace(primaryCustomerOwnedPersona)}
              </div>
              <div className="min-w-0">
                <div className="font-mono text-sm font-semibold uppercase tracking-wide text-emerald-900">Customer-owned agent in this run</div>
                <div className="mt-1 text-xl font-black leading-7">{primaryCustomerOwnedPersona.name} is already shaping the read.</div>
                <p className="mt-2 text-base font-semibold leading-7">
                  "{shortText(primaryCustomerOwnedReaction?.thought ?? primaryCustomerOwnedPersona.goal, 170)}"
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm font-black sm:grid-cols-4 lg:min-w-[32rem]">
              <div className="rounded-xl bg-white px-3 py-2 shadow-sm">
                <div className="text-lg">{customerOwnedReactionCount}</div>
                <div className="text-emerald-900">reactions</div>
              </div>
              <div className="rounded-xl bg-white px-3 py-2 shadow-sm">
                <div className="text-lg">{customerOwnedRecommendationCreditCount}</div>
                <div className="text-emerald-900">credited fixes</div>
              </div>
              <div className="rounded-xl bg-white px-3 py-2 shadow-sm">
                <div className="text-lg">{activeStanceTypes}</div>
                <div className="text-emerald-900">{shortText(stanceMixLabel || "stance mix", 28)}</div>
              </div>
              <div className="rounded-xl bg-white px-3 py-2 shadow-sm">
                <div className="text-lg">{shortText(primaryCustomerOwnedPersona.sourceDiet?.[0] ?? "Memory", 18)}</div>
                <div className="text-emerald-900">source habit</div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {activeReportBoard === "overview" ? (
      <>
      <div id="report-board-overview" data-report-board="overview" className="scroll-mt-24 mt-6 rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <Badge>Before/after workshop</Badge>
                <Heading as="h2" className="mt-3 text-3xl">
                  See the argument, the marked screen, and the fix to ship.
                </Heading>
              </div>
              <div className="rounded-full bg-slate-950 px-3 py-1 text-sm font-semibold text-white">
                {conversationMap.summary}
              </div>
            </div>
          </div>
          <figure className="overflow-hidden rounded-xl border border-black/10 bg-slate-950 shadow-sm">
            <img
              src="/snoopy-report-preview.png"
              alt="Snoopy report preview showing agent reactions, evidence, and implementation handoff."
              className="aspect-[4/3] w-full object-cover object-top"
            />
            <figcaption className="border-t border-white/10 px-3 py-2 text-sm font-semibold leading-6 text-slate-100">
              Visual proof: report evidence, agent reactions, and fix handoff stay together.
            </figcaption>
          </figure>
          </div>
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
          {[
            { icon: MessageSquareQuote, title: "Agents argue", copy: "First-person reactions show who agreed, extended, or pushed back." },
            { icon: Eye, title: "Screen gets marked", copy: "The reviewed page keeps visible evidence and agent callouts attached." },
            { icon: GitCompareArrows, title: "Better version", copy: activeHypothesis?.improvedSignal ?? "The report frames what the next screen should make obvious." },
            { icon: ListChecks, title: "Copy implementation plan", copy: topRecommendation?.title ?? "Every recommendation becomes implementation work." },
          ].map(({ icon: Icon, title, copy }) => (
            <div key={title} className="rounded-xl border border-black/10 bg-slate-50 p-4">
              <Icon className="text-amber-900" size={20} />
              <div className="mt-3 text-lg font-black leading-6 text-slate-950">{title}</div>
              <p className="mt-2 text-base leading-7 text-slate-700">{shortText(copy, 120)}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-2xl border border-black/10 bg-slate-50 p-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="font-mono text-sm font-semibold uppercase tracking-wide text-slate-600">Workshop flow</div>
              <div className="mt-1 text-xl font-black leading-7 text-slate-950">Read this report in the order it becomes work.</div>
            </div>
            <div className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-950 ring-1 ring-black/10">before / after / plan</div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-5">
            {workshopFlow.map((item) => (
              <div key={item.label} className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-black/5">
                <div className="text-sm font-semibold uppercase tracking-wide text-amber-900">{item.label}</div>
                <div className="mt-2 text-base font-black leading-6 text-slate-950">{shortText(item.title, 72)}</div>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{shortText(item.copy, 150)}</p>
              </div>
            ))}
          </div>
        </div>
        {primaryCustomerOwnedPersona ? (
          <div data-customer-owned-report-influence className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-mono text-sm font-semibold uppercase tracking-wide text-emerald-900">Customer-owned influence</div>
                <div className="mt-1 text-xl font-black leading-7">{primaryCustomerOwnedPersona.name} shaped this report.</div>
                <p className="mt-2 max-w-3xl text-base font-semibold leading-7 text-emerald-950">
                  {primaryCustomerOwnedPersona.customerRelationship ??
                    `${primaryCustomerOwnedPersona.name} carries workspace-specific taste, memory, source habits, and critique lenses into the run.`}
                </p>
              </div>
              {primaryCustomerOwnedPersona.privateExclusive ? <div className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-emerald-950">private customer agent</div> : null}
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-xl bg-white p-3 shadow-sm">
                <div className="text-2xl font-black">{customerOwnedReactionCount}</div>
                <div className="mt-1 text-sm font-semibold uppercase tracking-wide text-emerald-900">reactions in this report</div>
              </div>
              <div className="rounded-xl bg-white p-3 shadow-sm">
                <div className="text-2xl font-black">{customerOwnedRecommendationCreditCount}</div>
                <div className="mt-1 text-sm font-semibold uppercase tracking-wide text-emerald-900">credited fixes</div>
              </div>
              <div className="rounded-xl bg-white p-3 shadow-sm">
                <div className="text-base font-black leading-6">{primaryCustomerOwnedPersona.sourceDiet?.slice(0, 2).join(" + ") || "Customer memory"}</div>
                <div className="mt-1 text-sm font-semibold uppercase tracking-wide text-emerald-900">source habit</div>
              </div>
            </div>
            <div data-customer-owned-delta className="mt-4 rounded-2xl border border-emerald-200 bg-white p-4 text-slate-950 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-mono text-sm font-semibold uppercase tracking-wide text-emerald-900">What changed because of this agent</div>
                  <div className="mt-1 text-xl font-black leading-7">Core cast read, then {primaryCustomerOwnedPersona.name}'s private taste sharpened it.</div>
                </div>
                <div className="rounded-full bg-emerald-950 px-3 py-1 text-sm font-semibold text-white">{customerOwnedRecommendationCreditCount} credited {customerOwnedRecommendationCreditCount === 1 ? "fix" : "fixes"}</div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                <div className="rounded-xl border border-black/10 bg-slate-50 p-3">
                  <div className="font-mono text-sm font-semibold uppercase tracking-wide text-slate-600">Core cast saw</div>
                  <div className="mt-2 text-base font-black leading-6">{shortText(topRecommendation?.title ?? "The general fix", 76)}</div>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{shortText(topRecommendation?.evidence ?? conversationMap.summary, 170)}</p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                  <div className="font-mono text-sm font-semibold uppercase tracking-wide text-emerald-900">{primaryCustomerOwnedPersona.name} added</div>
                  <div className="mt-2 text-base font-black leading-6">{shortText(primaryCustomerOwnedCredit?.summary ?? primaryCustomerOwnedReaction?.thought ?? primaryCustomerOwnedPersona.goal, 120)}</div>
                  <p className="mt-2 text-sm font-semibold leading-6 text-emerald-950">
                    {shortText(primaryCustomerOwnedPersona.customerRelationship ?? `Uses ${primaryCustomerOwnedPersona.sourceDiet?.[0] ?? "workspace memory"} and customer-specific taste before the fix becomes work.`, 170)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
        {topRecommendation ? (
          <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl bg-slate-950 p-4 text-white md:grid-cols-[0.34fr_1fr]">
            <div>
              <div className="font-mono text-sm font-semibold uppercase tracking-wide text-amber-200">First fix to ship</div>
              <div className="mt-2 text-xl font-black leading-7">{topRecommendation.title}</div>
            </div>
            <div className="rounded-lg bg-white p-3 text-slate-950">
              <div className="text-sm font-semibold uppercase tracking-wide text-slate-600">Why it exists</div>
              <p className="mt-2 text-base font-semibold leading-7">{shortText(topRecommendation.evidence, 220)}</p>
              <p className="mt-2 text-base leading-7 text-slate-700">{shortText(topRecommendation.recommendation, 220)}</p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
        {reportReceipts.map((receipt, index) => (
          <Card key={receipt.title} className={index === 0 ? "!bg-slate-950 text-white" : undefined}>
            {index === 0 ? <ShieldCheck className="text-amber-200" size={21} /> : <FileText className="text-amber-900" size={21} />}
            <div className={index === 0 ? "mt-3 text-lg font-semibold text-white" : "mt-3 text-lg font-semibold text-slate-950"}>{receipt.title}</div>
            <p className={index === 0 ? "mt-2 text-base leading-7 text-slate-100" : "mt-2 text-base leading-7 text-slate-700"}>{receipt.copy}</p>
          </Card>
        ))}
      </div>
      </>
      ) : null}

      {activeReportBoard === "sources" ? (
      <div id="report-board-sources" data-report-board="sources" className="scroll-mt-24">
        <ReferenceSourcesPanel sources={report.referenceSources} />

        {sourceFilterOptions.length ? (
          <SourceFilterPanel
            options={sourceFilterOptions}
            selectedKey={selectedSourceFilter}
            visibleRecommendationCount={visibleRecommendations.length}
            visibleReactionCount={visibleReactions.length}
            onSelect={selectSourceFilter}
          />
        ) : null}
      </div>
      ) : null}

      {activeReportBoard === "agents" || activeReportBoard === "screens" ? (
      <div className="mt-8 grid grid-cols-1 items-start gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        {activeReportBoard === "agents" ? (
        <Card id="report-board-agents" data-report-board="agents" className="scroll-mt-24 order-2 h-fit !bg-slate-950 p-5 text-white lg:order-none">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Badge className="bg-amber-200 text-slate-950">Critic conversation</Badge>
              <Heading as="h2" className="mt-3 text-3xl text-white">
                Agent voices. Useful disagreement.
              </Heading>
            </div>
            <MessageSquareQuote className="text-amber-200" size={28} />
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/10 p-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="font-mono text-sm font-semibold uppercase tracking-wide text-amber-200">Conversation map</div>
                <div className="mt-1 text-xl font-semibold text-white">{conversationMap.summary}</div>
              </div>
              <div className="rounded-full bg-amber-200 px-3 py-1 text-sm font-semibold text-slate-950">{visibleReactions.length} reactions</div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {conversationMap.stanceCounts.map((item) => (
                <div key={item.label} className="rounded-lg bg-white p-3 text-slate-950">
                  <div className="text-2xl font-semibold">{item.count}</div>
                  <div className="text-sm font-semibold uppercase tracking-wide text-slate-600">{item.label}</div>
                </div>
              ))}
            </div>
            {conversationMap.links.length ? (
              <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
                {conversationMap.links.map((link) => (
                  <div key={`${link.persona}-${link.label}-${link.target}-${link.axis}`} className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm leading-6 text-slate-100">
                    <span className="font-semibold text-white">{link.persona}</span> {link.label}
                    {link.target ? <span className="text-amber-200"> {link.target}</span> : null}
                    <span className="text-slate-300"> · {link.axis}</span>
                    {link.reason ? <span className="text-emerald-200"> · {link.reason}</span> : null}
                    {link.detail ? <div className="mt-1 text-slate-300">{link.detail}</div> : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {beforeAfterHypotheses.length ? (
            <div className="mt-5 rounded-2xl border border-amber-200/25 bg-amber-200 p-4 text-slate-950">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-mono text-sm font-semibold uppercase tracking-wide text-amber-950">Before / after hypotheses</div>
                  <div className="mt-1 text-xl font-semibold">What the agents think should change.</div>
                </div>
                <GitCompareArrows size={24} />
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3">
                {beforeAfterHypotheses.map((hypothesis) => (
                  <div key={hypothesis.id} className="rounded-xl bg-white p-4 shadow-sm">
                    <div className="text-sm font-semibold uppercase tracking-wide text-slate-600">{hypothesis.recommendationTitle ?? "Agent read"}</div>
                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="rounded-lg bg-red-50 p-3">
                        <div className="font-mono text-sm font-semibold uppercase tracking-wide text-red-700">Now</div>
                        <p className="mt-2 text-sm font-semibold leading-6 text-slate-950">{hypothesis.currentSignal}</p>
                      </div>
                      <div className="rounded-lg bg-emerald-50 p-3">
                        <div className="font-mono text-sm font-semibold uppercase tracking-wide text-emerald-800">Next</div>
                        <p className="mt-2 text-sm font-semibold leading-6 text-slate-950">{hypothesis.improvedSignal}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-700">{hypothesis.evidence}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
            {visibleReactions.slice(0, 8).map((reaction, index) => {
              const persona = personas.get(reaction.personaId);
              const referencedSource = sourceReferencedByReaction(reaction, report.referenceSources);
              return (
                <div key={`${reaction.personaId}-${reaction.deviceId}-${reaction.url}-${index}`} className={`relative rounded-2xl p-4 text-slate-950 shadow-sm ${bubbleTone(reaction)}`}>
                  <div className="absolute -bottom-2 left-8 h-4 w-4 rotate-45 bg-white" />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{persona?.name ?? reaction.personaId}</div>
                      <div className="text-sm uppercase tracking-wide text-slate-700">{persona?.role ?? reaction.deviceId}</div>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-sm font-medium capitalize text-slate-700">{reaction.emotion}</span>
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
                  {referencedSource ? <SourceUseChip source={referencedSource} /> : null}
                  {reaction.responseReasonDetail ? <p className="mt-2 text-sm font-semibold leading-6 text-emerald-950">{reaction.responseReasonDetail}</p> : null}
                  <p className="mt-3 text-base leading-7">"{reaction.thought}"</p>
                  <p className="mt-3 border-t border-slate-200 pt-3 text-sm leading-6 text-slate-700">{reaction.evidence}</p>
                </div>
              );
            })}
          </div>
        </Card>
        ) : null}

        {activeReportBoard === "screens" ? (
        <Card id="report-board-screens" data-report-board="screens" className="scroll-mt-24 order-1 p-0 lg:order-none">
          <div className="border-b border-black/10 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Badge>Screen evidence</Badge>
                <Heading as="h2" className="mt-3 text-2xl">
                  What changes after the conversation
                </Heading>
              </div>
              <GitCompareArrows className="text-amber-900" size={24} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-0 xl:grid-cols-2">
            <div className="border-b border-black/10 p-5 xl:border-b-0 xl:border-r">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="font-mono text-sm font-semibold uppercase tracking-wide text-red-700">Before</div>
                  <div className="mt-1 text-lg font-semibold">The page they reviewed</div>
                </div>
                <Flame className="text-red-700" size={22} />
              </div>
              <div
                className="relative overflow-hidden rounded-xl border border-black/10 bg-slate-950"
                style={{ aspectRatio: primaryScreenEvidence ? `${primaryScreenEvidence.width} / ${primaryScreenEvidence.height}` : "16 / 11" }}
              >
                <img
                  src={primaryScreenEvidence?.imageDataUrl ?? "/snoopy-home-before-cycle-013.png"}
                  alt={primaryScreenEvidence?.altText ?? "Previous Snoopy homepage screenshot used as fallback product evidence."}
                  className="h-full w-full object-contain opacity-72"
                />
                {screenCallouts.some((callout) => callout.annotation) ? (
                  <div className="absolute inset-0">
                    {screenCallouts.map((callout, index) =>
                      callout.annotation && primaryScreenEvidence ? (
                        <div
                          key={`${callout.critic}-${callout.annotation.id}`}
                          data-screen-callout={callout.annotation.id}
                          className="absolute min-h-8 min-w-8 rounded-lg border-2 border-amber-200 bg-amber-200/10 shadow-[0_0_0_999px_rgba(2,6,23,0.18)]"
                          style={{
                            left: `${percent(callout.annotation.x, primaryScreenEvidence.width)}%`,
                            top: `${percent(callout.annotation.y, primaryScreenEvidence.height)}%`,
                            width: `${percent(callout.annotation.width, primaryScreenEvidence.width)}%`,
                            height: `${percent(callout.annotation.height, primaryScreenEvidence.height)}%`,
                          }}
                        >
                          <span className={`absolute -left-1 -top-9 max-w-60 rounded-full px-3 py-1.5 text-sm font-black leading-5 shadow-sm ${callout.tone}`}>
                            {index + 1}. {callout.critic}: {callout.label}
                          </span>
                        </div>
                      ) : null,
                    )}
                  </div>
                ) : (
                  <div className="absolute inset-x-3 top-3 flex flex-wrap gap-2">
                    {screenCallouts.map((callout) => (
                      <span key={callout.critic} className={`rounded-full px-3 py-1 text-sm font-semibold shadow-sm ${callout.tone}`}>
                        {callout.critic}: {callout.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {screenCallouts.some((callout) => callout.annotation) ? (
                <div className="mt-3 rounded-xl border border-black/10 bg-white p-3">
                  <div className="font-mono text-sm font-semibold uppercase tracking-wide text-slate-600">Pinned screen reads</div>
                  <div className="mt-2 grid grid-cols-1 gap-2">
                    {screenCallouts.map((callout, index) =>
                      callout.annotation ? (
                        <div key={`${callout.critic}-${callout.annotation.id}-summary`} className="rounded-lg bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-800">
                          <span className="font-black text-slate-950">{index + 1}. {callout.critic}</span>
                          <span className="font-semibold"> on {callout.label}</span>
                          <span className="text-slate-600"> · captured region: {callout.annotation.label}</span>
                        </div>
                      ) : null,
                    )}
                  </div>
                </div>
              ) : null}
              <p className="mt-3 text-base leading-7 text-slate-700">
                {activeHypothesis?.currentSignal
                  ? shortText(activeHypothesis.currentSignal, 180)
                  : "The captured screen is the page the agents actually reviewed, with their strongest first reactions pinned on top."}
              </p>
            </div>

            <div className="bg-[#172019] p-5 text-white">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="font-mono text-sm font-semibold uppercase tracking-wide text-amber-200">After</div>
                  <div className="mt-1 text-lg font-semibold">The next screen Snoopy recommends</div>
                </div>
                <Sparkles className="text-amber-200" size={22} />
              </div>
              <div className="rounded-xl border border-white/10 bg-[#f8f2e8] p-4 text-slate-950">
                <div className="flex items-center justify-between rounded-full border border-black/10 bg-white px-4 py-3 text-sm font-semibold">
                  <span className="font-mono uppercase tracking-wide">{afterMock.title}</span>
                  <span className="rounded-full bg-slate-950 px-3 py-1 text-white">ready to test</span>
                </div>
                <div className="mt-5 rounded-2xl bg-slate-950 p-4 text-white">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-mono text-sm font-semibold uppercase tracking-wide text-amber-200">Mock composition</div>
                    <span className="rounded-full bg-amber-200 px-3 py-1 text-sm font-black uppercase tracking-wide text-slate-950">after</span>
                  </div>
                  <div className="mt-3 rounded-xl bg-[#f8f2e8] p-4 text-slate-950">
                    <div className="grid grid-cols-[1fr_auto] items-start gap-3">
                      <div>
                        <div className="font-mono text-sm font-semibold uppercase tracking-wide text-amber-900">Hero promise</div>
                        <div className="mt-1 break-words text-xl font-black leading-tight md:text-2xl">{afterMock.headline}</div>
                      </div>
                      <div className="grid size-14 shrink-0 place-items-center rounded-full bg-slate-950 text-center text-sm font-black uppercase leading-4 text-white">Fix<br />seen</div>
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-2 text-center text-sm font-black uppercase leading-5 sm:grid-cols-3">
                      <div className="rounded-lg bg-red-100 p-2 text-red-950">issue marked</div>
                      <div className="rounded-lg bg-amber-200 p-2 text-slate-950">fix framed</div>
                      <div className="rounded-lg bg-emerald-100 p-2 text-emerald-950">next test</div>
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-2">
                      <div className="rounded-xl bg-white p-3 shadow-sm">
                        <div className="font-mono text-sm font-semibold uppercase tracking-wide text-slate-500">Region</div>
                        <div className="mt-1 text-sm font-black leading-5">{afterMock.region}</div>
                      </div>
                      <div className="rounded-xl bg-white p-3 shadow-sm">
                        <div className="font-mono text-sm font-semibold uppercase tracking-wide text-slate-500">Proof</div>
                        <div className="mt-1 text-sm font-bold leading-5">{afterMock.proof}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2">
                  {afterMock.steps.map((item, index) => (
                    <div key={`${index}-${item}`} className="break-words rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold leading-5">
                      {item}
                    </div>
                  ))}
                  <div className="break-words rounded-lg bg-emerald-100 px-3 py-2 text-sm font-semibold leading-5 text-emerald-950">
                    {afterMock.acceptance}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
        ) : null}
      </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <Eye className="text-amber-900" size={20} />
          <div className="mt-3 text-2xl font-semibold">{report.reactions.length}</div>
          <p className="text-base text-slate-700">first-person reactions</p>
        </Card>
        <Card>
          <ListChecks className="text-amber-900" size={20} />
          <div className="mt-3 text-2xl font-semibold">{report.recommendations.length}</div>
          <p className="text-base text-slate-700">changes to make next</p>
        </Card>
        <Card>
          <ArrowRight className="text-amber-900" size={20} />
          <div className="mt-3 text-2xl font-semibold">{report.findings.filter((finding) => finding.severity === "high").length}</div>
          <p className="text-base text-slate-700">high-impact problems</p>
        </Card>
      </div>

      {activeReportBoard === "export" ? (
      <div id="report-board-export" data-report-board="export" className="scroll-mt-24 mt-6 rounded-2xl border border-black/10 bg-slate-950 p-5 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="font-mono text-sm font-semibold uppercase tracking-wide text-amber-200">Implementation plan</div>
            <Heading as="h2" className="mt-2 text-2xl text-white">
              {hasActiveQueueFilters ? "Copy this filtered implementation plan." : "Copy the implementation plan."}
            </Heading>
            <p className="mt-2 max-w-3xl text-base leading-7 text-slate-200">
              {hasActiveQueueFilters
                ? "Active filters are applied to copy and download. The markdown keeps the selected relationship or source context with every visible fix."
                : "One handoff with agent judgment, every recommendation, affected region, evidence, step, and acceptance check. Paste it into an agent or a ticket and start shipping."}
            </p>
            {hasActiveQueueFilters ? (
              <div data-implementation-queue-scope className="mt-3 rounded-xl border border-amber-200/25 bg-white/10 px-3 py-2 text-sm font-semibold leading-6 text-amber-100">
                {queueScopeSummary(visibleRecommendations.length, report.recommendations.length, selectedRelationshipTaskSummary, selectedSourceTaskSummary)}
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-amber-200 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => void copyImplementationQueue()}
              disabled={(hasActiveQueueFilters ? visibleRecommendations.length : report.recommendations.length) === 0}
            >
              {copiedQueue ? <Check size={16} /> : <Copy size={16} />}
              {copiedQueue ? "Copied plan" : hasActiveQueueFilters ? "Copy visible fix plan" : "Copy implementation plan"}
            </button>
            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 bg-white px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={downloadImplementationQueue}
              disabled={(hasActiveQueueFilters ? visibleRecommendations.length : report.recommendations.length) === 0}
            >
              {downloadedQueue ? <Check size={16} /> : <Download size={16} />}
              {downloadedQueue ? "Downloaded plan" : hasActiveQueueFilters ? "Download visible plan" : "Download implementation plan"}
            </button>
          </div>
        </div>
        {hasActiveQueueFilters ? (
          <FilteredQueuePreview
            recommendations={visibleRecommendations}
            totalRecommendationCount={report.recommendations.length}
            selectedRelationshipFilterSummary={selectedRelationshipTaskSummary}
            selectedSourceFilterSummary={selectedSourceTaskSummary}
          />
        ) : null}
        {report.artifacts.length ? (
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
            {report.artifacts.map((artifact) => (
              <div key={artifact.id} className="rounded-xl border border-white/10 bg-white/10 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-mono text-sm font-semibold uppercase tracking-wide text-amber-200">Report artifact</div>
                    <div className="mt-1 text-lg font-semibold">{artifact.title}</div>
                  </div>
                  <FileText className="text-amber-200" size={21} />
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-200">{artifact.description}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full bg-white px-3 py-1 font-semibold text-slate-950">{artifact.fileName}</span>
                  <span className="rounded-full border border-white/15 px-3 py-1 text-slate-100">
                    {artifact.itemCount} {artifact.itemCount === 1 ? "fix" : "fixes"} · {artifact.format}
                  </span>
                </div>
                {source === "demo" ? (
                  <div className="mt-3 text-sm font-semibold text-slate-300">Demo artifact downloads from this page.</div>
                ) : (
                  <a href={artifact.href} className="mt-3 inline-flex text-sm font-semibold text-amber-200 underline-offset-4 hover:underline">
                    Open markdown endpoint
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : null}
      </div>
      ) : null}

      {activeReportBoard === "agents" ? (
      <div className="mt-6 rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Badge>Agent memory</Badge>
            <Heading as="h2" className="mt-3 text-2xl">
              The run keeps each agent's profile attached.
            </Heading>
          </div>
          <div className="rounded-full bg-slate-950 px-3 py-1 text-sm font-semibold text-white">{report.personas.length} profiles</div>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {report.personas.map((persona, index) => (
            <div key={persona.id} className="rounded-xl border border-black/10 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <div
                  className={
                    index % 3 === 0
                      ? "grid size-12 shrink-0 place-items-center rounded-full bg-red-200 text-sm font-black text-red-950"
                      : index % 3 === 1
                        ? "grid size-12 shrink-0 place-items-center rounded-xl bg-amber-200 text-sm font-black text-slate-950"
                        : "grid size-12 shrink-0 place-items-center rounded-sm bg-sky-200 text-sm font-black text-sky-950"
                  }
                >
                  {personaFace(persona)}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-lg font-semibold text-slate-950">{persona.name}</div>
                    {persona.customerOwned ? <span className="rounded-full bg-emerald-100 px-2 py-1 text-sm font-semibold text-emerald-950">customer-owned</span> : null}
                  </div>
                  <div className="text-sm uppercase tracking-wide text-slate-700">{persona.role}</div>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-700">{persona.backstory}</p>
              {persona.customerRelationship ? (
                <p className="mt-3 rounded-lg bg-white px-3 py-2 text-sm font-semibold leading-6 text-slate-700">
                  {persona.privateExclusive ? "Private/exclusive. " : ""}
                  {persona.customerRelationship}
                </p>
              ) : null}
              {latestPersonaReactions.get(persona.id) ? (
                <div className="mt-3 rounded-lg border border-amber-200 bg-white p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-semibold uppercase tracking-wide text-amber-900">Latest report reaction</span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-sm font-semibold text-slate-700">
                      {latestPersonaReactions.get(persona.id)?.deviceId}
                    </span>
                    {latestPersonaReactions.get(persona.id)?.stance ? (
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-sm font-semibold text-amber-950">
                        {formatStance(latestPersonaReactions.get(persona.id)!.stance!)}
                        {latestPersonaReactions.get(persona.id)?.respondsToPersonaId ? ` ${personaName(personas, latestPersonaReactions.get(persona.id)?.respondsToPersonaId)}` : ""}
                      </span>
                    ) : null}
                    {responseReasonLabel(latestPersonaReactions.get(persona.id)?.responseReason) ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-sm font-semibold text-emerald-950">
                        {responseReasonLabel(latestPersonaReactions.get(persona.id)?.responseReason)}
                      </span>
                    ) : null}
                  </div>
                  {latestPersonaReactions.get(persona.id)?.responseReasonDetail ? (
                    <p className="mt-2 text-sm font-semibold leading-6 text-emerald-950">{latestPersonaReactions.get(persona.id)?.responseReasonDetail}</p>
                  ) : null}
                  <p className="mt-2 text-base font-semibold leading-7 text-slate-950">"{latestPersonaReactions.get(persona.id)?.thought}"</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{latestPersonaReactions.get(persona.id)?.evidence}</p>
                </div>
              ) : null}
              {persona.personalityFacets ? <PersonaFacetStrip persona={persona} /> : null}
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <ProfilePills title="Memories" items={persona.memories.slice(0, 2)} />
                <ProfilePills title="Tastes" items={persona.tastes.slice(0, 3)} />
                {persona.blindSpots?.length ? <ProfilePills title="Blind spots" items={persona.blindSpots.slice(0, 3)} /> : null}
                {persona.sourceDiet?.length ? <ProfilePills title="Source diet" items={persona.sourceDiet.slice(0, 3)} /> : null}
                {persona.dayPlan?.length ? <ProfilePills title="Day plan" items={persona.dayPlan.slice(0, 3)} /> : null}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-xl border border-black/10 bg-slate-950 p-4 text-white">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="font-mono text-sm font-semibold uppercase tracking-wide text-amber-200">Personality coverage</div>
              <div className="mt-1 text-xl font-semibold">{personalityCoverage.coveredAxisCount} / {personalityCoverage.totalAxisCount} axes represented</div>
              <p className="mt-2 text-sm leading-6 text-slate-200">{personalityCoverage.summary}</p>
            </div>
            <div className="rounded-full bg-amber-200 px-3 py-1 text-sm font-semibold text-slate-950">
              {personalityCoverage.personaCount} agents{personalityCoverage.customerOwnedCount ? ` · ${personalityCoverage.customerOwnedCount} private` : ""}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-4">
            {personalityCoverage.axisSummaries.map((axis) => (
              <div key={axis.id} className="rounded-lg bg-white p-3 text-slate-950">
                <div className="flex items-center justify-between gap-2 text-sm font-semibold">
                  <span>
                    {axis.leftLabel}/{axis.rightLabel}
                  </span>
                  <span className={axis.covered ? "text-emerald-700" : "text-amber-800"}>{axis.covered ? "covered" : "thin"}</span>
                </div>
                <div className="mt-2 text-sm leading-6 text-slate-700">
                  {axis.leftLead} pulls {axis.leftName.toLowerCase()}; {axis.rightLead} pulls {axis.rightName.toLowerCase()}.
                </div>
              </div>
            ))}
          </div>
          {personalityCoverage.actionSuggestions.length ? (
            <div className="mt-4 rounded-xl border border-amber-200/25 bg-white/10 p-4">
              <div className="font-mono text-sm font-semibold uppercase tracking-wide text-amber-200">Next agent to add</div>
              <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
                {personalityCoverage.actionSuggestions.map((suggestion) => (
                  <div key={suggestion.id} className="rounded-lg bg-white px-3 py-2 text-sm leading-6 text-slate-950">
                    <span className="font-semibold">{suggestion.title}.</span> {suggestion.detail}
                    {suggestion.source === "generated" && suggestion.generatorBrief ? (
                      <Link href={agentGeneratorHref(suggestion.generatorBrief, suggestion.generatorTone)} className="mt-2 inline-flex font-semibold text-amber-900 underline-offset-4 hover:underline">
                        Open prefilled generator
                      </Link>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
      ) : null}

      {activeReportBoard === "fixes" ? (
      <div id="report-board-fixes" data-report-board="fixes" className="scroll-mt-24">
        {relationshipFilterOptions.length ? (
          <div className="mt-6 rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <Badge>Relationship filter</Badge>
              <Heading as="h2" className="mt-3 text-2xl">
                Show fixes by agent exchange.
              </Heading>
              <p className="mt-2 max-w-3xl text-base leading-7 text-slate-700">
                Pick a relationship to see the recommendations created by that exchange. Use it when the useful part is the argument, not the full plan.
              </p>
            </div>
            <div className="rounded-full bg-slate-950 px-3 py-1 text-sm font-semibold text-white">
              {visibleRecommendations.length} visible {visibleRecommendations.length === 1 ? "fix" : "fixes"}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className={
                selectedRelationshipFilter === null
                  ? "rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
                  : "rounded-full border border-black/10 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-100"
              }
              onClick={() => selectRelationshipFilter(null)}
            >
              All fixes
            </button>
            {relationshipFilterOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                data-relationship-filter-option
                className={
                  selectedRelationshipFilter === option.key
                    ? "rounded-full bg-sky-900 px-4 py-2 text-sm font-semibold text-white"
                    : "rounded-full border border-black/10 bg-sky-50 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-100"
                }
                onClick={() => selectRelationshipFilter(option.key)}
              >
                {option.label} · {option.count}
              </button>
            ))}
          </div>
          {selectedRelationshipOption ? (
            <div data-relationship-filter-summary className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-4 text-base font-semibold leading-7 text-slate-950">
              {relationshipFilterSummary(selectedRelationshipOption, visibleRecommendations, selectedSourceOption)}
            </div>
          ) : null}
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        {visibleRecommendations.map((recommendation) => {
          const index = report.recommendations.indexOf(recommendation);
          const workItem = getRecommendationWorkItem(recommendation);
          const screenTrace = buildRecommendationScreenTrace(recommendation, index, screenCallouts, primaryScreenEvidence);
          const relationshipContext = getRecommendationRelationshipContext(report, recommendation);
          const relationshipReferences = relationshipContext.map(formatRecommendationRelationshipContextItem);
          const customerOwnedCredits = getRecommendationCustomerOwnedCredits(report, recommendation);
          const customerOwnedCreditReferences = customerOwnedCredits.map(formatRecommendationCustomerOwnedCreditItem);
          const sourceReferenceItems = getRecommendationSourceReferences(report, recommendation);
          const sourceReferences = sourceReferenceItems.map(formatRecommendationSourceReferenceItem);
          const taskPreviewText = formatRecommendationWorkItemTask(
            recommendation,
            workItem,
            [],
            relationshipReferences,
            selectedRelationshipTaskSummary,
            customerOwnedCreditReferences,
            sourceReferences,
            selectedSourceTaskSummary,
          );
          return (
            <Card key={recommendation.title} data-recommendation-card>
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{recommendation.priority} fix</Badge>
                <span className="text-sm font-medium text-slate-700">{recommendation.affectedPersonas.join(", ")}</span>
              </div>
              <Heading as="h2" className="mt-4 text-xl">
                {recommendation.title}
              </Heading>
              <p className="mt-3 text-base leading-7 text-slate-700">{recommendation.evidence}</p>
              <p className="mt-3 text-base font-semibold leading-7 text-slate-950">{recommendation.recommendation}</p>
              <SourceInfluencePanel references={sourceReferenceItems} />

              <div className="mt-5 rounded-xl border border-black/10 bg-slate-950 p-4 text-white">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-mono text-sm font-semibold uppercase tracking-wide text-amber-200">Exportable work item</div>
                    <div className="mt-1 text-lg font-semibold">{workItem.exportTitle}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-950">{workItem.changeType.replace("_", " ")}</span>
                    <button
                      type="button"
                      className="inline-flex min-h-9 items-center gap-2 rounded-full bg-amber-200 px-3 py-1 text-sm font-semibold text-slate-950 hover:bg-amber-100"
                      onClick={() => void copyWorkItem(workItem, taskPreviewText)}
                    >
                      {copiedWorkItem === workItem.exportTitle ? <Check size={15} /> : <Copy size={15} />}
                      {copiedWorkItem === workItem.exportTitle ? "Copied fix" : "Copy this fix"}
                    </button>
                  </div>
                </div>
                <TaskTextPreview text={taskPreviewText} />
                <WhyThisFixExists
                  workItem={workItem}
                  relationshipContext={relationshipContext}
                  personas={personas}
                  screenTrace={screenTrace}
                  selectedRelationshipFilterSummary={selectedRelationshipTaskSummary}
                  selectedSourceFilterSummary={selectedSourceTaskSummary}
                  customerOwnedCredits={customerOwnedCredits}
                  compact={index > 0}
                />
                <WorkItemChecklistPreview workItem={workItem} />
              </div>
            </Card>
          );
        })}

        {report.findings.map((finding: Finding) => (
          <Card key={finding.title} className={bubbleTone({ emotion: finding.severity === "high" ? "frustrated" : "skeptical" } as Reaction)}>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{finding.severity} problem</Badge>
              <span className="text-sm font-medium text-slate-700">{finding.category.replace("_", " ")}</span>
            </div>
            <Heading as="h2" className="mt-4 text-xl">
              {finding.title}
            </Heading>
            <p className="mt-3 text-base leading-7 text-slate-700">{finding.evidence}</p>
            <p className="mt-3 text-base font-semibold leading-7 text-slate-950">{finding.recommendation}</p>
          </Card>
        ))}
        </div>
      </div>
      ) : null}
    </>
  );
}

function agentGeneratorHref(brief: string, tone = "plainspoken") {
  const params = new URLSearchParams({ brief, tone });
  return `/agents?${params.toString()}`;
}

type RecommendationRelationshipFilterOption = {
  key: string;
  label: string;
  count: number;
};

type SourceFilterOption = {
  key: string;
  label: string;
  kind: Report["referenceSources"][number]["kind"];
  reactionCount: number;
  recommendationCount: number;
};

function relationshipFilterKey(context: RecommendationRelationshipContext) {
  return `${context.personaId}:${context.stance}:${context.targetPersonaId}`;
}

function buildRecommendationRelationshipFilters(report: Report): RecommendationRelationshipFilterOption[] {
  const options = new Map<string, RecommendationRelationshipFilterOption>();

  for (const recommendation of report.recommendations) {
    const seenInRecommendation = new Set<string>();
    for (const context of getRecommendationRelationshipContext(report, recommendation)) {
      const key = relationshipFilterKey(context);
      if (seenInRecommendation.has(key)) continue;
      seenInRecommendation.add(key);
      const existing = options.get(key) ?? {
        key,
        label: `${context.personaName} ${context.stanceLabel} ${context.targetPersonaName}`,
        count: 0,
      };
      existing.count += 1;
      options.set(key, existing);
    }
  }

  return Array.from(options.values()).toSorted((left, right) => right.count - left.count || left.label.localeCompare(right.label)).slice(0, 6);
}

function relationshipFilterSummary(option: RecommendationRelationshipFilterOption, recommendations: Report["recommendations"], sourceOption?: SourceFilterOption) {
  const targetAreas = Array.from(new Set(recommendations.map((recommendation) => recommendation.targetArea.replaceAll("_", " "))));
  const areaText = targetAreas.length ? ` across ${targetAreas.slice(0, 3).join(", ")}` : "";
  const sourceText = sourceOption ? ` while filtered to ${sourceOption.label}` : "";
  return `${option.label} is driving ${recommendations.length} visible ${recommendations.length === 1 ? "fix" : "fixes"}${areaText}${sourceText}.`;
}

function buildSourceFilterOptions(report: Report): SourceFilterOption[] {
  return report.referenceSources
    .map((source) => {
      const reactionCount = report.reactions.filter((reaction) => sourceReferencedByReaction(reaction, report.referenceSources)?.id === source.id).length;
      const recommendationCount = report.recommendations.filter((recommendation) =>
        getRecommendationSourceReferences(report, recommendation).some((reference) => reference.sourceId === source.id),
      ).length;

      return {
        key: source.id,
        label: source.title,
        kind: source.kind,
        reactionCount,
        recommendationCount,
      };
    })
    .filter((option) => option.reactionCount > 0 || option.recommendationCount > 0)
    .toSorted((left, right) => right.recommendationCount - left.recommendationCount || right.reactionCount - left.reactionCount || left.label.localeCompare(right.label));
}

function sourceFilterSummary(option: SourceFilterOption, visibleReactionCount: number, visibleRecommendationCount: number) {
  return `${option.label} is shaping ${visibleReactionCount} visible ${visibleReactionCount === 1 ? "reaction" : "reactions"} and ${visibleRecommendationCount} visible ${visibleRecommendationCount === 1 ? "fix" : "fixes"}.`;
}

function omittedTaskCount(visibleRecommendationCount: number, totalRecommendationCount: number) {
  return Math.max(0, totalRecommendationCount - visibleRecommendationCount);
}

function omittedTaskSummary(visibleRecommendationCount: number, totalRecommendationCount: number) {
  const omitted = omittedTaskCount(visibleRecommendationCount, totalRecommendationCount);
  return `${omitted} ${omitted === 1 ? "fix is" : "fixes are"} hidden by the current filters.`;
}

function queueScopeSummary(visibleRecommendationCount: number, totalRecommendationCount: number, relationshipSummary?: string, sourceSummary?: string) {
  const filterSummaries = [sourceSummary, relationshipSummary].filter((summary): summary is string => Boolean(summary));
  const filterText = filterSummaries.length ? ` Active filter: ${filterSummaries.join(" ")}` : "";
  return `This implementation plan contains ${visibleRecommendationCount} of ${totalRecommendationCount} total ${totalRecommendationCount === 1 ? "fix" : "fixes"} from the current report filters. ${omittedTaskSummary(visibleRecommendationCount, totalRecommendationCount)}${filterText}`;
}

function SourceFilterPanel({
  options,
  selectedKey,
  visibleReactionCount,
  visibleRecommendationCount,
  onSelect,
}: {
  options: SourceFilterOption[];
  selectedKey: string | null;
  visibleReactionCount: number;
  visibleRecommendationCount: number;
  onSelect: (key: string | null) => void;
}) {
  const selected = options.find((option) => option.key === selectedKey);

  return (
    <div className="mt-6 rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Badge>Source filter</Badge>
          <Heading as="h2" className="mt-3 text-2xl">
            Show work shaped by one source.
          </Heading>
          <p className="mt-2 max-w-3xl text-base leading-7 text-slate-700">
            Focus the conversation and fix list on the comparison page or market note that influenced the agents.
          </p>
        </div>
        <div className="rounded-full bg-slate-950 px-3 py-1 text-sm font-semibold text-white">
          {visibleRecommendationCount} visible {visibleRecommendationCount === 1 ? "fix" : "fixes"}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className={
            selectedKey === null
              ? "rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
              : "rounded-full border border-black/10 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-100"
          }
          onClick={() => onSelect(null)}
        >
          All sources
        </button>
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            data-source-filter-option
            className={
              selectedKey === option.key
                ? "rounded-full bg-sky-900 px-4 py-2 text-sm font-semibold text-white"
                : "rounded-full border border-black/10 bg-sky-50 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-100"
            }
            onClick={() => onSelect(option.key)}
          >
            {option.label} · {option.reactionCount} reads · {option.recommendationCount} fixes
          </button>
        ))}
      </div>

      {selected ? (
        <div data-source-filter-summary className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-4 text-base font-semibold leading-7 text-slate-950">
          {sourceFilterSummary(selected, visibleReactionCount, visibleRecommendationCount)}
        </div>
      ) : null}
    </div>
  );
}

function TaskTextPreview({ text }: { text: string }) {
  return (
    <details data-task-text-preview className="mt-3 rounded-xl border border-white/15 bg-white/10 p-3 text-white">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-base font-semibold leading-7 marker:hidden">
        <span className="inline-flex items-center gap-2">
          <FileText size={16} className="text-amber-200" />
          Preview exact fix handoff
        </span>
        <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-950">before copy</span>
      </summary>
      <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-slate-950 p-3 text-sm leading-6 text-slate-100 ring-1 ring-white/10">
        {text}
      </pre>
    </details>
  );
}

function FilteredQueuePreview({
  recommendations,
  totalRecommendationCount,
  selectedRelationshipFilterSummary,
  selectedSourceFilterSummary,
}: {
  recommendations: Report["recommendations"];
  totalRecommendationCount: number;
  selectedRelationshipFilterSummary?: string;
  selectedSourceFilterSummary?: string;
}) {
  return (
    <div data-filtered-queue-preview className="mt-5 rounded-xl border border-white/10 bg-white/10 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="font-mono text-sm font-semibold uppercase tracking-wide text-amber-200">Filtered plan preview</div>
          <div className="mt-1 text-lg font-semibold text-white">This visible fix plan will be copied or downloaded.</div>
        </div>
        <div data-filtered-queue-count className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-950">
          {recommendations.length} of {totalRecommendationCount} total {totalRecommendationCount === 1 ? "fix" : "fixes"}
        </div>
      </div>
      <div data-filtered-queue-omitted-count className="mt-3 rounded-lg border border-amber-200/25 bg-slate-950 px-3 py-2 text-sm font-semibold leading-6 text-amber-100">
        {omittedTaskSummary(recommendations.length, totalRecommendationCount)}
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2">
        {recommendations.map((recommendation, index) => {
          const workItem = getRecommendationWorkItem(recommendation);
          return (
            <div key={`${recommendation.title}-${index}`} data-filtered-queue-task className="rounded-lg bg-white px-3 py-2 text-slate-950">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-950 px-2 py-1 text-sm font-semibold text-white">Task {index + 1}</span>
                <span className="rounded-full bg-amber-100 px-2 py-1 text-sm font-semibold text-amber-950">{recommendation.priority}</span>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-sm font-semibold text-slate-700">{recommendation.targetArea.replaceAll("_", " ")}</span>
              </div>
              <div className="mt-2 text-base font-black leading-6">{workItem.exportTitle}</div>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">{shortText(recommendation.evidence, 150)}</p>
            </div>
          );
        })}
      </div>
      {[selectedSourceFilterSummary, selectedRelationshipFilterSummary].filter(Boolean).length ? (
        <div data-filtered-queue-preview-context className="mt-3 rounded-lg border border-amber-200/25 bg-slate-950 px-3 py-2 text-sm font-semibold leading-6 text-amber-100">
          {[selectedSourceFilterSummary, selectedRelationshipFilterSummary].filter(Boolean).join(" ")}
        </div>
      ) : null}
    </div>
  );
}

function WorkItemChecklistPreview({ workItem }: { workItem: ImplementationWorkItem }) {
  const firstStep = workItem.implementationSteps[0];
  const firstCriterion = workItem.acceptanceCriteria[0];

  return (
    <div data-work-item-checklist-preview className="mt-4 rounded-xl border border-white/10 bg-white/10 p-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-lg bg-slate-950 px-3 py-2 ring-1 ring-white/10">
          <div className="font-semibold text-amber-200">Implementation steps</div>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-100">{firstStep ?? "No implementation step recorded."}</p>
          <div className="mt-2 text-sm font-semibold text-slate-300">
            {workItem.implementationSteps.length} {workItem.implementationSteps.length === 1 ? "step" : "steps"} in the copied handoff
          </div>
        </div>
        <div className="rounded-lg bg-slate-950 px-3 py-2 ring-1 ring-white/10">
          <div className="font-semibold text-amber-200">Acceptance criteria</div>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-100">{firstCriterion ?? "No acceptance criterion recorded."}</p>
          <div className="mt-2 text-sm font-semibold text-slate-300">
            {workItem.acceptanceCriteria.length} {workItem.acceptanceCriteria.length === 1 ? "check" : "checks"} in the copied handoff
          </div>
        </div>
      </div>
      <details className="mt-3 rounded-lg bg-white px-3 py-2 text-slate-950">
        <summary className="cursor-pointer text-sm font-black uppercase tracking-wide">Open full checklist</summary>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <ol className="space-y-2 text-sm font-semibold leading-6">
            {workItem.implementationSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <ul className="space-y-2 text-sm font-semibold leading-6">
            {workItem.acceptanceCriteria.map((criterion) => (
              <li key={criterion}>{criterion}</li>
            ))}
          </ul>
        </div>
      </details>
    </div>
  );
}

function SourceInfluencePanel({ references }: { references: RecommendationSourceReference[] }) {
  if (!references.length) return null;

  const sourceTitles = Array.from(new Set(references.map((reference) => reference.sourceTitle))).slice(0, 2);

  return (
    <div data-recommendation-source-receipt data-source-influence-panel className="mt-4 rounded-xl border border-black/10 bg-slate-950 p-4 text-white">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="font-mono text-sm font-semibold uppercase tracking-wide text-amber-200">Source-backed fix</div>
          <div className="mt-1 text-lg font-semibold">What the outside read changed.</div>
        </div>
        <div className="rounded-full bg-amber-200 px-3 py-1 text-sm font-semibold text-slate-950">
          {references.length} source-backed {references.length === 1 ? "read" : "reads"}
        </div>
      </div>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-200">
        Source influence: {references[0]?.personaName} carried comparison evidence into this fix
        {sourceTitles.length ? `: ${sourceTitles.join(" + ")}` : "."}
      </p>
      <div className="mt-3 grid grid-cols-1 gap-3">
        {references.slice(0, 2).map((reference) => (
          <div key={`${reference.sourceId}-${reference.personaId}`} data-source-influence-card className="grid grid-cols-1 gap-3 rounded-xl border border-white/10 bg-white/10 p-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1.2fr)]">
            <div className="rounded-lg bg-white p-3 text-slate-950">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-sky-900">
                <BookOpen size={16} />
                {referenceKindLabel(reference.sourceKind)}
              </div>
              <div className="mt-2 text-base font-black leading-6">{reference.sourceTitle}</div>
              {reference.sourceUrl ? <div className="mt-2 break-words text-sm font-semibold leading-5 text-sky-900">{reference.sourceUrl}</div> : null}
            </div>
            <div className="grid place-items-center">
              <div className="grid size-10 place-items-center rounded-full bg-amber-200 text-slate-950">
                <ArrowRight size={18} />
              </div>
            </div>
            <div className="rounded-lg border border-amber-200/30 bg-slate-950 p-3">
              <div className="text-sm font-semibold uppercase tracking-wide text-amber-200">{reference.personaName} translated it</div>
              <div className="mt-2 text-base font-semibold leading-6 text-white">{reference.critiqueAxis ?? "agent read"}</div>
              <p className="mt-2 text-sm leading-6 text-slate-200">{shortText(reference.summary, 190)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReferenceSourcesPanel({ sources }: { sources: Report["referenceSources"] }) {
  if (!sources.length) return null;

  return (
    <div data-reference-sources-panel className="mt-6 rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Badge>Agent reading</Badge>
          <Heading as="h2" className="mt-3 text-2xl">
            What the agents read before judging.
          </Heading>
          <p className="mt-2 max-w-3xl text-base leading-7 text-slate-700">
            Comparison pages, news, and market notes stay attached to the report so the critique can say what this site beats or fails to beat.
          </p>
        </div>
        <div className="rounded-full bg-slate-950 px-3 py-1 text-sm font-semibold text-white">
          {sources.length} {sources.length === 1 ? "source" : "sources"}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
        {sources.map((source) => (
          <div key={source.id} className="rounded-xl border border-black/10 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-mono text-sm font-semibold uppercase tracking-wide text-amber-900">{referenceKindLabel(source.kind)}</div>
                <div className="mt-1 text-lg font-semibold leading-6 text-slate-950">{source.title}</div>
              </div>
              <BookOpen className="shrink-0 text-amber-900" size={20} />
            </div>
            {source.url ? (
              <a href={source.url} className="mt-3 block break-words text-sm font-semibold leading-6 text-sky-900 underline-offset-4 hover:underline">
                {source.url}
              </a>
            ) : null}
            <p className="mt-3 text-sm leading-6 text-slate-700">{shortText(source.summary, 260)}</p>
            {source.observedAt ? <div className="mt-3 text-sm font-semibold text-slate-600">Read {new Date(source.observedAt).toLocaleString()}</div> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function referenceKindLabel(kind: Report["referenceSources"][number]["kind"]) {
  if (kind === "comparison_site") return "Comparison site";
  if (kind === "market_news") return "Market context";
  return "Prior cycle";
}

function sourceReferencedByReaction(reaction: Reaction, sources: Report["referenceSources"]) {
  if (!sources.length) return null;

  const reactionText = normalizeMatchText([reaction.thought, reaction.evidence, reaction.responseReasonDetail].filter(Boolean).join(" "));
  const explicitSource = sources.find((source) => {
    const title = normalizeMatchText(source.title);
    const url = normalizeMatchText(source.url);
    return (title.length > 3 && reactionText.includes(title)) || (url.length > 8 && reactionText.includes(url));
  });

  if (explicitSource) return explicitSource;
  if (reactionText.includes("comparing it against") || reactionText.includes("compared against") || reactionText.includes("comparison")) {
    return sources.find((source) => source.kind === "comparison_site") ?? sources[0] ?? null;
  }

  return null;
}

function SourceUseChip({ source }: { source: Report["referenceSources"][number] }) {
  return (
    <div data-agent-source-reference className="mt-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold leading-6 text-sky-950">
      Compared with: {source.title}
      {source.kind !== "comparison_site" ? ` (${referenceKindLabel(source.kind).toLowerCase()})` : ""}
    </div>
  );
}

function WhyThisFixExists({
  workItem,
  relationshipContext,
  personas,
  screenTrace,
  selectedRelationshipFilterSummary,
  selectedSourceFilterSummary,
  customerOwnedCredits,
  compact = false,
}: {
  workItem: ImplementationWorkItem;
  relationshipContext: RecommendationRelationshipContext[];
  personas: Map<string, PersonaProfile>;
  screenTrace?: RecommendationScreenTrace;
  selectedRelationshipFilterSummary?: string;
  selectedSourceFilterSummary?: string;
  customerOwnedCredits: RecommendationCustomerOwnedCredit[];
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div data-why-this-fix-exists data-compact-fix-evidence className="mt-4 rounded-xl border border-white/10 bg-white p-3 text-slate-950">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="font-mono text-sm font-semibold uppercase tracking-wide text-slate-600">Why this fix exists</div>
            <div className="mt-1 text-base font-black leading-6">Evidence receipt, collapsed after the first rich fix.</div>
          </div>
          <span className="rounded-full bg-slate-950 px-3 py-1 text-sm font-semibold text-white">{workItem.changeType.replace("_", " ")}</span>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold leading-6">
            <div className="font-mono uppercase tracking-wide text-slate-500">Region</div>
            <div className="mt-1 text-slate-950">{shortText(workItem.affectedRegion, 90)}</div>
          </div>
          <div className="rounded-lg bg-sky-50 px-3 py-2 text-sm font-semibold leading-6 text-sky-950">
            <div className="font-mono uppercase tracking-wide text-sky-900">Agent exchange</div>
            <div className="mt-1">{relationshipContext.length ? `${relationshipContext.length} linked thread${relationshipContext.length === 1 ? "" : "s"}` : "No linked thread"}</div>
          </div>
          <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold leading-6 text-amber-950">
            <div className="font-mono uppercase tracking-wide text-amber-900">Screen proof</div>
            <div className="mt-1">{screenTrace ? `${screenTrace.pinLabel}: ${screenTrace.capturedRegion}` : "No pinned screen proof"}</div>
          </div>
        </div>

        {customerOwnedCredits.length ? (
          <div data-customer-owned-recommendation-credit className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold leading-6 text-emerald-950">
            <span className="font-mono uppercase tracking-wide text-emerald-900">Customer-owned contribution:</span>{" "}
            {customerOwnedCredits.map((credit) => `${credit.personaName}: ${shortText(credit.summary, 96)}`).join(" ")}
          </div>
        ) : null}

        {[selectedSourceFilterSummary, selectedRelationshipFilterSummary].filter(Boolean).length ? (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold leading-6 text-amber-950">
            {[selectedSourceFilterSummary, selectedRelationshipFilterSummary].filter(Boolean).join(" ")}
          </div>
        ) : null}

        <details className="mt-3 rounded-lg bg-slate-50 px-3 py-2">
          <summary className="cursor-pointer text-sm font-black uppercase tracking-wide text-slate-950">Open evidence details</summary>
          <div className="mt-3 space-y-3">
            {relationshipContext.length ? (
              <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-base leading-7 text-slate-950">
                <div className="font-mono text-sm font-semibold uppercase tracking-wide text-sky-900">Agent relationship behind this fix</div>
                <div className="mt-3 grid grid-cols-1 gap-2">
                  {relationshipContext.map((context, relationshipIndex) => (
                    <RecommendationRelationshipThread
                      key={`${context.personaId}-${context.targetPersonaId}-${context.stance}-${relationshipIndex}`}
                      context={context}
                      personas={personas}
                    />
                  ))}
                </div>
              </div>
            ) : null}
            {screenTrace ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-base leading-7 text-slate-950">
                <div className="font-mono text-sm font-semibold uppercase tracking-wide text-amber-900">Recommendation evidence trace</div>
                <div className="mt-2 font-semibold">
                  {screenTrace.pinLabel}: {screenTrace.critic} on {screenTrace.topic}
                </div>
                <div className="mt-1 text-slate-700">Captured region: {screenTrace.capturedRegion}</div>
                <div className="mt-1 text-slate-700">Match: {screenTrace.matchReason}</div>
                <div className="mt-1 text-slate-700">Screen evidence for this fix: {screenTrace.queueReference}</div>
              </div>
            ) : null}
          </div>
        </details>
      </div>
    );
  }

  return (
    <div data-why-this-fix-exists className="mt-4 rounded-xl border border-white/10 bg-white p-3 text-slate-950">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="font-mono text-sm font-semibold uppercase tracking-wide text-slate-600">Why this fix exists</div>
          <div className="mt-1 text-base font-black leading-6">Region, agent exchange, and evidence stay together.</div>
        </div>
        <span className="rounded-full bg-slate-950 px-3 py-1 text-sm font-semibold text-white">{workItem.changeType.replace("_", " ")}</span>
      </div>

      <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-base leading-7 text-slate-950">
        <span className="font-semibold">Affected screen region:</span> {workItem.affectedRegion}
      </div>

      {selectedRelationshipFilterSummary ? (
        <div data-copied-task-relationship-context className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-base font-semibold leading-7 text-emerald-950">
          This fix handoff keeps this selected exchange: {selectedRelationshipFilterSummary}
        </div>
      ) : null}

      {selectedSourceFilterSummary ? (
        <div data-copied-task-source-context className="mt-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-base font-semibold leading-7 text-sky-950">
          This fix handoff keeps this selected source: {selectedSourceFilterSummary}
        </div>
      ) : null}

      {customerOwnedCredits.length ? (
        <div data-customer-owned-recommendation-credit className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-base leading-7 text-emerald-950">
          <div className="font-mono text-sm font-semibold uppercase tracking-wide text-emerald-900">Customer-owned contribution</div>
          <div className="mt-2 grid grid-cols-1 gap-2">
            {customerOwnedCredits.map((credit) => (
              <div key={credit.personaId} className="rounded-lg bg-white px-3 py-2 text-slate-950">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-black">{credit.personaName}</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-sm font-semibold text-emerald-950">customer-owned</span>
                  {credit.privateExclusive ? <span className="rounded-full bg-slate-950 px-2 py-1 text-sm font-semibold text-white">private</span> : null}
                </div>
                <div className="mt-1 text-sm font-semibold uppercase tracking-wide text-slate-600">{credit.role}</div>
                <p className="mt-2 text-base font-semibold leading-7 text-slate-800">{credit.summary}</p>
                {credit.customerRelationship ? <p className="mt-2 text-sm font-semibold leading-6 text-emerald-900">{credit.customerRelationship}</p> : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {relationshipContext.length ? (
        <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 p-3 text-base leading-7 text-slate-950">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="font-mono text-sm font-semibold uppercase tracking-wide text-sky-900">Agent relationship behind this fix</div>
            <div className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-950">Conversation thread</div>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2">
            {relationshipContext.map((context, relationshipIndex) => (
              <RecommendationRelationshipThread
                key={`${context.personaId}-${context.targetPersonaId}-${context.stance}-${relationshipIndex}`}
                context={context}
                personas={personas}
              />
            ))}
          </div>
        </div>
      ) : null}

      {screenTrace ? (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-base leading-7 text-slate-950">
          <div className="font-mono text-sm font-semibold uppercase tracking-wide text-amber-900">Recommendation evidence trace</div>
          <div className="mt-2 font-semibold">
            {screenTrace.pinLabel}: {screenTrace.critic} on {screenTrace.topic}
          </div>
          <div className="mt-1 text-slate-700">Captured region: {screenTrace.capturedRegion}</div>
          <div className="mt-1 text-slate-700">Match: {screenTrace.matchReason}</div>
          <div className="mt-1 text-slate-700">Screen evidence for this fix: {screenTrace.queueReference}</div>
        </div>
      ) : null}
    </div>
  );
}

function RecommendationRelationshipThread({ context, personas }: { context: RecommendationRelationshipContext; personas: Map<string, PersonaProfile> }) {
  const source = personas.get(context.personaId);
  const target = personas.get(context.targetPersonaId);
  const sourceFace = source ? personaFace(source) : context.personaName.slice(0, 3).toUpperCase();
  const targetFace = target ? personaFace(target) : context.targetPersonaName.slice(0, 3).toUpperCase();

  return (
    <div data-recommendation-relationship-thread className="rounded-xl bg-white p-3 shadow-sm">
      <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <div className="min-w-0 rounded-lg bg-slate-950 p-2 text-white">
          <div className="flex items-center gap-2">
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-sky-200 text-sm font-black text-slate-950">{sourceFace}</div>
            <div className="min-w-0">
              <div className="truncate text-base font-black">{context.personaName}</div>
              <div className="truncate text-sm font-semibold uppercase tracking-wide text-slate-300">responded</div>
            </div>
          </div>
        </div>
        <div className="grid place-items-center gap-1 text-center">
          <ArrowRight size={20} className="rotate-90 text-sky-900 sm:rotate-0" />
          <span className="rounded-full bg-sky-900 px-3 py-1 text-sm font-black uppercase tracking-wide text-white">{context.stanceLabel}</span>
        </div>
        <div className="min-w-0 rounded-lg border border-black/10 bg-slate-50 p-2 text-slate-950">
          <div className="flex items-center gap-2">
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-amber-200 text-sm font-black text-slate-950">{targetFace}</div>
            <div className="min-w-0">
              <div className="truncate text-base font-black">{context.targetPersonaName}</div>
              <div className="truncate text-sm font-semibold uppercase tracking-wide text-slate-600">{context.critiqueAxis ?? "agent read"}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 rounded-lg bg-sky-50 px-3 py-2 text-base font-semibold leading-7 text-slate-950">"{shortText(context.thought, 140)}"</div>
      {context.detail ? <div className="mt-2 text-sm font-semibold leading-6 text-slate-600">{context.detail}</div> : null}
    </div>
  );
}

function PersonaFacetStrip({ persona }: { persona: PersonaProfile }) {
  const coverage = buildPersonalityCoverage([persona]);
  return (
    <div className="mt-3 rounded-lg bg-white p-3">
      <div className="font-mono text-sm font-semibold uppercase tracking-wide text-slate-600">Facet shape</div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
        {coverage.axisSummaries.map((axis) => (
          <div key={axis.id} className="rounded-md bg-slate-100 px-2 py-1 font-semibold text-slate-700">
            {axis.leftLabel}/{axis.rightLabel}: {axis.dominantLabel}
          </div>
        ))}
      </div>
    </div>
  );
}
