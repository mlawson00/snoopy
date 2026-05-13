import type { PersonaProfile } from "@snoopy/reports";

export type PersonalityFacets = NonNullable<PersonaProfile["personalityFacets"]>;

export type PersonalityCoveragePersona = {
  id: string;
  name: string;
  personalityFacets?: PersonaProfile["personalityFacets"];
  customerOwned?: boolean;
};

export type PersonalityCoverageCandidate = PersonalityCoveragePersona & {
  source?: "saved" | "generated";
  role?: string;
};

export type SuggestedAgentTone = "professional" | "plainspoken" | "blunt" | "warm" | "skeptical" | "visual";

export type PersonalityActionSuggestion = {
  id: string;
  title: string;
  detail: string;
  source: "saved" | "generated";
  generatorBrief?: string;
  generatorTone?: SuggestedAgentTone;
};

type AxisDefinition = {
  id: string;
  leftKey: keyof PersonalityFacets;
  rightKey: keyof PersonalityFacets;
  leftLabel: string;
  rightLabel: string;
  leftName: string;
  rightName: string;
};

export const PERSONALITY_AXES: AxisDefinition[] = [
  { id: "ie", leftKey: "introversion", rightKey: "extraversion", leftLabel: "I", rightLabel: "E", leftName: "Introversion", rightName: "Extraversion" },
  { id: "sn", leftKey: "sensing", rightKey: "intuition", leftLabel: "S", rightLabel: "N", leftName: "Sensing", rightName: "Intuition" },
  { id: "tf", leftKey: "thinking", rightKey: "feeling", leftLabel: "T", rightLabel: "F", leftName: "Thinking", rightName: "Feeling" },
  { id: "jp", leftKey: "judging", rightKey: "perceiving", leftLabel: "J", rightLabel: "P", leftName: "Judging", rightName: "Perceiving" },
];

export const CORE_CAST_PERSONALITY: PersonalityCoveragePersona[] = [
  {
    id: "maya",
    name: "Maya",
    personalityFacets: { introversion: 0.25, extraversion: 0.75, sensing: 0.82, intuition: 0.18, thinking: 0.72, feeling: 0.28, judging: 0.86, perceiving: 0.14 },
  },
  {
    id: "leo",
    name: "Leo",
    personalityFacets: { introversion: 0.68, extraversion: 0.32, sensing: 0.34, intuition: 0.66, thinking: 0.25, feeling: 0.75, judging: 0.22, perceiving: 0.78 },
  },
  {
    id: "ivy",
    name: "Ivy",
    personalityFacets: { introversion: 0.64, extraversion: 0.36, sensing: 0.7, intuition: 0.3, thinking: 0.34, feeling: 0.66, judging: 0.8, perceiving: 0.2 },
  },
  {
    id: "nora",
    name: "Nora",
    personalityFacets: { introversion: 0.72, extraversion: 0.28, sensing: 0.26, intuition: 0.74, thinking: 0.88, feeling: 0.12, judging: 0.84, perceiving: 0.16 },
  },
  {
    id: "omar",
    name: "Omar",
    personalityFacets: { introversion: 0.18, extraversion: 0.82, sensing: 0.78, intuition: 0.22, thinking: 0.64, feeling: 0.36, judging: 0.36, perceiving: 0.64 },
  },
  {
    id: "quinn",
    name: "Quinn",
    personalityFacets: { introversion: 0.42, extraversion: 0.58, sensing: 0.18, intuition: 0.82, thinking: 0.82, feeling: 0.18, judging: 0.26, perceiving: 0.74 },
  },
  {
    id: "mike-the-creator",
    name: "MIKE",
    personalityFacets: { introversion: 0.28, extraversion: 0.72, sensing: 0.22, intuition: 0.78, thinking: 0.9, feeling: 0.1, judging: 0.7, perceiving: 0.3 },
  },
];

const CORE_FACETS_BY_ID = new Map(CORE_CAST_PERSONALITY.map((persona) => [persona.id, persona.personalityFacets]));

const FALLBACK_FACETS: PersonalityFacets = {
  introversion: 0.5,
  extraversion: 0.5,
  sensing: 0.5,
  intuition: 0.5,
  thinking: 0.5,
  feeling: 0.5,
  judging: 0.5,
  perceiving: 0.5,
};

export function completePersonalityFacets(persona: PersonalityCoveragePersona): PersonalityFacets {
  const facets = persona.personalityFacets ?? CORE_FACETS_BY_ID.get(persona.id) ?? FALLBACK_FACETS;
  return {
    introversion: facets.introversion ?? FALLBACK_FACETS.introversion,
    extraversion: facets.extraversion ?? FALLBACK_FACETS.extraversion,
    sensing: facets.sensing ?? FALLBACK_FACETS.sensing,
    intuition: facets.intuition ?? FALLBACK_FACETS.intuition,
    thinking: facets.thinking ?? FALLBACK_FACETS.thinking,
    feeling: facets.feeling ?? FALLBACK_FACETS.feeling,
    judging: facets.judging ?? FALLBACK_FACETS.judging,
    perceiving: facets.perceiving ?? FALLBACK_FACETS.perceiving,
  };
}

