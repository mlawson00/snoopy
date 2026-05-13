import type { Report } from "@snoopy/reports";

type DevelopmentRunRecord = {
  id: string;
  status: "completed";
  safeMode: true;
  createdAt: string;
  completedAt: string;
  targetUrl: string;
  report: Report;
};

type ReportResponseRecord = {
  summary: string;
  payload: Report;
  created_at: string;
};

const STORE_KEY = "__snoopyDevelopmentRunStore";

type GlobalWithDevelopmentStore = typeof globalThis & {
  [STORE_KEY]?: Map<string, DevelopmentRunRecord>;
};

function developmentStore() {
  const globalStore = globalThis as GlobalWithDevelopmentStore;
  globalStore[STORE_KEY] ??= new Map<string, DevelopmentRunRecord>();
  return globalStore[STORE_KEY];
}

export function rememberDevelopmentRun(input: {
  targetUrl: string;
  report: Report;
  createdAt?: string;
  completedAt?: string;
}) {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const completedAt = input.completedAt ?? new Date().toISOString();
  const record: DevelopmentRunRecord = {
    id: input.report.runId,
    status: "completed",
    safeMode: true,
    createdAt,
    completedAt,
    targetUrl: input.targetUrl,
    report: input.report,
  };

  const store = developmentStore();
  store.set(record.id, record);

  for (const staleId of Array.from(store.keys()).slice(0, Math.max(0, store.size - 20))) {
    store.delete(staleId);
  }

  return {
    runId: record.id,
  };
}

export function listDevelopmentRuns() {
  return Array.from(developmentStore().values())
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map((run) => ({
      id: run.id,
      status: run.status,
      safeMode: run.safeMode,
      createdAt: run.createdAt,
      completedAt: run.completedAt,
      targetUrl: run.targetUrl,
      summary: run.report.summary,
      personaCount: run.report.personas.length,
      findingCount: run.report.findings.length,
      recommendationCount: run.report.recommendations.length,
      artifactCount: run.report.artifacts.length,
    }));
}

export function readDevelopmentRunReport(runId: string): ReportResponseRecord | null {
  const run = developmentStore().get(runId);
  if (!run) return null;

  return {
    summary: run.report.summary,
    payload: run.report,
    created_at: run.completedAt,
  };
}
