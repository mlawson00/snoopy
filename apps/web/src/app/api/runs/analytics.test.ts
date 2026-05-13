import { describe, expect, it } from "vitest";
import { buildRunFailureProperties, runErrorMessage, runFailureStatus } from "./analytics";

describe("run analytics helpers", () => {
  it("builds stable PostHog properties for failed audits", () => {
    const error = new Error("Target URL is missing.");
    error.name = "ZodError";

    expect(
      buildRunFailureProperties({
        runId: "run_failure",
        targetUrl: "https://example.com",
        cycleId: "cycle-168",
        posthogSessionId: "session_123",
        error,
      }),
    ).toEqual({
      run_id: "run_failure",
      cycle_id: "cycle-168",
      target_url: "https://example.com",
      persistence_status: "failed",
      validation_status: "failed",
      error_type: "ZodError",
      reason: "Target URL is missing.",
      posthog_session_id: "session_123",
    });
    expect(runFailureStatus(error)).toBe(400);
  });

  it("uses a safe message and server-error status for unknown failures", () => {
    expect(runErrorMessage("boom")).toBe("Unknown run audit error.");
    expect(runFailureStatus("boom")).toBe(500);
  });
});
