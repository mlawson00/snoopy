import { describe, expect, it } from "vitest";
import { getTargetSiteName, nextRunStatus, normalizeTargetUrl, persistRunResult, type SupabaseMutationClient } from "./index";

describe("db helpers", () => {
  it("normalizes target URLs", () => {
    expect(normalizeTargetUrl("https://example.com/pricing#faq")).toBe("https://example.com/pricing");
  });

  it("moves runs through valid statuses", () => {
    expect(nextRunStatus("queued", true)).toBe("running");
    expect(nextRunStatus("running", true)).toBe("completed");
  });

  it("persists a complete run graph", async () => {
    const inserts: Array<{ table: string; values: unknown }> = [];
    const client = createMockClient(inserts);

    const reference = await persistRunResult(client, {
      workspaceId: "workspace_1",
      targetSite: { name: getTargetSiteName("https://example.com/pricing"), url: "https://example.com/pricing" },
      persona: {
        name: "Maya",
        role: "Buyer",
        backstory: "Evaluates sites quickly.",
        trustThreshold: 0.7,
        goal: "Understand pricing.",
      },
      events: [{ type: "navigation", url: "https://example.com/pricing", message: "Opened page", occurredAt: "2026-05-09T00:00:00.000Z" }],
      report: {
        summary: "1 issue found.",
        findings: [
          {
            category: "confusion",
            severity: "medium",
            title: "Unclear copy",
            evidence: "The label was vague.",
            recommendation: "Use direct copy.",
            confidence: 0.8,
          },
        ],
        artifacts: [
          {
            id: "implementation-queue",
            title: "Implementation queue",
            kind: "implementation_queue",
            format: "markdown",
            mediaType: "text/markdown",
            href: "/api/runs/run_1/implementation-queue",
            fileName: "snoopy-run-1-implementation-queue.md",
            description: "Markdown handoff with implementation work.",
            itemCount: 1,
          },
        ],
      },
    });

    expect(reference.runId).toBe("runs_1");
    expect(inserts.map((insert) => insert.table)).toEqual([
      "target_sites",
      "personas",
      "test_goals",
      "runs",
      "browser_events",
      "findings",
      "reports",
      "report_artifacts",
    ]);
    expect(inserts.find((insert) => insert.table === "report_artifacts")?.values).toEqual([
      {
        report_id: "reports_1",
        run_id: "runs_1",
        artifact_key: "implementation-queue",
        title: "Implementation queue",
        kind: "implementation_queue",
        format: "markdown",
        media_type: "text/markdown",
        href: "/api/runs/run_1/implementation-queue",
        file_name: "snoopy-run-1-implementation-queue.md",
        description: "Markdown handoff with implementation work.",
        item_count: 1,
        payload: {
          id: "implementation-queue",
          title: "Implementation queue",
          kind: "implementation_queue",
          format: "markdown",
          mediaType: "text/markdown",
          href: "/api/runs/run_1/implementation-queue",
          fileName: "snoopy-run-1-implementation-queue.md",
          description: "Markdown handoff with implementation work.",
          itemCount: 1,
        },
      },
    ]);
  });
});

function createMockClient(inserts: Array<{ table: string; values: unknown }>): SupabaseMutationClient {
  const counts = new Map<string, number>();

  return {
    from(table: string) {
      return {
        insert(values: unknown) {
          inserts.push({ table, values });
          const response = Promise.resolve({ error: null });
          return Object.assign(response, {
            select() {
              return {
                single() {
                  const count = (counts.get(table) ?? 0) + 1;
                  counts.set(table, count);
                  return Promise.resolve({ data: { id: `${table}_${count}` }, error: null });
                },
              };
            },
          });
        },
      };
    },
  };
}
