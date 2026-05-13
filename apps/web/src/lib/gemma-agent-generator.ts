import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText } from "ai";
import { z } from "zod";
import { captureServerEvent } from "./server-analytics";
import { generatedAgentSchema, type GenerateAgentRequest, type GeneratedAgent } from "./agent-generator";

const DEFAULT_GEMMA_MODEL = "gemma-4-31B-it-UD-Q4_K_XL.gguf";

const gemmaConfigSchema = z.object({
  baseURL: z.string().url(),
  apiKey: z.string().min(1),
  model: z.string().min(1),
});

type GemmaGenerationMetadata = {
  distinctId: string;
  operation: "agent_generation";
  cycleId?: string;
  customerName?: string;
  tone?: string;
};

function gemmaConfig(env: NodeJS.ProcessEnv = process.env) {
  if (env.SNOOPY_DISABLE_GEMMA === "1" || env.SNOOPY_DISABLE_GEMMA === "true") return null;

  const parsed = gemmaConfigSchema.safeParse({
    baseURL: env.GEMMA_OPENAI_BASE_URL,
    apiKey: env.GEMMA_OPENAI_API_KEY,
    model: env.GEMMA_OPENAI_MODEL || DEFAULT_GEMMA_MODEL,
  });
  return parsed.success ? parsed.data : null;
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

function promptForAgent(input: GenerateAgentRequest) {
  return [
    "Create one Snoopy website-review agent as a durable customer-owned character.",
    "Return only valid JSON. Do not wrap it in markdown. Do not include commentary.",
    "The JSON must match this TypeScript-shaped contract:",
    JSON.stringify({
      id: "custom-short-slug",
      name: "Agent name",
      role: "Customer-owned role",
      face: "1-4 character initials or symbol",
      voice: "Brief human voice label",
      goal: "How this agent evaluates websites",
      backstory: "Specific, person-like history",
      memories: ["2-5 specific memories"],
      tastes: ["3-6 tastes"],
      blindSpots: ["2-5 blind spots"],
      motivations: ["2-5 motivations"],
      likes: ["2-5 likes"],
      deviceHabits: ["1-4 device habits"],
      skepticism: "What they distrust",
      critiqueLens: ["3-7 critique lenses"],
      voiceSettings: { style: input.tone, profanityLevel: "none | mild | moderate" },
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
      dayPlan: ["2-5 recurring activities"],
      sourceDiet: ["2-6 source types"],
      customerRelationship: "Private recurring reviewer relationship",
      privateExclusive: input.customerOwned,
      customerOwned: input.customerOwned,
    }),
    "Rules:",
    "- Make the agent feel like a believable person with stable taste, not a generic prompt.",
    "- They should be able to form opinions, argue constructively, revise their view, and evaluate websites from evidence.",
    "- Use the requested voice style, but do not make aggression the product.",
    "- Keep arrays within the requested sizes.",
    "- Use numbers from 0 to 1 for every personality facet.",
    "",
    `Customer: ${input.customerName || "workspace"}`,
    `Tone: ${input.tone}`,
    `Customer-owned: ${input.customerOwned}`,
    `Brief: ${input.brief}`,
  ].join("\n");
}

export async function generateAgentWithGemma(input: GenerateAgentRequest, metadata: GemmaGenerationMetadata): Promise<GeneratedAgent> {
  const config = gemmaConfig();
  if (!config) {
    throw new Error("Set GEMMA_OPENAI_BASE_URL and GEMMA_OPENAI_API_KEY to enable Gemma agent generation.");
  }

  const provider = createOpenAICompatible({
    name: "gemma-local",
    apiKey: config.apiKey,
    baseURL: config.baseURL,
  });
  const prompt = promptForAgent(input);
  const startedAt = Date.now();

  try {
    const result = await generateText({
      model: provider.chatModel(config.model),
      system: "You create structured Snoopy website-review agents. Return only valid JSON with no prose.",
      prompt,
      temperature: 0.35,
      maxOutputTokens: 1_600,
      experimental_telemetry: {
        isEnabled: true,
        functionId: "snoopy.agent.generate",
        metadata: {
          posthog_distinct_id: metadata.distinctId,
          operation: metadata.operation,
          ...(metadata.cycleId ? { cycle_id: metadata.cycleId } : {}),
        },
      },
    });
    const latencyMs = Date.now() - startedAt;

    captureServerEvent(metadata.distinctId, "$ai_generation", {
      $ai_provider: "gemma-local",
      $ai_model: config.model,
      $ai_latency: latencyMs / 1_000,
      $ai_input_tokens: result.usage.inputTokens,
      $ai_output_tokens: result.usage.outputTokens,
      $ai_input: [{ role: "user", content: prompt.slice(0, 4_000) }],
      $ai_output_choices: [{ role: "assistant", content: result.text.slice(0, 4_000) }],
      operation: metadata.operation,
      cycle_id: metadata.cycleId,
      generation_status: "success",
      finish_reason: result.finishReason,
      prompt_truncated: prompt.length > 4_000,
      output_truncated: result.text.length > 4_000,
    });

    captureServerEvent(metadata.distinctId, "snoopy_model_call_completed", {
      operation: metadata.operation,
      cycle_id: metadata.cycleId,
      model: config.model,
      provider: "gemma-local",
      latency_ms: latencyMs,
      input_tokens: result.usage.inputTokens,
      output_tokens: result.usage.outputTokens,
      generation_status: "success",
      finish_reason: result.finishReason,
      customer_name: metadata.customerName,
      tone: metadata.tone,
    });

    return generatedAgentSchema.parse(JSON.parse(extractJsonObject(result.text)));
  } catch (error) {
    captureServerEvent(metadata.distinctId, "snoopy_model_call_failed", {
      operation: metadata.operation,
      cycle_id: metadata.cycleId,
      model: config.model,
      provider: "gemma-local",
      latency_ms: Date.now() - startedAt,
      generation_status: "error",
      error_type: error instanceof Error ? error.name : "UnknownError",
      error_message: error instanceof Error ? error.message : "Unknown model error.",
      customer_name: metadata.customerName,
      tone: metadata.tone,
    });
    throw error;
  }
}
