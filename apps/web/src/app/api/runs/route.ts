import { NextResponse } from "next/server";
import { createSupabaseReadClient, createSupabaseServiceClient, getTargetSiteName, listWorkspaceRuns, persistRunResult } from "@snoopy/db";
import { defaultPersonas, runSafeBrowserAudit } from "@snoopy/runner";
import { captureServerEvent, distinctIdFromRequest, flushServerAnalytics, posthogSessionIdFromRequest } from "@/lib/server-analytics";
import { buildRunFailureProperties, runErrorMessage, runFailureStatus } from "./analytics";
import { listDevelopmentRuns, rememberDevelopmentRun } from "./development-run-store";

export async function GET() {
  const workspaceId = process.env.SNOOPY_DEFAULT_WORKSPACE_ID;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!workspaceId || !supabaseUrl || !serviceRoleKey) {
    const generatedRuns = listDevelopmentRuns();
    return NextResponse.json({
      runs: [
        ...generatedRuns,
        {
          id: "run_demo_pricing",
          status: "completed",
          safeMode: true,
          createdAt: "2026-05-09T00:00:00.000Z",
          completedAt: "2026-05-09T00:03:00.000Z",
          targetUrl: "/settings/billing",
          summary: "Pricing teardown produced paid-plan clarity, proof near the decision, and a plan another agent can implement.",
          personaCount: 7,
          findingCount: 2,
          recommendationCount: 3,
          artifactCount: 1,
        },
        {
          id: "run_demo_signup",
          status: "completed",
          safeMode: true,
          createdAt: "2026-05-09T00:10:00.000Z",
          completedAt: "2026-05-09T00:13:00.000Z",
          targetUrl: "/runs/new",
          summary: "Run setup teardown checked URL-first flow, saved customer agents, and default-heavy setup.",
          personaCount: 7,
          findingCount: 1,
          recommendationCount: 2,
          artifactCount: 1,
        },
      ],
      persistence: {
        status: generatedRuns.length ? "generated" : "demo",
        reason: "Production workspace persistence is not configured.",
      },
    });
  }

  const runs = await listWorkspaceRuns(createSupabaseReadClient(supabaseUrl, serviceRoleKey), workspaceId);
  return NextResponse.json({ runs, persistence: { status: "loaded" } });
}

export async function POST(request: Request) {
  const body = await request.json();
  const distinctId = distinctIdFromRequest(request);
  const posthogSessionId = posthogSessionIdFromRequest(request);
  const additionalPersonas = Array.isArray(body.additionalPersonas) ? body.additionalPersonas : [];
  const personas = body.personas ?? (additionalPersonas.length > 0 ? [...defaultPersonas, ...additionalPersonas].slice(0, 10) : undefined);
  const runId = body.runId ?? crypto.randomUUID();
  captureServerEvent(distinctId, "snoopy_run_requested", {
    run_id: runId,
    cycle_id: body.cycleId,
    target_url: body.targetUrl,
    additional_persona_count: additionalPersonas.length,
    persona_count: Array.isArray(personas) ? personas.length : defaultPersonas.length,
    comparison_url_count: Array.isArray(body.comparisonUrls) ? body.comparisonUrls.length : 0,
    news_url_count: Array.isArray(body.newsUrls) ? body.newsUrls.length : 0,
    max_pages: body.maxPages ?? 1,
    posthog_session_id: posthogSessionId,
  });
  let result;
  try {
    result = await runSafeBrowserAudit({
      runId,
      targetUrl: body.targetUrl,
      goal: body.goal,
      persona: body.persona,
      personas,
      devices: body.devices,
      comparisonUrls: body.comparisonUrls,
      newsUrls: body.newsUrls,
      marketContext: body.marketContext,
      priorPersonaOutputs: body.priorPersonaOutputs,
      analyticsDistinctId: distinctId,
      cycleId: body.cycleId,
      maxPages: body.maxPages,
      safeMode: true,
    });
  } catch (error) {
    captureServerEvent(
      distinctId,
      "snoopy_run_failed",
      buildRunFailureProperties({
        runId,
        targetUrl: body.targetUrl,
        cycleId: body.cycleId,
        posthogSessionId,
        error,
      }),
    );
    await flushServerAnalytics();
    return NextResponse.json(
      {
        runId,
        persistence: {
          status: "failed",
          reason: runErrorMessage(error),
        },
      },
      { status: runFailureStatus(error) },
    );
  }

  const workspaceId = body.workspaceId ?? process.env.SNOOPY_DEFAULT_WORKSPACE_ID;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!workspaceId || !supabaseUrl || !serviceRoleKey) {
    const reference = rememberDevelopmentRun({
      targetUrl: result.input.targetUrl,
      report: result.report,
      createdAt: result.events[0]?.occurredAt,
      completedAt: new Date().toISOString(),
    });

    captureServerEvent(distinctId, "snoopy_run_persistence_completed", {
      run_id: runId,
      cycle_id: body.cycleId,
      persistence_status: "generated",
      reaction_count: result.report.reactions.length,
      finding_count: result.report.findings.length,
      recommendation_count: result.report.recommendations.length,
      posthog_session_id: posthogSessionId,
    });
    await flushServerAnalytics();
    return NextResponse.json({
      ...result,
      persistence: {
        status: "generated",
        reason: "Report is available in this running workspace session. Configure production workspace persistence before customer use.",
        reference,
      },
    });
  }

  try {
    const primaryPersona = result.report.personas[0] ?? result.input.persona;
    if (!primaryPersona) {
      throw new Error("Run did not produce a persona to persist.");
    }

    const reference = await persistRunResult(createSupabaseServiceClient(supabaseUrl, serviceRoleKey), {
      workspaceId,
      targetSite: {
        name: body.targetName ?? getTargetSiteName(result.input.targetUrl),
        url: result.input.targetUrl,
      },
      persona: {
        name: primaryPersona.name,
        role: primaryPersona.role,
        backstory: primaryPersona.backstory,
        trustThreshold: primaryPersona.trustThreshold,
        goal: primaryPersona.goal,
      },
      events: result.events,
      report: result.report,
    });

    captureServerEvent(distinctId, "snoopy_run_persistence_completed", {
      run_id: runId,
      cycle_id: body.cycleId,
      persistence_status: "persisted",
      persisted_run_id: reference.runId,
      reaction_count: result.report.reactions.length,
      finding_count: result.report.findings.length,
      recommendation_count: result.report.recommendations.length,
      posthog_session_id: posthogSessionId,
    });
    await flushServerAnalytics();
    return NextResponse.json({
      ...result,
      persistence: {
        status: "persisted",
        reference,
      },
    });
  } catch (error) {
    captureServerEvent(distinctId, "snoopy_run_persistence_completed", {
      run_id: runId,
      cycle_id: body.cycleId,
      persistence_status: "failed",
      reason: error instanceof Error ? error.message : "Unknown persistence error.",
      reaction_count: result.report.reactions.length,
      finding_count: result.report.findings.length,
      recommendation_count: result.report.recommendations.length,
      posthog_session_id: posthogSessionId,
    });
    await flushServerAnalytics();
    return NextResponse.json(
      {
        ...result,
        persistence: {
          status: "failed",
          reason: error instanceof Error ? error.message : "Unknown persistence error.",
        },
      },
      { status: 202 },
    );
  }
}
