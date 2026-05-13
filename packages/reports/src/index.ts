import { z } from "zod";

export const findingCategories = [
  "confusion",
  "dead_end",
  "trust_issue",
  "copy_problem",
  "conversion_friction",
  "accessibility",
  "visual_design",
  "agent_readiness",
  "suggested_fix",
] as const;

export const findingSchema = z.object({
  category: z.enum(findingCategories),
  severity: z.enum(["low", "medium", "high"]),
  title: z.string().min(3),
  evidence: z.string().min(1),
  recommendation: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

export const personalityFacetWeightsSchema = z.object({
  introversion: z.number().min(0).max(1),
  extraversion: z.number().min(0).max(1),
  sensing: z.number().min(0).max(1),
  intuition: z.number().min(0).max(1),
  thinking: z.number().min(0).max(1),
  feeling: z.number().min(0).max(1),
  judging: z.number().min(0).max(1),
  perceiving: z.number().min(0).max(1),
});

export const personaVoiceSchema = z.object({
  style: z.enum(["professional", "plainspoken", "blunt"]),
  allowsMildProfanity: z.boolean().default(false),
  profanityLevel: z.enum(["none", "mild", "moderate"]).default("none"),
});

export const personaProfileSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2),
  role: z.string().min(2),
  face: z.string().min(1).max(4).optional(),
  goal: z.string().min(5),
  backstory: z.string().min(5),
  memories: z.array(z.string().min(1)),
  tastes: z.array(z.string().min(1)),
  blindSpots: z.array(z.string().min(1)).optional(),
  motivations: z.array(z.string().min(1)),
  likes: z.array(z.string().min(1)),
  deviceHabits: z.array(z.string().min(1)),
  skepticism: z.string().min(1),
  trustThreshold: z.number().min(0).max(1),
  personalityFacets: personalityFacetWeightsSchema.optional(),
  critiqueLens: z.array(z.string().min(1)).optional(),
  voice: personaVoiceSchema.optional(),
  sourceDiet: z.array(z.string().min(1)).optional(),
  dayPlan: z.array(z.string().min(1)).optional(),
  customerRelationship: z.string().min(1).optional(),
  privateExclusive: z.boolean().optional(),
  customerOwned: z.boolean().optional(),
});

export const deviceProfileSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  kind: z.enum(["mobile", "tablet", "laptop", "desktop"]),
  viewport: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
  userAgent: z.string().min(1),
});

export const referenceSourceSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["comparison_site", "market_news", "prior_cycle"]),
  title: z.string().min(1),
  url: z.string().min(1).optional(),
  summary: z.string().min(1),
  observedAt: z.string().min(1).optional(),
});

export const consensusSignalSchema = z.object({
  uniqueCritiqueAxes: z.array(z.string().min(1)),
  stanceCounts: z.record(z.string(), z.number()),
  collapseRisk: z.enum(["low", "medium", "high"]),
  summary: z.string().min(1),
});

export const reactionSchema = z.object({
  personaId: z.string().min(1),
  deviceId: z.string().min(1),
  url: z.string().min(1),
  emotion: z.enum(["curious", "confident", "confused", "skeptical", "frustrated", "delighted"]),
  thought: z.string().min(1),
  evidence: z.string().min(1),
  critiqueAxis: z.string().min(1).optional(),
  stance: z.enum(["independent", "supports_prior", "extends_prior", "contradicts_prior", "improved_since_prior"]).optional(),
  respondsToPersonaId: z.string().min(1).optional(),
  responseReason: z
    .enum(["same_run_reply", "prior_memory", "self_memory", "same_evidence", "polarity_shift", "prior_improvement", "facet_contrast"])
    .optional(),
  responseReasonDetail: z.string().min(1).optional(),
});

export const journeyEventSchema = z.object({
  personaId: z.string().min(1),
  deviceId: z.string().min(1),
  type: z.enum(["navigation", "observation", "reaction", "blocked_action", "finding", "error"]),
  url: z.string().min(1),
  message: z.string().min(1),
  occurredAt: z.string().min(1),
});

export const simulationSnapshotSchema = z.object({
  id: z.string().min(1),
  personaId: z.string().min(1),
  deviceId: z.string().min(1),
  moment: z.string().min(1),
  x: z.number(),
  y: z.number(),
  activity: z.string().min(1),
  mood: z.string().min(1),
  thought: z.string().min(1),
});

export const screenEvidenceAnnotationSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["heading", "action", "content", "image", "form"]),
  label: z.string().min(1),
  x: z.number().min(0),
  y: z.number().min(0),
  width: z.number().min(1),
  height: z.number().min(1),
  importance: z.number().min(0).max(1),
  evidence: z.string().min(1).optional(),
});

