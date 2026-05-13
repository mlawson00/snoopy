import { beforeEach, describe, expect, it, vi } from "vitest";

const runSafeBrowserAudit = vi.fn();
const captureServerEvent = vi.fn();
const flushServerAnalytics = vi.fn();

vi.mock("@snoopy/runner", () => ({
  defaultPersonas: [
    {
      id: "maya",
      name: "Maya",
      role: "Operations buyer",
      goal: "Understand the site.",
      backstory: "Evaluates products quickly.",
      trustThreshold: 0.7,
    },
  ],
  runSafeBrowserAudit,
}));

vi.mock("@snoopy/db", () => ({
  createSupabaseReadClient: vi.fn(),
  createSupabaseServiceClient: vi.fn(),
  getTargetSiteName: vi.fn(() => "Example"),
  listWorkspaceRuns: vi.fn(),
  persistRunResult: vi.fn(),
}));

vi.mock("@/lib/server-analytics", () => ({
  captureServerEvent,
  distinctIdFromRequest: (request: Request) => request.headers.get("x-posthog-distinct-id") || "snoopy-server",
  flushServerAnalytics,
  posthogSessionIdFromRequest: (request: Request) => request.headers.get("x-posthog-session-id") || undefined,
}));

describe("/api/runs route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.SNOOPY_DEFAULT_WORKSPACE_ID;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  it("returns structured JSON and captures analytics when audit execution fails", async () => {
    const error = new Error("Browser launch failed.");
    error.name = "BrowserError";
    runSafeBrowserAudit.mockRejectedValueOnce(error);

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/runs", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-posthog-distinct-id": "user_123",
          "x-posthog-session-id": "session_123",
        },
        body: JSON.stringify({
          runId: "run_failure",
          cycleId: "cycle-168",
          targetUrl: "http://127.0.0.1:9",
          goal: "Trigger a controlled failure.",
        }),
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      runId: "run_failure",
      persistence: {
        status: "failed",
        reason: "Browser launch failed.",
      },
    });
    expect(captureServerEvent).toHaveBeenCalledWith(
      "user_123",
      "snoopy_run_failed",
      expect.objectContaining({
        run_id: "run_failure",
        cycle_id: "cycle-168",
        target_url: "http://127.0.0.1:9",
        validation_status: "failed",
        error_type: "BrowserError",
        reason: "Browser launch failed.",
        posthog_session_id: "session_123",
      }),
    );
    expect(flushServerAnalytics).toHaveBeenCalled();
  });
});