export function buildPersonalityCoverage(personas: PersonalityCoveragePersona[], candidates: PersonalityCoverageCandidate[] = []) {
  const hydrated = personas.map((persona) => ({ ...persona, personalityFacets: completePersonalityFacets(persona) }));
  const axisSummaries = PERSONALITY_AXES.map((axis) => {
    const leftMax = Math.max(...hydrated.map((persona) => persona.personalityFacets[axis.leftKey]), 0);
    const rightMax = Math.max(...hydrated.map((persona) => persona.personalityFacets[axis.rightKey]), 0);
    const leftAverage = average(hydrated.map((persona) => persona.personalityFacets[axis.leftKey]));
    const rightAverage = average(hydrated.map((persona) => persona.personalityFacets[axis.rightKey]));
    const leftLead = hydrated.toSorted((a, b) => b.personalityFacets[axis.leftKey] - a.personalityFacets[axis.leftKey])[0];
    const rightLead = hydrated.toSorted((a, b) => b.personalityFacets[axis.rightKey] - a.personalityFacets[axis.rightKey])[0];
    const covered = leftMax >= 0.6 && rightMax >= 0.6;
    const dominantLabel = Math.abs(leftAverage - rightAverage) < 0.08 ? "balanced" : leftAverage > rightAverage ? axis.leftName.toLowerCase() : axis.rightName.toLowerCase();

    return {
      ...axis,
      leftAverage,
      rightAverage,
      leftMax,
      rightMax,
      covered,
      dominantLabel,
      leftLead: leftLead?.name ?? axis.leftName,
      rightLead: rightLead?.name ?? axis.rightName,
    };
  });

  const coveredAxisCount = axisSummaries.filter((axis) => axis.covered).length;
  const customerOwnedCount = hydrated.filter((persona) => persona.customerOwned).length;
  const panelRisk = coveredAxisCount === PERSONALITY_AXES.length ? "low" : coveredAxisCount >= 2 ? "medium" : "high";
  const summary =
    coveredAxisCount === PERSONALITY_AXES.length
      ? "Full weighted coverage. The panel has people pulling from both sides of every facet axis."
      : `${coveredAxisCount} of ${PERSONALITY_AXES.length} axes covered. Add a sharper specialist before trusting consensus.`;
  const actionSuggestions = buildActionSuggestions(axisSummaries, candidates);

  return {
    personas: hydrated,
    personaCount: hydrated.length,
    customerOwnedCount,
    axisSummaries,
    coveredAxisCount,
    totalAxisCount: PERSONALITY_AXES.length,
    panelRisk,
    summary,
    actionSuggestions,
  };
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

type AxisSummary = ReturnType<typeof buildPersonalityCoverage>["axisSummaries"][number];

function buildActionSuggestions(axisSummaries: AxisSummary[], candidates: PersonalityCoverageCandidate[]): PersonalityActionSuggestion[] {
  const hydratedCandidates = candidates.map((candidate) => ({ ...candidate, personalityFacets: completePersonalityFacets(candidate) }));
  const suggestions: PersonalityActionSuggestion[] = [];

  for (const axis of axisSummaries) {
    if (axis.covered) continue;
    const weakSides = [
      { key: axis.leftKey, label: axis.leftName, max: axis.leftMax },
      { key: axis.rightKey, label: axis.rightName, max: axis.rightMax },
    ]
      .filter((side) => side.max < 0.6)
      .toSorted((a, b) => a.max - b.max);

    for (const side of weakSides) {
      const savedMatch = hydratedCandidates.toSorted((a, b) => b.personalityFacets[side.key] - a.personalityFacets[side.key])[0];
      if (savedMatch && savedMatch.personalityFacets[side.key] >= 0.6) {
        suggestions.push({
          id: `${axis.id}-${String(side.key)}-${savedMatch.id}`,
          title: `Add ${savedMatch.name}`,
          detail: `${savedMatch.name} strengthens ${side.label.toLowerCase()} on the ${axis.leftLabel}/${axis.rightLabel} axis.`,
          source: "saved",
        });
      } else {
        const generatorTone = toneForFacet(side.key);
        const generatorBrief = `Create a customer-owned ${side.label.toLowerCase()}-heavy website reviewer who scores above 0.70 on ${side.label.toLowerCase()}, challenges weak consensus, explains how their point of view differs from the existing panel, and leaves practical website-improvement work.`;
        suggestions.push({
          id: `${axis.id}-${String(side.key)}-generated`,
          title: `Add ${articleFor(side.label)} ${side.label.toLowerCase()}-heavy reviewer`,
          detail: `Generate a specialist who scores above 0.70 on ${side.label.toLowerCase()} and brings a clear reason to challenge consensus.`,
          source: "generated",
          generatorBrief,
          generatorTone,
        });
      }
    }
  }

  return suggestions.slice(0, 3);
}

function articleFor(word: string) {
  return /^[aeiou]/i.test(word) ? "an" : "a";
}

function toneForFacet(facet: keyof PersonalityFacets): SuggestedAgentTone {
  if (facet === "feeling") return "warm";
  if (facet === "intuition" || facet === "perceiving") return "visual";
  if (facet === "thinking" || facet === "extraversion") return "blunt";
  if (facet === "sensing" || facet === "judging") return "professional";
  return "skeptical";
}
