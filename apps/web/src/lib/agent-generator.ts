import { z } from "zod";

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

export const generatedAgentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.string().min(1),
  face: z.string().min(1).max(4),
  voice: z.string().min(1),
  goal: z.string().min(1),
  backstory: z.string().min(1),
  memories: z.array(z.string().min(1)).min(2).max(5),
  tastes: z.array(z.string().min(1)).min(3).max(6),
  blindSpots: z.array(z.string().min(1)).min(2).max(5).default(["May over-index on the original brief.", "Needs another agent to challenge favorite patterns."]),
  motivations: z.array(z.string().min(1)).min(2).max(5),
  likes: z.array(z.string().min(1)).min(2).max(5),
  deviceHabits: z.array(z.string().min(1)).min(1).max(4),
  skepticism: z.string().min(1),
  critiqueLens: z.array(z.string().min(1)).min(3).max(7),
  voiceSettings: z.object({
    style: z.enum(["professional", "plainspoken", "blunt", "warm", "skeptical", "visual"]),
    profanityLevel: z.enum(["none", "mild", "moderate"]),
  }),
  personalityFacets: personalityFacetWeightsSchema.default({
    introversion: 0.5,
    extraversion: 0.5,
    sensing: 0.5,
    intuition: 0.5,
    thinking: 0.5,
    feeling: 0.5,
    judging: 0.5,
    perceiving: 0.5,
  }),
  dayPlan: z.array(z.string().min(1)).min(2).max(5),
  sourceDiet: z.array(z.string().min(1)).min(2).max(6),
  customerRelationship: z.string().min(1).default("Private customer-owned reviewer for this workspace."),
  privateExclusive: z.boolean().default(true),
  customerOwned: z.boolean(),
});

export type GeneratedAgent = z.infer<typeof generatedAgentSchema>;

export const generateAgentRequestSchema = z.object({
  brief: z.string().trim().min(10).max(1_200),
  customerName: z.string().trim().max(80).optional(),
  tone: z.enum(["professional", "plainspoken", "blunt", "warm", "skeptical", "visual"]).default("plainspoken"),
  customerOwned: z.boolean().default(true),
  mode: z.enum(["auto", "deterministic"]).default("auto"),
});

export type GenerateAgentRequest = z.infer<typeof generateAgentRequestSchema>;

const schemaForOpenAi = {
  name: "generated_snoopy_agent",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "id",
      "name",
      "role",
      "face",
      "voice",
      "goal",
      "backstory",
      "memories",
      "tastes",
      "blindSpots",
      "motivations",
      "likes",
      "deviceHabits",
      "skepticism",
      "critiqueLens",
      "voiceSettings",
      "personalityFacets",
      "dayPlan",
      "sourceDiet",
      "customerRelationship",
      "privateExclusive",
      "customerOwned",
    ],
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      role: { type: "string" },
      face: { type: "string" },
      voice: { type: "string" },
      goal: { type: "string" },
      backstory: { type: "string" },
      memories: { type: "array", minItems: 2, maxItems: 5, items: { type: "string" } },
      tastes: { type: "array", minItems: 3, maxItems: 6, items: { type: "string" } },
      blindSpots: { type: "array", minItems: 2, maxItems: 5, items: { type: "string" } },
      motivations: { type: "array", minItems: 2, maxItems: 5, items: { type: "string" } },
      likes: { type: "array", minItems: 2, maxItems: 5, items: { type: "string" } },
      deviceHabits: { type: "array", minItems: 1, maxItems: 4, items: { type: "string" } },
      skepticism: { type: "string" },
      critiqueLens: { type: "array", minItems: 3, maxItems: 7, items: { type: "string" } },
      voiceSettings: {
        type: "object",
        additionalProperties: false,
        required: ["style", "profanityLevel"],
        properties: {
          style: { type: "string", enum: ["professional", "plainspoken", "blunt", "warm", "skeptical", "visual"] },
          profanityLevel: { type: "string", enum: ["none", "mild", "moderate"] },
        },
      },
      personalityFacets: {
        type: "object",
        additionalProperties: false,
        required: ["introversion", "extraversion", "sensing", "intuition", "thinking", "feeling", "judging", "perceiving"],
        properties: {
          introversion: { type: "number", minimum: 0, maximum: 1 },
          extraversion: { type: "number", minimum: 0, maximum: 1 },
          sensing: { type: "number", minimum: 0, maximum: 1 },
          intuition: { type: "number", minimum: 0, maximum: 1 },
          thinking: { type: "number", minimum: 0, maximum: 1 },
          feeling: { type: "number", minimum: 0, maximum: 1 },
          judging: { type: "number", minimum: 0, maximum: 1 },
          perceiving: { type: "number", minimum: 0, maximum: 1 },
        },
      },
      dayPlan: { type: "array", minItems: 2, maxItems: 5, items: { type: "string" } },
      sourceDiet: { type: "array", minItems: 2, maxItems: 6, items: { type: "string" } },
      customerRelationship: { type: "string" },
      privateExclusive: { type: "boolean" },
      customerOwned: { type: "boolean" },
    },
  },
} as const;