export const screenEvidenceSchema = z.object({
  id: z.string().min(1),
  route: z.string().min(1),
  url: z.string().min(1),
  deviceId: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  capturedAt: z.string().min(1),
  imageDataUrl: z.string().min(1),
  altText: z.string().min(1),
  annotations: z.array(screenEvidenceAnnotationSchema).default([]),
});

export const implementationWorkItemSchema = z.object({
  exportTitle: z.string().min(3),
  affectedRegion: z.string().min(1),
  changeType: z.enum(["copy", "layout", "visual_design", "accessibility", "trust", "conversion", "agent_output", "navigation", "content"]),
  implementationSteps: z.array(z.string().min(1)).min(1),
  acceptanceCriteria: z.array(z.string().min(1)).min(1),
});

export const recommendationSchema = z.object({
  priority: z.enum(["high", "medium", "low"]),
  title: z.string().min(3),
  targetArea: z.enum(["user_experience", "conversion_flow", "trust", "copy", "product_clarity", "agent_readiness", "accessibility", "visual_design"]),
  recommendation: z.string().min(1),
  evidence: z.string().min(1),
  affectedPersonas: z.array(z.string().min(1)),
  affectedDevices: z.array(z.string().min(1)),
  implementationWorkItem: implementationWorkItemSchema.optional(),
});

export const reportArtifactSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  kind: z.enum(["implementation_queue"]),
  format: z.enum(["markdown"]),
  mediaType: z.string().min(1),
  href: z.string().min(1),
  fileName: z.string().min(1),
  description: z.string().min(1),
  itemCount: z.number().int().min(0),
});

export const beforeAfterHypothesisSchema = z.object({
  id: z.string().min(1),
  route: z.string().min(1),
  currentSignal: z.string().min(1),
  improvedSignal: z.string().min(1),
  evidence: z.string().min(1),
  personaId: z.string().min(1).optional(),
  recommendationTitle: z.string().min(1).optional(),
});

export const reportSchema = z.object({
  runId: z.string().min(1),
  summary: z.string().min(1),
  findings: z.array(findingSchema),
  personas: z.array(personaProfileSchema).default([]),
  devices: z.array(deviceProfileSchema).default([]),
  referenceSources: z.array(referenceSourceSchema).default([]),
  consensus: consensusSignalSchema.optional(),
  journeyEvents: z.array(journeyEventSchema).default([]),
  reactions: z.array(reactionSchema).default([]),
  snapshots: z.array(simulationSnapshotSchema).default([]),
  screenEvidence: z.array(screenEvidenceSchema).default([]),
  recommendations: z.array(recommendationSchema).default([]),
  artifacts: z.array(reportArtifactSchema).default([]),
  beforeAfterHypotheses: z.array(beforeAfterHypothesisSchema).default([]),
});

export type Finding = z.infer<typeof findingSchema>;
export type PersonaProfile = z.infer<typeof personaProfileSchema>;
export type DeviceProfile = z.infer<typeof deviceProfileSchema>;
export type ReferenceSource = z.infer<typeof referenceSourceSchema>;
export type ConsensusSignal = z.infer<typeof consensusSignalSchema>;
export type Reaction = z.infer<typeof reactionSchema>;
export type JourneyEvent = z.infer<typeof journeyEventSchema>;
export type SimulationSnapshot = z.infer<typeof simulationSnapshotSchema>;
export type ScreenEvidenceAnnotation = z.infer<typeof screenEvidenceAnnotationSchema>;
export type ScreenEvidence = z.infer<typeof screenEvidenceSchema>;
export type ImplementationWorkItem = z.infer<typeof implementationWorkItemSchema>;
export type Recommendation = z.infer<typeof recommendationSchema>;
export type ReportArtifact = z.infer<typeof reportArtifactSchema>;
export type BeforeAfterHypothesis = z.infer<typeof beforeAfterHypothesisSchema>;
export type Report = z.infer<typeof reportSchema>;

export function normalizeFinding(input: unknown): Finding {
  return findingSchema.parse(input);
}

export function buildReport(runId: string, findings: Finding[]): Report {
  const highCount = findings.filter((finding) => finding.severity === "high").length;
  const summary =
    findings.length === 0
      ? "No material friction was detected in this safe-mode run."
      : `${findings.length} issue${findings.length === 1 ? "" : "s"} found, including ${highCount} high severity.`;

  return reportSchema.parse({ runId, summary, findings });
}

