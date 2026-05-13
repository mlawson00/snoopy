import { ReportDetail } from "@/components/report-detail";
import { Badge, Heading, Section } from "@snoopy/ui";

export default async function RunReportPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;

  return (
    <Section>
      <Badge>Report</Badge>
      <Heading as="h1" className="mt-3 text-3xl">
        Run findings
      </Heading>
      <ReportDetail runId={runId} />
    </Section>
  );
}