export function generateDeterministicAgent(input: GenerateAgentRequest): GeneratedAgent {
  const keywords = extractKeywords(input.brief);
  const role = roleFromBrief(input.brief, keywords);
  const name = nameFromBrief(input.brief, keywords);
  const face = initials(name);
  const primaryTaste = keywords[0] ?? "commercial clarity";
  const secondTaste = keywords[1] ?? "specific evidence";
  const thirdTaste = keywords[2] ?? "visible improvement";

  return {
    id: `custom-${slugify(name)}`,
    name,
    role,
    face,
    voice: voiceLabel(input.tone),
    goal: `Review websites for ${primaryTaste}, ${secondTaste}, and whether the page becomes easier to improve after the run.`,
    backstory: `${name} was generated for ${input.customerName || "this workspace"} from the brief: "${input.brief.slice(0, 180)}${input.brief.length > 180 ? "..." : ""}" They are designed to be a recurring character with stable taste, not a one-off prompt.`,
    memories: [
      `Remembers prior runs where ${primaryTaste} was missed or buried.`,
      `Keeps a running opinion about whether the site is becoming more useful after each critique cycle.`,
      `Compares new pages against the customer's own taste profile before agreeing with the core cast.`,
    ],
    tastes: uniqueList([primaryTaste, secondTaste, thirdTaste, "clear evidence", "constructive disagreement", "before/after progress"]).slice(0, 6),
    blindSpots: [
      `May over-protect ${primaryTaste} when a broader buyer need matters more.`,
      "Can mistake familiar customer taste for proof that a new visitor understands the page.",
      "Needs another agent to challenge whether the recommendation is commercially urgent.",
    ],
    motivations: ["Protect the customer's point of view", "Find issues the core cast might miss", "Turn critique into useful next work"],
    likes: ["Specific evidence", "Visible product examples", "Agents who explain why they agree or disagree"],
    deviceHabits: ["Checks the first impression on mobile", "Reviews evidence and recommendations on desktop"],
    skepticism: `Distrusts generic praise, generic criticism, and any agent consensus that does not explain ${primaryTaste}.`,
    critiqueLens: uniqueList([primaryTaste, secondTaste, thirdTaste, "customer-specific taste", "agent disagreement", "commercial usefulness"]).slice(0, 7),
    voiceSettings: {
      style: input.tone,
      profanityLevel: input.tone === "blunt" ? "mild" : "none",
    },
    personalityFacets: facetWeightsFor(input.tone, input.brief),
    dayPlan: [
      "Read the latest saved reports and update their opinion of the customer's site.",
      "Compare one competitor or reference page before the next run when sources are supplied.",
      "Respond to at least one other agent instead of producing a standalone verdict.",
      "Leave one recommendation another agent or human can act on.",
    ],
    sourceDiet: ["Customer site history", "Prior Snoopy reports", "Competitor pages supplied by the user", "Current market notes supplied for the run"],
    customerRelationship: `Private recurring reviewer for ${input.customerName || "this workspace"} who protects the customer's taste, history, and commercial priorities.`,
    privateExclusive: input.customerOwned,
    customerOwned: input.customerOwned,
  };
}