export function buildSimulationReport(input: {
  runId: string;
  findings: Finding[];
  personas: PersonaProfile[];
  devices: DeviceProfile[];
  referenceSources?: ReferenceSource[];
  consensus?: ConsensusSignal;
  journeyEvents: JourneyEvent[];
  reactions: Reaction[];
  snapshots: SimulationSnapshot[];
  screenEvidence?: ScreenEvidence[];
  recommendations: Recommendation[];
  artifacts?: ReportArtifact[];
  beforeAfterHypotheses?: BeforeAfterHypothesis[];
}): Report {
  const highCount = input.findings.filter((finding) => finding.severity === "high").length;
  const personaCount = input.personas.length;
  const deviceCount = input.devices.length;
  const summary =
    input.findings.length === 0
      ? `${personaCount} agents completed ${deviceCount} device checks without material friction.`
      : `${personaCount} agents tested ${deviceCount} devices and found ${input.findings.length} issue${
          input.findings.length === 1 ? "" : "s"
        }, including ${highCount} high severity.`;

  return reportSchema.parse({
    runId: input.runId,
    summary,
    findings: input.findings,
    personas: input.personas,
    devices: input.devices,
    referenceSources: input.referenceSources ?? [],
    consensus: input.consensus,
    journeyEvents: input.journeyEvents,
    reactions: input.reactions,
    snapshots: input.snapshots,
    screenEvidence: input.screenEvidence ?? [],
    recommendations: input.recommendations,
    artifacts: input.artifacts ?? defaultReportArtifacts(input.runId, input.recommendations.length),
    beforeAfterHypotheses: input.beforeAfterHypotheses ?? buildDefaultBeforeAfterHypotheses(input),
  });
}

export function implementationQueueHref(runId: string): string {
  return `/api/runs/${encodeURIComponent(runId)}/implementation-queue`;
}

export function buildImplementationQueueArtifact(runId: string, itemCount: number): ReportArtifact {
  return {
    id: "implementation-queue",
    title: "Implementation queue",
    kind: "implementation_queue",
    format: "markdown",
    mediaType: "text/markdown",
    href: implementationQueueHref(runId),
    fileName: implementationQueueFilename(runId),
    description: "Markdown handoff with agent judgment context, every recommendation, affected region, implementation step, and acceptance criterion.",
    itemCount,
  };
}

export function defaultReportArtifacts(runId: string, recommendationCount: number): ReportArtifact[] {
  return recommendationCount > 0 ? [buildImplementationQueueArtifact(runId, recommendationCount)] : [];
}

export function buildDefaultBeforeAfterHypotheses(input: {
  findings: Finding[];
  personas: PersonaProfile[];
  reactions: Reaction[];
  recommendations: Recommendation[];
}): BeforeAfterHypothesis[] {
  const personas = new Map(input.personas.map((persona) => [persona.id, persona]));
  const recommendations =
    input.recommendations.length > 0
      ? input.recommendations
      : input.findings.slice(0, 3).map((finding) => ({
          priority: finding.severity === "high" ? "high" : finding.severity === "medium" ? "medium" : "low",
          title: finding.title,
          targetArea: finding.category === "accessibility" ? "accessibility" : finding.category === "visual_design" ? "visual_design" : "product_clarity",
          recommendation: finding.recommendation,
          evidence: finding.evidence,
          affectedPersonas: [],
          affectedDevices: [],
        }) satisfies Recommendation);

  if (recommendations.length > 0) {
    return recommendations.slice(0, 3).map((recommendation, index) => {
      const reaction = pickReactionForRecommendation(input.reactions, recommendation);
      return buildBeforeAfterHypothesis({
        id: `before-after-${index + 1}`,
        personas,
        reaction,
        recommendation,
      });
    });
  }

  return input.reactions.slice(0, 2).map((reaction, index) =>
    buildBeforeAfterHypothesis({
      id: `before-after-${index + 1}`,
      personas,
      reaction,
    }),
  );
}

function buildBeforeAfterHypothesis(input: {
  id: string;
  personas: Map<string, PersonaProfile>;
  reaction?: Reaction;
  recommendation?: Recommendation;
}): BeforeAfterHypothesis {
  const { id, personas, reaction, recommendation } = input;
  const personaName = reaction ? personas.get(reaction.personaId)?.name ?? reaction.personaId : "Snoopy";
  const route = reaction?.url ?? "current route";
  const currentSignal = reaction
    ? `${personaName} sees ${reaction.critiqueAxis ?? "the page"}: ${reaction.thought}`
    : recommendation
      ? recommendation.evidence
      : "The current route needs a clearer agent-readable before/after signal.";
  const improvedSignal = recommendation
    ? recommendation.recommendation
    : "Turn the strongest agent reaction into a visible next-state recommendation.";

  return {
    id,
    route,
    currentSignal,
    improvedSignal,
    evidence: recommendation?.evidence ?? reaction?.evidence ?? "No supporting evidence was captured.",
    personaId: reaction?.personaId,
    recommendationTitle: recommendation?.title,
  };
}

