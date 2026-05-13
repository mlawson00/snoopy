import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { defaultPersonas, runSafeBrowserAudit, type Persona } from "@snoopy/runner";
import { chromium, type ViewportSize } from "playwright";

type AuditSummary = {
  path: string;
  runId: string;
  targetUrl: string;
  summary: string;
  personaCount: number;
  deviceCount: number;
  journeyEventCount: number;
  reactionCount: number;
  reactionsByEmotion: Record<string, number>;
  consensus?: {
    collapseRisk: string;
    summary: string;
    uniqueCritiqueAxes: string[];
    stanceCounts: Record<string, number>;
  };
  routeCoverage: string[];
  personas: Array<{
    id: string;
    name: string;
    role: string;
    memories?: string[];
    tastes?: string[];
    blindSpots?: string[];
    critiqueLens?: string[];
    sourceDiet?: string[];
    dayPlan?: string[];
    customerOwned?: boolean;
    personalityFacets?: PersonalityFacetWeights;
  }>;
  findings: Array<{
    category: string;
    severity: string;
    title: string;
    evidence: string;
    recommendation: string;
    confidence: number;
  }>;
  recommendations: Array<{
    priority: string;
    title: string;
    targetArea: string;
    recommendation: string;
    evidence: string;
    affectedPersonas: string[];
    affectedDevices: string[];
  }>;
  reactionSamples: Array<{
    personaId: string;
    deviceId: string;
    url: string;
    emotion: string;
    thought: string;
    evidence: string;
    critiqueAxis?: string;
    stance?: string;
    respondsToPersonaId?: string;
    responseReason?: string;
    responseReasonDetail?: string;
  }>;
  reactions: Array<{
    personaId: string;
    deviceId: string;
    url: string;
    emotion: string;
    thought: string;
    evidence: string;
    critiqueAxis?: string;
    stance?: string;
    respondsToPersonaId?: string;
    responseReason?: string;
    responseReasonDetail?: string;
  }>;
  referenceSources: Array<{
    id: string;
    kind: string;
    title: string;
    url?: string;
    summary: string;
  }>;
  screenEvidence: Array<{
    id: string;
    route: string;
    url: string;
    deviceId: string;
    width: number;
    height: number;
    capturedAt: string;
    altText: string;
    hasImageDataUrl: boolean;
    annotations: Array<{
      id: string;
      kind: string;
      label: string;
      x: number;
      y: number;
      width: number;
      height: number;
      importance: number;
      evidence?: string;
    }>;
  }>;
};

type PersonalityFacet =
  | "introversion"
  | "extraversion"
  | "sensing"
  | "intuition"
  | "thinking"
  | "feeling"
  | "judging"
  | "perceiving";

type PersonalityFacetWeights = Partial<Record<PersonalityFacet, number>>;

type PersonalityAxisCoverage = {
  axis: string;
  leftFacet: PersonalityFacet;
  rightFacet: PersonalityFacet;
  leftMax: number;
  rightMax: number;
  balancedCount: number;
  covered: boolean;
  strongestLeftPersona?: string;
  strongestRightPersona?: string;
};

type ScreenshotSummary = {
  route: string;
  viewport: string;
  file: string;
  width: number;
  height: number;
  status: "captured" | "failed" | "skipped";
  error?: string;
};

type CliOptions = {
  baseUrl: string;
  cycleId: string;
  routes: string[];
  maxPages: number;
  goal: string;
  comparisonUrls: string[];
  newsUrls: string[];
  marketContext?: string;
  artifactRoot: string;
  overwrite: boolean;
  screenshots: boolean;
  localStorageJson?: string;
  localStorageFile?: string;
};

type SavedAgentSnapshot = {
  id?: string;
  name?: string;
  role?: string;
  face?: string;
  voice?: string;
  goal?: string;
  backstory?: string;
  memories?: string[];
  tastes?: string[];
  blindSpots?: string[];
  motivations?: string[];
  likes?: string[];
  deviceHabits?: string[];
  skepticism?: string;
  critiqueLens?: string[];
  voiceSettings?: {
    style?: string;
    profanityLevel?: string;
  };
  personalityFacets?: PersonalityFacetWeights;
  dayPlan?: string[];
  sourceDiet?: string[];
  customerRelationship?: string;
  privateExclusive?: boolean;
  customerOwned?: boolean;
};

const DEFAULT_ROUTES = ["/", "/dashboard", "/runs/new", "/settings/billing", "/runs/demo"];
const SAVED_AGENTS_STORAGE_KEY = "snoopy.savedAgents";
const SCREENSHOT_VIEWPORTS: Array<{ id: string; viewport: ViewportSize }> = [
  { id: "mobile", viewport: { width: 390, height: 844 } },
  { id: "desktop", viewport: { width: 1366, height: 900 } },
];

