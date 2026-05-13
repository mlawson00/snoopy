import { NextResponse } from "next/server";
import { generateAgentRequestSchema, generateDeterministicAgent } from "@/lib/agent-generator";
import { generateAgentWithGemma } from "@/lib/gemma-agent-generator";
import { captureServerEvent, distinctIdFromRequest, flushServerAnalytics, posthogSessionIdFromRequest } from "@/lib/server-analytics";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = generateAgentRequestSchema.safeParse(body);
  const distinctId = distinctIdFromRequest(request);
  const posthogSessionId = posthogSessionIdFromRequest(request);
  const cycleId = typeof body.cycleId === "string" && body.cycleId.trim() ? body.cycleId.trim() : undefined;

  if (!parsed.success) {
    captureServerEvent(distinctId, "snoopy_agent_generation_rejected", {
      cycle_id: cycleId,
      reason: "invalid_request",
      posthog_session_id: posthogSessionId,
    });
    await flushServerAnalytics();
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  captureServerEvent(distinctId, "snoopy_agent_generation_requested", {
    cycle_id: cycleId,
    customer_name: parsed.data.customerName,
    tone: parsed.data.tone,
    customer_owned: parsed.data.customerOwned,
    mode: parsed.data.mode,
    brief_length: parsed.data.brief.length,
    posthog_session_id: posthogSessionId,
  });

  if (parsed.data.mode === "deterministic") {
    const agent = generateDeterministicAgent(parsed.data);
    captureServerEvent(distinctId, "snoopy_agent_generation_completed", {
      cycle_id: cycleId,
      generation_status: "deterministic",
      reason: "Deterministic generation requested.",
      agent_id: agent.id,
      customer_name: parsed.data.customerName,
      tone: parsed.data.tone,
      posthog_session_id: posthogSessionId,
    });
    await flushServerAnalytics();
    return NextResponse.json({
      agent,
      generation: {
        status: "deterministic",
        reason: "Deterministic generation requested.",
      },
    });
  }

  try {
    const agent = await generateAgentWithGemma(parsed.data, {
      distinctId,
      operation: "agent_generation",
      cycleId,
      customerName: parsed.data.customerName,
      tone: parsed.data.tone,
    });
    captureServerEvent(distinctId, "snoopy_agent_generation_completed", {
      cycle_id: cycleId,
      generation_status: "llm",
      model: process.env.GEMMA_OPENAI_MODEL,
      provider: "gemma-local",
      agent_id: agent.id,
      customer_name: parsed.data.customerName,
      tone: parsed.data.tone,
      posthog_session_id: posthogSessionId,
    });
    await flushServerAnalytics();
    return NextResponse.json({ agent, generation: { status: "llm" } });
  } catch (error) {
    const agent = generateDeterministicAgent(parsed.data);
    const reason = error instanceof Error ? error.message : "Gemma generation failed.";
    captureServerEvent(distinctId, "snoopy_agent_generation_completed", {
      cycle_id: cycleId,
      generation_status: "fallback",
      fallback_reason: reason,
      agent_id: agent.id,
      customer_name: parsed.data.customerName,
      tone: parsed.data.tone,
      posthog_session_id: posthogSessionId,
    });
    await flushServerAnalytics();
    return NextResponse.json({
      agent,
      generation: {
        status: "fallback",
        reason,
      },
    });
  }
}
