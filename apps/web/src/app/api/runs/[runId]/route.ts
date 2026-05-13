import { NextResponse } from "next/server";
import { createSupabaseReadClient, getRunReport } from "@snoopy/db";
import { getDemoRunReport } from "../demo-reports";
import { readDevelopmentRunReport } from "../development-run-store";

export async function GET(_request: Request, { params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    const generatedReport = readDevelopmentRunReport(runId);
    if (generatedReport) {
      return NextResponse.json({
        report: generatedReport,
        persistence: {
          status: "generated",
        },
      });
    }

    const demoReport = getDemoRunReport(runId);
    if (demoReport) {
      return NextResponse.json({
        report: {
          summary: demoReport.summary,
          payload: demoReport,
          created_at: "2026-05-09T00:03:00.000Z",
        },
        persistence: {
          status: "demo",
        },
      });
    }

    return NextResponse.json({
      report: null,
      persistence: {
        status: "demo",
        reason: "Production workspace persistence is not configured.",
      },
    });
  }

  const report = await getRunReport(createSupabaseReadClient(supabaseUrl, serviceRoleKey), runId);
  return NextResponse.json({ report, persistence: { status: report ? "loaded" : "missing" } });
}