async function main() {
  const options = parseCliOptions(process.argv.slice(2));
  const artifactDir = path.join(options.artifactRoot, options.cycleId);
  const screenshotDir = path.join(artifactDir, "screenshots");

  await mkdir(options.artifactRoot, { recursive: true });
  await mkdir(artifactDir, { recursive: options.overwrite });
  await mkdir(screenshotDir, { recursive: true });

  const initialLocalStorage = await resolveInitialLocalStorage(options);
  const savedAgentPersonas = parseSavedAgentsFromLocalStorage(initialLocalStorage);
  const auditPersonas = savedAgentPersonas.length ? [...defaultPersonas, ...savedAgentPersonas].slice(0, 10) : undefined;
  const priorPersonaOutputs = await loadPriorPersonaOutputs(options.artifactRoot, options.cycleId);
  const serviceMetadata = await fetchJson(new URL("/api/service-metadata", options.baseUrl).toString());
  const audits: AuditSummary[] = [];

  for (const route of options.routes) {
    const targetUrl = new URL(route, options.baseUrl).toString();
    const result = await runSafeBrowserAudit({
      runId: `${options.cycleId}-${slugifyRoute(route)}`,
      cycleId: options.cycleId,
      targetUrl,
      goal: options.goal,
      comparisonUrls: options.comparisonUrls,
      newsUrls: options.newsUrls,
      marketContext: options.marketContext,
      priorPersonaOutputs,
      initialLocalStorage,
      personas: auditPersonas,
      maxPages: options.maxPages,
      safeMode: true,
    });

    audits.push({
      path: route,
      runId: result.report.runId,
      targetUrl,
      summary: result.report.summary,
      personaCount: result.report.personas.length,
      deviceCount: result.report.devices.length,
      journeyEventCount: result.report.journeyEvents.length,
      reactionCount: result.report.reactions.length,
      reactionsByEmotion: countBy(result.report.reactions, (reaction) => reaction.emotion),
      consensus: result.report.consensus,
      routeCoverage: Array.from(
        new Set(
          result.report.journeyEvents
            .filter((event) => event.type === "observation")
            .map((event) => new URL(event.url).pathname || "/"),
        ),
      ).sort(),
      personas: result.report.personas.map((persona) => ({
        id: persona.id,
        name: persona.name,
        role: persona.role,
        memories: persona.memories,
        tastes: persona.tastes,
        blindSpots: persona.blindSpots,
        critiqueLens: persona.critiqueLens,
        sourceDiet: persona.sourceDiet,
        dayPlan: persona.dayPlan,
        customerOwned: persona.customerOwned,
        personalityFacets: persona.personalityFacets,
      })),
      findings: result.report.findings,
      recommendations: result.report.recommendations,
      reactionSamples: result.report.reactions.slice(0, 6),
      reactions: result.report.reactions,
      referenceSources: result.report.referenceSources,
      screenEvidence: result.report.screenEvidence.map((screen) => ({
        id: screen.id,
        route: screen.route,
        url: screen.url,
        deviceId: screen.deviceId,
        width: screen.width,
        height: screen.height,
        capturedAt: screen.capturedAt,
        altText: screen.altText,
        hasImageDataUrl: Boolean(screen.imageDataUrl),
        annotations: screen.annotations.map((annotation) => ({
          id: annotation.id,
          kind: annotation.kind,
          label: annotation.label,
          x: annotation.x,
          y: annotation.y,
          width: annotation.width,
          height: annotation.height,
          importance: annotation.importance,
          evidence: annotation.evidence,
        })),
      })),
    });
  }

  const screenshots = options.screenshots ? await captureScreenshots(options, artifactDir, screenshotDir, initialLocalStorage) : [];
  const unresolvedFindings = audits.flatMap((audit) =>
    audit.findings
      .filter((finding) => finding.severity !== "low")
      .map((finding) => ({
        route: audit.path,
        severity: finding.severity,
        category: finding.category,
        title: finding.title,
        evidence: finding.evidence,
        recommendation: finding.recommendation,
      })),
  );

  const beforeAfterHypotheses = buildBeforeAfterHypotheses(audits);
  const data = {
    cycleId: options.cycleId,
    createdAt: new Date().toISOString(),
    objective: "Automated Snoopy-on-Snoopy self-audit artifact generation.",
    inputs: {
      baseUrl: options.baseUrl,
      routes: options.routes,
      maxPages: options.maxPages,
      goal: options.goal,
      comparisonUrls: options.comparisonUrls,
      newsUrls: options.newsUrls,
      marketContext: options.marketContext,
      screenshots: options.screenshots,
      initialLocalStorageKeys: Object.keys(initialLocalStorage ?? {}),
      savedAgentPersonaCount: savedAgentPersonas.length,
      priorPersonaOutputCount: priorPersonaOutputs.length,
    },
    serviceMetadata,
    audits,
    screenshots,
    beforeAfterHypotheses,
    qualitySignals: {
      auditedRouteCount: audits.length,
      totalJourneyEvents: audits.reduce((sum, audit) => sum + audit.journeyEventCount, 0),
      totalReactions: audits.reduce((sum, audit) => sum + audit.reactionCount, 0),
      reactionsByEmotion: countEmotionTotals(audits),
      stanceCounts: countReactionFieldTotals(audits, "stance"),
      responseReasonCounts: countReactionFieldTotals(audits, "responseReason"),
      stanceQuality: buildStanceQuality(audits),
      critiqueAxisCounts: countReactionFieldTotals(audits, "critiqueAxis"),
      personaCoverage: buildPersonaCoverage(audits),
      unresolvedFindingCount: unresolvedFindings.length,
      screenshotCount: screenshots.filter((screenshot) => screenshot.status === "captured").length,
      consensusCollapseRisk: countBy(audits, (audit) => audit.consensus?.collapseRisk ?? "unknown"),
    },
    unresolvedFindings,
  };

  await writeJson(path.join(artifactDir, "data.json"), data);
  await writeJson(path.join(artifactDir, "backlog.json"), buildBacklog(options.cycleId, unresolvedFindings, screenshots));
  await writeFile(path.join(artifactDir, "writeup.md"), buildWriteup(options, data), "utf8");
  await writeFile(path.join(artifactDir, "validation-log.md"), buildValidationLog(), "utf8");
  await writeFile(path.join(artifactDir, "next-cycle-hypotheses.md"), buildNextCycleHypotheses(unresolvedFindings, screenshots), "utf8");

  console.log(`Self-audit artifacts written to ${artifactDir}`);
}

