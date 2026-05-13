import { existsSync, readFileSync } from "node:fs";

type Format = "json" | "markdown";

type Options = {
  cycleId: string;
  since: string;
  format: Format;
  host: string;
  projectId: string;
  personalApiKey: string;
};

type QueryResponse = {
  results?: unknown[][];
  error?: unknown;
  detail?: unknown;
};

type EventSummary = {
  event: string;
  count: number;
  uniqueActors: number;
  firstSeen: string | null;
  lastSeen: string | null;
};

type RunSummary = {
  runId: string;
  requested: number;
  started: number;
  completed: number;
  persisted: number;
  failed: number;
  modelCalls: number;
  aiGenerations: number;
  persistenceStatuses: string[];
  errorTypes: string[];
  firstSeen: string | null;
  lastSeen: string | null;
};

type ModelCallSummary = {
  operation: string;
  calls: number;
  averageLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  maxLatencyMs: number;
  inputTokens: number;
  outputTokens: number;
};

type ModelCallDrilldown = {
  operation: string;
  route: string;
  device: string;
  personaId: string;
  agentType: string;
  calls: number;
  averageLatencyMs: number;
  p95LatencyMs: number;
  inputTokens: number;
  outputTokens: number;
};

type CycleSummary = {
  cycleId: string;
  generatedAt: string;
  since: string;
  projectId: string;
  cycleKind: "browser_product" | "runner_self_audit" | "unknown";
  eventSummaries: EventSummary[];
  runSummaries: RunSummary[];
  modelCallSummaries: ModelCallSummary[];
  modelCallDrilldowns: ModelCallDrilldown[];
  totals: {
    requestedRuns: number;
    startedRuns: number;
    completedRuns: number;
    persistedRuns: number;
    failedRuns: number;
    modelCalls: number;
    aiGenerations: number;
    agentGenerationRequests: number;
    agentGenerationCompletions: number;
    clientInteractions: number;
    savedAgentInteractions: number;
    reportInteractions: number;
    implementationHandoffs: number;
    runFormSubmissions: number;
    runFormCompletions: number;
    runFormFailures: number;
    agentGenerationFormSubmissions: number;
    agentGenerationFormCompletions: number;
    savedAgentSaves: number;
    savedAgentSelections: number;
    reportFilterChanges: number;
    modelInputTokens: number;
    modelOutputTokens: number;
  };
  ratios: {
    agentGenerationFormCompletionRate: number | null;
    savedAgentSaveToSelectionRate: number | null;
    runFormCompletionRate: number | null;
    reportFilterToHandoffRate: number | null;
  };
  globalReview: {
    status: "healthy" | "needs_attention";
    notes: string[];
  };
};

const SAVED_AGENT_INTERACTION_EVENTS = [
  "snoopy_agent_generation_form_submitted",
  "snoopy_agent_generation_form_completed",
  "snoopy_agent_generation_form_failed",
  "snoopy_saved_agent_saved",
  "snoopy_saved_agent_deleted",
  "snoopy_saved_agent_profile_updated",
  "snoopy_custom_critic_added",
  "snoopy_saved_agent_selection_changed",
];

const REPORT_INTERACTION_EVENTS = [
  "snoopy_report_source_filter_changed",
  "snoopy_report_relationship_filter_changed",
  "snoopy_report_fix_handoff_copied",
  "snoopy_report_implementation_queue_copied",
  "snoopy_report_implementation_queue_downloaded",
];

const IMPLEMENTATION_HANDOFF_EVENTS = [
  "snoopy_report_fix_handoff_copied",
  "snoopy_report_implementation_queue_copied",
  "snoopy_report_implementation_queue_downloaded",
];

const RUN_FORM_EVENTS = ["snoopy_run_form_submitted", "snoopy_run_form_completed", "snoopy_run_form_failed"];

const CLIENT_INTERACTION_EVENTS = [...SAVED_AGENT_INTERACTION_EVENTS, ...REPORT_INTERACTION_EVENTS, ...RUN_FORM_EVENTS];

