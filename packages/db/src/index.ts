import { createClient } from "@supabase/supabase-js";

export type RunStatus = "queued" | "running" | "completed" | "failed";

export type TargetSite = {
  id: string;
  workspaceId: string;
  name: string;
  url: string;
};

export type SnoopyRun = {
  id: string;
  workspaceId: string;
  targetSiteId: string;
  personaId: string;
  goalId: string;
  status: RunStatus;
  createdAt: string;
};

export type PersistedRunReference = {
  workspaceId: string;
  targetSiteId: string;
  personaId: string;
  testGoalId: string;
  runId: string;
};

export type PersistRunReportArtifact = {
  id: string;
  title: string;
  kind: string;
  format: string;
  mediaType: string;
  href: string;
  fileName: string;
  description: string;
  itemCount: number;
};

export type PersistRunPayload = {
  workspaceId: string;
  targetSite: {
    name: string;
    url: string;
  };
  persona: {
    name: string;
    role: string;
    backstory: string;
    trustThreshold: number;
    goal: string;
  };
  events: Array<{
    type: string;
    url: string;
    message: string;
    occurredAt: string;
  }>;
  report: {
    summary: string;
    findings: Array<{
      category: string;
      severity: string;
      title: string;
      evidence: string;
      recommendation: string;
      confidence: number;
    }>;
    artifacts?: PersistRunReportArtifact[];
  };
};

type SupabaseError = {
  message: string;
};

type SupabaseResponse = {
  error: SupabaseError | null;
};

type SupabaseSingleResponse<T> = {
  data: T | null;
  error: SupabaseError | null;
};

type SupabaseListResponse<T> = {
  data: T[] | null;
  error: SupabaseError | null;
};

type SupabaseInsertBuilder = PromiseLike<SupabaseResponse> & {
  select(columns?: string): {
    single(): PromiseLike<SupabaseSingleResponse<{ id: string }>>;
  };
};

export type SupabaseMutationClient = {
  from(table: string): {
    insert(values: unknown): SupabaseInsertBuilder;
  };
};

type SupabaseReadBuilder = {
  eq(column: string, value: unknown): {
    order(column: string, options?: { ascending?: boolean }): {
      limit(count: number): PromiseLike<SupabaseListResponse<Record<string, unknown>>>;
    };
    maybeSingle(): PromiseLike<SupabaseSingleResponse<Record<string, unknown>>>;
  };
};

export type SupabaseReadClient = {
  from(table: string): {
    select(columns?: string): SupabaseReadBuilder;
  };
};

export function normalizeTargetUrl(url: string): string {
  const parsed = new URL(url);
  parsed.hash = "";
  return parsed.toString();
}

export function createSupabaseServiceClient(url: string, serviceRoleKey: string): SupabaseMutationClient {
  return createUntypedSupabaseClient(url, serviceRoleKey) as SupabaseMutationClient;
}

export function createSupabaseReadClient(url: string, serviceRoleKey: string): SupabaseReadClient {
  return createUntypedSupabaseClient(url, serviceRoleKey) as SupabaseReadClient;
}