function parseCliOptions(args: string[]): CliOptions {
  const values = new Map<string, string | boolean>();

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg?.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = args[index + 1];
    if (!next || next.startsWith("--")) {
      values.set(key, true);
      continue;
    }
    values.set(key, next);
    index += 1;
  }

  const baseUrl = stringValue(values, "base-url", process.env.SNOOPY_SELF_AUDIT_BASE_URL ?? "http://127.0.0.1:3000");
  const cycleId = stringValue(values, "cycle", process.env.SNOOPY_SELF_AUDIT_CYCLE ?? timestampCycleId());
  const routes = stringValue(values, "routes", process.env.SNOOPY_SELF_AUDIT_ROUTES ?? DEFAULT_ROUTES.join(","))
    .split(",")
    .map((route) => route.trim())
    .filter(Boolean);
  const maxPages = Number(stringValue(values, "max-pages", process.env.SNOOPY_SELF_AUDIT_MAX_PAGES ?? "1"));
  const artifactRoot = stringValue(values, "artifact-root", process.env.SNOOPY_SELF_AUDIT_ARTIFACT_ROOT ?? "docs/self-audits");
  const comparisonUrls = parseListValue(stringValue(values, "comparison-urls", process.env.SNOOPY_SELF_AUDIT_COMPARISON_URLS ?? ""));
  const newsUrls = parseListValue(stringValue(values, "news-urls", process.env.SNOOPY_SELF_AUDIT_NEWS_URLS ?? ""));
  const marketContext = stringValue(values, "market-context", process.env.SNOOPY_SELF_AUDIT_MARKET_CONTEXT ?? "").trim() || undefined;
  const localStorageJson = stringValue(values, "local-storage-json", process.env.SNOOPY_SELF_AUDIT_LOCAL_STORAGE_JSON ?? "").trim() || undefined;
  const localStorageFile = stringValue(values, "local-storage-file", process.env.SNOOPY_SELF_AUDIT_LOCAL_STORAGE_FILE ?? "").trim() || undefined;
  const goal = stringValue(
    values,
    "goal",
    process.env.SNOOPY_SELF_AUDIT_GOAL ??
      "Evaluate Snoopy for trust, UX clarity, report usefulness, agent usability, accessibility, and deployment readiness.",
  );

  if (!Number.isInteger(maxPages) || maxPages < 1 || maxPages > 3) {
    throw new Error("--max-pages must be an integer between 1 and 3.");
  }

  return {
    baseUrl,
    cycleId,
    routes,
    maxPages,
    goal,
    comparisonUrls,
    newsUrls,
    marketContext,
    artifactRoot,
    overwrite: Boolean(values.get("overwrite")),
    screenshots: !values.has("skip-screenshots"),
    localStorageJson,
    localStorageFile,
  };
}

function stringValue(values: Map<string, string | boolean>, key: string, fallback: string): string {
  const value = values.get(key);
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function parseListValue(value: string): string[] {
  return value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

async function fetchJson(url: string): Promise<unknown> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return { status: "failed", url, reason: `${response.status} ${response.statusText}` };
    }
    return await response.json();
  } catch (error) {
    return { status: "failed", url, reason: error instanceof Error ? error.message : "Unknown fetch error." };
  }
}

async function resolveInitialLocalStorage(options: CliOptions): Promise<Record<string, string> | undefined> {
  const raw = options.localStorageFile ? await readFile(options.localStorageFile, "utf8") : options.localStorageJson;
  if (!raw) return undefined;
  const parsed = JSON.parse(raw) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Initial localStorage must be a JSON object with string values.");
  }

  return Object.fromEntries(
    Object.entries(parsed).map(([key, value]) => {
      if (typeof value !== "string") {
        throw new Error(`Initial localStorage value for ${key} must be a string.`);
      }
      return [key, value] as const;
    }),
  );
}

function parseSavedAgentsFromLocalStorage(initialLocalStorage?: Record<string, string>): Persona[] {
  const raw = initialLocalStorage?.[SAVED_AGENTS_STORAGE_KEY];
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((agent, index) => {
      const persona = savedAgentToPersona(agent as SavedAgentSnapshot, index);
      return persona ? [persona] : [];
    });
  } catch {
    return [];
  }
}