const RATIO_WARNING_MIN_SAMPLE_SIZE = 3;
const MODEL_BUDGETS = {
  browser_product: {
    label: "Default browser workflow",
    maxModelCalls: 35,
    maxInputTokens: 35_000,
    maxOutputTokens: 5_000,
    maxReactionP95LatencyMs: 3_000,
    maxGeneratorLatencyMs: 15_000,
  },
  runner_self_audit: {
    label: "Runner self-audit workflow",
    maxModelCalls: 70,
    maxInputTokens: 110_000,
    maxOutputTokens: 9_000,
    maxReactionP95LatencyMs: 4_000,
    maxGeneratorLatencyMs: 15_000,
  },
  unknown: {
    label: "Default browser workflow",
    maxModelCalls: 35,
    maxInputTokens: 35_000,
    maxOutputTokens: 5_000,
    maxReactionP95LatencyMs: 3_000,
    maxGeneratorLatencyMs: 15_000,
  },
} satisfies Record<CycleSummary["cycleKind"], ModelBudget>;

type ModelBudget = {
  label: string;
  maxModelCalls: number;
  maxInputTokens: number;
  maxOutputTokens: number;
  maxReactionP95LatencyMs: number;
  maxGeneratorLatencyMs: number;
};

const EVENT_SUMMARY_QUERY = `
select
  event,
  count() as count,
  count(distinct distinct_id) as unique_actors,
  min(timestamp) as first_seen,
  max(timestamp) as last_seen
from events
where timestamp > now() - interval {since}
  and properties.cycle_id = {cycle_id}
  and {nonce} = {nonce}
group by event
order by last_seen desc
limit 100
`;

const RUN_SUMMARY_QUERY = `
select
  coalesce(nullIf(toString(properties.run_id), ''), 'missing-run-id') as run_id,
  sum(if(event = 'snoopy_run_requested', 1, 0)) as requested,
  sum(if(event = 'snoopy_run_started', 1, 0)) as started,
  sum(if(event = 'snoopy_run_completed', 1, 0)) as completed,
  sum(if(event = 'snoopy_run_persistence_completed', 1, 0)) as persisted,
  sum(if(event = 'snoopy_run_failed', 1, 0)) as failed,
  sum(if(event = 'snoopy_model_call_completed', 1, 0)) as model_calls,
  sum(if(event = '$ai_generation', 1, 0)) as ai_generations,
  groupUniqArray(toString(properties.persistence_status)) as persistence_statuses,
  groupUniqArray(toString(properties.error_type)) as error_types,
  min(timestamp) as first_seen,
  max(timestamp) as last_seen
from events
where timestamp > now() - interval {since}
  and properties.cycle_id = {cycle_id}
  and {nonce} = {nonce}
  and event in (
    'snoopy_run_requested',
    'snoopy_run_started',
    'snoopy_run_completed',
    'snoopy_run_persistence_completed',
    'snoopy_run_failed',
    'snoopy_model_call_completed',
    '$ai_generation'
  )
group by run_id
order by last_seen desc
limit 100
`;

const MODEL_CALL_SUMMARY_QUERY = `
select
  coalesce(nullIf(toString(properties.operation), ''), 'unknown') as operation,
  count() as calls,
  round(avg(toFloat(properties.latency_ms)), 0) as avg_latency_ms,
  quantile(0.5)(toFloat(properties.latency_ms)) as p50_latency_ms,
  quantile(0.95)(toFloat(properties.latency_ms)) as p95_latency_ms,
  max(toFloat(properties.latency_ms)) as max_latency_ms,
  sum(toFloat(properties.input_tokens)) as input_tokens,
  sum(toFloat(properties.output_tokens)) as output_tokens
from events
where timestamp > now() - interval {since}
  and properties.cycle_id = {cycle_id}
  and {nonce} = {nonce}
  and event = 'snoopy_model_call_completed'
group by operation
order by calls desc
limit 20
`;

