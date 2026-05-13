import { createServer, type Server } from "node:http";
import { describe, expect, it } from "vitest";
import { defaultDeviceProfiles, defaultPersonas, runSafeBrowserAudit, validateRunInput } from "./index";

const validInput = {
  runId: "run_1",
  targetUrl: "https://example.com",
  persona: {
    name: "Maya",
    role: "Operations buyer",
    goal: "Understand pricing and decide whether to start a trial",
    backstory: "Evaluates software quickly between meetings.",
    trustThreshold: 0.7,
  },
  safeMode: true,
};

describe("runner", () => {
  it("validates run input", () => {
    expect(validateRunInput(validInput).persona?.name).toBe("Maya");
  });

  it("defaults to seven distinct critics and four devices", () => {
    const input = validateRunInput({
      runId: "run_defaults",
      targetUrl: "https://example.com",
      safeMode: true,
    });

    expect(input.personas).toHaveLength(7);
    expect(input.devices).toHaveLength(4);
    expect(input.personas?.[0]?.memories?.length).toBeGreaterThan(0);
    const ivy = input.personas?.find((persona) => persona.id === "ivy");
    expect(ivy?.role).toMatch(/visually impaired/i);
    expect(ivy?.deviceHabits?.join(" ") ?? "").toMatch(/screen reader|zoom/i);
    const quinn = input.personas?.find((persona) => persona.id === "quinn");
    expect(quinn?.critiqueLens?.join(" ")).toMatch(/agent readiness/i);
    expect(quinn?.voice?.profanityLevel).toBe("moderate");
    const mike = input.personas?.find((persona) => persona.id === "mike-the-creator");
    expect(mike?.name).toBe("MIKE THE CREATOR");
    expect(mike?.personalityFacets?.thinking).toBeGreaterThan(0.85);
    expect(new Set(input.personas?.flatMap((persona) => persona.critiqueLens ?? [])).size).toBeGreaterThan(12);
  });

  it("produces a read-only report", async () => {
    const server = await createTestServer();
    const address = server.address();
    if (typeof address !== "object" || address === null) {
      server.close();
      throw new Error("Test server did not expose a port.");
    }

    const result = await runSafeBrowserAudit({
      ...validInput,
      targetUrl: `http://127.0.0.1:${address.port}`,
    });
    server.close();

    expect(result.report.findings[0]?.category).toBe("conversion_friction");
    expect(result.events.some((event) => event.type === "blocked_submit")).toBe(true);
  });

  it("classifies copy and orientation friction", async () => {
    const server = await createSparseTestServer();
    const address = server.address();
    if (typeof address !== "object" || address === null) {
      server.close();
      throw new Error("Test server did not expose a port.");
    }

    const result = await runSafeBrowserAudit({
      ...validInput,
      targetUrl: `http://127.0.0.1:${address.port}`,
    });
    server.close();

    const categories = result.report.findings.map((finding) => finding.category);
    expect(categories).toContain("confusion");
    expect(categories).toContain("copy_problem");
    expect(categories).toContain("dead_end");
  });

  it("does not flag report-specific implementation actions as generic CTA copy", async () => {
    const server = await createImplementationPlanActionTestServer();
    const address = server.address();
    if (typeof address !== "object" || address === null) {
      server.close();
      throw new Error("Test server did not expose a port.");
    }

    const result = await runSafeBrowserAudit({
      ...validInput,
      targetUrl: `http://127.0.0.1:${address.port}`,
    });
    server.close();

    expect(result.report.findings.map((finding) => finding.title)).not.toContain("CTA copy is too generic");
  });

  it("records persona/device journeys, reactions, snapshots, and recommendations", async () => {
    const server = await createTestServer();
    const address = server.address();
    if (typeof address !== "object" || address === null) {
      server.close();
      throw new Error("Test server did not expose a port.");
    }

    const result = await runSafeBrowserAudit({
      runId: "run_matrix",
      targetUrl: `http://127.0.0.1:${address.port}`,
      personas: defaultPersonas.slice(0, 2),
      devices: defaultDeviceProfiles.slice(0, 2),
      maxPages: 1,
      safeMode: true,
    });
    server.close();

    expect(result.report.personas).toHaveLength(2);
    expect(result.report.devices).toHaveLength(2);
    expect(result.report.journeyEvents.filter((event) => event.type === "navigation")).toHaveLength(4);
    expect(result.report.reactions).toHaveLength(4);
    expect(result.report.snapshots.length).toBeGreaterThan(0);
    expect(result.report.screenEvidence.length).toBeGreaterThan(0);
    expect(result.report.screenEvidence[0]?.imageDataUrl).toMatch(/^data:image\/jpeg;base64,/);
    expect(result.report.screenEvidence[0]?.annotations.length).toBeGreaterThan(0);
    expect(result.report.screenEvidence[0]?.annotations[0]?.width).toBeGreaterThan(0);
    expect(result.report.recommendations.length).toBeGreaterThan(0);
    expect(result.report.recommendations[0]?.affectedDevices.length).toBeGreaterThan(0);
    expect(result.report.recommendations[0]?.implementationWorkItem?.acceptanceCriteria.length).toBeGreaterThan(0);
    expect(result.report.artifacts[0]?.kind).toBe("implementation_queue");
    expect(result.report.artifacts[0]?.href).toBe("/api/runs/run_matrix/implementation-queue");
  });

  it("lets agents respond to each other within the same run when no prior cycle exists", async () => {
    const server = await createAgentReadinessTestServer();
    const address = server.address();
    if (typeof address !== "object" || address === null) {
      server.close();
      throw new Error("Test server did not expose a port.");
    }

    const result = await runSafeBrowserAudit({
      runId: "run_same_run_conversation",
      targetUrl: `http://127.0.0.1:${address.port}`,
      personas: defaultPersonas.slice(0, 3),
      devices: defaultDeviceProfiles.slice(0, 1),
      maxPages: 1,
      safeMode: true,
    });
    server.close();

    expect(result.report.reactions).toHaveLength(3);
    expect(result.report.reactions[0]?.stance).toBe("independent");
    expect(result.report.reactions.slice(1).every((reaction) => reaction.respondsToPersonaId)).toBe(true);
    expect(result.report.reactions[1]?.thought).toContain("Maya");
    expect(result.report.reactions[2]?.thought).toContain("Leo");
    expect(result.report.reactions[1]?.responseReason).toBe("facet_contrast");
    expect(result.report.reactions[2]?.responseReason).toBe("facet_contrast");
    expect(result.report.reactions[1]?.responseReasonDetail).toContain("Leo leans");
    expect(result.report.reactions[1]?.responseReasonDetail).toContain("Maya leans");
    expect(result.report.consensus?.stanceCounts.extends_prior ?? 0).toBeGreaterThan(0);
  });

  it("marks same-axis positive agreement as support instead of another extension", async () => {
    const server = await createDarkPanelContrastTestServer();
    const address = server.address();
    if (typeof address !== "object" || address === null) {
      server.close();
      throw new Error("Test server did not expose a port.");
    }

    const leo = defaultPersonas.find((persona) => persona.id === "leo");
    if (!leo) {
      server.close();
      throw new Error("Expected Leo persona.");
    }

    const result = await runSafeBrowserAudit({
      runId: "run_positive_same_axis_support",
      targetUrl: `http://127.0.0.1:${address.port}`,
      personas: [
        leo,
        {
          id: "custom-brand-guardian",
          name: "Brand Guardian",
          role: "Customer-owned visual brand guardian",
          goal: "Protect premium visual quality.",
          backstory: "A customer-owned reviewer with a strong visual taste.",
          trustThreshold: 0.72,
          critiqueLens: ["visual design", "brand quality"],
          personalityFacets: {
            introversion: 0.46,
            extraversion: 0.54,
            sensing: 0.62,
            intuition: 0.38,
            thinking: 0.58,
            feeling: 0.42,
            judging: 0.66,
            perceiving: 0.34,
          },
          customerOwned: true,
        },
      ],
      devices: defaultDeviceProfiles.slice(3, 4),
      maxPages: 1,
      safeMode: true,
    });
    server.close();

    const brandGuardianReaction = result.report.reactions.find((reaction) => reaction.personaId === "custom-brand-guardian");
    expect(brandGuardianReaction?.critiqueAxis).toBe("visual design");
    expect(brandGuardianReaction?.stance).toBe("supports_prior");
    expect(brandGuardianReaction?.responseReason).toBe("same_evidence");
    expect(brandGuardianReaction?.thought).toContain("I agree with Leo here:");
  });

  it("seeds initial localStorage before capturing a page", async () => {
    const server = await createLocalStorageEchoTestServer();
    const address = server.address();
    if (typeof address !== "object" || address === null) {
      server.close();
      throw new Error("Test server did not expose a port.");
    }

    const result = await runSafeBrowserAudit({
      runId: "run_local_storage",
      targetUrl: `http://127.0.0.1:${address.port}`,
      personas: defaultPersonas.slice(0, 1),
      devices: defaultDeviceProfiles.slice(0, 1),
      maxPages: 1,
      initialLocalStorage: {
        "snoopy.test": "Pricing security privacy demo example for a saved Brand Guardian agent.",
      },
      safeMode: true,
    });
    server.close();

    const categories = result.report.findings.map((finding) => finding.category);
    expect(categories).not.toContain("conversion_friction");
    expect(categories).not.toContain("trust_issue");
    expect(categories).not.toContain("confusion");
  });

  it("flags hard-to-see UI through visual and accessibility agents", async () => {
    const server = await createHardToReadTestServer();
    const address = server.address();
    if (typeof address !== "object" || address === null) {
      server.close();
      throw new Error("Test server did not expose a port.");
    }

    const leo = defaultPersonas.find((persona) => persona.id === "leo");
    const ivy = defaultPersonas.find((persona) => persona.id === "ivy");
    if (!leo || !ivy) {
      server.close();
      throw new Error("Expected visual and accessibility personas.");
    }

    const result = await runSafeBrowserAudit({
      runId: "run_hard_to_read",
      targetUrl: `http://127.0.0.1:${address.port}`,
      personas: [leo, ivy],
      devices: defaultDeviceProfiles.slice(3, 4),
      maxPages: 1,
      safeMode: true,
    });
    server.close();

    expect(result.report.reactions.some((reaction) => reaction.critiqueAxis === "visual design" && /looks like (absolute )?ass/i.test(reaction.thought))).toBe(
      true,
    );
    expect(result.report.reactions.some((reaction) => reaction.critiqueAxis === "accessibility" && /screen-reader|zoom/i.test(reaction.thought))).toBe(true);
    expect(result.report.findings.map((finding) => finding.category)).toContain("visual_design");
    expect(result.report.findings.map((finding) => finding.category)).toContain("accessibility");
  });

  it("judges contrast against the visible ancestor background", async () => {
    const server = await createDarkPanelContrastTestServer();
    const address = server.address();
    if (typeof address !== "object" || address === null) {
      server.close();
      throw new Error("Test server did not expose a port.");
    }

    const leo = defaultPersonas.find((persona) => persona.id === "leo");
    const ivy = defaultPersonas.find((persona) => persona.id === "ivy");
    if (!leo || !ivy) {
      server.close();
      throw new Error("Expected visual and accessibility personas.");
    }

    const result = await runSafeBrowserAudit({
      runId: "run_dark_panel_contrast",
      targetUrl: `http://127.0.0.1:${address.port}`,
      personas: [leo, ivy],
      devices: [defaultDeviceProfiles[0]!, defaultDeviceProfiles[3]!],
      maxPages: 1,
      safeMode: true,
    });
    server.close();

    expect(result.report.findings.map((finding) => finding.category)).not.toContain("visual_design");
    expect(result.report.findings.map((finding) => finding.category)).not.toContain("accessibility");
    expect(result.report.reactions[0]?.thought).toContain("designed, not just assembled");
    expect(result.report.reactions[2]?.thought).toContain("hard readability blocker");
    expect(result.report.reactions[0]?.thought).not.toBe(result.report.reactions[1]?.thought);
    expect(result.report.reactions[2]?.thought).not.toBe(result.report.reactions[3]?.thought);
    expect(result.report.reactions[0]?.thought).toContain("On mobile");
    expect(result.report.reactions[1]?.thought).toContain("On desktop");
    expect(result.report.reactions[2]?.thought).toContain("zoomed reading");
    expect(result.report.reactions[3]?.thought).toContain("dense report detail");
    expect(result.report.findings.map((finding) => finding.category)).toContain("suggested_fix");
    expect(result.report.recommendations.length).toBeGreaterThan(1);
    expect(result.report.recommendations.map((recommendation) => recommendation.title)).toContain("Give the report a stronger visual focal point");
    expect(result.report.recommendations.map((recommendation) => recommendation.title)).toContain("Keep important words readable under tired-reader conditions");
  });

  it("evaluates JSON API routes as machine-readable contracts instead of visual pages", async () => {
    const server = await createJsonContractTestServer();
    const address = server.address();
    if (typeof address !== "object" || address === null) {
      server.close();
      throw new Error("Test server did not expose a port.");
    }

    const leo = defaultPersonas.find((persona) => persona.id === "leo");
    const ivy = defaultPersonas.find((persona) => persona.id === "ivy");
    const quinn = defaultPersonas.find((persona) => persona.id === "quinn");
    if (!leo || !ivy || !quinn) {
      server.close();
      throw new Error("Expected visual, accessibility, and agent-readiness personas.");
    }

    const result = await runSafeBrowserAudit({
      runId: "run_json_contract",
      targetUrl: `http://127.0.0.1:${address.port}/api/service-metadata`,
      personas: [leo, ivy, quinn],
      devices: defaultDeviceProfiles.slice(0, 1),
      maxPages: 1,
      safeMode: true,
    });
    server.close();

    const categories = result.report.findings.map((finding) => finding.category);
    expect(categories).not.toContain("visual_design");
    expect(categories).not.toContain("accessibility");
    expect(categories).not.toContain("trust_issue");
    expect(result.report.findings.map((finding) => finding.title)).not.toContain("Machine-readable route lacks examples or field guidance");
    expect(result.report.findings[0]?.category).toBe("suggested_fix");
    expect(result.report.reactions.some((reaction) => reaction.thought.includes("raw machine output"))).toBe(true);
    expect(result.report.reactions.some((reaction) => reaction.thought.includes("not scoring raw JSON as a visual page"))).toBe(true);
    expect(result.report.reactions.some((reaction) => reaction.thought.includes("JSON as an agent contract"))).toBe(true);
  });

  it("evaluates downloadable markdown queues as implementation artifacts instead of visual pages", async () => {
    const server = await createMarkdownArtifactTestServer();
    const address = server.address();
    if (typeof address !== "object" || address === null) {
      server.close();
      throw new Error("Test server did not expose a port.");
    }

    const leo = defaultPersonas.find((persona) => persona.id === "leo");
    const ivy = defaultPersonas.find((persona) => persona.id === "ivy");
    const quinn = defaultPersonas.find((persona) => persona.id === "quinn");
    if (!leo || !ivy || !quinn) {
      server.close();
      throw new Error("Expected visual, accessibility, and agent-readiness personas.");
    }

    const result = await runSafeBrowserAudit({
      runId: "run_markdown_queue",
      targetUrl: `http://127.0.0.1:${address.port}/api/runs/run_demo_pricing/implementation-queue`,
      personas: [leo, ivy, quinn],
      devices: defaultDeviceProfiles.slice(0, 1),
      maxPages: 1,
      safeMode: true,
    });
    server.close();

    const categories = result.report.findings.map((finding) => finding.category);
    expect(categories).not.toContain("visual_design");
    expect(categories).not.toContain("accessibility");
    expect(categories).not.toContain("trust_issue");
    expect(categories).not.toContain("dead_end");
    expect(result.report.findings[0]?.category).toBe("suggested_fix");
    expect(result.report.reactions).toHaveLength(3);
    expect(result.report.reactions.some((reaction) => reaction.thought.includes("markdown as an implementation queue"))).toBe(true);
    expect(result.report.journeyEvents.some((event) => event.message.includes("downloadable markdown implementation queue"))).toBe(true);
  });

  it("honors custom agent profanity settings when the critique warrants it", async () => {
    const server = await createHardToReadTestServer();
    const address = server.address();
    if (typeof address !== "object" || address === null) {
      server.close();
      throw new Error("Test server did not expose a port.");
    }

    const result = await runSafeBrowserAudit({
      runId: "run_custom_blunt",
      targetUrl: `http://127.0.0.1:${address.port}`,
      personas: [
        {
          id: "custom-blunt",
          name: "Mike",
          role: "Blunt product owner",
          goal: "Evaluate whether the UI is commercially good enough.",
          backstory: "Created by the user to test whether custom agents can sound like real people.",
          trustThreshold: 0.72,
          critiqueLens: ["visual design", "UI quality", "commercial taste"],
          voice: { style: "blunt", allowsMildProfanity: true, profanityLevel: "moderate" },
        },
      ],
      devices: defaultDeviceProfiles.slice(3, 4),
      maxPages: 1,
      safeMode: true,
    });
    server.close();

    expect(result.report.reactions[0]?.personaId).toBe("custom-blunt");
    expect(result.report.reactions[0]?.thought).toMatch(/absolute ass/i);
  });

  it("lets agents respond to prior persona outputs instead of repeating the same critique", async () => {
    const server = await createTestServer();
    const address = server.address();
    if (typeof address !== "object" || address === null) {
      server.close();
      throw new Error("Test server did not expose a port.");
    }

    const quinn = defaultPersonas.find((persona) => persona.id === "quinn");
    if (!quinn) {
      server.close();
      throw new Error("Expected agent-readiness persona.");
    }

    const result = await runSafeBrowserAudit({
      runId: "run_prior_outputs",
      targetUrl: `http://127.0.0.1:${address.port}`,
      personas: [quinn],
      devices: defaultDeviceProfiles.slice(2, 3),
      maxPages: 1,
      priorPersonaOutputs: [
        { cycleId: "cycle-004", personaId: "maya", thought: "The CTA is vague.", category: "confusion" },
        { cycleId: "cycle-004", personaId: "leo", thought: "The CTA is vague.", category: "confusion" },
        { cycleId: "cycle-004", personaId: "nora", thought: "The CTA is vague.", category: "confusion" },
        { cycleId: "cycle-004", personaId: "omar", thought: "The CTA is vague.", category: "confusion" },
      ],
      safeMode: true,
    });
    server.close();

    expect(result.report.reactions[0]?.thought).toContain("repeated prior output");
    expect(result.report.reactions[0]?.thought).toContain("Maya");
    expect(result.report.reactions[0]?.stance).toBe("extends_prior");
    expect(result.report.reactions[0]?.responseReason).toBe("prior_memory");
    expect(result.report.consensus?.uniqueCritiqueAxes).toContain("agent readiness");
  });

  it("describes self-memory as an earlier read instead of pretending another agent spoke", async () => {
    const server = await createTestServer();
    const address = server.address();
    if (typeof address !== "object" || address === null) {
      server.close();
      throw new Error("Test server did not expose a port.");
    }

    const maya = defaultPersonas.find((persona) => persona.id === "maya");
    if (!maya) {
      server.close();
      throw new Error("Expected Maya persona.");
    }

    const result = await runSafeBrowserAudit({
      runId: "run_self_memory",
      targetUrl: `http://127.0.0.1:${address.port}`,
      personas: [maya],
      devices: defaultDeviceProfiles.slice(3, 4),
      maxPages: 1,
      priorPersonaOutputs: [{ cycleId: "cycle-104", personaId: "maya", thought: "The form can be judged before submission.", category: "conversion safety" }],
      safeMode: true,
    });
    server.close();

    expect(result.report.reactions[0]?.thought).toContain("my earlier read");
    expect(result.report.reactions[0]?.thought).not.toContain("Maya here");
    expect(result.report.reactions[0]?.respondsToPersonaId).toBe("maya");
    expect(result.report.reactions[0]?.responseReason).toBe("self_memory");
  });

  it("lets route-scoped prior-output accountability clear repeated prior-output collapse", async () => {
    const server = await createAgentReadinessTestServer();
    const address = server.address();
    if (typeof address !== "object" || address === null) {
      server.close();
      throw new Error("Test server did not expose a port.");
    }

    const quinn = defaultPersonas.find((persona) => persona.id === "quinn");
    if (!quinn) {
      server.close();
      throw new Error("Expected agent-readiness persona.");
    }

    const result = await runSafeBrowserAudit({
      runId: "run_consensus_accountability",
      targetUrl: `http://127.0.0.1:${address.port}`,
      personas: [quinn],
      devices: [defaultDeviceProfiles[0]!, defaultDeviceProfiles[3]!],
      maxPages: 1,
      priorPersonaOutputs: [
        { cycleId: "cycle-010", personaId: "maya", thought: "The API proof is vague.", category: "agent readiness" },
        { cycleId: "cycle-010", personaId: "leo", thought: "The API proof is vague.", category: "agent readiness" },
        { cycleId: "cycle-010", personaId: "nora", thought: "The API proof is vague.", category: "agent readiness" },
        { cycleId: "cycle-010", personaId: "omar", thought: "The API proof is vague.", category: "agent readiness" },
      ],
      safeMode: true,
    });
    server.close();

    expect(result.report.reactions[0]?.emotion).toBe("confident");
    expect(result.report.reactions[0]?.thought).toContain("reusable product data");
    expect(result.report.reactions[0]?.thought).toContain("human-facing output");
    expect(result.report.reactions[1]?.thought).toContain("next automated improvement");
    expect(result.report.reactions[0]?.thought).not.toBe(result.report.reactions[1]?.thought);
    expect(result.report.reactions[0]?.stance).toBe("improved_since_prior");
    expect(result.report.findings.map((finding) => finding.category)).not.toContain("agent_readiness");
  });

  it("does not collapse positive prior-output matches into all improved stances", async () => {
    const server = await createAgentReadinessTestServer();
    const address = server.address();
    if (typeof address !== "object" || address === null) {
      server.close();
      throw new Error("Test server did not expose a port.");
    }

    const result = await runSafeBrowserAudit({
      runId: "run_prior_stance_variety",
      targetUrl: `http://127.0.0.1:${address.port}`,
      personas: defaultPersonas,
      devices: defaultDeviceProfiles.slice(3, 4),
      maxPages: 1,
      priorPersonaOutputs: [
        {
          cycleId: "cycle-090",
          personaId: "maya",
          thought: "Pricing transparency is visible.",
          evidence: "Desktop capture: 0 tiny-text elements, 0 low-contrast elements.",
          category: "pricing transparency",
        },
        {
          cycleId: "cycle-090",
          personaId: "leo",
          thought: "Visual design has a clear product stage. I am not seeing a hard visual failure.",
          evidence: "Desktop capture: 0 tiny-text elements, 0 low-contrast elements.",
          category: "visual design",
        },
        {
          cycleId: "cycle-090",
          personaId: "ivy",
          thought: "Accessibility evidence is readable. I am not hitting a hard readability blocker.",
          evidence: "Desktop capture: 0 tiny-text elements, 0 low-contrast elements, 0 unlabeled controls.",
          category: "accessibility",
        },
        { cycleId: "cycle-090", personaId: "omar", thought: "Conversion urgency is visible.", category: "conversion urgency" },
        { cycleId: "cycle-090", personaId: "nora", thought: "Trust evidence is present.", category: "trust evidence" },
        { cycleId: "cycle-090", personaId: "quinn", thought: "Agent readiness is clear.", category: "agent readiness" },
        { cycleId: "cycle-090", personaId: "mike-the-creator", thought: "Show do not tell is working.", category: "show do not tell" },
      ],
      safeMode: true,
    });
    server.close();

    expect(result.report.consensus?.stanceCounts.improved_since_prior ?? 0).toBeLessThan(result.report.reactions.length);
    expect(result.report.consensus?.stanceCounts.supports_prior ?? 0).toBeGreaterThan(0);
    expect(result.report.consensus?.stanceCounts.extends_prior ?? 0).toBeGreaterThan(0);
  });

  it("scopes prior-output repetition checks to the current route", async () => {
    const server = await createTestServer();
    const address = server.address();
    if (typeof address !== "object" || address === null) {
      server.close();
      throw new Error("Test server did not expose a port.");
    }

    const quinn = defaultPersonas.find((persona) => persona.id === "quinn");
    if (!quinn) {
      server.close();
      throw new Error("Expected agent-readiness persona.");
    }

    const result = await runSafeBrowserAudit({
      runId: "run_route_scoped_prior_outputs",
      targetUrl: `http://127.0.0.1:${address.port}`,
      personas: [quinn],
      devices: defaultDeviceProfiles.slice(2, 3),
      maxPages: 1,
      priorPersonaOutputs: [
        { cycleId: "cycle-006", route: "/dashboard", personaId: "maya", thought: "The CTA is vague.", category: "confusion" },
        { cycleId: "cycle-006", route: "/dashboard", personaId: "leo", thought: "The CTA is vague.", category: "confusion" },
        { cycleId: "cycle-006", route: "/dashboard", personaId: "nora", thought: "The CTA is vague.", category: "confusion" },
        { cycleId: "cycle-006", route: "/dashboard", personaId: "omar", thought: "The CTA is vague.", category: "confusion" },
      ],
      safeMode: true,
    });
    server.close();

    expect(result.report.reactions[0]?.thought).not.toContain("repeated prior output");
    expect(result.report.reactions[0]?.stance).toBe("independent");
  });

  it("normalizes origin URLs so the root route is not visited twice", async () => {
    const server = await createLinkedRoutesTestServer();
    const address = server.address();
    if (typeof address !== "object" || address === null) {
      server.close();
      throw new Error("Test server did not expose a port.");
    }

    const result = await runSafeBrowserAudit({
      runId: "run_normalized_routes",
      targetUrl: `http://127.0.0.1:${address.port}`,
      personas: defaultPersonas.slice(0, 1),
      devices: defaultDeviceProfiles.slice(0, 1),
      maxPages: 2,
      safeMode: true,
    });
    server.close();

    const observedPaths = result.report.journeyEvents
      .filter((event) => event.type === "observation")
      .map((event) => new URL(event.url).pathname);

    expect(observedPaths).toEqual(["/", "/dashboard"]);
  });
});