function savedAgentToPersona(agent: SavedAgentSnapshot, index: number): Persona | null {
  if (!agent.name || !agent.role) return null;
  const critiqueLens = readList(agent.critiqueLens, ["customer-specific taste", "commercial usefulness", "agent disagreement"]);
  const memories = readList(agent.memories, ["Remembers prior Snoopy runs for this customer.", "Compares this page against the customer's own taste."]);
  const tastes = readList(agent.tastes, ["clear evidence", "useful critique", "visible improvement"]);

  return {
    id: agent.id || `saved-agent-${index + 1}`,
    name: agent.name,
    role: agent.role,
    face: agent.face,
    goal: agent.goal || `Review the website through ${critiqueLens.slice(0, 3).join(", ")} for this customer.`,
    backstory: agent.backstory || "Customer-owned recurring reviewer with private workspace context.",
    memories,
    tastes,
    blindSpots: readList(agent.blindSpots, ["May over-index on the customer brief.", "Needs the core cast to challenge familiar assumptions."]),
    motivations: readList(agent.motivations, ["Protect the customer's point of view", "Find what the core cast may miss"]),
    likes: readList(agent.likes, ["Specific evidence", "Visible before and after", "Constructive disagreement"]),
    deviceHabits: readList(agent.deviceHabits, ["Checks mobile first", "Reviews evidence on desktop"]),
    skepticism: agent.skepticism || "Distrusts generic praise, generic criticism, and unsupported agreement.",
    trustThreshold: 0.72,
    personalityFacets: completePersonalityFacets(agent.personalityFacets),
    critiqueLens,
    sourceDiet: readList(agent.sourceDiet, ["Customer site history", "Prior Snoopy reports"]),
    dayPlan: readList(agent.dayPlan, ["Read prior reports", "Respond to another agent", "Leave one useful fix"]),
    customerRelationship: agent.customerRelationship || "Private customer-owned reviewer for this workspace.",
    privateExclusive: agent.privateExclusive ?? true,
    customerOwned: agent.customerOwned ?? true,
    voice: {
      style: mapSavedVoiceStyle(agent.voiceSettings?.style),
      allowsMildProfanity: agent.voiceSettings?.profanityLevel === "mild" || agent.voiceSettings?.profanityLevel === "moderate",
      profanityLevel: mapSavedProfanityLevel(agent.voiceSettings?.profanityLevel),
    },
  };
}

function completePersonalityFacets(facets: PersonalityFacetWeights | undefined) {
  return {
    introversion: facets?.introversion ?? 0.46,
    extraversion: facets?.extraversion ?? 0.54,
    sensing: facets?.sensing ?? 0.62,
    intuition: facets?.intuition ?? 0.38,
    thinking: facets?.thinking ?? 0.58,
    feeling: facets?.feeling ?? 0.42,
    judging: facets?.judging ?? 0.66,
    perceiving: facets?.perceiving ?? 0.34,
  };
}

function readList(items: string[] | undefined, fallback: string[]) {
  return items?.filter(Boolean).length ? items.filter(Boolean) : fallback;
}

function mapSavedVoiceStyle(style: string | undefined): NonNullable<Persona["voice"]>["style"] {
  if (style === "professional" || style === "plainspoken" || style === "blunt") return style;
  return "plainspoken";
}

function mapSavedProfanityLevel(level: string | undefined): NonNullable<Persona["voice"]>["profanityLevel"] {
  if (level === "mild" || level === "moderate") return level;
  return "none";
}

async function loadPriorPersonaOutputs(artifactRoot: string, cycleId: string) {
  try {
    const entries = await readdir(artifactRoot, { withFileTypes: true });
    const cycleDirs = entries
      .filter((entry) => entry.isDirectory() && entry.name.startsWith("cycle-") && entry.name !== cycleId)
      .map((entry) => entry.name)
      .sort()
      .slice(-3);
    const outputs: Array<{
      cycleId?: string;
      route?: string;
      personaId: string;
      emotion?: string;
      thought: string;
      evidence?: string;
      category?: string;
      title?: string;
    }> = [];

    for (const priorCycleId of cycleDirs) {
      const filePath = path.join(artifactRoot, priorCycleId, "data.json");
      const raw = await readFile(filePath, "utf8").catch(() => "");
      if (!raw) continue;
      const parsed = JSON.parse(raw) as {
        audits?: Array<{
          path?: string;
          reactions?: Array<{ personaId: string; emotion?: string; thought: string; evidence?: string; critiqueAxis?: string }>;
          reactionSamples?: Array<{ personaId: string; emotion?: string; thought: string; evidence?: string; critiqueAxis?: string }>;
          findings?: Array<{ category?: string; severity?: string; title?: string; evidence?: string }>;
        }>;
      };

      for (const audit of parsed.audits ?? []) {
        for (const reaction of audit.reactions ?? audit.reactionSamples ?? []) {
          outputs.push({
            cycleId: priorCycleId,
            route: audit.path,
            personaId: reaction.personaId,
            emotion: reaction.emotion,
            thought: reaction.thought,
            evidence: reaction.evidence,
            category: reaction.critiqueAxis,
          });
        }
        for (const finding of audit.findings ?? []) {
          if (isLowSignalPriorFinding(finding)) continue;
          outputs.push({
            cycleId: priorCycleId,
            route: audit.path,
            personaId: "prior-cycle",
            thought: finding.evidence ?? finding.title ?? "Prior finding without evidence.",
            evidence: finding.evidence,
            category: finding.category,
            title: finding.title,
          });
        }
      }
    }

    return outputs.slice(-120);
  } catch {
    return [];
  }
}