const MODEL_CALL_DRILLDOWN_QUERY = `
select
  coalesce(nullIf(toString(properties.operation), ''), 'unknown') as operation,
  coalesce(nullIf(toString(properties.route), ''), 'unknown') as route,
  coalesce(nullIf(toString(properties.device), ''), 'unknown') as device,
  coalesce(nullIf(toString(properties.persona_id), ''), 'unknown') as persona_id,
  coalesce(nullIf(toString(properties.agent_type), ''), 'unknown') as agent_type,
  count() as calls,
  round(avg(toFloat(properties.latency_ms)), 0) as avg_latency_ms,
  quantile(0.95)(toFloat(properties.latency_ms)) as p95_latency_ms,
  sum(toFloat(properties.input_tokens)) as input_tokens,
  sum(toFloat(properties.output_tokens)) as output_tokens
from events
where timestamp > now() - interval {since}
  and properties.cycle_id = {cycle_id}
  and {nonce} = {nonce}
  and event = 'snoopy_model_call_completed'
group by operation, route, device, persona_id, agent_type
order by calls desc, p95_latency_ms desc
limit 30
`;

function loadEnvFile(path: string) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (!key || process.env[key] !== undefined) continue;
    process.env[key] = rawValue?.replace(/^["']|["']$/g, "") ?? "";
  }
}

function parseArgs(argv: string[]): Partial<Options> & { help?: boolean } {
  const options: Partial<Options> & { help?: boolean } = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const value = argv[index + 1];
    if (arg === "--help" || arg === "-h") options.help = true;
    if (arg === "--cycle") {
      options.cycleId = requiredValue(arg, value);
      index += 1;
    }
    if (arg === "--since") {
      options.since = requiredValue(arg, value);
      index += 1;
    }
    if (arg === "--format") {
      options.format = parseFormat(requiredValue(arg, value));
      index += 1;
    }
    if (arg === "--host") {
      options.host = requiredValue(arg, value);
      index += 1;
    }
    if (arg === "--project-id") {
      options.projectId = requiredValue(arg, value);
      index += 1;
    }
  }
  return options;
}

function requiredValue(flag: string, value: string | undefined) {
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${flag}.`);
  return value;
}

function parseFormat(value: string): Format {
  if (value === "json" || value === "markdown") return value;
  throw new Error("--format must be json or markdown.");
}

function usage() {
  return `Usage: corepack pnpm posthog:cycle -- --cycle <cycle-id> [--since "24 hour"] [--format markdown|json]

Environment:
  POSTHOG_PERSONAL_API_KEY  Required. Personal API key with project query access.
  POSTHOG_PROJECT_ID        Required unless --project-id is passed.
  POSTHOG_API_HOST          Optional. Defaults to https://us.posthog.com.`;
}

function buildOptions(): Options {
  loadEnvFile(".env.local");
  loadEnvFile(".env");
  const parsed = parseArgs(process.argv.slice(2));
  if (parsed.help) {
    console.log(usage());
    process.exit(0);
  }

  const cycleId = parsed.cycleId ?? process.env.SNOOPY_POSTHOG_CYCLE_ID;
  const projectId = parsed.projectId ?? process.env.POSTHOG_PROJECT_ID;
  const personalApiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  if (!cycleId) throw new Error("Pass --cycle <cycle-id> or set SNOOPY_POSTHOG_CYCLE_ID.");
  if (!projectId) throw new Error("Pass --project-id <id> or set POSTHOG_PROJECT_ID.");
  if (!personalApiKey) throw new Error("Set POSTHOG_PERSONAL_API_KEY.");

  return {
    cycleId,
    since: parsed.since ?? "24 hour",
    format: parsed.format ?? "markdown",
    host: parsed.host ?? process.env.POSTHOG_API_HOST ?? "https://us.posthog.com",
    projectId,
    personalApiKey,
  };
}

function escapeHogQLString(value: string) {
  return `'${value.replaceAll("\\", "\\\\").replaceAll("'", "\\'")}'`;
}

function intervalLiteral(value: string) {
  const match = value.trim().match(/^(\d+)\s+(minute|hour|day|week|month)s?$/i);
  if (!match) throw new Error('--since must look like "30 minute", "24 hour", or "7 day".');
  return `${match[1]} ${match[2]?.toLowerCase()}`;
}