function pickReactionForRecommendation(reactions: Reaction[], recommendation: Recommendation) {
  return (
    reactions.find((reaction) => recommendation.affectedPersonas.includes(reaction.personaId) && reaction.critiqueAxis && recommendation.evidence.includes(reaction.evidence)) ??
    reactions.find((reaction) => recommendation.affectedPersonas.includes(reaction.personaId)) ??
    reactions.find((reaction) => recommendation.targetArea.includes((reaction.critiqueAxis ?? "").replaceAll(" ", "_"))) ??
    reactions[0]
  );
}

export function readableTargetArea(targetArea: Recommendation["targetArea"]): string {
  return targetArea.replaceAll("_", " ");
}

export function getRecommendationWorkItem(recommendation: Recommendation): ImplementationWorkItem {
  return (
    recommendation.implementationWorkItem ?? {
      exportTitle: recommendation.title,
      affectedRegion: readableTargetArea(recommendation.targetArea),
      changeType: "content",
      implementationSteps: [
        recommendation.recommendation,
        "Check the updated screen on mobile and desktop.",
        "Keep the critic evidence attached to the recommendation.",
      ],
      acceptanceCriteria: [
        "The report shows the affected screen region beside the recommended change.",
        "A nontechnical reviewer can tell what should be changed next.",
      ],
    }
  );
}

export function formatRecommendationWorkItemTask(
  recommendation: Recommendation,
  workItem: ImplementationWorkItem = getRecommendationWorkItem(recommendation),
  screenEvidenceReferences: string[] = [],
  agentRelationshipReferences: string[] = [],
  selectedRelationshipFilterSummary?: string,
  customerOwnedContributionReferences: string[] = [],
  sourceReferences: string[] = [],
  selectedSourceFilterSummary?: string,
): string {
  return [
    `# ${workItem.exportTitle}`,
    "",
    `Priority: ${recommendation.priority}`,
    `Change type: ${workItem.changeType.replaceAll("_", " ")}`,
    `Affected screen region: ${workItem.affectedRegion}`,
    `Affected personas: ${recommendation.affectedPersonas.join(", ") || "Not specified"}`,
    `Affected devices: ${recommendation.affectedDevices.join(", ") || "Not specified"}`,
    ...(selectedRelationshipFilterSummary ? ["", "Selected relationship filter:", selectedRelationshipFilterSummary] : []),
    ...(selectedSourceFilterSummary ? ["", "Selected source filter:", selectedSourceFilterSummary] : []),
    ...(customerOwnedContributionReferences.length
      ? ["", "Customer-owned contribution:", ...customerOwnedContributionReferences.map((reference) => `- ${reference}`)]
      : []),
    ...(agentRelationshipReferences.length ? ["", "Agent relationship behind this fix:", ...agentRelationshipReferences.map((reference) => `- ${reference}`)] : []),
    ...(sourceReferences.length ? ["", "Source used by agent:", ...sourceReferences.map((reference) => `- ${reference}`)] : []),
    "",
    "Evidence:",
    recommendation.evidence,
    ...(screenEvidenceReferences.length ? ["", "Screen evidence:", ...screenEvidenceReferences.map((reference) => `- ${reference}`)] : []),
    "",
    "Recommendation:",
    recommendation.recommendation,
    "",
    "Implementation steps:",
    ...workItem.implementationSteps.map((step, index) => `${index + 1}. ${step}`),
    "",
    "Acceptance criteria:",
    ...workItem.acceptanceCriteria.map((criterion) => `- ${criterion}`),
  ].join("\n");
}

export type RecommendationRelationshipContext = {
  personaId: string;
  personaName: string;
  personaCustomerOwned: boolean;
  personaPrivateExclusive?: boolean;
  personaCustomerRelationship?: string;
  targetPersonaId: string;
  targetPersonaName: string;
  targetPersonaCustomerOwned: boolean;
  targetPersonaPrivateExclusive?: boolean;
  targetPersonaCustomerRelationship?: string;
  stance: NonNullable<Reaction["stance"]>;
  stanceLabel: string;
  responseReason?: string;
  critiqueAxis?: string;
  thought: string;
  evidence: string;
  detail?: string;
};

export type RecommendationCustomerOwnedCredit = {
  personaId: string;
  personaName: string;
  role: string;
  privateExclusive?: boolean;
  customerRelationship?: string;
  summary: string;
};

