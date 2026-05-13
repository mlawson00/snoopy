import { spawn, type ChildProcess } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

type Options = {
  cycleId: string;
  enableGemma: boolean;
  port: number;
  projectId: string;
  personalApiKey: string;
  host: string;
  timeoutMs: number;
};

type QueryResponse = {
  results?: unknown[][];
  error?: unknown;
  detail?: unknown;
};

type BrowserVerification = {
  cycleId: string;
  clientStatus: unknown;
  gemmaEnabled: boolean;
  expectedEvents: string[];
  posthogRequests: Array<{ method: string; url: string }>;
  posthogRows: unknown[][];
};

const BASE_EXPECTED_BROWSER_EVENTS = [
  "snoopy_agent_generation_form_submitted",
  "snoopy_agent_generation_form_completed",
  "snoopy_saved_agent_saved",
  "snoopy_saved_agent_selection_changed",
  "snoopy_run_form_submitted",
  "snoopy_run_form_completed",
  "snoopy_run_requested",
  "snoopy_run_started",
  "snoopy_run_completed",
  "snoopy_run_persistence_completed",
  "snoopy_report_implementation_queue_copied",
];

const GEMMA_EXPECTED_EVENTS = ["snoopy_model_call_completed", "$ai_generation"];

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, "utf8").split(/\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (!key || process.env[key] !== undefined) continue;
    process.env[key] = rawValue?.replace(/^["']|["']$/g, "") ?? "";
  }
}

function parseArgs(argv: string[]) {
  const parsed: Partial<Options> & { help?: boolean } = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const value = argv[index + 1];
    if (arg === "--help" || arg === "-h") parsed.help = true;
    if (arg === "--cycle") {
      parsed.cycleId = requiredValue(arg, value);
      index += 1;
    }
    if (arg === "--port") {
      parsed.port = Number(requiredValue(arg, value));
      index += 1;
    }
    if (arg === "--timeout-ms") {
      parsed.timeoutMs = Number(requiredValue(arg, value));
      index += 1;
    }
    if (arg === "--enable-gemma") {
      parsed.enableGemma = true;
    }
  }
  return parsed;
}

function requiredValue(flag: string, value: string | undefined) {
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${flag}.`);
  return value;
}

function usage() {
  return `Usage: corepack pnpm posthog:browser -- --cycle <cycle-id> [--port 3217] [--enable-gemma]

Environment:
  POSTHOG_PERSONAL_API_KEY  Required. Personal API key with project query access.
  POSTHOG_PROJECT_ID        Required.
  POSTHOG_API_HOST          Optional. Defaults to https://us.posthog.com.
  NEXT_PUBLIC_POSTHOG_*     Required by the web app for browser capture.`;
}

function buildOptions(): Options {
  loadEnvFile(".env.local");
  loadEnvFile(".env");
  const parsed = parseArgs(process.argv.slice(2));
  if (parsed.help) {
    console.log(usage());
    process.exit(0);
  }

  const cycleId = parsed.cycleId ?? `cycle-browser-${Date.now()}`;
  const projectId = process.env.POSTHOG_PROJECT_ID;
  const personalApiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  if (!projectId) throw new Error("Set POSTHOG_PROJECT_ID.");
  if (!personalApiKey) throw new Error("Set POSTHOG_PERSONAL_API_KEY.");
  if (!process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) throw new Error("Set NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN.");
  if (!process.env.NEXT_PUBLIC_POSTHOG_HOST) throw new Error("Set NEXT_PUBLIC_POSTHOG_HOST.");

  return {
    cycleId,
    enableGemma: parsed.enableGemma ?? false,
    host: process.env.POSTHOG_API_HOST ?? "https://us.posthog.com",
    personalApiKey,
    port: parsed.port ?? 3217,
    projectId,
    timeoutMs: parsed.timeoutMs ?? 90_000,
  };
}

function startWebServer(options: Pick<Options, "enableGemma" | "port">) {
  const child = spawn("corepack", ["pnpm", "--filter", "@snoopy/web", "exec", "next", "dev", "--turbopack", "--hostname", "127.0.0.1", "--port", String(options.port)], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      SNOOPY_DISABLE_GEMMA: options.enableGemma ? "0" : (process.env.SNOOPY_DISABLE_GEMMA ?? "1"),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout?.on("data", (chunk) => {
    if (process.env.SNOOPY_POSTHOG_BROWSER_VERBOSE) process.stdout.write(chunk);
  });
  child.stderr?.on("data", (chunk) => {
    if (process.env.SNOOPY_POSTHOG_BROWSER_VERBOSE) process.stderr.write(chunk);
  });
  return child;
}

async function waitForServer(baseUrl: string, timeoutMs: number) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      // Server is still starting.
    }
    await sleep(500);
  }
  throw new Error(`Timed out waiting for ${baseUrl}.`);
}

async function runBrowserCheck(options: Options): Promise<BrowserVerification> {
  const webRequire = createRequire(path.join(process.cwd(), "apps/web/package.json"));
  const { chromium } = webRequire("@playwright/test") as typeof import("@playwright/test");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const posthogRequests: Array<{ method: string; url: string }> = [];

  page.on("request", (request) => {
    const url = request.url();
    if (url.includes("posthog") || url.includes("/capture/")) {
      posthogRequests.push({ method: request.method(), url });
    }
  });

  await page.addInitScript((cycleId) => {
    window.localStorage.setItem("snoopy.cycleId", cycleId);
  }, options.cycleId);

  const expectedEvents = [...BASE_EXPECTED_BROWSER_EVENTS, ...(options.enableGemma ? GEMMA_EXPECTED_EVENTS : [])];

  await page.goto(`http://127.0.0.1:${options.port}/agents?cycleId=${encodeURIComponent(options.cycleId)}`, { waitUntil: "networkidle" });
  await clickAndWaitForCapture(page, () => page.getByRole("button", { name: /generate agent/i }).click());
  await page.getByRole("button", { name: /save agent/i }).click();
  await page.waitForTimeout(250);

  await page.goto(`http://127.0.0.1:${options.port}/runs/new?cycleId=${encodeURIComponent(options.cycleId)}`, { waitUntil: "networkidle" });
  await clickAndWaitForCapture(page, () => page.getByRole("checkbox", { name: /include .* in this run/i }).first().check());
  await clickAndWaitForCapture(page, () => page.getByRole("button", { name: /run review/i }).click());
  const fullReportLink = page.getByRole("link", { name: /open full report/i });
  await fullReportLink.waitFor({ timeout: options.timeoutMs });
  await fullReportLink.click();
  await page.waitForLoadState("networkidle");

  const relationshipFilter = page.locator("[data-relationship-filter-option]").first();
  if ((await relationshipFilter.count()) > 0) {
    expectedEvents.push("snoopy_report_relationship_filter_changed");
    await clickAndWaitForCapture(page, () => relationshipFilter.click());
  }
  await clickAndWaitForCapture(page, () => page.getByRole("button", { name: /copy .*implementation plan|copy visible fix plan/i }).first().click());

  await page.waitForTimeout(1_000);
  const clientStatus = await page.evaluate(() => window.__SNOOPY_CLIENT_ANALYTICS_STATUS__ ?? null);
  await browser.close();

  return {
    clientStatus,
    cycleId: options.cycleId,
    gemmaEnabled: options.enableGemma,
    expectedEvents,
    posthogRequests,
    posthogRows: [],
  };
}