function facetWeightsFor(tone: GenerateAgentRequest["tone"], brief: string) {
  const lower = brief.toLowerCase();
  const visualOrBrand = lower.includes("visual") || lower.includes("brand") || lower.includes("design");
  const financeOrProof = lower.includes("finance") || lower.includes("cfo") || lower.includes("proof") || lower.includes("security");
  const accessibility = lower.includes("access") || lower.includes("read") || lower.includes("vision");

  if (tone === "blunt") {
    return { introversion: 0.24, extraversion: 0.76, sensing: 0.34, intuition: 0.66, thinking: 0.86, feeling: 0.14, judging: 0.72, perceiving: 0.28 };
  }
  if (tone === "warm") {
    return { introversion: 0.48, extraversion: 0.52, sensing: 0.42, intuition: 0.58, thinking: 0.28, feeling: 0.72, judging: 0.44, perceiving: 0.56 };
  }
  if (tone === "visual" || visualOrBrand) {
    return { introversion: 0.56, extraversion: 0.44, sensing: 0.3, intuition: 0.7, thinking: 0.34, feeling: 0.66, judging: 0.32, perceiving: 0.68 };
  }
  if (tone === "skeptical" || financeOrProof) {
    return { introversion: 0.68, extraversion: 0.32, sensing: 0.7, intuition: 0.3, thinking: 0.82, feeling: 0.18, judging: 0.78, perceiving: 0.22 };
  }
  if (accessibility) {
    return { introversion: 0.64, extraversion: 0.36, sensing: 0.74, intuition: 0.26, thinking: 0.4, feeling: 0.6, judging: 0.82, perceiving: 0.18 };
  }
  if (tone === "professional") {
    return { introversion: 0.58, extraversion: 0.42, sensing: 0.68, intuition: 0.32, thinking: 0.72, feeling: 0.28, judging: 0.76, perceiving: 0.24 };
  }
  return { introversion: 0.46, extraversion: 0.54, sensing: 0.62, intuition: 0.38, thinking: 0.58, feeling: 0.42, judging: 0.66, perceiving: 0.34 };
}

export async function generateAgentWithOpenAi(input: GenerateAgentRequest, apiKey: string): Promise<GeneratedAgent> {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_AGENT_GENERATOR_MODEL ?? "gpt-5.4-mini",
      instructions:
        "Create one Snoopy website-review agent as a durable character. The agent should be useful, constructive, distinct, and commercially credible. Avoid making them generically aggressive. Return only valid JSON matching the schema.",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Customer: ${input.customerName || "workspace"}\nTone: ${input.tone}\nCustomer-owned: ${input.customerOwned}\nBrief: ${input.brief}`,
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          ...schemaForOpenAi,
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI agent generation failed: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as { output_text?: string; output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
  const text = payload.output_text ?? payload.output?.flatMap((item) => item.content ?? []).find((content) => content.type === "output_text")?.text;
  if (!text) {
    throw new Error("OpenAI agent generation returned no output text.");
  }

  return generatedAgentSchema.parse(JSON.parse(text));
}

function extractKeywords(brief: string): string[] {
  const cleaned = brief
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !STOP_WORDS.has(word));

  return uniqueList(cleaned).slice(0, 5).map((word) => word.replace(/-/g, " "));
}

function roleFromBrief(brief: string, keywords: string[]) {
  const lower = brief.toLowerCase();
  if (lower.includes("brand")) return "Customer-owned brand guardian";
  if (lower.includes("finance") || lower.includes("cfo")) return "Customer-owned finance skeptic";
  if (lower.includes("access") || lower.includes("read")) return "Customer-owned accessibility reviewer";
  if (lower.includes("competitor") || lower.includes("market")) return "Customer-owned market watcher";
  return `Customer-owned ${keywords[0] ?? "website"} reviewer`;
}

function nameFromBrief(brief: string, keywords: string[]) {
  const explicit = brief.match(/\bcalled\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/) ?? brief.match(/\bnamed\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/);
  if (explicit?.[1]) return explicit[1];
  const seed = (keywords[0] ?? "custom").charCodeAt(0);
  return ["Ari", "Bea", "Cato", "Dee", "Eli", "Fran", "Gia", "Hale"][seed % 8] ?? "Ari";
}

function voiceLabel(tone: GenerateAgentRequest["tone"]) {
  const labels = {
    professional: "Measured, precise, and evidence-led",
    plainspoken: "Plainspoken, constructive, and direct",
    blunt: "Blunt, concise, and still useful",
    warm: "Warm, encouraging, and specific",
    skeptical: "Skeptical, patient, and proof-hungry",
    visual: "Visual, taste-led, and detail-aware",
  };
  return labels[tone];
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "agent";
}

function uniqueList(items: string[]) {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
}

const STOP_WORDS = new Set([
  "about",
  "after",
  "agent",
  "agents",
  "because",
  "before",
  "could",
  "customer",
  "different",
  "should",
  "their",
  "there",
  "these",
  "thing",
  "things",
  "website",
  "would",
]);
