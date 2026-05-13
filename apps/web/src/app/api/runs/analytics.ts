type RunFailureInput = {
  runId: string;
  targetUrl?: unknown;
  cycleId?: unknown;
  posthogSessionId?: string;
  error: unknown;
};

export function runErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown run audit error.";
}

export function runErrorType(error: unknown) {
  return error instanceof Error ? error.name || "Error" : typeof error;
}

export function runFailureStatus(error: unknown) {
  return runErrorType(error) === "ZodError" ? 400 : 500;
}

export function buildRunFailureProperties(input: RunFailureInput) {
  return {
    run_id: input.runId,
    cycle_id: typeof input.cycleId === "string" ? input.cycleId : undefined,
    target_url: typeof input.targetUrl === "string" ? input.targetUrl : undefined,
    persistence_status: "failed",
    validation_status: "failed",
    error_type: runErrorType(input.error),
    reason: runErrorMessage(input.error),
    posthog_session_id: input.posthogSessionId,
  };
}