function isLowSignalPriorFinding(finding: { category?: string; severity?: string; title?: string; evidence?: string }) {
  const haystack = [finding.category, finding.title, finding.evidence].filter(Boolean).join(" ").toLowerCase();
  if (finding.severity === "low" && finding.category === "suggested_fix") return true;
  return /baseline journey is readable|run additional agents against narrower goals/i.test(haystack);
}

async function captureScreenshots(
  options: CliOptions,
  artifactDir: string,
  screenshotDir: string,
  initialLocalStorage?: Record<string, string>,
): Promise<ScreenshotSummary[]> {
  const browser = await chromium.launch({ headless: true });
  const screenshots: ScreenshotSummary[] = [];

  try {
    for (const route of options.routes) {
      const routeUrl = new URL(route, options.baseUrl).toString();
      const screenshotSkipReason = await screenshotSkipReasonForRoute(routeUrl);
      if (screenshotSkipReason) {
        for (const { id, viewport } of SCREENSHOT_VIEWPORTS) {
          screenshots.push({
            route,
            viewport: id,
            file: "",
            width: viewport.width,
            height: viewport.height,
            status: "skipped",
            error: screenshotSkipReason,
          });
        }
        continue;
      }

      for (const { id, viewport } of SCREENSHOT_VIEWPORTS) {
        const context = await browser.newContext({ viewport });
        if (initialLocalStorage) {
          await context.addInitScript((entries) => {
            for (const [key, value] of Object.entries(entries)) {
              window.localStorage.setItem(key, value);
            }
          }, initialLocalStorage);
        }
        const page = await context.newPage();
        const fileName = `${slugifyRoute(route)}-${id}.png`;
        const filePath = path.join(screenshotDir, fileName);

        try {
          await page.goto(routeUrl, { waitUntil: "networkidle", timeout: 20_000 });
          await page.screenshot({ path: filePath, fullPage: true });
          screenshots.push({
            route,
            viewport: id,
            file: path.relative(artifactDir, filePath),
            width: viewport.width,
            height: viewport.height,
            status: "captured",
          });
        } catch (error) {
          screenshots.push({
            route,
            viewport: id,
            file: path.relative(artifactDir, filePath),
            width: viewport.width,
            height: viewport.height,
            status: "failed",
            error: error instanceof Error ? error.message : "Unknown screenshot error.",
          });
        } finally {
          await context.close();
        }
      }
    }
  } finally {
    await browser.close();
  }

  return screenshots;
}