function createUntypedSupabaseClient(url: string, serviceRoleKey: string): unknown {
  const createUntypedClient = createClient as unknown as (supabaseUrl: string, supabaseKey: string, options: object) => unknown;
  return createUntypedClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function getTargetSiteName(url: string): string {
  const parsed = new URL(url);
  return parsed.hostname.replace(/^www\./, "");
}

async function insertAndReturnId(client: SupabaseMutationClient, table: string, values: unknown): Promise<string> {
  const { data, error } = await client.from(table).insert(values).select("id").single();
  if (error) throw new Error(`Failed to insert ${table}: ${error.message}`);
  if (!data?.id) throw new Error(`Failed to insert ${table}: missing id.`);
  return data.id;
}

async function insertRows(client: SupabaseMutationClient, table: string, values: unknown[]): Promise<void> {
  if (values.length === 0) return;
  const { error } = await client.from(table).insert(values);
  if (error) throw new Error(`Failed to insert ${table}: ${error.message}`);
}

export async function persistRunResult(
  client: SupabaseMutationClient,
  payload: PersistRunPayload,
): Promise<PersistedRunReference> {
  const targetSiteId = await insertAndReturnId(client, "target_sites", {
    workspace_id: payload.workspaceId,
    name: payload.targetSite.name,
    url: normalizeTargetUrl(payload.targetSite.url),
  });

  const personaId = await insertAndReturnId(client, "personas", {
    workspace_id: payload.workspaceId,
    name: payload.persona.name,
    role: payload.persona.role,
    backstory: payload.persona.backstory,
    trust_threshold: payload.persona.trustThreshold,
  });

  const testGoalId = await insertAndReturnId(client, "test_goals", {
    workspace_id: payload.workspaceId,
    title: payload.persona.goal.slice(0, 120),
    instructions: payload.persona.goal,
  });

  const runId = await insertAndReturnId(client, "runs", {
    workspace_id: payload.workspaceId,
    target_site_id: targetSiteId,
    persona_id: personaId,
    test_goal_id: testGoalId,
    status: "completed",
    safe_mode: true,
    started_at: payload.events[0]?.occurredAt ?? new Date().toISOString(),
    completed_at: new Date().toISOString(),
  });

  await insertRows(
    client,
    "browser_events",
    payload.events.map((event) => ({
      run_id: runId,
      event_type: event.type,
      url: event.url,
      message: event.message,
      occurred_at: event.occurredAt,
    })),
  );

  await insertRows(
    client,
    "findings",
    payload.report.findings.map((finding) => ({
      run_id: runId,
      category: finding.category,
      severity: finding.severity,
      title: finding.title,
      evidence: finding.evidence,
      recommendation: finding.recommendation,
      confidence: finding.confidence,
    })),
  );

  const reportId = await insertAndReturnId(client, "reports", {
    run_id: runId,
    summary: payload.report.summary,
    payload: payload.report,
  });

  await insertRows(
    client,
    "report_artifacts",
    (payload.report.artifacts ?? []).map((artifact) => ({
      report_id: reportId,
      run_id: runId,
      artifact_key: artifact.id,
      title: artifact.title,
      kind: artifact.kind,
      format: artifact.format,
      media_type: artifact.mediaType,
      href: artifact.href,
      file_name: artifact.fileName,
      description: artifact.description,
      item_count: artifact.itemCount,
      payload: artifact,
    })),
  );

  return {
    workspaceId: payload.workspaceId,
    targetSiteId,
    personaId,
    testGoalId,
    runId,
  };
}

export type RunSummary = {
  id: string;
  status: RunStatus;
  safeMode: boolean;
  createdAt: string;
  completedAt: string | null;
  targetSiteId: string;
  personaId: string;
  testGoalId: string;
};

export async function listWorkspaceRuns(
  client: SupabaseReadClient,
  workspaceId: string,
  limit = 20,
): Promise<RunSummary[]> {
  const { data, error } = await client
    .from("runs")
    .select("id,status,safe_mode,created_at,completed_at,target_site_id,persona_id,test_goal_id")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to list runs: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: String(row.id),
    status: row.status as RunStatus,
    safeMode: Boolean(row.safe_mode),
    createdAt: String(row.created_at),
    completedAt: row.completed_at ? String(row.completed_at) : null,
    targetSiteId: String(row.target_site_id),
    personaId: String(row.persona_id),
    testGoalId: String(row.test_goal_id),
  }));
}

export async function getRunReport(client: SupabaseReadClient, runId: string): Promise<Record<string, unknown> | null> {
  const { data, error } = await client.from("reports").select("summary,payload,created_at").eq("run_id", runId).maybeSingle();
  if (error) throw new Error(`Failed to load report: ${error.message}`);
  return data;
}

export function nextRunStatus(current: RunStatus, success: boolean): RunStatus {
  if (current === "queued") return "running";
  if (current === "running") return success ? "completed" : "failed";
  return current;
}
