import { NextResponse } from "next/server";
import { createSupabaseReadClient, getRunReport } from "@snoopy/db";
import { formatImplementationQueueMarkdown, implementationQueueFilename, reportSchema, type Report } from "@snoopy/reports";
import { getDemoRunReport } from "../../demo-reports";
import { readDevelopmentRunReport } from "../../development-run-store";

function markdownResponse(report: Report) {
  return new NextResponse(formatImplementationQueueMarkdown(report), {
    headers: {
      "cache-control": "no-store",
      "content-disposition": `attachment; filename="${implementationQueueFilename(report.runId)}"`,
      "content-type": "text/markdown; charset=utf-8",
    },
  });
}

export async function GET(_request: Request, { params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    const generatedReport = readDevelopmentRunReport(runId);
    if (generatedReport) {
      return markdownResponse(reportSchema.parse(generatedReport.payload));
    }

    const demoReport = getDemoRunReport(runId);
    if (demoReport) {
      return markdownResponse(demoReport);
    }

    return NextResponse.json(
      {
        error: "Implementation queue is unavailable because this report is not persisted in the running workspace session.",
        persistence: {
          status: "missing",
        },
      },
      { status: 404 },
    );
  }

  const persistedReport = await getRunReport(createSupabaseReadClient(supabaseUrl, serviceRoleKey), runId);
  if (!persistedReport?.payload) {
    return NextResponse.json(
      {
        error: "Implementation queue is unavailable because the report was not found.",
        persistence: {
          status: "missing",
        },
      },
      { status: 404 },
    );
  }

  return markdownResponse(reportSchema.parse(persistedReport.payload));
}