async function screenshotSkipReasonForRoute(url: string): Promise<string | undefined> {
  try {
    const response = await fetch(url, { method: "GET" });
    const contentDisposition = response.headers.get("content-disposition")?.toLowerCase() ?? "";
    if (contentDisposition.includes("attachment")) {
      return "downloadable artifact; no browser-rendered screenshot is expected";
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function buildBacklog(cycleId: string, findings: Array<{ route: string; title: string; evidence: string; recommendation: string }>, screenshots: ScreenshotSummary[]) {
  const findingItems = findings.map((finding, index) => ({
    id: `${cycleId}-${String(index + 1).padStart(3, "0")}`,
    status: "deferred",
    priority: "medium",
    area: "self-audit finding",
    title: `${finding.route}: ${finding.title}`,
    evidence: finding.evidence,
    expectedImpact: finding.recommendation,
  }));

  return {
    cycleId,
    items: [
      {
        id: `${cycleId}-000`,
        status: "completed",
        priority: "high",
        area: "agent usability",
        title: "Run first-class self-audit command and write reusable artifacts.",
        evidence: "The command generated markdown, structured JSON, backlog, validation, next-cycle hypotheses, and screenshot files.",
        expectedImpact: "Reduces manual recursive-cycle overhead and makes future self-improvement runs repeatable.",
      },
      ...findingItems,
      {
        id: `${cycleId}-${String(findingItems.length + 1).padStart(3, "0")}`,
        status: screenshots.some((screenshot) => screenshot.status === "captured") ? "completed" : "blocked",
        priority: "high",
        area: "cycle artifacts",
        title: "Capture screenshot artifacts for audited routes.",
        evidence: `${screenshots.filter((screenshot) => screenshot.status === "captured").length} screenshots captured.`,
        expectedImpact: "Improves visual QA and responsive layout handoff for future agents.",
      },
    ],
  };
}

function buildWriteup(
  options: CliOptions,
  data: {
    createdAt: string;
    audits: AuditSummary[];
    screenshots: ScreenshotSummary[];
    qualitySignals: {
      totalJourneyEvents: number;
      totalReactions: number;
      reactionsByEmotion: Record<string, number>;
      stanceCounts: Record<string, number>;
      stanceQuality: ReturnType<typeof buildStanceQuality>;
      critiqueAxisCounts: Record<string, number>;
      personaCoverage: ReturnType<typeof buildPersonaCoverage>;
      consensusCollapseRisk: Record<string, number>;
      unresolvedFindingCount: number;
      screenshotCount: number;
    };
    beforeAfterHypotheses: ReturnType<typeof buildBeforeAfterHypotheses>;
    unresolvedFindings: Array<{ route: string; severity: string; category: string; title: string; recommendation: string }>;
  },
): string {
  const auditLines = data.audits
    .map(
      (audit) =>
        `- \`${audit.path}\`: ${audit.summary} ${audit.reactionCount} reactions (${formatCounts(audit.reactionsByEmotion)}).`,
    )
    .join("\n");
  const findingLines =
    data.unresolvedFindings.length > 0
      ? data.unresolvedFindings
          .map((finding) => `- \`${finding.route}\` ${finding.severity} ${finding.category}: ${finding.title}. ${finding.recommendation}`)
          .join("\n")
      : "- No medium or high findings remained in this automated pass.";
  const coverageLines = data.qualitySignals.personaCoverage.personalityAxes
    .map((axis) => {
      const status = axis.covered ? "covered" : "needs coverage";
      return `- ${axis.axis}: ${status}; ${axis.leftFacet} max ${axis.leftMax}, ${axis.rightFacet} max ${axis.rightMax}.`;
    })
    .join("\n");
  const hypothesisLines = data.beforeAfterHypotheses
    .slice(0, 6)
    .map((hypothesis) => `- \`${hypothesis.route}\`: now "${hypothesis.currentSignal}"; next "${hypothesis.improvedSignal}".`)
    .join("\n");

  return `# Snoopy Self-Audit ${options.cycleId}

Generated: ${data.createdAt}

## Summary

This cycle used \`pnpm self-audit\` to run Snoopy against Snoopy and write reusable artifacts automatically. The command audited ${data.audits.length} routes, recorded ${data.qualitySignals.totalJourneyEvents} journey events, captured ${data.qualitySignals.totalReactions} agent reactions, fetched service metadata, and saved ${data.qualitySignals.screenshotCount} screenshot artifacts. Consensus risk by route: ${formatCounts(data.qualitySignals.consensusCollapseRisk)}.

Stances recorded across all reactions: ${formatCounts(data.qualitySignals.stanceCounts)}. Response reasons: ${formatCounts(data.qualitySignals.responseReasonCounts)}. Critique-axis coverage: ${formatCounts(data.qualitySignals.critiqueAxisCounts)}.

Stance quality: ${data.qualitySignals.stanceQuality.linkedReactionCount} linked reactions, ${data.qualitySignals.stanceQuality.stanceTypeCount} stance types, dominant stance ${data.qualitySignals.stanceQuality.dominantStance} at ${Math.round(data.qualitySignals.stanceQuality.dominantStanceShare * 100)}%.

## Inputs

- Base URL: \`${options.baseUrl}\`
- Routes: ${options.routes.map((route) => `\`${route}\``).join(", ")}
- Max pages per route: ${options.maxPages}
- Goal: ${options.goal}
- Comparison URLs: ${options.comparisonUrls.length ? options.comparisonUrls.map((url) => `\`${url}\``).join(", ") : "none"}
- News URLs: ${options.newsUrls.length ? options.newsUrls.map((url) => `\`${url}\``).join(", ") : "none"}
- Market context: ${options.marketContext ? "provided" : "none"}

## Route Results

${auditLines}

## Persona Coverage

- Unique personas: ${data.qualitySignals.personaCoverage.uniquePersonaCount}
- Customer-owned personas in this audit: ${data.qualitySignals.personaCoverage.customerOwnedPersonaCount}

${coverageLines}

## Unresolved Findings

${findingLines}

## Before/After Hypotheses

${hypothesisLines}

## Screenshots

${data.screenshots.map(formatScreenshotLine).join("\n")}

## Quality Delta

- This cycle turns Snoopy's agent reactions, consensus signals, prior-cycle memory, route coverage, findings, and screenshots into reusable product data.
- Future agents can run \`pnpm self-audit -- --base-url <url> --cycle <id>\` to reproduce the standard artifact set, including structured JSON for agent disagreement and visual/readability follow-up.

## Validation

Repository validation is recorded in \`validation-log.md\` after the required gates run.
`;
}

function formatScreenshotLine(screenshot: ScreenshotSummary): string {
  const file = screenshot.file ? `\`${screenshot.file}\`` : "`not applicable`";
  const reason = screenshot.error ? ` - ${screenshot.error}` : "";
  return `- ${screenshot.status}: ${file} (${screenshot.route}, ${screenshot.viewport}, ${screenshot.width}x${screenshot.height})${reason}`;
}

function buildValidationLog(): string {
  return `# Validation Log

## Required Gates

The following gates are required because this cycle added a self-audit command and generated artifacts:

- \`corepack pnpm typecheck\`
  - Status: pending
- \`corepack pnpm test\`
  - Status: pending
- \`corepack pnpm lint\`
  - Status: pending
- \`corepack pnpm build\`
  - Status: pending
- \`corepack pnpm e2e:smoke\`
  - Status: pending
`;
}

function buildNextCycleHypotheses(findings: Array<{ route: string; title: string }>, screenshots: ScreenshotSummary[]): string {
  const screenshotHypothesis =
    screenshots.length > 0
      ? "Review captured screenshots on mobile and desktop to identify responsive layout, visual hierarchy, and text-density issues that text-only runner output cannot evaluate."
      : "Fix screenshot capture so visual QA becomes part of every recursive cycle.";
  const findingHypotheses = findings.slice(0, 3).map((finding, index) => `${index + 2}. Improve \`${finding.route}\` based on the unresolved finding "${finding.title}".`);

  return `# Next-Cycle Hypotheses

1. ${screenshotHypothesis}
${findingHypotheses.join("\n")}
${findingHypotheses.length === 0 ? "2. Run a report-detail-focused cycle against `/runs/demo` to improve recommendation inspection, evidence traceability, and agent usefulness.\n3. Consider sharing service metadata with UI readiness copy to reduce drift between agent-readable APIs and human-facing commercial surfaces." : ""}
`;
}

function countBy<T>(items: T[], getKey: (item: T) => string): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = getKey(item);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

function countEmotionTotals(audits: AuditSummary[]): Record<string, number> {
  return audits.reduce<Record<string, number>>((acc, audit) => {
    for (const [emotion, count] of Object.entries(audit.reactionsByEmotion)) {
      acc[emotion] = (acc[emotion] ?? 0) + count;
    }
    return acc;
  }, {});
}

function countReactionFieldTotals(audits: AuditSummary[], field: "critiqueAxis" | "stance" | "responseReason"): Record<string, number> {
  return audits.reduce<Record<string, number>>((acc, audit) => {
    for (const reaction of audit.reactions) {
      const key = reaction[field] ?? "missing";
      acc[key] = (acc[key] ?? 0) + 1;
    }
    return acc;
  }, {});
}

function buildStanceQuality(audits: AuditSummary[]) {
  const reactions = audits.flatMap((audit) => audit.reactions);
  const stanceCounts = countReactionFieldTotals(audits, "stance");
  const stanceEntries = Object.entries(stanceCounts).sort((a, b) => b[1] - a[1]);
  const [dominantStance = "none", dominantCount = 0] = stanceEntries[0] ?? [];
  const linkedReactionCount = reactions.filter((reaction) => reaction.respondsToPersonaId).length;
  const nonIndependentReactionCount = reactions.filter((reaction) => reaction.stance && reaction.stance !== "independent").length;
  const respondingPersonaCount = new Set(reactions.filter((reaction) => reaction.respondsToPersonaId).map((reaction) => reaction.personaId)).size;
  const respondedToPersonaCount = new Set(reactions.map((reaction) => reaction.respondsToPersonaId).filter(Boolean)).size;

  return {
    totalReactions: reactions.length,
    linkedReactionCount,
    linkedReactionShare: ratio(linkedReactionCount, reactions.length),
    nonIndependentReactionCount,
    nonIndependentReactionShare: ratio(nonIndependentReactionCount, reactions.length),
    stanceTypeCount: Object.keys(stanceCounts).filter((stance) => stance !== "missing").length,
    dominantStance,
    dominantStanceShare: ratio(dominantCount, reactions.length),
    respondingPersonaCount,
    respondedToPersonaCount,
  };
}

function buildPersonaCoverage(audits: AuditSummary[]) {
  const personas = uniquePersonas(audits);
  const personalityAxes = PERSONALITY_AXES.map((axis) => {
    const leftScores = personas.map((persona) => ({ persona, score: persona.personalityFacets?.[axis.leftFacet] ?? 0 }));
    const rightScores = personas.map((persona) => ({ persona, score: persona.personalityFacets?.[axis.rightFacet] ?? 0 }));
    const strongestLeft = leftScores.sort((a, b) => b.score - a.score)[0];
    const strongestRight = rightScores.sort((a, b) => b.score - a.score)[0];
    const balancedCount = personas.filter((persona) => {
      const left = persona.personalityFacets?.[axis.leftFacet] ?? 0;
      const right = persona.personalityFacets?.[axis.rightFacet] ?? 0;
      return left >= 0.4 && left <= 0.6 && right >= 0.4 && right <= 0.6;
    }).length;
    const leftMax = roundScore(strongestLeft?.score ?? 0);
    const rightMax = roundScore(strongestRight?.score ?? 0);

    return {
      axis: axis.name,
      leftFacet: axis.leftFacet,
      rightFacet: axis.rightFacet,
      leftMax,
      rightMax,
      balancedCount,
      covered: leftMax >= 0.6 && rightMax >= 0.6,
      strongestLeftPersona: strongestLeft?.persona.name,
      strongestRightPersona: strongestRight?.persona.name,
    } satisfies PersonalityAxisCoverage;
  });

  return {
    uniquePersonaCount: personas.length,
    customerOwnedPersonaCount: personas.filter((persona) => persona.customerOwned).length,
    personas: personas.map((persona) => ({
      id: persona.id,
      name: persona.name,
      role: persona.role,
      customerOwned: Boolean(persona.customerOwned),
      critiqueLens: persona.critiqueLens ?? [],
      personalityFacets: persona.personalityFacets ?? {},
    })),
    personalityAxes,
    allAxesCovered: personalityAxes.every((axis) => axis.covered),
  };
}

function buildBeforeAfterHypotheses(audits: AuditSummary[]) {
  return audits.map((audit) => {
    const topFinding = audit.findings.find((finding) => finding.severity !== "low" && !isBaselineFinding(finding));
    const topRecommendation = audit.recommendations.find((recommendation) => recommendation.priority !== "low" && !isBaselineRecommendation(recommendation));
    const representativeReaction = chooseBeforeAfterReaction(audit.reactions);
    const currentSignal = topFinding
      ? `${topFinding.title}: ${topFinding.evidence}`
      : representativeReaction
        ? `${personaLabel(audit, representativeReaction.personaId)} sees ${representativeReaction.critiqueAxis ?? "the route"}: ${shorten(representativeReaction.thought, 360)}`
        : "The audited route is readable, but the next cycle still needs a sharper product-specific read.";
    const improvedSignal = topRecommendation
      ? `${topRecommendation.title}: ${topRecommendation.recommendation}`
      : routeImprovementHypothesis(audit.path);

    return {
      route: audit.path,
      currentSignal,
      improvedSignal,
      evidence: topRecommendation?.evidence ?? topFinding?.recommendation ?? representativeReaction?.evidence ?? audit.summary,
    };
  });
}

function chooseBeforeAfterReaction(reactions: AuditSummary["reactions"]) {
  return (
    reactions.find((reaction) => reaction.personaId === "custom-brand-guardian") ??
    reactions.find((reaction) => reaction.personaId === "mike-the-creator") ??
    reactions.find((reaction) => reaction.critiqueAxis === "visual design") ??
    reactions.find((reaction) => reaction.critiqueAxis === "accessibility") ??
    reactions[0]
  );
}

function personaLabel(audit: AuditSummary, personaId: string) {
  return audit.personas.find((persona) => persona.id === personaId)?.name ?? personaId;
}

function routeImprovementHypothesis(route: string) {
  if (route === "/agents") {
    return "Make the agents page feel like a living cast room: memorable profile cards, visible memories, source diets, and a clear path to create a customer-owned agent that can join a run immediately.";
  }
  if (route.startsWith("/agents/")) {
    return "Make the profile feel like a durable person: stronger portrait signal, visible taste history, recent judgments, and relationship to other agents above generic proof copy.";
  }
  if (route === "/runs/new") {
    return "Keep the one-URL default, then show the selected cast, saved customer agents, comparison sources, and expected output before asking for optional edits.";
  }
  if (route.startsWith("/runs/")) {
    return "Make the report read like a before/after workshop: conversation map first, screen evidence second, then the fix queue and what changed since prior runs.";
  }
  if (route.startsWith("/api/")) {
    return "Keep the machine contract complete while pairing it with a human-readable surface that shows how agents and deployers use the fields.";
  }
  if (route === "/settings/billing") {
    return "Wrap pricing around the working agent product: persistent core cast, customer-owned agents, memory, source reading, and recurring watches.";
  }
  return "Turn the route's strongest current proof into a more visual, agent-readable, and commercially useful next-state example.";
}

function isBaselineFinding(finding: { title?: string; evidence?: string; recommendation?: string }) {
  return /baseline journey is readable|machine-readable contract is agent-ready/i.test([finding.title, finding.evidence, finding.recommendation].filter(Boolean).join(" "));
}

function isBaselineRecommendation(recommendation: { title?: string; evidence?: string; recommendation?: string }) {
  return /baseline journey is readable|machine-readable contract is agent-ready/i.test(
    [recommendation.title, recommendation.evidence, recommendation.recommendation].filter(Boolean).join(" "),
  );
}

function shorten(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  const clipped = value.slice(0, maxLength - 1).trimEnd();
  const wordBoundary = clipped.lastIndexOf(" ");
  const clean = (wordBoundary > maxLength * 0.72 ? clipped.slice(0, wordBoundary) : clipped).replace(/[,.!?;:]+$/, "");
  return `${clean}...`;
}

function uniquePersonas(audits: AuditSummary[]) {
  const personas = new Map<string, AuditSummary["personas"][number]>();
  for (const audit of audits) {
    for (const persona of audit.personas) {
      if (!personas.has(persona.id)) {
        personas.set(persona.id, persona);
      }
    }
  }
  return Array.from(personas.values());
}

function ratio(count: number, total: number) {
  return total > 0 ? roundScore(count / total) : 0;
}

function roundScore(value: number) {
  return Math.round(value * 100) / 100;
}

function formatCounts(counts: Record<string, number>): string {
  return Object.entries(counts)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");
}

async function writeJson(filePath: string, value: unknown) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function slugifyRoute(route: string): string {
  if (route === "/") return "home";
  return route.replace(/^\//, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "route";
}

function timestampCycleId(): string {
  return `cycle-${new Date().toISOString().replace(/[-:]/g, "").replace(/\..+$/, "z")}`;
}

const PERSONALITY_AXES: Array<{ name: string; leftFacet: PersonalityFacet; rightFacet: PersonalityFacet }> = [
  { name: "introversion/extraversion", leftFacet: "introversion", rightFacet: "extraversion" },
  { name: "sensing/intuition", leftFacet: "sensing", rightFacet: "intuition" },
  { name: "thinking/feeling", leftFacet: "thinking", rightFacet: "feeling" },
  { name: "judging/perceiving", leftFacet: "judging", rightFacet: "perceiving" },
];

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