function fillQuery(query: string, options: Options) {
  return query
    .replaceAll("{cycle_id}", escapeHogQLString(options.cycleId))
    .replaceAll("{since}", intervalLiteral(options.since))
    .replaceAll("{nonce}", String(Date.now()));
}

async function executeHogQL(options: Options, query: string) {
  const response = await fetch(`${options.host.replace(/\/$/, "")}/api/projects/${options.projectId}/query/`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${options.personalApiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
  });
  const payload = (await response.json()) as QueryResponse;
  if (!response.ok || payload.error) {
    throw new Error(`PostHog query failed: ${JSON.stringify(payload.error ?? payload.detail ?? payload)}`);
  }
  return payload.results ?? [];
}

function numberAt(row: unknown[], index: number) {
  const value = row[index];
  return typeof value === "number" ? value : Number(value ?? 0);
}

function stringAt(row: unknown[], index: number) {
  const value = row[index];
  return typeof value === "string" && value.length ? value : null;
}

function stringsAt(row: unknown[], index: number) {
  const value = row[index];
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.length > 0 && item !== "null");
}

function buildGlobalReview(summary: Omit<CycleSummary, "globalReview">): CycleSummary["globalReview"] {
  const notes: string[] = [];
  const isRunnerSelfAudit = summary.cycleKind === "runner_self_audit";
  const modelBudget = modelBudgetFor(summary.cycleKind);
  if (!isRunnerSelfAudit && summary.totals.requestedRuns === 0) notes.push("No run requests were observed for this cycle.");
  if (summary.totals.requestedRuns > summary.totals.startedRuns + summary.totals.failedRuns) notes.push("Some requested runs did not start or fail explicitly.");
  if (summary.totals.startedRuns > summary.totals.completedRuns + summary.totals.failedRuns) notes.push("Some started runs did not complete or fail explicitly.");
  if (!isRunnerSelfAudit && summary.totals.completedRuns > summary.totals.persistedRuns) notes.push("Some completed runs did not emit persistence completion.");
  if (summary.totals.failedRuns > 0) notes.push(`${summary.totals.failedRuns} failed run event${summary.totals.failedRuns === 1 ? "" : "s"} need review.`);
  if (summary.totals.modelCalls === 0) notes.push("No completed model calls were observed for this cycle.");
  if (summary.totals.modelCalls > modelBudget.maxModelCalls) {
    notes.push(`Model calls exceeded the ${modelBudget.label} budget (${summary.totals.modelCalls}/${modelBudget.maxModelCalls}).`);
  }
  if (summary.totals.modelInputTokens > modelBudget.maxInputTokens) {
    notes.push(`Model input tokens exceeded the ${modelBudget.label} budget (${Math.round(summary.totals.modelInputTokens)}/${modelBudget.maxInputTokens}).`);
  }
  if (summary.totals.modelOutputTokens > modelBudget.maxOutputTokens) {
    notes.push(`Model output tokens exceeded the ${modelBudget.label} budget (${Math.round(summary.totals.modelOutputTokens)}/${modelBudget.maxOutputTokens}).`);
  }
  const reactionModelSummary = summary.modelCallSummaries.find((item) => item.operation === "agent_reaction");
  if (reactionModelSummary && reactionModelSummary.p95LatencyMs > modelBudget.maxReactionP95LatencyMs) {
    notes.push(
      `Agent reaction p95 latency exceeded the ${modelBudget.label} budget (${Math.round(reactionModelSummary.p95LatencyMs)}ms/${modelBudget.maxReactionP95LatencyMs}ms).`,
    );
  }
  const generatorModelSummary = summary.modelCallSummaries.find((item) => item.operation === "agent_generation");
  if (generatorModelSummary && generatorModelSummary.maxLatencyMs > modelBudget.maxGeneratorLatencyMs) {
    notes.push(
      `Agent generation latency exceeded the ${modelBudget.label} budget (${Math.round(generatorModelSummary.maxLatencyMs)}ms/${modelBudget.maxGeneratorLatencyMs}ms).`,
    );
  }
  if (!isRunnerSelfAudit && summary.totals.clientInteractions === 0) notes.push("No cycle-scoped browser interaction events were observed.");
  if (summary.totals.runFormSubmissions > summary.totals.runFormCompletions + summary.totals.runFormFailures) {
    notes.push("Some browser run form submissions did not complete or fail explicitly.");
  }
  if (summary.totals.savedAgentInteractions > 0 && summary.totals.runFormSubmissions === 0) {
    notes.push("Saved-agent interactions happened without a browser run form submission.");
  }
  if (summary.totals.reportInteractions > 0 && summary.totals.implementationHandoffs === 0) {
    notes.push("Report filters or inspection happened without an implementation handoff copy/download.");
  }
  if (isLowRate(summary.ratios.agentGenerationFormCompletionRate, 0.8, summary.totals.agentGenerationFormSubmissions)) {
    notes.push(
      `Agent generation form completion rate is ${formatPercent(summary.ratios.agentGenerationFormCompletionRate)} (${summary.totals.agentGenerationFormCompletions}/${summary.totals.agentGenerationFormSubmissions}).`,
    );
  }
  if (isLowRate(summary.ratios.savedAgentSaveToSelectionRate, 0.5, summary.totals.savedAgentSaves)) {
    notes.push(
      `Saved-agent save-to-selection rate is ${formatPercent(summary.ratios.savedAgentSaveToSelectionRate)} (${summary.totals.savedAgentSelections}/${summary.totals.savedAgentSaves}).`,
    );
  }
  if (isLowRate(summary.ratios.runFormCompletionRate, 0.8, summary.totals.runFormSubmissions)) {
    notes.push(`Run form completion rate is ${formatPercent(summary.ratios.runFormCompletionRate)} (${summary.totals.runFormCompletions}/${summary.totals.runFormSubmissions}).`);
  }
  if (isLowRate(summary.ratios.reportFilterToHandoffRate, 0.5, summary.totals.reportFilterChanges)) {
    notes.push(
      `Report filter-to-handoff rate is ${formatPercent(summary.ratios.reportFilterToHandoffRate)} (${summary.totals.implementationHandoffs}/${summary.totals.reportFilterChanges}).`,
    );
  }
  if (notes.length === 0) {
    notes.push(
      isRunnerSelfAudit
        ? "Runner self-audit model-call and lifecycle events are connected for this cycle."
        : "Run lifecycle, model-call, persistence, and browser interaction events are connected for this cycle.",
    );
  }
  return {
    status: notes.length === 1 && notes[0]?.startsWith("Run lifecycle") ? "healthy" : "needs_attention",
    notes,
  };
}

