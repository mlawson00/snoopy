"use client";

import Link from "next/link";
import { ExternalLink, FileText, ListChecks, MessageSquareQuote } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, Heading } from "@snoopy/ui";

type RunSummary = {
  id: string;
  status: string;
  safeMode: boolean;
  createdAt: string;
  completedAt: string | null;
  targetUrl?: string;
  summary?: string;
  personaCount?: number;
  findingCount?: number;
  recommendationCount?: number;
  artifactCount?: number;
};

type RunsResponse = {
  runs: RunSummary[];
  persistence: {
    status: string;
    reason?: string;
  };
};

export function RunHistory() {
  const [response, setResponse] = useState<RunsResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/runs")
      .then((res) => res.json() as Promise<RunsResponse>)
      .then((data) => {
        if (!cancelled) setResponse(data);
      })
      .catch(() => {
        if (!cancelled) setResponse({ runs: [], persistence: { status: "failed", reason: "Unable to load runs." } });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card className="mx-auto mt-8 w-full max-w-5xl">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Heading as="h2" className="text-xl">
            Recent work
          </Heading>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Reopen the conversation, evidence, before/after recommendations, and implementation plan from each teardown.</p>
        </div>
        <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-600">
          Workspace feed: {response?.persistence.status ?? "loading"}
        </span>
      </div>
      <div className="divide-y divide-slate-200">
        {(response?.runs ?? []).map((run) => (
          <RunHistoryItem key={run.id} run={run} />
        ))}
      </div>
      {response?.runs.length === 0 ? <p className="pt-4 text-sm text-slate-600">No teardowns yet. Start with a URL and Snoopy will fill this with report artifacts.</p> : null}
    </Card>
  );
}

function RunHistoryItem({ run }: { run: RunSummary }) {
  const targetLabel = run.targetUrl ? displayTarget(run.targetUrl) : friendlyRunName(run.id);
  const completedLabel = run.completedAt ? formatCompletedAt(run.completedAt) : run.status;
  const recommendationCount = run.recommendationCount ?? 0;
  const findingCount = run.findingCount ?? 0;
  const artifactCount = run.artifactCount ?? 0;
  const personaCount = run.personaCount ?? 7;
  const evidenceChips = [
    `${personaCount} voices`,
    `${findingCount} finding${findingCount === 1 ? "" : "s"}`,
    `${recommendationCount} fix${recommendationCount === 1 ? "" : "es"}`,
    artifactCount > 0 ? `${artifactCount} artifact${artifactCount === 1 ? "" : "s"}` : "plan pending",
  ];

  return (
    <Link href={`/runs/${run.id}`} className="group block py-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold uppercase text-amber-950">{run.status}</span>
            <span className="text-sm text-slate-500">{completedLabel}</span>
          </div>
          <div className="mt-3 flex items-start gap-3">
            <FileText className="mt-1 shrink-0 text-slate-950" size={20} />
            <div>
              <span className="block text-lg font-semibold text-slate-950 group-hover:text-amber-900">{targetLabel}</span>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{run.summary ?? "Report, critic reactions, recommendations, and handoff artifacts are available to inspect."}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {evidenceChips.map((chip) => (
              <span key={chip} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700">
                {chip.includes("voice") ? <MessageSquareQuote size={14} /> : <ListChecks size={14} />}
                {chip}
              </span>
            ))}
          </div>
        </div>
        <span className="inline-flex min-h-10 w-fit items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white group-hover:bg-amber-900">
          Open report
          <ExternalLink size={15} />
        </span>
      </div>
    </Link>
  );
}

function displayTarget(targetUrl: string) {
  if (targetUrl.startsWith("/")) return targetUrl;

  try {
    const url = new URL(targetUrl);
    return url.hostname.replace(/^www\./, "") + url.pathname.replace(/\/$/, "");
  } catch {
    return targetUrl;
  }
}

function friendlyRunName(id: string) {
  return id
    .replace(/^run_/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatCompletedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "completed";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
