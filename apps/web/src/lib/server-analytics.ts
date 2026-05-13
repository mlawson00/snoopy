import { PostHog } from "posthog-node";

type AnalyticsProperties = Record<string, unknown>;

let posthog: PostHog | null | undefined;

function getPostHogClient() {
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

export function distinctIdFromRequest(request: Request, fallback = "snoopy-server") {
  return request.headers.get("x-posthog-distinct-id") || fallback;
}

export function posthogSessionIdFromRequest(request: Request) {
  return request.headers.get("x-posthog-session-id") || undefined;
}

export function captureServerEvent(distinctId: string, event: string, properties: AnalyticsProperties = {}) {
  const client = getPostHogClient();
  if (!client) return;

  client.capture({
    distinctId,
    event,
    properties,
  });
}

export async function flushServerAnalytics() {
  const client = getPostHogClient();
  if (!client) return;
  await client.flush();
}