function sumCounts(countFor: (event: string) => number, events: string[]) {
  return events.reduce((total, event) => total + countFor(event), 0);
}

function ratio(numerator: number, denominator: number) {
  return denominator > 0 ? numerator / denominator : null;
}

function isLowRate(value: number | null, threshold: number, sampleSize: number) {
  return sampleSize >= RATIO_WARNING_MIN_SAMPLE_SIZE && value !== null && value < threshold;
}

function formatPercent(value: number | null) {
  if (value === null) return "n/a";
  return `${Math.round(value * 100)}%`;
}

function classifyCycle(totals: CycleSummary["totals"]): CycleSummary["cycleKind"] {
  if (totals.clientInteractions > 0 || totals.requestedRuns > 0 || totals.agentGenerationRequests > 0) return "browser_product";
  if (totals.startedRuns > 0 && totals.modelCalls > 0) return "runner_self_audit";
  return "unknown";
}

function modelBudgetFor(cycleKind: CycleSummary["cycleKind"]) {
  return MODEL_BUDGETS[cycleKind];
}

async function summarizeCycle(options: Options): Promise<CycleSummary> {
  const [eventRows, runRows, modelCallRows, modelDrilldownRows] = await Promise.all([
    executeHogQL(options, fillQuery(EVENT_SUMMARY_QUERY, options)),
    executeHogQL(options, fillQuery(RUN_SUMMARY_QUERY, options)),
    executeHogQL(options, fillQuery(MODEL_CALL_SUMMARY_QUERY, options)),
    executeHogQL(options, fillQuery(MODEL_CALL_DRILLDOWN_QUERY, options)),
  ]);

  const eventSummaries = eventRows.map((row) => ({
    event: stringAt(row, 0) ?? "unknown",
    count: numberAt(row, 1),
    uniqueActors: numberAt(row, 2),
    firstSeen: stringAt(row, 3),
    lastSeen: stringAt(row, 4),
  }));
  const runSummaries = runRows.map((row) => ({
    runId: stringAt(row, 0) ?? "missing-run-id",
    requested: numberAt(row, 1),
    started: numberAt(row, 2),
    completed: numberAt(row, 3),
    persisted: numberAt(row, 4),
    failed: numberAt(row, 5),
    modelCalls: numberAt(row, 6),
    aiGenerations: numberAt(row, 7),
    persistenceStatuses: stringsAt(row, 8),
    errorTypes: stringsAt(row, 9),
    firstSeen: stringAt(row, 10),
    lastSeen: stringAt(row, 11),
  }));
  const modelCallSummaries = modelCallRows.map((row) => ({
    operation: stringAt(row, 0) ?? "unknown",
    calls: numberAt(row, 1),
    averageLatencyMs: numberAt(row, 2),
    p50LatencyMs: numberAt(row, 3),
    p95LatencyMs: numberAt(row, 4),
    maxLatencyMs: numberAt(row, 5),
    inputTokens: numberAt(row, 6),
    outputTokens: numberAt(row, 7),
  }));
  const modelCallDrilldowns = modelDrilldownRows.map((row) => ({
    operation: stringAt(row, 0) ?? "unknown",
    route: stringAt(row, 1) ?? "unknown",
    device: stringAt(row, 2) ?? "unknown",
    personaId: stringAt(row, 3) ?? "unknown",
    agentType: stringAt(row, 4) ?? "unknown",
    calls: numberAt(row, 5),
    averageLatencyMs: numberAt(row, 6),
    p95LatencyMs: numberAt(row, 7),
    inputTokens: numberAt(row, 8),
    outputTokens: numberAt(row, 9),
  }));
  const countFor = (event: string) => eventSummaries.find((item) => item.event === event)?.count ?? 0;
  const modelInputTokens = modelCallSummaries.reduce((total, item) => total + item.inputTokens, 0);
  const modelOutputTokens = modelCallSummaries.reduce((total, item) => total + item.outputTokens, 0);
  const totals: CycleSummary["totals"] = {
    requestedRuns: countFor("snoopy_run_requested"),
    startedRuns: countFor("snoopy_run_started"),
    completedRuns: countFor("snoopy_run_completed"),
    persistedRuns: countFor("snoopy_run_persistence_completed"),
    failedRuns: countFor("snoopy_run_failed"),
    modelCalls: countFor("snoopy_model_call_completed"),
    aiGenerations: countFor("$ai_generation"),
    agentGenerationRequests: countFor("snoopy_agent_generation_requested"),
    agentGenerationCompletions: countFor("snoopy_agent_generation_completed"),
    clientInteractions: sumCounts(countFor, CLIENT_INTERACTION_EVENTS),
    savedAgentInteractions: sumCounts(countFor, SAVED_AGENT_INTERACTION_EVENTS),
    reportInteractions: sumCounts(countFor, REPORT_INTERACTION_EVENTS),
    implementationHandoffs: sumCounts(countFor, IMPLEMENTATION_HANDOFF_EVENTS),
    runFormSubmissions: countFor("snoopy_run_form_submitted"),
    runFormCompletions: countFor("snoopy_run_form_completed"),
    runFormFailures: countFor("snoopy_run_form_failed"),
    agentGenerationFormSubmissions: countFor("snoopy_agent_generation_form_submitted"),
    agentGenerationFormCompletions: countFor("snoopy_agent_generation_form_completed"),
    savedAgentSaves: countFor("snoopy_saved_agent_saved"),
    savedAgentSelections: countFor("snoopy_saved_agent_selection_changed"),
    reportFilterChanges: countFor("snoopy_report_source_filter_changed") + countFor("snoopy_report_relationship_filter_changed"),
    modelInputTokens,
    modelOutputTokens,
  };
  const summary: Omit<CycleSummary, "globalReview"> = {
    cycleId: options.cycleId,
    generatedAt: new Date().toISOString(),
    since: options.since,
    projectId: options.projectId,
    cycleKind: classifyCycle(totals),
    eventSummaries,
    runSummaries,
    modelCallSummaries,
    modelCallDrilldowns,
    totals,
    ratios: {
      agentGenerationFormCompletionRate: ratio(totals.agentGenerationFormCompletions, totals.agentGenerationFormSubmissions),
      savedAgentSaveToSelectionRate: ratio(totals.savedAgentSelections, totals.savedAgentSaves),
      runFormCompletionRate: ratio(totals.runFormCompletions, totals.runFormSubmissions),
      reportFilterToHandoffRate: ratio(totals.implementationHandoffs, totals.reportFilterChanges),
    },
  };
  return {
    ...summary,
    globalReview: buildGlobalReview(summary),
  };
}