async function clickAndWaitForCapture(page: import("@playwright/test").Page, action: () => Promise<unknown>) {
  const captureRequestPromise = page.waitForRequest((request) => request.url().includes("/capture/"), { timeout: 12_000 });
  await action();
  await captureRequestPromise;
}

async function queryPostHog(options: Options, expectedEvents: string[]) {
  const nonce = Date.now();
  const query = `
select event, properties.cycle_id, count() as count
from events
where timestamp > now() - interval 30 minute
  and properties.cycle_id = ${escapeHogQLString(options.cycleId)}
  and event in (${expectedEvents.map(escapeHogQLString).join(", ")})
  and ${nonce} = ${nonce}
group by event, properties.cycle_id
order by event asc
`;
  const response = await fetch(`${options.host.replace(/\/$/, "")}/api/projects/${options.projectId}/query/`, {
    body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
    headers: {
      authorization: `Bearer ${options.personalApiKey}`,
      "content-type": "application/json",
    },
    method: "POST",
  });
  const payload = (await response.json()) as QueryResponse;
  if (!response.ok || payload.error) throw new Error(`PostHog query failed: ${JSON.stringify(payload.error ?? payload.detail ?? payload)}`);
  return payload.results ?? [];
}

async function waitForPostHogEvent(options: Options, expectedEvents: string[]) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < options.timeoutMs) {
    const rows = await queryPostHog(options, expectedEvents);
    const observedEvents = new Set(rows.map((row) => (Array.isArray(row) ? row[0] : undefined)));
    if (expectedEvents.every((event) => observedEvents.has(event))) return rows;
    await sleep(2_000);
  }
  throw new Error(`Timed out waiting for browser events in PostHog for ${options.cycleId}.`);
}

function escapeHogQLString(value: string) {
  return `'${value.replaceAll("\\", "\\\\").replaceAll("'", "\\'")}'`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function stopWebServer(child: ChildProcess) {
  if (child.exitCode !== null || child.killed) return;
  child.kill("SIGTERM");
  await sleep(500);
  if (child.exitCode === null && !child.killed) child.kill("SIGKILL");
}

async function main() {
  const options = buildOptions();
  const server = startWebServer(options);
  try {
    await waitForServer(`http://127.0.0.1:${options.port}`, options.timeoutMs);
    const verification = await runBrowserCheck(options);
    verification.posthogRows = await waitForPostHogEvent(options, verification.expectedEvents);
    console.log(JSON.stringify(verification, null, 2));
  } finally {
    await stopWebServer(server);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
