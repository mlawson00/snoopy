import { describe, expect, it } from "vitest";
import {
  buildReport,
  buildSimulationReport,
  formatAgentJudgmentContext,
  formatImplementationQueueMarkdown,
  formatRecommendationCustomerOwnedCreditItem,
  formatOperationalBoundariesContext,
  formatRecommendationRelationshipContextItem,
  formatRecommendationSourceReferenceItem,
  formatRecommendationWorkItemTask,
  formatScreenEvidenceContext,
  getRecommendationCustomerOwnedCredits,
  getRecommendationRelationshipContext,
  getRecommendationSourceReferences,
  implementationQueueFilename,
  implementationQueueHref,
  normalizeFinding,
} from "./index";

describe("reports", () => {
  it("normalizes a valid finding", () => {
    expect(
      normalizeFinding({
        category: "confusion",
        severity: "medium",
        title: "Pricing label is unclear",
        evidence: "The persona hesitated on the pricing section.",
        recommendation: "Add a plain-language billing interval label.",
        confidence: 0.8,
      }).category,
    ).toBe("confusion");
  });

  it("summarizes reports", () => {
    const report = buildReport("run_1", [
      {
        category: "dead_end",
        severity: "high",
        title: "No path back to pricing",
        evidence: "Navigation hid the pricing link after opening docs.",
        recommendation: "Keep pricing available in the header.",
        confidence: 0.72,
      },
    ]);

    expect(report.summary).toContain("1 issue");
    expect(report.artifacts).toEqual([]);
  });

  it("builds evidence-backed simulation reports", () => {
    const report = buildSimulationReport({
      runId: "run_sim",
      personas: [
        {
          id: "maya",
          name: "Maya",
          role: "Buyer",
          goal: "Understand pricing.",
          backstory: "Compares tools quickly.",
          memories: ["Hidden fees wasted her time."],
          tastes: ["Clear tables"],
          motivations: ["Avoid surprises"],
          likes: ["Transparent pricing"],
          deviceHabits: ["Skims on mobile"],
          skepticism: "Needs proof.",
          trustThreshold: 0.7,
          customerOwned: true,
          privateExclusive: true,
          customerRelationship: "Private buyer reviewer for Acme Growth.",
        },
      ],
      devices: [
        {
          id: "iphone",
          label: "iPhone",
          kind: "mobile",
          viewport: { width: 390, height: 844 },
          userAgent: "test",
        },
      ],
      journeyEvents: [
        {
          personaId: "maya",
          deviceId: "iphone",
          type: "navigation",
          url: "https://example.com",
          message: "Opened page",
          occurredAt: "2026-05-09T00:00:00.000Z",
        },
      ],
      reactions: [
        {
          personaId: "maya",
          deviceId: "iphone",
          url: "https://example.com",
          emotion: "confused",
          thought: "What happens next?",
          evidence: "CTA was vague.",
          stance: "improved_since_prior",
        },
      ],
      snapshots: [
        {
          id: "moment_1",
          personaId: "maya",
          deviceId: "iphone",
          moment: "Moment 1",
          x: 10,
          y: 10,
          activity: "Homepage",
          mood: "confused",
          thought: "What happens next?",
        },
      ],
      findings: [
        {
          category: "confusion",
          severity: "medium",
          title: "CTA is vague",
          evidence: "Maya could not tell what happens next.",
          recommendation: "Use a specific CTA label.",
          confidence: 0.8,
        },
      ],
      recommendations: [
        {
          priority: "medium",
          title: "Clarify the CTA",
          targetArea: "copy",
          recommendation: "Use action-specific CTA copy.",
          evidence: "Maya hesitated on mobile.",
          affectedPersonas: ["maya"],
          affectedDevices: ["iphone"],
          implementationWorkItem: {
            exportTitle: "Clarify the CTA",
            affectedRegion: "Primary action near the hero",
            changeType: "copy",
            implementationSteps: ["Replace the vague CTA with an action-specific label."],
            acceptanceCriteria: ["A first-time visitor can say what happens after clicking the CTA."],
          },
        },
      ],
    });

    expect(report.summary).toContain("1 agents");
    expect(report.recommendations[0]?.evidence).toContain("Maya");
    expect(report.recommendations[0]?.implementationWorkItem?.affectedRegion).toContain("Primary action");
    expect(report.reactions[0]?.stance).toBe("improved_since_prior");
    expect(report.beforeAfterHypotheses[0]).toMatchObject({
      currentSignal: expect.stringContaining("Maya"),
      improvedSignal: "Use action-specific CTA copy.",
      recommendationTitle: "Clarify the CTA",
    });
    expect(report.artifacts[0]).toMatchObject({
      id: "implementation-queue",
      kind: "implementation_queue",
      format: "markdown",
      itemCount: 1,
    });
    expect(report.artifacts[0]?.href).toBe("/api/runs/run_sim/implementation-queue");
  });

  it("formats implementation work items and full queues", () => {
    const report = buildSimulationReport({
      runId: "Run Demo/Queue",
      personas: [
        {
          id: "maya",
          name: "Maya",
          role: "Buyer",
          goal: "Understand pricing.",
          backstory: "Compares tools quickly.",
          memories: ["Hidden fees wasted her time."],
          tastes: ["Clear tables"],
          motivations: ["Avoid surprises"],
          likes: ["Transparent pricing"],
          deviceHabits: ["Skims on mobile"],
          skepticism: "Needs proof.",
          trustThreshold: 0.7,
          customerOwned: true,
          privateExclusive: true,
          customerRelationship: "Private buyer reviewer for Acme Growth.",
        },
        {
          id: "leo",
          name: "Leo",
          role: "Visual critic",
          goal: "Judge whether the result is visible.",
          backstory: "Looks for premium visual proof.",
          memories: ["Weak screenshots killed trust."],
          tastes: ["Strong hierarchy"],
          motivations: ["Protect visual trust"],
          likes: ["Visible proof"],
          deviceHabits: ["Checks desktop"],
          skepticism: "Generic layout loses him.",
          trustThreshold: 0.62,
        },
      ],
      devices: [
        {
          id: "desktop",
          label: "Desktop",
          kind: "desktop",
          viewport: { width: 1440, height: 900 },
          userAgent: "test",
        },
      ],
      journeyEvents: [],
      reactions: [
        {
          personaId: "maya",
          deviceId: "desktop",
          url: "https://example.com",
          emotion: "skeptical",
          thought: "I need proof before I care.",
          evidence: "The page hid the result. I am also comparing it against Hotjar.",
          critiqueAxis: "product clarity",
          stance: "extends_prior",
          respondsToPersonaId: "leo",
          responseReason: "same_run_reply",
          responseReasonDetail: "Maya turns Leo's visual concern into a buyer outcome.",
        },
      ],
      snapshots: [],
      referenceSources: [
        {
          id: "comparison-1",
          kind: "comparison_site",
          title: "Hotjar",
          url: "https://www.hotjar.com",
          summary: "Hotjar shows product evidence near website optimization claims.",
          observedAt: "2026-05-10T00:00:00.000Z",
        },
      ],
      screenEvidence: [
        {
          id: "screen-desktop-root",
          route: "/",
          url: "https://example.com",
          deviceId: "desktop",
          width: 1440,
          height: 900,
          capturedAt: "2026-05-10T00:00:00.000Z",
          imageDataUrl: "data:image/jpeg;base64,test",
          altText: "Desktop screenshot of example.com",
          annotations: [
            {
              id: "annotation-1",
              kind: "heading",
              label: "Website result preview",
              x: 80,
              y: 120,
              width: 640,
              height: 180,
              importance: 1,
              evidence: "heading visible in captured viewport",
            },
            {
              id: "annotation-2",
              kind: "action",
              label: "Start trial",
              x: 96,
              y: 340,
              width: 160,
              height: 44,
              importance: 0.86,
            },
          ],
        },
      ],
      findings: [],
      recommendations: [
        {
          priority: "high",
          title: "Show the result first",
          targetArea: "product_clarity",
          recommendation: "Put the before/after result above the explanation.",
          evidence: "Maya wanted the outcome before reading setup copy.",
          affectedPersonas: ["maya"],
          affectedDevices: ["desktop"],
        },
      ],
    });

    const relationshipContext = getRecommendationRelationshipContext(report, report.recommendations[0]!);
    const relationshipReferences = relationshipContext.map(formatRecommendationRelationshipContextItem);
    const customerOwnedCredits = getRecommendationCustomerOwnedCredits(report, report.recommendations[0]!);
    const customerOwnedReferences = customerOwnedCredits.map(formatRecommendationCustomerOwnedCreditItem);
    const sourceReferences = getRecommendationSourceReferences(report, report.recommendations[0]!);
    const sourceReferenceText = sourceReferences.map(formatRecommendationSourceReferenceItem);
    const task = formatRecommendationWorkItemTask(
      report.recommendations[0]!,
      undefined,
      [],
      relationshipReferences,
      "Maya extended Leo is driving 1 visible fix across product clarity.",
      customerOwnedReferences,
      sourceReferenceText,
      'Hotjar is shaping 1 visible reaction and 1 visible fix.',
    );
    const context = formatAgentJudgmentContext(report);
    const screenContext = formatScreenEvidenceContext(report);
    const boundaries = formatOperationalBoundariesContext();
    const queue = formatImplementationQueueMarkdown(report);
    const filteredQueue = formatImplementationQueueMarkdown(report, {
      recommendations: report.recommendations,
      scopeSummary: 'This queue contains 1 visible task from the current report filters. Active filter: Hotjar is shaping 1 visible reaction and 1 visible fix.',
      selectedSourceFilterSummary: 'Hotjar is shaping 1 visible reaction and 1 visible fix.',
    });

    expect(task).toContain("Affected screen region: product clarity");
    expect(task).toContain("Selected relationship filter:");
    expect(task).toContain("Maya extended Leo is driving 1 visible fix across product clarity.");
    expect(task).toContain("Selected source filter:");
    expect(task).toContain("Hotjar is shaping 1 visible reaction and 1 visible fix.");
    expect(task).toContain("Customer-owned contribution:");
    expect(task).toContain("Maya (Buyer). Maya extended Leo on product clarity");
    expect(task).toContain("Private buyer reviewer for Acme Growth.");
    expect(task).toContain("Agent relationship behind this fix:");
    expect(task).toContain("Maya [customer-owned] extended Leo on product clarity");
    expect(task).toContain("Source used by agent:");
    expect(task).toContain('Maya on product clarity used comparison site "Hotjar" (https://www.hotjar.com).');
    expect(task).toContain("Acceptance criteria:");
    expect(relationshipContext[0]).toMatchObject({ personaName: "Maya", personaCustomerOwned: true, targetPersonaName: "Leo", stanceLabel: "extended" });
    expect(customerOwnedCredits[0]).toMatchObject({ personaName: "Maya", privateExclusive: true });
    expect(sourceReferences[0]).toMatchObject({ personaName: "Maya", sourceTitle: "Hotjar", sourceKind: "comparison_site" });
    expect(context).toContain("### Maya (Buyer)");
    expect(context).toContain("Latest reaction: skeptical on desktop; extends Leo; reason: same run reply");
    expect(context).toContain('Thought: "I need proof before I care."');
    expect(context).toContain("Evidence: The page hid the result.");
    expect(screenContext).toContain("##");
    expect(screenContext).toContain('annotation-1 heading "Website result preview" at 80,120 640x180');
    expect(boundaries).toContain("Production credentials stay server-side");
    expect(boundaries).toContain("read-only implementation handoff");
    expect(queue).toContain("# Snoopy Implementation Queue: Run Demo/Queue");
    expect(queue).toContain("## Agent Judgment Context");
    expect(queue).toContain("Agent relationship behind this fix:");
    expect(queue).toContain("Customer-owned contribution:");
    expect(queue).toContain("Source used by agent:");
    expect(queue).toContain('Maya on product clarity used comparison site "Hotjar"');
    expect(queue).toContain("Maya [customer-owned] extended Leo on product clarity");
    expect(queue).toContain("## Before/After Hypotheses");
    expect(queue).toContain("Current signal: Maya sees");
    expect(queue).toContain("Improved signal: Put the before/after result above the explanation.");
    expect(filteredQueue).toContain("Queue scope:");
    expect(filteredQueue).toContain("This queue contains 1 visible task from the current report filters.");
    expect(filteredQueue).toContain("Selected source filter:");
    expect(filteredQueue).toContain("Hotjar is shaping 1 visible reaction and 1 visible fix.");
    expect(queue).toContain("## Screen Evidence");
    expect(queue).toContain("Screen evidence:");
    expect(queue).toContain('desktop / (1440x900); annotations: annotation-1 heading "Website result preview"');
    expect(queue).toContain("## Operational Boundaries");
    expect(queue).toContain("Production persistence requires configured workspace storage");
    expect(queue.indexOf("## Operational Boundaries")).toBeLessThan(queue.indexOf("## Agent Judgment Context"));
    expect(queue).toContain("## Task 1: Show the result first");
    expect(queue).toContain("Reaction count: 1");
    expect(implementationQueueFilename(report.runId)).toBe("snoopy-run-demo-queue-implementation-queue.md");
    expect(implementationQueueHref(report.runId)).toBe("/api/runs/Run%20Demo%2FQueue/implementation-queue");
    expect(report.artifacts[0]?.fileName).toBe("snoopy-run-demo-queue-implementation-queue.md");
  });
});