function markdownTable(rows: string[][]) {
  if (!rows.length) return "";
  const widths = rows[0]?.map((_, columnIndex) => Math.max(...rows.map((row) => row[columnIndex]?.length ?? 0))) ?? [];
  return rows
    .map((row, rowIndex) => {
      const line = `| ${row.map((cell, columnIndex) => cell.padEnd(widths[columnIndex] ?? 0)).join(" | ")} |`;
      if (rowIndex !== 0) return line;
      return `${line}\n| ${widths.map((width) => "-".repeat(Math.max(width, 3))).join(" | ")} |`;
    })
    .join("\n");
}

function renderMarkdown(summary: CycleSummary) {
  const modelBudget = modelBudgetFor(summary.cycleKind);
  const eventRows = [
    ["Event", "Count", "Actors", "Last seen"],
    ...summary.eventSummaries.map((item) => [item.event, String(item.count), String(item.uniqueActors), item.lastSeen ?? ""]),
  ];
  const runRows = [
    ["Run", "Req", "Start", "Done", "Persist", "Fail", "Model", "Errors"],
    ...summary.runSummaries.map((item) => [
      item.runId,
      String(item.requested),
      String(item.started),
      String(item.completed),
      String(item.persisted),
      String(item.failed),
      String(item.modelCalls),
      item.errorTypes.join(", "),
    ]),
  ];
  const modelRows = [
    ["Operation", "Calls", "Avg ms", "P50 ms", "P95 ms", "Max ms", "Input tok", "Output tok"],
    ...summary.modelCallSummaries.map((item) => [
      item.operation,
      String(item.calls),
      String(Math.round(item.averageLatencyMs)),
      String(Math.round(item.p50LatencyMs)),
      String(Math.round(item.p95LatencyMs)),
      String(Math.round(item.maxLatencyMs)),
      String(Math.round(item.inputTokens)),
      String(Math.round(item.outputTokens)),
    ]),
  ];
  const modelDrilldownRows = [
    ["Operation", "Route", "Device", "Persona", "Type", "Calls", "Avg ms", "P95 ms", "Input tok", "Output tok"],
    ...summary.modelCallDrilldowns.map((item) => [
      item.operation,
      compactRoute(item.route),
      item.device,
      item.personaId,
      item.agentType,
      String(item.calls),
      String(Math.round(item.averageLatencyMs)),
      String(Math.round(item.p95LatencyMs)),
      String(Math.round(item.inputTokens)),
      String(Math.round(item.outputTokens)),
    ]),
  ];
  return `# PostHog Cycle Summary: ${summary.cycleId}

Generated: ${summary.generatedAt}

Window: last ${summary.since}
Project: ${summary.projectId}
Cycle kind: ${summary.cycleKind}

## Totals

- Run requests: ${summary.totals.requestedRuns}
- Runs started: ${summary.totals.startedRuns}
- Runs completed: ${summary.totals.completedRuns}
- Persistence completions: ${summary.totals.persistedRuns}
- Failed runs: ${summary.totals.failedRuns}
- Model calls completed: ${summary.totals.modelCalls}
- AI generations: ${summary.totals.aiGenerations}
- Model input/output tokens: ${Math.round(summary.totals.modelInputTokens)}/${Math.round(summary.totals.modelOutputTokens)}
- Agent generation requests: ${summary.totals.agentGenerationRequests}
- Agent generation completions: ${summary.totals.agentGenerationCompletions}
- Client interactions: ${summary.totals.clientInteractions}
- Saved-agent interactions: ${summary.totals.savedAgentInteractions}
- Run form submissions/completions/failures: ${summary.totals.runFormSubmissions}/${summary.totals.runFormCompletions}/${summary.totals.runFormFailures}
- Report interactions: ${summary.totals.reportInteractions}
- Implementation handoffs: ${summary.totals.implementationHandoffs}

## Interaction Ratios

- Agent generation form completion: ${formatPercent(summary.ratios.agentGenerationFormCompletionRate)}
- Saved-agent save to selection: ${formatPercent(summary.ratios.savedAgentSaveToSelectionRate)}
- Run form completion: ${formatPercent(summary.ratios.runFormCompletionRate)}
- Report filter to handoff: ${formatPercent(summary.ratios.reportFilterToHandoffRate)}

Ratio samples:

- Agent generation form completion: ${summary.totals.agentGenerationFormCompletions}/${summary.totals.agentGenerationFormSubmissions}
- Saved-agent save to selection: ${summary.totals.savedAgentSelections}/${summary.totals.savedAgentSaves}
- Run form completion: ${summary.totals.runFormCompletions}/${summary.totals.runFormSubmissions}
- Report filter to handoff: ${summary.totals.implementationHandoffs}/${summary.totals.reportFilterChanges}

Global review only emits low-ratio warnings after at least ${RATIO_WARNING_MIN_SAMPLE_SIZE} opportunities, so one-off browser smokes prove wiring without becoming product-wide friction claims.

## Model Budget

- Budget profile: ${modelBudget.label}
- Model calls: ${summary.totals.modelCalls}/${modelBudget.maxModelCalls}
- Input tokens: ${Math.round(summary.totals.modelInputTokens)}/${modelBudget.maxInputTokens}
- Output tokens: ${Math.round(summary.totals.modelOutputTokens)}/${modelBudget.maxOutputTokens}
- Agent reaction p95 latency: ${formatLatencyBudget(summary.modelCallSummaries.find((item) => item.operation === "agent_reaction")?.p95LatencyMs, modelBudget.maxReactionP95LatencyMs)}
- Agent generation latency: ${formatLatencyBudget(summary.modelCallSummaries.find((item) => item.operation === "agent_generation")?.maxLatencyMs, modelBudget.maxGeneratorLatencyMs)}

## Global Review

Status: ${summary.globalReview.status}

${summary.globalReview.notes.map((note) => `- ${note}`).join("\n")}

## Events

${markdownTable(eventRows)}

## Runs

${markdownTable(runRows)}

## Model Calls

${markdownTable(modelRows)}

## Model Call Drilldowns

${markdownTable(modelDrilldownRows)}
`;
}

function compactRoute(route: string) {
  if (route === "unknown") return route;
  try {
    const url = new URL(route);
    return `${url.pathname}${url.search}`;
  } catch {
    return route;
  }
}

function formatLatencyBudget(value: number | undefined, budget: number) {
  return value === undefined ? `n/a/${budget}ms` : `${Math.round(value)}ms/${budget}ms`;
}

async function main() {
  const options = buildOptions();
  const summary = await summarizeCycle(options);
  if (options.format === "json") {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log(renderMarkdown(summary));
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