export type RecommendationSourceReference = {
  sourceId: string;
  sourceKind: ReferenceSource["kind"];
  sourceTitle: string;
  sourceUrl?: string;
  personaId: string;
  personaName: string;
  critiqueAxis?: string;
  summary: string;
};

function normalizedRoutePath(value: string): string {
  try {
    return new URL(value, "https://snoopy.local").pathname || "/";
  } catch {
    return value.split("?")[0]?.split("#")[0] || "/";
  }
}

function annotationSummary(annotation: ScreenEvidenceAnnotation): string {
  return `${annotation.id} ${annotation.kind} "${annotation.label}" at ${annotation.x},${annotation.y} ${annotation.width}x${annotation.height}`;
}

function screenSummary(screen: ScreenEvidence, annotations = screen.annotations.slice(0, 3)): string {
  const route = screen.route || normalizedRoutePath(screen.url);
  const annotationText = annotations.length ? `; annotations: ${annotations.map(annotationSummary).join(" | ")}` : "; annotations: none captured";
  return `${screen.deviceId} ${route} (${screen.width}x${screen.height})${annotationText}`;
}

function screenEvidenceForRecommendation(report: Report, recommendation: Recommendation): ScreenEvidence[] {
  if (!report.screenEvidence.length) return [];

  const matchingHypothesis = report.beforeAfterHypotheses.find(
    (hypothesis) => hypothesis.recommendationTitle === recommendation.title || hypothesis.evidence === recommendation.evidence || hypothesis.improvedSignal === recommendation.recommendation,
  );
  const route = matchingHypothesis ? normalizedRoutePath(matchingHypothesis.route) : undefined;
  const affectedDevices = new Set(recommendation.affectedDevices);

  const routeMatches = route
    ? report.screenEvidence.filter((screen) => normalizedRoutePath(screen.route || screen.url) === route || normalizedRoutePath(screen.url) === route)
    : report.screenEvidence;
  const deviceMatches = affectedDevices.size > 0 ? routeMatches.filter((screen) => affectedDevices.has(screen.deviceId)) : routeMatches;
  return (deviceMatches.length ? deviceMatches : routeMatches).slice(0, 2);
}

function latestReactionsByPersona(reactions: Reaction[]) {
  const latest = new Map<string, Reaction>();
  for (const reaction of reactions) {
    latest.set(reaction.personaId, reaction);
  }
  return latest;
}

function relationshipLabel(stance: NonNullable<Reaction["stance"]>) {
  if (stance === "supports_prior") return "supported";
  if (stance === "extends_prior") return "extended";
  if (stance === "contradicts_prior") return "pushed back on";
  if (stance === "improved_since_prior") return "saw improvement after";
  return stance.replaceAll("_", " ");
}

function recommendationRelationshipScore(reaction: Reaction, recommendation: Recommendation) {
  let score = 0;
  const targetText = [recommendation.title, recommendation.recommendation, recommendation.evidence, recommendation.targetArea].join(" ").toLowerCase();

  if (recommendation.affectedPersonas.includes(reaction.personaId)) score += 4;
  if (reaction.respondsToPersonaId && recommendation.affectedPersonas.includes(reaction.respondsToPersonaId)) score += 3;
  if (reaction.critiqueAxis && targetText.includes(reaction.critiqueAxis.toLowerCase())) score += 2;
  if (reaction.evidence && recommendation.evidence.includes(reaction.evidence)) score += 2;
  if (reaction.responseReason === "same_run_reply") score += 1;
  return score;
}