function createTestServer(): Promise<Server> {
  const server = createServer((_request, response) => {
    response.setHeader("content-type", "text/html");
    response.end(`
      <html>
        <head><title>Pricing</title></head>
        <body>
          <h1>Pricing</h1>
          <p>Trusted by teams with strong privacy controls.</p>
          <a href="/demo">Start demo</a>
          <form><button type="submit">Sign up</button></form>
        </body>
      </html>
    `);
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

function createSparseTestServer(): Promise<Server> {
  const server = createServer((_request, response) => {
    response.setHeader("content-type", "text/html");
    response.end(`
      <html>
        <head><title>Welcome</title></head>
        <body>
          <h1>Welcome</h1>
          <p>We help teams move faster.</p>
          <a href="/details">Learn more</a>
        </body>
      </html>
    `);
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

function createImplementationPlanActionTestServer(): Promise<Server> {
  const server = createServer((_request, response) => {
    response.setHeader("content-type", "text/html");
    response.end(`
      <html>
        <head><title>Report</title></head>
        <body>
          <main>
            <h1>Run findings</h1>
            <p>Trusted privacy-safe demo example with features, benefits, and a report artifact.</p>
            <p>Comparison source says learn more, but this report gives the user concrete implementation outcomes.</p>
            <button>Copy implementation plan</button>
            <button>Download implementation plan</button>
            <button>Copy this fix</button>
            <a href="/runs/new">Start website review</a>
          </main>
        </body>
      </html>
    `);
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

function createAgentReadinessTestServer(): Promise<Server> {
  const server = createServer((_request, response) => {
    response.setHeader("content-type", "text/html");
    response.end(`
      <html>
        <head><title>Agent readiness</title></head>
        <body>
          <main>
            <h1>Agent-readiness proof</h1>
            <p>Start a run with pricing, security, privacy, and production workspace boundaries visible.</p>
            <p>Output schemas expose personas, reactions, stances, findings, recommendations, snapshots, referenceSources, consensus, and validation traces.</p>
            <p>Prior-cycle memory uses route-scoped prior outputs, stance counts, independent critique axes, and consensus collapse risk.</p>
            <p>Comparison sources include competitor URLs, market news, and validation traces from typecheck, test, lint, build, and smoke.</p>
          </main>
        </body>
      </html>
    `);
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

function createLocalStorageEchoTestServer(): Promise<Server> {
  const server = createServer((_request, response) => {
    response.setHeader("content-type", "text/html");
    response.end(`
      <html>
        <head><title>Saved agent echo</title></head>
        <body>
          <main>
            <h1>Saved agent run setup</h1>
            <p id="storage"></p>
            <a href="/run">Start trial</a>
          </main>
          <script>
            document.getElementById("storage").textContent = window.localStorage.getItem("snoopy.test") || "";
          </script>
        </body>
      </html>
    `);
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

function createJsonContractTestServer(): Promise<Server> {
  const server = createServer((_request, response) => {
    response.setHeader("content-type", "application/json");
    response.end(
      JSON.stringify({
        service: {
          name: "Snoopy",
          capabilities: ["agent output", "JSON metadata", "automation command", "report artifacts"],
          longDescription: "contract preamble ".repeat(500),
        },
        automation: {
          selfAudit: {
            command: "corepack pnpm self-audit",
            artifactRoot: "docs/self-audits",
            exampleCommands: [
              "corepack pnpm self-audit -- --base-url http://127.0.0.1:3100 --cycle cycle-api --routes /api/service-metadata",
            ],
            localStorageSeeding: {
              fixture: "docs/self-audits/fixtures/saved-agent-local-storage.json",
              valueContract: "Pass a JSON object whose localStorage values are already-serialized strings.",
            },
          },
        },
        api: {
          createRun: { method: "POST", path: "/api/runs" },
        },
        examples: {
          createRun: {
            request: {
              method: "POST",
              path: "/api/runs",
              body: { targetUrl: "https://example.com", goal: "Find conversion friction." },
            },
            responseShape: { report: "Report payload with findings and recommendations." },
          },
        },
        fieldContracts: {
          createRunBody: {
            required: ["targetUrl"],
            optional: ["goal", "comparisonUrls", "additionalPersonas"],
          },
          reaction: {
            required: ["personaId", "deviceId", "thought", "evidence"],
            optional: ["stance", "responseReasonDetail"],
          },
        },
        fallback: {
          availableWithoutCredentials: false,
          productionPersistence: "Report artifacts persist in production storage.",
        },
      }),
    );
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

function createLinkedRoutesTestServer(): Promise<Server> {
  const server = createServer((request, response) => {
    response.setHeader("content-type", "text/html");

    if (request.url === "/dashboard") {
      response.end(`
        <html>
          <head><title>Dashboard</title></head>
          <body>
            <h1>Dashboard</h1>
            <p>Trusted reports with privacy notes and clear next steps.</p>
            <a href="/">Home</a>
          </body>
        </html>
      `);
      return;
    }

    response.end(`
      <html>
        <head><title>Home</title></head>
        <body>
          <h1>Home</h1>
          <p>Pricing and security proof for read-only teardowns.</p>
          <a href="/">Home</a>
          <a href="/dashboard">Dashboard</a>
        </body>
      </html>
    `);
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

function createMarkdownArtifactTestServer(): Promise<Server> {
  const server = createServer((_request, response) => {
    response.setHeader("content-type", "text/markdown; charset=utf-8");
    response.setHeader("content-disposition", 'attachment; filename="snoopy-run-demo-pricing-implementation-queue.md"');
    response.end(`# Snoopy Implementation Queue

Source report: run_demo_pricing
Generated: 2026-05-09T23:00:00.000Z

## Agent Judgment Context

### Quinn (Agent-readiness lead)

Latest reaction: confident on desktop; independent.

Thought: "I can turn this recommendation into work without reopening the UI."

Evidence: The report preserved recommendation work items, trace context, and persona disagreement.

## Task 1: Make the report handoff more useful

Recommendation: Keep the agent critique attached to the implementation work.

Implementation steps:
- Add persona reaction context beside the queue.
- Preserve source report metadata.

Acceptance criteria:
- The artifact includes agent judgment context.
- A downstream agent can identify the source run and next task.
`);
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

function createHardToReadTestServer(): Promise<Server> {
  const server = createServer((_request, response) => {
    response.setHeader("content-type", "text/html");
    response.end(`
      <html>
        <head>
          <title>Hard to read</title>
          <style>
            body { background: #ffffff; color: #eeeeee; font-family: Arial, sans-serif; }
            main { width: 1180px; margin: 0 auto; }
            p, a, button, label { color: #eeeeee; font-size: 10px; line-height: 1.2; }
            button { background: #f8fafc; border: 0; padding: 2px 4px; }
          </style>
        </head>
        <body>
          <main>
            <h1>Pricing</h1>
            <p>Trusted teams can start a trial, but this paragraph is intentionally pale, tiny, and too wide to scan comfortably across the page without zoom.</p>
            <p>Another long line keeps stretching across the viewport with weak contrast, making the content visually exhausting and hard to read for low-vision users.</p>
            <a href="/demo">Learn more</a>
            <button></button>
          </main>
        </body>
      </html>
    `);
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

function createDarkPanelContrastTestServer(): Promise<Server> {
  const server = createServer((_request, response) => {
    response.setHeader("content-type", "text/html");
    response.end(`
      <html>
        <head>
          <title>Readable dark panel</title>
          <style>
            body { margin: 0; background: #ffffff; font-family: Arial, sans-serif; }
            main { min-height: 100vh; padding: 48px; }
            section { background: #020617; color: #f8fafc; border-radius: 20px; padding: 32px; max-width: 760px; }
            p, a, button, li { color: #e2e8f0; font-size: 16px; line-height: 1.6; }
            a, button { display: inline-flex; margin-top: 16px; background: #fde68a; color: #020617; border: 0; border-radius: 10px; padding: 12px 16px; font-weight: 700; }
          </style>
        </head>
        <body>
          <main>
            <section>
              <h1>Website teardown that shows the fix</h1>
              <p>Seven critics compare the page, explain what is hard to see, and return a before-and-after fix queue for the next improvement cycle.</p>
              <p>Trusted privacy controls, clear features, benefits, demo examples, and a short how it works path sit beside the paid pricing action.</p>
              <ul>
                <li>Readable contrast inside the dark product stage.</li>
                <li>Clear pricing and proof beside the action.</li>
              </ul>
              <a href="/pricing">See pricing</a>
              <button>Run teardown</button>
            </section>
          </main>
        </body>
      </html>
    `);
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}
