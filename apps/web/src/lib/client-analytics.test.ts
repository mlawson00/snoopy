import { beforeEach, describe, expect, it, vi } from "vitest";

const posthogMock = {
  capture: vi.fn(),
  get_distinct_id: vi.fn(),
  get_session_id: vi.fn(),
  init: vi.fn(),
  __loaded: false,
};

vi.mock("posthog-js", () => ({
  default: posthogMock,
}));

describe("client analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.unstubAllEnvs();
    posthogMock.__loaded = false;
    posthogMock.get_distinct_id.mockReturnValue(undefined);
    posthogMock.get_session_id.mockReturnValue(undefined);
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ ok: true })));
    vi.stubGlobal("window", {
      location: {
        pathname: "/runs/new",
        search: "?cycleId=cycle-client-test",
      },
      localStorage: {
        getItem: vi.fn(() => null),
      },
    });
  });

  it("captures client events with cycle and route context", async () => {
    const { captureClientEvent } = await import("./client-analytics");

    captureClientEvent("snoopy_saved_agent_saved", {
      agent_id: "agent-1",
      saved_agent_count: 2,
    });

    expect(posthogMock.capture).toHaveBeenCalledWith("snoopy_saved_agent_saved", {
      agent_id: "agent-1",
      cycle_id: "cycle-client-test",
      page_path: "/runs/new",
      saved_agent_count: 2,
    });
  });

  it("initializes PostHog before the first event when public env is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "token-1");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://us.i.posthog.com");
    const { captureClientEvent } = await import("./client-analytics");

    captureClientEvent("snoopy_run_form_submitted");

    expect(posthogMock.init).toHaveBeenCalledWith("token-1", {
      api_host: "https://us.i.posthog.com",
      defaults: "2026-01-30",
      request_batching: false,
    });
    expect(fetch).toHaveBeenCalledWith("https://us.i.posthog.com/capture/", expect.objectContaining({ method: "POST" }));
    expect(window.__SNOOPY_CLIENT_ANALYTICS_STATUS__).toMatchObject({
      hostConfigured: true,
      initAttempted: true,
      lastCaptureEvent: "snoopy_run_form_submitted",
      tokenConfigured: true,
    });
  });

  it("exposes missing client analytics env without leaking values", async () => {
    const { captureClientEvent } = await import("./client-analytics");

    captureClientEvent("snoopy_run_form_submitted");

    expect(posthogMock.init).not.toHaveBeenCalled();
    expect(window.__SNOOPY_CLIENT_ANALYTICS_STATUS__).toEqual({
      hostConfigured: false,
      initAttempted: true,
      initError: undefined,
      lastCaptureError: undefined,
      lastCaptureEvent: "snoopy_run_form_submitted",
      loaded: false,
      tokenConfigured: false,
    });
  });

  it("initializes from the public runtime config when bundled env is unavailable", async () => {
    window.__SNOOPY_PUBLIC_CONFIG__ = {
      posthogHost: "https://us.i.posthog.com",
      posthogProjectToken: "runtime-token",
    };
    const { captureClientEvent } = await import("./client-analytics");

    captureClientEvent("snoopy_run_form_submitted");

    expect(posthogMock.init).toHaveBeenCalledWith("runtime-token", {
      api_host: "https://us.i.posthog.com",
      defaults: "2026-01-30",
      request_batching: false,
    });
    expect(fetch).toHaveBeenCalledWith("https://us.i.posthog.com/capture/", expect.objectContaining({ method: "POST" }));
    expect(window.__SNOOPY_CLIENT_ANALYTICS_STATUS__).toMatchObject({
      hostConfigured: true,
      initAttempted: true,
      lastCaptureEvent: "snoopy_run_form_submitted",
      tokenConfigured: true,
    });
  });

  it("adds PostHog distinct and session IDs to server requests", async () => {
    posthogMock.get_distinct_id.mockReturnValue("distinct-1");
    posthogMock.get_session_id.mockReturnValue("session-1");
    const { posthogRequestHeaders } = await import("./client-analytics");

    expect(posthogRequestHeaders()).toEqual({
      "content-type": "application/json",
      "x-posthog-distinct-id": "distinct-1",
      "x-posthog-session-id": "session-1",
    });
  });
});