function normalizeReferenceMatchText(value: string | undefined) {
  return (value ?? "").toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

function sourceReferencedByReaction(reaction: Reaction, sources: ReferenceSource[]) {
  if (!sources.length) return null;

  const reactionText = normalizeReferenceMatchText([reaction.thought, reaction.evidence, reaction.responseReasonDetail].filter(Boolean).join(" "));
  const explicitSource = sources.find((source) => {
    const title = normalizeReferenceMatchText(source.title);
    const url = normalizeReferenceMatchText(source.url);
    return (title.length > 3 && reactionText.includes(title)) || (url.length > 8 && reactionText.includes(url));
  });

  if (explicitSource) return explicitSource;
  if (reactionText.includes("comparing it against") || reactionText.includes("compared against") || reactionText.includes("comparison")) {
    return sources.find((source) => source.kind === "comparison_site") ?? sources[0] ?? null;
  }

  return null;
}

export function getRecommendationSourceReferences(report: Report, recommendation: Recommendation): RecommendationSourceReference[] {
  if (!report.referenceSources.length) return [];

  const personas = new Map(report.personas.map((persona) => [persona.id, persona]));
  const seen = new Set<string>();

  return report.reactions
    .map((reaction) => ({ reaction, score: recommendationRelationshipScore(reaction, recommendation), source: sourceReferencedByReaction(reaction, report.referenceSources) }))
    .filter((item) => item.score > 0 && item.source)
    .sort((left, right) => right.score - left.score)
    .flatMap(({ reaction, source }) => {
      if (!source) return [];
      const key = `${source.id}:${reaction.personaId}`;
      if (seen.has(key)) return [];
      seen.add(key);
      const persona = personas.get(reaction.personaId);
      return [
        {
          sourceId: source.id,
          sourceKind: source.kind,
          sourceTitle: source.title,
          sourceUrl: source.url,
          personaId: reaction.personaId,
          personaName: persona?.name ?? reaction.personaId,
          critiqueAxis: reaction.critiqueAxis,
          summary: reaction.evidence,
        },
      ];
    })
    .slice(0, 3);
}

export function formatRecommendationSourceReferenceItem(reference: RecommendationSourceReference): string {
  const kind = reference.sourceKind.replaceAll("_", " ");
  const axis = reference.critiqueAxis ? ` on ${reference.critiqueAxis}` : "";
  const url = reference.sourceUrl ? ` (${reference.sourceUrl})` : "";
  return `${reference.personaName}${axis} used ${kind} "${reference.sourceTitle}"${url}. Evidence: ${reference.summary}`;
}

export function getRecommendationRelationshipContext(report: Report, recommendation: Recommendation): RecommendationRelationshipContext[] {
  const personas = new Map(report.personas.map((persona) => [persona.id, persona]));
  return report.reactions
    .filter((reaction) => reaction.respondsToPersonaId && reaction.stance && reaction.stance !== "independent")
    .map((reaction) => ({ reaction, score: recommendationRelationshipScore(reaction, recommendation) }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 2)
    .map(({ reaction }) => {
      const stance = reaction.stance as NonNullable<Reaction["stance"]>;
      const persona = personas.get(reaction.personaId);
      const targetPersona = personas.get(reaction.respondsToPersonaId!);
      return {
        personaId: reaction.personaId,
        personaName: persona?.name ?? reaction.personaId,
        personaCustomerOwned: Boolean(persona?.customerOwned),
        personaPrivateExclusive: persona?.privateExclusive,
        personaCustomerRelationship: persona?.customerRelationship,
        targetPersonaId: reaction.respondsToPersonaId!,
        targetPersonaName: targetPersona?.name ?? reaction.respondsToPersonaId!,
        targetPersonaCustomerOwned: Boolean(targetPersona?.customerOwned),
        targetPersonaPrivateExclusive: targetPersona?.privateExclusive,
        targetPersonaCustomerRelationship: targetPersona?.customerRelationship,
        stance,
        stanceLabel: relationshipLabel(stance),
        responseReason: reaction.responseReason ? formatResponseReason(reaction.responseReason) : undefined,
        critiqueAxis: reaction.critiqueAxis,
        thought: reaction.thought,
        evidence: reaction.evidence,
        detail: reaction.responseReasonDetail,
      };
    });
}

export function formatRecommendationRelationshipContextItem(context: RecommendationRelationshipContext): string {
  const personaLabel = context.personaCustomerOwned ? `${context.personaName} [customer-owned]` : context.personaName;
  const targetLabel = context.targetPersonaCustomerOwned ? `${context.targetPersonaName} [customer-owned]` : context.targetPersonaName;
  const axis = context.critiqueAxis ? ` on ${context.critiqueAxis}` : "";
  const reason = context.responseReason ? `; reason: ${context.responseReason}` : "";
  const detail = context.detail ? ` (${context.detail})` : "";
  return `${personaLabel} ${context.stanceLabel} ${targetLabel}${axis}${reason}${detail}. Thought: "${context.thought}"`;
}

export function getRecommendationCustomerOwnedCredits(report: Report, recommendation: Recommendation): RecommendationCustomerOwnedCredit[] {
  const personas = new Map(report.personas.map((persona) => [persona.id, persona]));
  const credits = new Map<string, RecommendationCustomerOwnedCredit>();

  function addCredit(personaId: string, summary: string) {
    const persona = personas.get(personaId);
    if (!persona?.customerOwned) return;
    const existing = credits.get(personaId);
    if (existing) {
      if (!existing.summary.includes(summary)) existing.summary = `${existing.summary} ${summary}`;
      return;
    }
    credits.set(personaId, {
      personaId,
      personaName: persona.name,
      role: persona.role,
      privateExclusive: persona.privateExclusive,
      customerRelationship: persona.customerRelationship,
      summary,
    });
  }

  for (const context of getRecommendationRelationshipContext(report, recommendation)) {
    const axis = context.critiqueAxis ? ` on ${context.critiqueAxis}` : "";
    if (context.personaCustomerOwned) {
      addCredit(context.personaId, `${context.personaName} ${context.stanceLabel} ${context.targetPersonaName}${axis}, so this recommendation carries a customer-specific read.`);
    }
    if (context.targetPersonaCustomerOwned) {
      addCredit(
        context.targetPersonaId,
        `${context.targetPersonaName} shaped this recommendation because ${context.personaName} ${context.stanceLabel} that customer-owned read${axis}.`,
      );
    }
  }

  for (const personaId of recommendation.affectedPersonas) {
    const persona = personas.get(personaId);
    if (persona?.customerOwned && !credits.has(personaId)) {
      addCredit(personaId, `${persona.name} is an affected customer-owned agent, so this recommendation preserves that workspace-specific taste.`);
    }
  }

  return Array.from(credits.values());
}

export function formatRecommendationCustomerOwnedCreditItem(credit: RecommendationCustomerOwnedCredit): string {
  const privacy = credit.privateExclusive ? " Private/exclusive." : "";
  const relationship = credit.customerRelationship ? ` Relationship: ${credit.customerRelationship}` : "";
  return `${credit.personaName} (${credit.role}). ${credit.summary}${privacy}${relationship}`;
}

function formatReactionStance(reaction: Reaction, personas: Map<string, PersonaProfile>) {
  const reason = reaction.responseReason
    ? `; reason: ${formatResponseReason(reaction.responseReason)}${reaction.responseReasonDetail ? ` (${reaction.responseReasonDetail})` : ""}`
    : "";
  if (!reaction.stance) return `independent${reason}`;
  if (reaction.stance === "supports_prior") return `supports ${reaction.respondsToPersonaId ? personas.get(reaction.respondsToPersonaId)?.name ?? reaction.respondsToPersonaId : "prior output"}${reason}`;
  if (reaction.stance === "extends_prior") return `extends ${reaction.respondsToPersonaId ? personas.get(reaction.respondsToPersonaId)?.name ?? reaction.respondsToPersonaId : "prior output"}${reason}`;
  if (reaction.stance === "contradicts_prior") return `pushes back on ${reaction.respondsToPersonaId ? personas.get(reaction.respondsToPersonaId)?.name ?? reaction.respondsToPersonaId : "prior output"}${reason}`;
  if (reaction.stance === "improved_since_prior") return `improved since prior${reason}`;
  return `${reaction.stance}${reason}`;
}

function formatResponseReason(reason: NonNullable<Reaction["responseReason"]>) {
  if (reason === "same_run_reply") return "same run reply";
  if (reason === "prior_memory") return "prior memory";
  if (reason === "self_memory") return "self memory";
  if (reason === "same_evidence") return "same evidence";
  if (reason === "polarity_shift") return "polarity shift";
  if (reason === "prior_improvement") return "prior improvement";
  if (reason === "facet_contrast") return "facet contrast";
  return reason;
}

export function formatAgentJudgmentContext(report: Report): string {
  const personas = new Map(report.personas.map((persona) => [persona.id, persona]));
  const reactions = latestReactionsByPersona(report.reactions);
  const entries = report.personas
    .map((persona) => {
      const reaction = reactions.get(persona.id);
      if (!reaction) return null;

      return [
        `### ${persona.name} (${persona.role})`,
        "",
        `Latest reaction: ${reaction.emotion} on ${reaction.deviceId}; ${formatReactionStance(reaction, personas)}.`,
        "",
        `Thought: "${reaction.thought}"`,
        "",
        `Evidence: ${reaction.evidence}`,
        persona.customerOwned ? "Customer-owned: yes" : "",
        persona.privateExclusive ? "Private/exclusive: yes" : "",
        persona.customerRelationship ? `Customer relationship: ${persona.customerRelationship}` : "",
        persona.memories.length ? `Memory: ${persona.memories.slice(0, 2).join(" / ")}` : "",
        persona.blindSpots?.length ? `Blind spots to watch: ${persona.blindSpots.slice(0, 3).join(" / ")}` : "",
        persona.sourceDiet?.length ? `Source diet: ${persona.sourceDiet.slice(0, 3).join(" / ")}` : "",
        persona.dayPlan?.length ? `Day plan: ${persona.dayPlan.slice(0, 3).join(" / ")}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .filter((entry): entry is string => Boolean(entry));

  return entries.join("\n\n");
}

export function formatBeforeAfterContext(report: Report): string {
  return report.beforeAfterHypotheses
    .map((hypothesis, index) =>
      [
        `### ${index + 1}. ${hypothesis.recommendationTitle ?? "Before/after hypothesis"}`,
        "",
        `Route: ${hypothesis.route}`,
        "",
        `Current signal: ${hypothesis.currentSignal}`,
        "",
        `Improved signal: ${hypothesis.improvedSignal}`,
        "",
        `Evidence: ${hypothesis.evidence}`,
      ].join("\n"),
    )
    .join("\n\n");
}

export function formatScreenEvidenceContext(report: Report): string {
  return report.screenEvidence
    .filter((screen) => screen.annotations.length > 0)
    .slice(0, 6)
    .map((screen, index) =>
      [
        `### ${index + 1}. ${screen.deviceId} ${screen.route}`,
        "",
        `URL: ${screen.url}`,
        `Viewport: ${screen.width}x${screen.height}`,
        `Captured: ${screen.capturedAt}`,
        "",
        "Captured regions:",
        ...screen.annotations.slice(0, 5).map((annotation) => `- ${annotationSummary(annotation)}${annotation.evidence ? `; evidence: ${annotation.evidence}` : ""}`),
      ].join("\n"),
    )
    .join("\n\n");
}

export function formatOperationalBoundariesContext(): string {
  return [
    "Production credentials stay server-side; do not place API keys, service-role keys, payment credentials, or customer secrets in this queue.",
    "This markdown is a read-only implementation handoff. It does not submit forms, make purchases, alter billing, run migrations, or perform destructive actions.",
    "Production persistence requires configured workspace storage. If persistence is unavailable, generated reports are only available in the current running workspace session.",
    "After implementing a task, rerun validation and capture fresh evidence before treating the recommendation as resolved.",
  ].join("\n");
}

export type ImplementationQueueMarkdownOptions = {
  recommendations?: Recommendation[];
  scopeSummary?: string;
  selectedRelationshipFilterSummary?: string;
  selectedSourceFilterSummary?: string;
};

export function formatImplementationQueueMarkdown(report: Report, options: ImplementationQueueMarkdownOptions = {}): string {
  const recommendations = options.recommendations ?? report.recommendations;
  const tasks = recommendations.map((recommendation, index) => {
    const workItem = getRecommendationWorkItem(recommendation);
    const screenEvidenceReferences = screenEvidenceForRecommendation(report, recommendation).map((screen) => screenSummary(screen));
    const relationshipReferences = getRecommendationRelationshipContext(report, recommendation).map(formatRecommendationRelationshipContextItem);
    const customerOwnedReferences = getRecommendationCustomerOwnedCredits(report, recommendation).map(formatRecommendationCustomerOwnedCreditItem);
    const sourceReferences = getRecommendationSourceReferences(report, recommendation).map(formatRecommendationSourceReferenceItem);
    return [
      `## Task ${index + 1}: ${workItem.exportTitle}`,
      "",
      formatRecommendationWorkItemTask(
        recommendation,
        workItem,
        screenEvidenceReferences,
        relationshipReferences,
        options.selectedRelationshipFilterSummary,
        customerOwnedReferences,
        sourceReferences,
        options.selectedSourceFilterSummary,
      ),
    ].join("\n");
  });
  const agentJudgmentContext = formatAgentJudgmentContext(report);
  const beforeAfterContext = formatBeforeAfterContext(report);
  const screenEvidenceContext = formatScreenEvidenceContext(report);

  return [
    `# Snoopy Implementation Queue: ${report.runId}`,
    "",
    report.summary,
    "",
    `Recommendation count: ${recommendations.length}`,
    `Finding count: ${report.findings.length}`,
    `Reaction count: ${report.reactions.length}`,
    ...(options.scopeSummary ? ["", "Queue scope:", options.scopeSummary] : []),
    "",
    "Use this queue as implementation work. Keep the agent judgment, evidence, and acceptance criteria attached to each task.",
    "",
    "## Operational Boundaries",
    "",
    formatOperationalBoundariesContext(),
    "",
    ...(agentJudgmentContext ? ["## Agent Judgment Context", "", agentJudgmentContext, ""] : []),
    ...(beforeAfterContext ? ["## Before/After Hypotheses", "", beforeAfterContext, ""] : []),
    ...(screenEvidenceContext ? ["## Screen Evidence", "", screenEvidenceContext, ""] : []),
    ...tasks,
  ].join("\n\n");
}

export function implementationQueueFilename(runId: string): string {
  const slug = runId
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `snoopy-${slug || "report"}-implementation-queue.md`;
}
