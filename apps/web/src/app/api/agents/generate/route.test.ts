import { beforeEach, describe, expect, it, vi } from "vitest";

const captureServerEvent = vi.fn();
const flushServerAnalytics = vi.fn();

vi.mock("@/lib/agent-generator", async () => {
  const { z } = await import("zod");
  return {
    generateAgentRequestSchema: z.object({
      brief: z.string().min(10),
      customerName: z.string().optional(),
      tone: z.enum(["professional", "plainspoken", "blunt", "warm", "skeptical", "visual"]).default("plainspoken"),
      customerOwned: z.boolean().default(true),
      mode: z.enum(["deterministic"]).optional(),
    }),
    generateDeterministicAgent: vi.fn((input) => ({
      id: "deterministic-observer",
      name: "Deterministic Observer",
      role: "Analytics reviewer",
      face: "DO",
      voice: "Plainspoken",
      goal: input.brief,
      backstory: "Generated for tests.",
      memories: [],
      tastes: [],
      blindSpots: [],
      motivations: [],
      likes: [],
      deviceHabits: [],
      skepticism: "Needs evidence.",
      critiqueLens: ["observability"],
      voiceSettings: { style: input.tone, profanityLevel: "none" },
      personalityFacets: {},
      dayPlan: [],
      sourceDiet: [],
      customerRelationship: input.customerName,
      privateExclusive: true,
      customerOwned: true,
    })),
  };
});

vi.mock("@/lib/gemma-agent-generator", () => ({
  generateAgentWithGemma: vi.fn(),
}));

vi.mock("@/lib/server-analytics", () => ({
  captureServerEvent,
  distinctIdFromRequest: (request: Request) => request.headers.get("x-posthog-distinct-id") || "snoopy-server",
  flushServerAnalytics,
  posthogSessionIdFromRequest: (request: Request) => request.headers.get("x-posthog-session-id") || undefined,
}));

describe("/api/agents/generate route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("attaches cycle_id to deterministic agent generation analytics", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/agents/generate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-posthog-distinct-id": "user_123",
          "x-posthog-session-id": "session_123",
        },
        body: JSON.stringify({
          brief: "Create an observability reviewer who checks cycle analytics.",
          customerName: "Snoopy Internal",
          tone: "plainspoken",
          customerOwned: true,
          mode: "deterministic",
          cycleId: "cycle-170",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(captureServerEvent).toHaveBeenCalledWith(
      "user_123",
      "snoopy_agent_generation_requested",
      expect.objectContaining({
        cycle_id: "cycle-170",
        posthog_session_id: "session_123",
      }),
    );
    expect(captureServerEvent).toHaveBeenCalledWith(
      "user_123",
      "snoopy_agent_generation_completed",
      expect.objectContaining({
        cycle_id: "cycle-170",
        generation_status: "deterministic",
        posthog_session_id: "session_123",
      }),
    );
    expect(flushServerAnalytics).toHaveBeenCalled();
  });
});
