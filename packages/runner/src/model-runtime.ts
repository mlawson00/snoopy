import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText } from "ai";
import { PostHog } from "posthog-node";
import { z } from "zod";
import type { DeviceProfile, PersonaProfile, Reaction, ReferenceSource } from "@snoopy/reports";

const DEFAULT_GEMMA_MODEL = "gemma-4-31B-it-UD-Q4_K_XL.gguf";

const gemmaConfigSchema = z.object({
  baseURL: z.string().url(),
  apiKey: z.string().min(1),
  model: z.string().min(1),
});

const gemmaReactionSchema = z.object({
  emotion: z.enum(["curious", "confident", "confused", "skeptical", "frustrated", "delighted"]),
  thought: z.string().min(12).max(900),
  evidence: z.string().min(12).max(1_200),
  critiqueAxis: z.string().min(2).max(80),
});

type VisitForPrompt = {
  title: string;
  url: string;
  text: string;
  linkCount: number;
  formCount: number;
  visualMetrics: {
    headingCount: number;
    interactiveCount: number;
    imageCount: number;
    smallTextCount: number;
    lowContrastTextCount: number;
    unlabeledControlCount: number;
    longLineCount: number;
    landmarkCount: number;
  };
};

type GenerateGemmaReactionInput = {
  seedReaction: Reaction;
  persona: PersonaProfile;
  device: DeviceProfile;
  visit: VisitForPrompt;
  referenceSources: ReferenceSource[];
  currentRunReactions: Reaction[];
  analyticsDistinctId?: string;
  cycleId?: string;
  runId: string;
};

type AnalyticsProperties = Record<string, unknown>;

let posthog: PostHog | null | undefined;

function gemmaConfig(env: NodeJS.ProcessEnv = process.env) {
  if (env.SNOOPY_DISABLE_GEMMA === "1" || env.SNOOPY_DISABLE_GEMMA === "true") return null;

  const parsed = gemmaConfigSchema.safeParse({
    baseURL: env.GEMMA_OPENAI_BASE_URL,
    apiKey: env.GEMMA_OPENAI_API_KEY,
    model: env.GEMMA_OPENAI_MODEL || DEFAULT_GEMMA_MODEL,
  });
  return parsed.success ? parsed.data : null;
}

function posthogClient() {
  if (posthog !== undefined) return posthog;

  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  if (!token || !host) {
    posthog = null;
    return posthog;
  }

  posthog = new PostHog(token, { host });
  return posthog;
}

export function captureRunnerEvent(distinctId: string | undefined, event: string, properties: AnalyticsProperties = {}) {
  const client = posthogClient();
  if (!client) return;
  client.capture({
    distinctId: distinctId || "snoopy-runner",
    event,
    properties,
  });
}

export async function flushRunnerAnalytics() {
  const client = posthogClient();
  if (!client) return;
  await client.flush();
}

function promptForReaction(input: GenerateGemmaReactionInput) {
  const persona = input.persona;
  const priorReactions = input.currentRunReactions
    .slice(-6)
    .map((reaction) => `${reaction.personaId} (${reaction.critiqueAxis ?? "general"}): ${reaction.thought}`)
    .join("\n");
  const sources = input.referenceSources.map((source) => `${source.kind}: ${source.title} - ${source.summary.slice(0, 240)}`).join("\n");

  return [
    "You are one Snoopy website-evaluator agent. Rewrite the seeded reaction into your own evidence-based opinion.",
    "Return only JSON. Do not include markdown or commentary.",
    "JSON shape: {\"emotion\":\"curious|confident|confused|skeptical|frustrated|delighted\",\"thought\":\"first-person reaction\",\"evidence\":\"concrete observed evidence\",\"critiqueAxis\":\"short axis\"}",
    "",
    "Rules:",
    "- Stay grounded in the captured website evidence. Do not invent pages, clicks, prices, or screenshots.",
    "- Speak in first person as the agent.",
    "- If prior agents are available, you may support, extend, or push back on them.",
    "- Keep the thought to one or two vivid sentences.",
    "- Evidence should mention specific text, metrics, forms, visual issues, or supplied sources.",
    "- Preserve the seeded reaction's broad stance unless the website evidence clearly supports a better read.",
    "",
    `Agent: ${persona.name}`,
    `Role: ${persona.role}`,
    `Goal: ${persona.goal}`,
    `Backstory: ${persona.backstory}`,
    `Skepticism: ${persona.skepticism}`,
    `Tastes: ${(persona.tastes ?? []).join(", ")}`,
    `Critique lenses: ${(persona.critiqueLens ?? []).join(", ")}`,
    `Device: ${input.device.label} (${input.device.kind})`,
    `Route: ${input.visit.url}`,
    `Title: ${input.visit.title || "untitled"}`,
    `Visible text excerpt: ${input.visit.text.slice(0, 2_500)}`,
    `Metrics: ${JSON.stringify(input.visit.visualMetrics)}`,
    `Links: ${input.visit.linkCount}; forms: ${input.visit.formCount}`,
    sources ? `Reference sources:\n${sources}` : "Reference sources: none",
    priorReactions ? `Prior reactions this run:\n${priorReactions}` : "Prior reactions this run: none",
    `Seed reaction: ${JSON.stringify(input.seedReaction)}`,
  ].join("\n");
}

