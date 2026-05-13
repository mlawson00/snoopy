"use client";

import posthog from "posthog-js";

type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;
type ClientAnalyticsStatus = {
  hostConfigured: boolean;
  initAttempted: boolean;
  initError?: string;
  lastCaptureEvent?: string;
  lastCaptureError?: string;
  loaded: boolean;
  tokenConfigured: boolean;
};

declare global {
  interface Window {
    __SNOOPY_CLIENT_ANALYTICS_STATUS__?: ClientAnalyticsStatus;
    __SNOOPY_PUBLIC_CONFIG__?: {
      posthogHost?: string;
      posthogProjectToken?: string;
    };
  }
}

let didAttemptClientInit = false;
let lastInitError: string | undefined;
let lastCaptureEvent: string | undefined;
let lastCaptureError: string | undefined;

export function captureClientEvent(event: string, properties: AnalyticsProperties = {}) {
  try {
    ensureClientPostHog();
    const eventProperties = {
      ...clientContextProperties(),
      ...properties,
    };
    posthog.capture(event, eventProperties);
    sendDirectClientCapture(event, eventProperties);
    lastCaptureEvent = event;
    lastCaptureError = undefined;
    writeClientAnalyticsStatus();
  } catch (caught) {
    lastCaptureError = caught instanceof Error ? caught.message : "PostHog browser capture failed.";
    writeClientAnalyticsStatus();
    // Analytics must never block the product flow.
  }
}

export function posthogRequestHeaders() {
  ensureClientPostHog();
  const headers: Record<string, string> = { "content-type": "application/json" };
  const distinctId = posthog.get_distinct_id();
  const sessionId = posthog.get_session_id();
  if (distinctId) headers["x-posthog-distinct-id"] = distinctId;
  if (sessionId) headers["x-posthog-session-id"] = sessionId;
  return headers;
}

export function currentCycleId() {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("cycleId") ?? params.get("cycle_id") ?? window.localStorage.getItem("snoopy.cycleId") ?? undefined;
  } catch {
    return undefined;
  }
}

function ensureClientPostHog() {
  if (didAttemptClientInit) {
    writeClientAnalyticsStatus();
    return;
  }
  didAttemptClientInit = true;
  const { host, token } = readPublicPostHogConfig();
  const loadedPostHog = posthog as typeof posthog & { __loaded?: boolean };
  if (token && host && !loadedPostHog.__loaded) {
    try {
      posthog.init(token, {
        api_host: host,
        defaults: "2026-01-30",
        request_batching: false,
      });
    } catch (caught) {
      lastInitError = caught instanceof Error ? caught.message : "PostHog browser initialization failed.";
    }
  }
  writeClientAnalyticsStatus();
}

function clientContextProperties(): AnalyticsProperties {
  try {
    return {
      cycle_id: currentCycleId(),
      page_path: window.location.pathname,
    };
  } catch {
    return {};
  }
}

function writeClientAnalyticsStatus() {
  try {
    window.__SNOOPY_CLIENT_ANALYTICS_STATUS__ = readClientAnalyticsStatus();
  } catch {
    // Status is diagnostic only.
  }
}

function readClientAnalyticsStatus(): ClientAnalyticsStatus {
  const loadedPostHog = posthog as typeof posthog & { __loaded?: boolean };
  const { host, token } = readPublicPostHogConfig();
  return {
    hostConfigured: Boolean(host),
    initAttempted: didAttemptClientInit,
    initError: lastInitError,
    lastCaptureError,
    lastCaptureEvent,
    loaded: Boolean(loadedPostHog.__loaded),
    tokenConfigured: Boolean(token),
  };
}

function readPublicPostHogConfig() {
  try {
    return {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || window.__SNOOPY_PUBLIC_CONFIG__?.posthogHost,
      token: process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN || window.__SNOOPY_PUBLIC_CONFIG__?.posthogProjectToken,
    };
  } catch {
    return {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      token: process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN,
    };
  }
}

function sendDirectClientCapture(event: string, properties: AnalyticsProperties) {
  const { host, token } = readPublicPostHogConfig();
  if (!host || !token) return;
  const distinctId = posthog.get_distinct_id() || "snoopy-browser";
  const sessionId = posthog.get_session_id();
  const body = JSON.stringify({
    api_key: token,
    distinct_id: distinctId,
    event,
    properties: {
      ...properties,
      ...(sessionId ? { $session_id: sessionId } : {}),
    },
  });
  void fetch(`${host.replace(/\/$/, "")}/capture/`, {
    body,
    headers: { "content-type": "application/json" },
    keepalive: true,
    method: "POST",
  });
}