function extractJsonObject(text: string) {
  const withoutFence = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Gemma returned no JSON object.");
  }
  return withoutFence.slice(start, end + 1);
}

export async function generateGemmaReaction(input: GenerateGemmaReactionInput): Promise<Reaction> {
  const config = gemmaConfig();
  if (!config) return input.seedReaction;

  const provider = createOpenAICompatible({
    name: "gemma-local",
    apiKey: config.apiKey,
    baseURL: config.baseURL,
  });
  const prompt = promptForReaction(input);
  const startedAt = Date.now();
  const distinctId = input.analyticsDistinctId || "snoopy-runner";

  try {
    const result = await generateText({
      model: provider.chatModel(config.model),
      system: "You are a Snoopy website-evaluator agent. Return only the requested JSON object.",
      prompt,
      temperature: 0.45,
      maxOutputTokens: 420,
      experimental_telemetry: {
        isEnabled: true,
        functionId: "snoopy.runner.reaction",
        metadata: {
          posthog_distinct_id: distinctId,
          run_id: input.runId,
          persona_id: input.persona.id,
          route: input.visit.url,
        },
      },
    });
    const latencyMs = Date.now() - startedAt;
    const parsed = gemmaReactionSchema.parse(JSON.parse(extractJsonObject(result.text)));

    captureRunnerEvent(distinctId, "$ai_generation", {
      $ai_provider: "gemma-local",
      $ai_model: config.model,
      $ai_latency: latencyMs / 1_000,
      $ai_input_tokens: result.usage.inputTokens,
      $ai_output_tokens: result.usage.outputTokens,
      $ai_input: [{ role: "user", content: prompt.slice(0, 4_000) }],
      $ai_output_choices: [{ role: "assistant", content: result.text.slice(0, 4_000) }],
      operation: "agent_reaction",
      generation_status: "success",
      finish_reason: result.finishReason,
      run_id: input.runId,
      cycle_id: input.cycleId,
      persona_id: input.persona.id,
      agent_type: input.persona.customerOwned ? "customer_owned" : "core",
      route: input.visit.url,
      device: input.device.id,
      prompt_truncated: prompt.length > 4_000,
      output_truncated: result.text.length > 4_000,
    });
    captureRunnerEvent(distinctId, "snoopy_model_call_completed", {
      operation: "agent_reaction",
      model: config.model,
      provider: "gemma-local",
      latency_ms: latencyMs,
      input_tokens: result.usage.inputTokens,
      output_tokens: result.usage.outputTokens,
      generation_status: "success",
      run_id: input.runId,
      cycle_id: input.cycleId,
      persona_id: input.persona.id,
      agent_type: input.persona.customerOwned ? "customer_owned" : "core",
      route: input.visit.url,
      device: input.device.id,
      stance: input.seedReaction.stance,
      critique_axis: parsed.critiqueAxis,
      emotion: parsed.emotion,
      finish_reason: result.finishReason,
    });

    return {
      ...input.seedReaction,
      emotion: parsed.emotion,
      thought: parsed.thought,
      evidence: parsed.evidence,
      critiqueAxis: parsed.critiqueAxis,
    };
  } catch (error) {
    captureRunnerEvent(distinctId, "snoopy_model_call_failed", {
      operation: "agent_reaction",
      model: config.model,
      provider: "gemma-local",
      latency_ms: Date.now() - startedAt,
      generation_status: "error",
      fallback_reason: error instanceof Error ? error.message : "Unknown model error.",
      error_type: error instanceof Error ? error.name : "UnknownError",
      run_id: input.runId,
      cycle_id: input.cycleId,
      persona_id: input.persona.id,
      agent_type: input.persona.customerOwned ? "customer_owned" : "core",
      route: input.visit.url,
      device: input.device.id,
    });
    return input.seedReaction;
  }
}
