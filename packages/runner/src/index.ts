import {
  buildSimulationReport,
  type DeviceProfile,
  type Finding,
  type JourneyEvent,
  type PersonaProfile,
  type Reaction,
  type Recommendation,
  type ReferenceSource,
  type Report,
  type ScreenEvidence,
  type ScreenEvidenceAnnotation,
  type SimulationSnapshot,
} from "@snoopy/reports";
import { chromium, type APIRequestContext, type Browser, type Page } from "playwright";
import { z } from "zod";
import { captureRunnerEvent, flushRunnerAnalytics, generateGemmaReaction } from "./model-runtime";

export const personaSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().min(2),
  role: z.string().min(2),
  face: z.string().min(1).max(4).optional(),
  goal: z.string().min(5),
  backstory: z.string().min(5),
  memories: z.array(z.string().min(1)).optional(),
  tastes: z.array(z.string().min(1)).optional(),
  blindSpots: z.array(z.string().min(1)).optional(),
  motivations: z.array(z.string().min(1)).optional(),
  likes: z.array(z.string().min(1)).optional(),
  deviceHabits: z.array(z.string().min(1)).optional(),
  skepticism: z.string().min(1).optional(),
  trustThreshold: z.number().min(0).max(1).default(0.65),
  voice: z
    .object({
      style: z.enum(["professional", "plainspoken", "blunt"]),
      allowsMildProfanity: z.boolean().default(false),
      profanityLevel: z.enum(["none", "mild", "moderate"]).default("none"),
    })
    .optional(),
  personalityFacets: z
    .object({
      introversion: z.number().min(0).max(1),
      extraversion: z.number().min(0).max(1),
      sensing: z.number().min(0).max(1),
      intuition: z.number().min(0).max(1),
      thinking: z.number().min(0).max(1),
      feeling: z.number().min(0).max(1),
      judging: z.number().min(0).max(1),
      perceiving: z.number().min(0).max(1),
    })
    .optional(),
  critiqueLens: z.array(z.string().min(1)).optional(),
  sourceDiet: z.array(z.string().min(1)).optional(),
  dayPlan: z.array(z.string().min(1)).optional(),
  customerRelationship: z.string().min(1).optional(),
  privateExclusive: z.boolean().optional(),
  customerOwned: z.boolean().optional(),
});

export const priorPersonaOutputSchema = z.object({
  cycleId: z.string().min(1).optional(),
  route: z.string().min(1).optional(),
  personaId: z.string().min(1),
  emotion: z.string().min(1).optional(),
  thought: z.string().min(1),
  evidence: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
});

export const deviceProfileSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  kind: z.enum(["mobile", "tablet", "laptop", "desktop"]),
  viewport: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
  userAgent: z.string().min(1),
});

export const runInputSchema = z.object({
  runId: z.string().min(1),
  targetUrl: z.url(),
  goal: z.string().min(5).optional(),
  persona: personaSchema.optional(),
  personas: z.array(personaSchema).min(1).max(10).optional(),
  devices: z.array(deviceProfileSchema).min(1).max(4).optional(),
  comparisonUrls: z.array(z.url()).max(5).optional(),
  newsUrls: z.array(z.url()).max(5).optional(),
  marketContext: z.string().max(4_000).optional(),
  priorPersonaOutputs: z.array(priorPersonaOutputSchema).max(120).optional(),
  initialLocalStorage: z.record(z.string(), z.string()).optional(),
  analyticsDistinctId: z.string().min(1).optional(),
  cycleId: z.string().min(1).optional(),
  maxPages: z.number().int().min(1).max(3).default(1),
  safeMode: z.literal(true).default(true),
});

export type Persona = z.infer<typeof personaSchema>;
export type PriorPersonaOutput = z.infer<typeof priorPersonaOutputSchema>;
export type RunDeviceProfile = z.infer<typeof deviceProfileSchema>;
export type RunInput = z.infer<typeof runInputSchema>;

export type BrowserEvent = {
  type: "navigation" | "observation" | "blocked_submit" | "finding" | "error";
  url: string;
  message: string;
  occurredAt: string;
};

export type RunResult = {
  input: RunInput;
  events: BrowserEvent[];
  report: Report;
};

export const defaultDeviceProfiles: DeviceProfile[] = [
  {
    id: "iphone",
    label: "iPhone",
    kind: "mobile",
    viewport: { width: 390, height: 844 },
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  },
  {
    id: "tablet",
    label: "Tablet",
    kind: "tablet",
    viewport: { width: 820, height: 1180 },
    userAgent:
      "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  },
  {
    id: "laptop",
    label: "Laptop",
    kind: "laptop",
    viewport: { width: 1366, height: 900 },
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
  },
  {
    id: "desktop",
    label: "Desktop",
    kind: "desktop",
    viewport: { width: 1600, height: 1000 },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
  },
];

export const defaultPersonas: PersonaProfile[] = [
  {
    id: "maya",
    name: "Maya",
    role: "Operations buyer with budget pressure",
    goal: "Decide whether the product is clear enough to trial without surprising her team.",
    backstory: "Runs a lean ops team, owns renewal cleanup, and evaluates tools between meetings while finance asks for proof.",
    memories: [
      "Once got surprised by hidden implementation fees after a polished demo.",
      "Recently helped finance cut duplicate SaaS tools and now distrusts vague packaging.",
    ],
    tastes: ["Plain pricing tables", "Obvious setup steps", "ROI claims tied to examples"],
    motivations: ["Save admin time", "Avoid migration surprises", "Prove ROI quickly"],
    likes: ["Transparent pricing", "Security badges near CTAs", "Short customer stories"],
    deviceHabits: ["Skims on iPhone before meetings", "Compares plans on laptop later"],
    skepticism: "Assumes vague copy means a sales call, hidden services work, or a painful rollout.",
    trustThreshold: 0.72,
    personalityFacets: {
      introversion: 0.25,
      extraversion: 0.75,
      sensing: 0.82,
      intuition: 0.18,
      thinking: 0.72,
      feeling: 0.28,
      judging: 0.86,
      perceiving: 0.14,
    },
    critiqueLens: ["pricing transparency", "implementation effort", "operational proof", "budget risk"],
  },
  {
    id: "leo",
    name: "Leo",
    role: "Freelance designer with a high visual bar",
    goal: "Decide whether the product looks credible enough to show a paying client.",
    backstory: "Audits client sites for hierarchy, spacing, contrast, and taste; notices when a page feels assembled instead of designed.",
    memories: [
      "Dropped a vendor because the dashboard looked rough in screenshots.",
      "Won a client by turning a dense page into a calm product story.",
    ],
    tastes: ["Strong visual hierarchy", "Readable spacing", "Real product screenshots", "Polished responsive layouts"],
    motivations: ["Protect client trust", "Find tasteful tools", "Avoid embarrassing recommendations"],
    likes: ["Crisp screenshots", "Concise feature names", "Confident typography"],
    deviceHabits: ["Checks first impressions on mobile", "Inspects density and alignment on desktop"],
    skepticism: "Distrusts pages that look unfinished, text-heavy, low-contrast, or generic compared with modern SaaS benchmarks.",
    trustThreshold: 0.6,
    voice: { style: "blunt", allowsMildProfanity: true, profanityLevel: "moderate" },
    personalityFacets: {
      introversion: 0.68,
      extraversion: 0.32,
      sensing: 0.34,
      intuition: 0.66,
      thinking: 0.25,
      feeling: 0.75,
      judging: 0.22,
      perceiving: 0.78,
    },
    critiqueLens: ["visual design", "readability", "taste", "competitive polish"],
  },
  {
    id: "nora",
    name: "Nora",
    role: "Security-conscious founder",
    goal: "Decide whether the service is credible enough to touch company or customer data.",
    backstory: "Bootstrapped a regulated workflow company and reads privacy, retention, and credential boundaries carefully.",
    memories: [
      "A vendor once failed procurement over missing data-retention terms.",
      "Customers ask her about SOC 2, subprocessors, and audit trails every quarter.",
    ],
    tastes: ["Precise compliance language", "Docs links", "Evidence over adjectives"],
    motivations: ["Reduce vendor risk", "Move quickly without security debt", "Answer customer objections"],
    likes: ["Privacy links", "Compliance claims with detail", "Named customer proof"],
    deviceHabits: ["Researches deeply on laptop", "Rechecks claims on tablet in the evening"],
    skepticism: "Treats missing security language, unclear credential boundaries, or hand-wavy AI claims as blockers.",
    trustThreshold: 0.86,
    personalityFacets: {
      introversion: 0.72,
      extraversion: 0.28,
      sensing: 0.26,
      intuition: 0.74,
      thinking: 0.88,
      feeling: 0.12,
      judging: 0.84,
      perceiving: 0.16,
    },
    critiqueLens: ["trust evidence", "security boundaries", "data retention", "procurement risk"],
  },
  {
    id: "omar",
    name: "Omar",
    role: "Revenue-focused ecommerce manager",
    goal: "See whether the product can improve conversion this week without slowing the team.",
    backstory: "Owns weekly revenue targets and checks tools between campaign, inventory, and checkout alerts.",
    memories: [
      "Lost a weekend to a plugin that broke checkout.",
      "Remembers a vendor winning him over with a concrete 90-second demo and before-after numbers.",
    ],
    tastes: ["Concrete outcomes", "Short demos", "Obvious next steps", "Fast pages"],
    motivations: ["Increase conversion", "Avoid checkout risk", "Ship improvements quickly"],
    likes: ["Before-and-after examples", "Fast demos", "Clear implementation promises"],
    deviceHabits: ["Monitors on phone", "Approves purchases on desktop"],
    skepticism: "Needs proof that setup will not hurt revenue or distract the team.",
    trustThreshold: 0.68,
    voice: { style: "plainspoken", allowsMildProfanity: true, profanityLevel: "mild" },
    personalityFacets: {
      introversion: 0.18,
      extraversion: 0.82,
      sensing: 0.78,
      intuition: 0.22,
      thinking: 0.64,
      feeling: 0.36,
      judging: 0.36,
      perceiving: 0.64,
    },
    critiqueLens: ["conversion urgency", "setup speed", "checkout risk", "mobile clarity"],
  },
  {
    id: "ivy",
    name: "Ivy",
    role: "Visually impaired accessibility researcher",
    goal: "Check whether the experience works with screen-reader habits, zoom, keyboard navigation, and low-vision reading needs.",
    backstory: "Uses a screen reader, high zoom, and keyboard-first browsing; studies where visual styling hides the actual task.",
    memories: [
      "Watched users miss a critical CTA because it looked decorative and had no useful accessible name.",
      "Abandoned a signup flow after pale text and tiny controls made it exhausting to read.",
    ],
    tastes: ["Readable contrast", "Plain labels", "Predictable focus order", "Accessible forms"],
    motivations: ["Reduce exclusion", "Expose hard-to-read UI", "Make decisions possible without perfect vision"],
    likes: ["High-contrast text", "Visible focus states", "Useful alt text", "Helpful empty states"],
    deviceHabits: ["Uses a screen reader on laptop", "Zooms mobile pages to 200%", "Tabs through forms before trusting them"],
    skepticism: "Calls out tiny text, weak contrast, missing labels, and interfaces that only work visually.",
    trustThreshold: 0.78,
    voice: { style: "plainspoken", allowsMildProfanity: false, profanityLevel: "none" },
    personalityFacets: {
      introversion: 0.64,
      extraversion: 0.36,
      sensing: 0.7,
      intuition: 0.3,
      thinking: 0.34,
      feeling: 0.66,
      judging: 0.8,
      perceiving: 0.2,
    },
    critiqueLens: ["accessibility", "readability", "screen reader usability", "keyboard flow"],
  },
  {
    id: "quinn",
    name: "Quinn",
    role: "Automation-minded builder and agent user",
    goal: "Decide whether another agent or technical buyer could use the product output to improve a site without babysitting it.",
    backstory: "Builds internal AI workflows, compares tools by their APIs and artifacts, and wants outputs that survive handoff between agents.",
    memories: [
      "Integrated a tool that looked impressive but produced vague reports no engineer could act on.",
      "Saw a competitor win budget because its API examples and output schema were immediately testable.",
    ],
    tastes: ["Structured JSON", "Traceable evidence", "API examples", "Clear comparison context"],
    motivations: ["Automate repeatable critique", "Reduce agent handoff loss", "Compare against current market expectations"],
    likes: ["Machine-readable reports", "Webhook-ready data", "Validation logs", "Explicit uncertainty"],
    deviceHabits: ["Reads docs on desktop", "Checks JSON payloads and examples before trusting the UI"],
    skepticism: "Flags novelty that does not become reusable data, differentiated critique, or deployable workflow.",
    trustThreshold: 0.7,
    voice: { style: "plainspoken", allowsMildProfanity: true, profanityLevel: "moderate" },
    personalityFacets: {
      introversion: 0.42,
      extraversion: 0.58,
      sensing: 0.18,
      intuition: 0.82,
      thinking: 0.82,
      feeling: 0.18,
      judging: 0.26,
      perceiving: 0.74,
    },
    critiqueLens: ["agent readiness", "output usefulness", "comparison context", "workflow novelty"],
  },
  {
    id: "mike-the-creator",
    name: "MIKE THE CREATOR",
    role: "Impatient product creator with money on the line",
    goal: "Force the product to show something amazing, useful, graphical, and worth paying for.",
    backstory:
      "Direct product creator with low patience for techno-speak, boring screens, fake agreement, and product pages that fail to show the core value.",
    memories: [
      "Said show, do not tell.",
      "Rejected hosting and infrastructure talk as product-killing noise.",
      "Said personas should call out boring UI and weak product flow before the user has to.",
    ],
    tastes: ["Metaphorical fireworks", "Graphical proof", "Direct criticism", "Useful product flow", "Before and after"],
    motivations: ["Make the product commercially valuable", "Improve boring UI", "Expose regression-to-the-mean agent behavior"],
    likes: ["First-person direct speech", "Constructive agent conversation", "Screens that make value obvious"],
    deviceHabits: ["Skims fast on desktop", "Stops reading when a page becomes a form wall"],
    skepticism: "Assumes boring design, infrastructure talk, forced-agreement language, and techno-speak are failures until the product proves otherwise.",
    trustThreshold: 0.9,
    voice: { style: "blunt", allowsMildProfanity: true, profanityLevel: "moderate" },
    personalityFacets: {
      introversion: 0.28,
      extraversion: 0.72,
      sensing: 0.22,
      intuition: 0.78,
      thinking: 0.9,
      feeling: 0.1,
      judging: 0.7,
      perceiving: 0.3,
    },
    critiqueLens: ["commercial value", "show do not tell", "graphical design", "boring detection", "direct creator taste"],
  },
];

function toPersonaProfile(persona: Persona, fallbackId: string, goalOverride?: string): PersonaProfile {
  return {
    id: persona.id ?? fallbackId,
    name: persona.name,
    role: persona.role,
    face: persona.face,
    goal: goalOverride ?? persona.goal,
    backstory: persona.backstory,
    memories: persona.memories ?? ["Remembers when a similar site made the next step hard to find."],
    tastes: persona.tastes ?? ["Clear copy", "Predictable navigation", "Fast answers"],
    blindSpots: persona.blindSpots,
    motivations: persona.motivations ?? ["Make a confident decision", "Avoid wasting time"],
    likes: persona.likes ?? ["Transparent pricing", "Specific proof", "Simple CTAs"],
    deviceHabits: persona.deviceHabits ?? ["Starts on mobile", "Finishes on laptop"],
    skepticism: persona.skepticism ?? "Needs concrete evidence before trusting broad claims.",
    trustThreshold: persona.trustThreshold,
    personalityFacets: persona.personalityFacets,
    critiqueLens: persona.critiqueLens,
    voice: persona.voice,
    sourceDiet: persona.sourceDiet,
    dayPlan: persona.dayPlan,
    customerRelationship: persona.customerRelationship,
    privateExclusive: persona.privateExclusive,
    customerOwned: persona.customerOwned,
  };
}

export function validateRunInput(input: unknown): RunInput {
  const parsed = runInputSchema.parse(input);
  const personas = parsed.personas ?? (parsed.persona ? [parsed.persona] : undefined);
  return {
    ...parsed,
    persona: parsed.persona ?? personas?.[0] ?? defaultPersonas[0],
    personas: personas ?? defaultPersonas,
    devices: parsed.devices ?? defaultDeviceProfiles,
  };
}

export function createSafeModeFinding(input: RunInput): Finding {
  const personaName = input.persona?.name ?? "A persona";
  return {
    category: "conversion_friction",
    severity: "medium",
    title: "Safe-mode run stopped before form submission",
    evidence: `${personaName} reached an action that would submit data on ${input.targetUrl}.`,
    recommendation: "Review the pre-submit copy, trust signals, and confirmation expectations before enabling live submission tests.",
    confidence: 0.66,
  };
}

function createFinding(
  category: Finding["category"],
  severity: Finding["severity"],
  title: string,
  evidence: string,
  recommendation: string,
  confidence = 0.68,
): Finding {
  return { category, severity, title, evidence, recommendation, confidence };
}

function extractSameOriginLinks(baseUrl: string, hrefs: string[], maxPages: number): string[] {
  const normalizedBaseUrl = normalizeNavigableUrl(baseUrl);
  const origin = new URL(normalizedBaseUrl).origin;
  const seen = new Set<string>([normalizedBaseUrl]);
  const links: string[] = [];

  for (const href of hrefs) {
    try {
      const link = normalizeNavigableUrl(href, normalizedBaseUrl);
      const url = new URL(link);
      if (url.origin !== origin || seen.has(link)) continue;
      seen.add(link);
      links.push(link);
      if (links.length >= maxPages - 1) break;
    } catch {
      continue;
    }
  }

  return links;
}

function normalizeNavigableUrl(value: string, baseUrl?: string): string {
  const url = new URL(value, baseUrl);
  url.hash = "";
  return url.toString();
}

async function captureVisualMetrics(page: Page): Promise<VisualMetrics> {
  return page.evaluate(`
    (() => {
      function parseRgb(value) {
        function parseAlpha(raw) {
          if (!raw) return 1;
          return raw.trim().endsWith("%") ? Number(raw.trim().slice(0, -1)) / 100 : Number(raw);
        }
        function channelToByte(channel) {
          return Math.max(0, Math.min(255, Math.round(channel * 255)));
        }
        function gammaCorrect(channel) {
          const clamped = Math.max(0, Math.min(1, channel));
          return clamped <= 0.0031308 ? clamped * 12.92 : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
        }
        function parseModernColorBody(raw) {
          const parts = raw.split("/");
          const channels = parts[0].trim().split(/\\s+/).map((part) => Number(part.replace("%", "")));
          const alpha = parseAlpha(parts[1]);
          return { channels, alpha };
        }
        function labToRgb(l, a, b, alpha) {
          const y = (l + 16) / 116;
          const x = a / 500 + y;
          const z = y - b / 200;
          const pivot = (value) => {
            const cubed = Math.pow(value, 3);
            return cubed > 0.008856 ? cubed : (value - 16 / 116) / 7.787;
          };
          const X = 0.95047 * pivot(x);
          const Y = pivot(y);
          const Z = 1.08883 * pivot(z);
          const red = gammaCorrect(3.2406 * X - 1.5372 * Y - 0.4986 * Z);
          const green = gammaCorrect(-0.9689 * X + 1.8758 * Y + 0.0415 * Z);
          const blue = gammaCorrect(0.0557 * X - 0.204 * Y + 1.057 * Z);
          return [channelToByte(red), channelToByte(green), channelToByte(blue), alpha];
        }
        function oklabToRgb(l, a, b, alpha) {
          const lPrime = l + 0.3963377774 * a + 0.2158037573 * b;
          const mPrime = l - 0.1055613458 * a - 0.0638541728 * b;
          const sPrime = l - 0.0894841775 * a - 1.291485548 * b;
          const L = Math.pow(lPrime, 3);
          const M = Math.pow(mPrime, 3);
          const S = Math.pow(sPrime, 3);
          const red = gammaCorrect(4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S);
          const green = gammaCorrect(-1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S);
          const blue = gammaCorrect(-0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S);
          return [channelToByte(red), channelToByte(green), channelToByte(blue), alpha];
        }
        const match = value.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?/i);
        if (match) {
          const alpha = match[4] === undefined ? 1 : Number(match[4]);
          if (alpha === 0) return null;
          return [Number(match[1]), Number(match[2]), Number(match[3]), alpha];
        }
        const labMatch = value.match(/^lab\\((.+)\\)$/i);
        if (labMatch) {
          const parsed = parseModernColorBody(labMatch[1]);
          if (parsed.alpha === 0 || parsed.channels.length < 3) return null;
          return labToRgb(parsed.channels[0], parsed.channels[1], parsed.channels[2], parsed.alpha);
        }
        const oklabMatch = value.match(/^oklab\\((.+)\\)$/i);
        if (oklabMatch) {
          const parsed = parseModernColorBody(oklabMatch[1]);
          if (parsed.alpha === 0 || parsed.channels.length < 3) return null;
          return oklabToRgb(parsed.channels[0], parsed.channels[1], parsed.channels[2], parsed.alpha);
        }
        const oklchMatch = value.match(/^oklch\\((.+)\\)$/i);
        if (oklchMatch) {
          const parsed = parseModernColorBody(oklchMatch[1]);
          if (parsed.alpha === 0 || parsed.channels.length < 3) return null;
          const hue = (parsed.channels[2] * Math.PI) / 180;
          return oklabToRgb(parsed.channels[0], parsed.channels[1] * Math.cos(hue), parsed.channels[1] * Math.sin(hue), parsed.alpha);
        }
        return null;
      }
      function blend(top, bottom) {
        const alpha = top[3] ?? 1;
        return [
          Math.round(top[0] * alpha + bottom[0] * (1 - alpha)),
          Math.round(top[1] * alpha + bottom[1] * (1 - alpha)),
          Math.round(top[2] * alpha + bottom[2] * (1 - alpha)),
          1
        ];
      }
      function effectiveBackground(element) {
        const layers = [];
        let node = element;
        while (node && node.nodeType === Node.ELEMENT_NODE) {
          const background = parseRgb(window.getComputedStyle(node).backgroundColor);
          if (background) layers.push(background);
          node = node.parentElement;
        }
        const htmlBackground = parseRgb(window.getComputedStyle(document.documentElement).backgroundColor);
        if (htmlBackground) layers.push(htmlBackground);
        let color = [255, 255, 255, 1];
        for (let index = layers.length - 1; index >= 0; index -= 1) {
          color = blend(layers[index], color);
        }
        return color;
      }
      function luminance(color) {
        function transform(channel) {
          const normalized = channel / 255;
          return normalized <= 0.03928 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
        }
        return 0.2126 * transform(color[0]) + 0.7152 * transform(color[1]) + 0.0722 * transform(color[2]);
      }
      function contrastRatio(foreground, background) {
        const foregroundLuminance = luminance(foreground);
        const backgroundLuminance = luminance(background);
        const lighter = Math.max(foregroundLuminance, backgroundLuminance);
        const darker = Math.min(foregroundLuminance, backgroundLuminance);
        return (lighter + 0.05) / (darker + 0.05);
      }
      function isVisible(element) {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none" && Number(style.opacity) > 0;
      }
      function accessibleName(element) {
        const id = element.getAttribute("id");
        const label = id && window.CSS && CSS.escape ? document.querySelector('label[for="' + CSS.escape(id) + '"]')?.textContent ?? "" : "";
        return [
          element.getAttribute("aria-label"),
          element.getAttribute("title"),
          element.textContent,
          label,
          element.getAttribute("placeholder"),
          element.getAttribute("alt")
        ].filter(Boolean).join(" ").trim();
      }

      const textElements = Array.from(document.body?.querySelectorAll("h1,h2,h3,h4,h5,h6,p,li,a,button,label,span,small,td,th,input,textarea,select") ?? []).filter(
        (element) => isVisible(element) && (element.textContent?.trim() || element.getAttribute("placeholder"))
      );
      const fontSizes = textElements.map((element) => Number.parseFloat(window.getComputedStyle(element).fontSize || "16")).filter(Number.isFinite);
      const smallTextCount = textElements.filter((element) => Number.parseFloat(window.getComputedStyle(element).fontSize || "16") < 14).length;
      const lowContrastTextCount = textElements.filter((element) => {
        const style = window.getComputedStyle(element);
        const foreground = parseRgb(style.color);
        const background = effectiveBackground(element);
        if (!foreground) return false;
        const fontSize = Number.parseFloat(style.fontSize || "16");
        const minimumRatio = fontSize >= 18 ? 3 : 4.5;
        return contrastRatio(foreground, background) < minimumRatio;
      }).length;
      const controls = Array.from(document.body?.querySelectorAll("button,input,select,textarea,[role='button'],[role='link'],a[href]") ?? []).filter(isVisible);
      const unlabeledControlCount = controls.filter((element) => accessibleName(element).length === 0).length;
      const genericLinkCount = Array.from(document.body?.querySelectorAll("a[href],button") ?? []).filter((element) => {
        if (!isVisible(element)) return false;
        const label = accessibleName(element).toLowerCase();
        return /^(click here|learn more|read more|submit|more|go|start)$/.test(label);
      }).length;
      const longLineCount = textElements.filter((element) => {
        const rect = element.getBoundingClientRect();
        const fontSize = Number.parseFloat(window.getComputedStyle(element).fontSize || "16");
        return rect.width / Math.max(fontSize, 1) > 72;
      }).length;

      return {
        visibleTextElementCount: textElements.length,
        smallTextCount,
        lowContrastTextCount,
        unlabeledControlCount,
        genericLinkCount,
        imageCount: Array.from(document.images).filter(isVisible).length,
        headingCount: Array.from(document.body?.querySelectorAll("h1,h2,h3,h4,h5,h6") ?? []).filter(isVisible).length,
        landmarkCount: Array.from(document.body?.querySelectorAll("main,nav,header,footer,aside,section,[role='main'],[role='navigation']") ?? []).filter(isVisible).length,
        interactiveCount: controls.length,
        longLineCount,
        averageFontSize: fontSizes.length ? fontSizes.reduce((sum, size) => sum + size, 0) / fontSizes.length : 0,
        bodyTextLength: document.body?.innerText.length ?? 0,
        bodyScrollHeight: document.documentElement.scrollHeight,
        viewportHeight: window.innerHeight
      };
    })()
  `) as Promise<VisualMetrics>;
}

async function collectReferenceSources(browser: Browser, input: RunInput): Promise<ReferenceSource[]> {
  const sources: ReferenceSource[] = [];

  if (input.marketContext?.trim()) {
    sources.push({
      id: "market-context",
      kind: "market_news",
      title: "Provided market context",
      summary: input.marketContext.trim().slice(0, 1_200),
      observedAt: new Date().toISOString(),
    });
  }

  const urlSources = [
    ...(input.comparisonUrls ?? []).map((url) => ({ url, kind: "comparison_site" as const })),
    ...(input.newsUrls ?? []).map((url) => ({ url, kind: "market_news" as const })),
  ];

  for (const [index, source] of urlSources.entries()) {
    const page = await browser.newPage();
    await page.route("**/*", async (route) => {
      if (["GET", "HEAD", "OPTIONS"].includes(route.request().method())) {
        await route.continue();
        return;
      }
      await route.abort("blockedbyclient");
    });

    try {
      await page.goto(source.url, { waitUntil: "domcontentloaded", timeout: 15_000 });
      await page.waitForLoadState("networkidle", { timeout: 3_000 }).catch(() => undefined);
      const title = (await page.title()) || source.url;
      const text = (await page.locator("body").innerText({ timeout: 3_000 }).catch(() => "")).replace(/\s+/g, " ").trim();
      sources.push({
        id: `${source.kind}-${index + 1}`,
        kind: source.kind,
        title,
        url: source.url,
        summary: text.slice(0, 1_200) || "Reference page loaded, but no readable body text was captured.",
        observedAt: new Date().toISOString(),
      });
    } catch (error) {
      sources.push({
        id: `${source.kind}-${index + 1}`,
        kind: source.kind,
        title: source.url,
        url: source.url,
        summary: `Reference could not be read: ${error instanceof Error ? error.message : "Unknown error."}`,
        observedAt: new Date().toISOString(),
      });
    } finally {
      await page.close();
    }
  }

  return sources;
}

type PageVisit = {
  personaId: string;
  personaName: string;
  deviceId: string;
  deviceLabel: string;
  url: string;
  title: string;
  contentType: string;
  text: string;
  linkCount: number;
  formCount: number;
  visualMetrics: VisualMetrics;
};

type CapturedScreen = ScreenEvidence;

type VisualMetrics = {
  visibleTextElementCount: number;
  smallTextCount: number;
  lowContrastTextCount: number;
  unlabeledControlCount: number;
  genericLinkCount: number;
  imageCount: number;
  headingCount: number;
  landmarkCount: number;
  interactiveCount: number;
  longLineCount: number;
  averageFontSize: number;
  bodyTextLength: number;
  bodyScrollHeight: number;
  viewportHeight: number;
};

type ReactionContext = {
  runId: string;
  analyticsDistinctId?: string;
  cycleId?: string;
  priorPersonaOutputs: PriorPersonaOutput[];
  referenceSources: ReferenceSource[];
  personasById?: Map<string, string>;
  personaProfilesById?: Map<string, PersonaProfile>;
  currentRunReactions?: Reaction[];
};

function inferFindings(input: RunInput, visited: PageVisit[]): Finding[] {
  if (visited.length > 0 && visited.every(isMachineReadableVisit)) {
    return inferMachineReadableFindings(visited);
  }

  const allText = visited.map((page) => page.text.toLowerCase()).join("\n");
  const personaNames = Array.from(new Set(visited.map((page) => page.personaName))).slice(0, 3).join(", ") || input.persona?.name || "Personas";
  const findings: Finding[] = [];

  if (!allText.includes("pricing") && !allText.includes("price")) {
    findings.push(
      createFinding(
        "conversion_friction",
        "medium",
        "Pricing path is not obvious",
        `${personaNames} could not see explicit pricing language across the sampled agent/device journeys.`,
        "Add a persistent pricing route or clearer plan language near the primary CTA.",
      ),
    );
  }

  if (!/(security|privacy|soc 2|gdpr|compliance|customers|trusted)/i.test(allText)) {
    findings.push(
      createFinding(
        "trust_issue",
        "medium",
        "Trust evidence is light in the sampled journey",
        "The visited pages did not expose clear security, privacy, compliance, or customer proof language.",
        "Move trust signals closer to the first decision point for skeptical buyers.",
        0.62,
      ),
    );
  }

  if (!/(how it works|features|benefits|use cases|faq|demo|example)/i.test(allText)) {
    findings.push(
      createFinding(
        "confusion",
        "medium",
        "Value path needs more orientation",
        `${personaNames} did not encounter familiar orientation cues such as features, examples, FAQs, or a how-it-works explanation.`,
        "Add a short explanatory section near the first CTA that explains who the product is for and what happens next.",
        0.64,
      ),
    );
  }

  const hasGenericCtaCopy = /(click here|submit|learn more|read more)/i.test(allText);
  const hasOutcomeCtaCopy =
    /(start trial|book demo|get pricing|view plans|create account|get started|start website review|run review|copy implementation plan|download implementation plan|copy visible fix plan|download visible plan|copy this fix|fix handoff|implementation plan)/i.test(
      allText,
    );

  if (hasGenericCtaCopy && !hasOutcomeCtaCopy) {
    findings.push(
      createFinding(
        "copy_problem",
        "medium",
        "CTA copy is too generic",
        "The sampled journey relies on broad CTA language without a specific outcome-oriented action.",
        "Rewrite CTA labels around the visitor's next outcome, such as viewing plans, booking a demo, or starting a trial.",
        0.67,
      ),
    );
  }

  if (!/(start|trial|demo|contact|buy|checkout|sign up|get started)/i.test(allText)) {
    findings.push(
      createFinding(
        "dead_end",
        "high",
        "Primary next step is unclear",
        "The runner did not find common CTA language in the sampled page text.",
        "Use one visible primary action that matches the visitor's likely intent.",
        0.7,
      ),
    );
  }

  const formPages = visited.filter((page) => page.formCount > 0);
  if (formPages.length > 0) {
    findings.push(createSafeModeFinding(input));
  }

  if (findings.length === 0) {
    findings.push(
      createFinding(
        "suggested_fix",
        "low",
        "Baseline journey is readable",
        "The sampled pages exposed pricing, trust language, and a recognizable next step.",
        "Run additional agents against narrower goals to find role-specific friction.",
        0.58,
      ),
    );
  }

  return findings;
}

function inferMachineReadableFindings(visited: PageVisit[]): Finding[] {
  const allText = visited.map((page) => page.text.toLowerCase()).join("\n");
  const findings: Finding[] = [];

  if (visited.every(isImplementationQueueVisit)) {
    if (!/(agent judgment context|latest reaction|thought|evidence|persona|stance)/i.test(allText)) {
      findings.push(
        createFinding(
          "agent_readiness",
          "medium",
          "Implementation queue is missing agent judgment context",
          "The markdown artifact did not preserve enough persona reaction, stance, thought, or evidence for another agent to understand why the work matters.",
          "Include the latest persona reactions and evidence beside the recommendation work items.",
          0.68,
        ),
      );
    }

    if (!/(recommendation|task|implementation step|acceptance criteria|affected region)/i.test(allText)) {
      findings.push(
        createFinding(
          "confusion",
          "medium",
          "Implementation queue is not actionable enough",
          "The markdown artifact did not expose concrete recommendations, implementation steps, affected regions, or acceptance criteria.",
          "Keep each recommendation tied to a task, implementation steps, and acceptance criteria so a downstream agent can pick it up without reopening the UI.",
          0.66,
        ),
      );
    }

    if (!/(run|report|route|source|generated)/i.test(allText)) {
      findings.push(
        createFinding(
          "agent_readiness",
          "medium",
          "Implementation queue lacks source context",
          "The markdown artifact did not clearly identify the source run, report, route, or generation context.",
          "Add source metadata so future agents can trace the work back to the audited report.",
          0.62,
        ),
      );
    }

    if (findings.length === 0) {
      findings.push(
        createFinding(
          "suggested_fix",
          "low",
          "Implementation queue is agent-ready",
          "The markdown artifact preserves agent judgment, evidence, source context, recommendation work, and acceptance criteria for downstream implementation.",
          "Keep auditing downloadable artifacts whenever report structure or agent memory changes.",
          0.6,
        ),
      );
    }

    return findings;
  }

  if (!/(api|json|schema|metadata|endpoint|method|path|response|automation|command|artifact)/i.test(allText)) {
    findings.push(
      createFinding(
        "agent_readiness",
        "medium",
        "Machine-readable route does not explain its contract",
        "The sampled API route returned machine-readable data, but the payload did not expose endpoint, schema, command, automation, or artifact language.",
        "Add explicit contract fields so agents can understand how to call the service and reuse its outputs without inspecting application code.",
        0.68,
      ),
    );
  }

  if (!/(example|fixture|minimumbody|valuecontract|fieldcontracts|responseshape|required|optional|responsefields|personafields|recommendationworkitemfields)/i.test(allText)) {
    findings.push(
      createFinding(
        "confusion",
        "medium",
        "Machine-readable route lacks examples or field guidance",
        "The sampled API payload did not expose examples, fixtures, value contracts, or output field lists.",
        "Include concrete example requests, fixture paths, and field contracts for future agents and integrations.",
        0.66,
      ),
    );
  }

  if (!/(credential|credentials|availablewithoutcredentials|production|fallback|read-only|readonly|persistence|privacy|boundary)/i.test(allText)) {
    findings.push(
      createFinding(
        "trust_issue",
        "medium",
        "Machine-readable route lacks credential and persistence boundaries",
        "The sampled API payload did not clearly expose credential, production, fallback, privacy, or persistence boundaries.",
        "Expose operational boundaries in the JSON contract so agents know what is safe to run, what requires production credentials, and where artifacts persist.",
        0.64,
      ),
    );
  }

  if (findings.length === 0) {
    findings.push(
      createFinding(
        "suggested_fix",
        "low",
        "Machine-readable contract is agent-ready",
        "The sampled API route exposes enough endpoint, automation, artifact, example, and boundary data for future agents to use it without reverse-engineering the code.",
        "Continue auditing machine-readable routes when new API fields, fixtures, or automation commands are added.",
        0.6,
      ),
    );
  }

  return findings;
}

function hasWords(text: string, pattern: RegExp): boolean {
  return pattern.test(text);
}

function hasReadabilityProblem(metrics: VisualMetrics): boolean {
  return metrics.lowContrastTextCount > 0 || metrics.smallTextCount >= 2 || metrics.longLineCount >= 2;
}

function hasVisualPolishProblem(metrics: VisualMetrics): boolean {
  const denseAndPlain = metrics.visibleTextElementCount >= 32 && metrics.imageCount === 0 && metrics.bodyScrollHeight > metrics.viewportHeight * 1.4;
  return hasReadabilityProblem(metrics) || denseAndPlain || metrics.headingCount === 0;
}

function hasAccessibilityProblem(metrics: VisualMetrics): boolean {
  return hasReadabilityProblem(metrics) || metrics.unlabeledControlCount > 0 || metrics.landmarkCount === 0;
}

function isMachineReadableVisit(visit: PageVisit): boolean {
  const contentType = visit.contentType.toLowerCase();
  return (
    contentType.includes("application/json") ||
    contentType.includes("application/problem+json") ||
    contentType.includes("application/ld+json") ||
    contentType.includes("text/markdown") ||
    contentType.includes("text/plain")
  );
}

function isImplementationQueueVisit(visit: PageVisit): boolean {
  const text = visit.text.toLowerCase();
  return (
    visit.url.includes("/implementation-queue") ||
    (visit.contentType.toLowerCase().includes("text/markdown") &&
      text.includes("implementation queue") &&
      text.includes("agent judgment context"))
  );
}

function blankVisualMetrics(viewportHeight: number): VisualMetrics {
  return {
    visibleTextElementCount: 0,
    smallTextCount: 0,
    lowContrastTextCount: 0,
    unlabeledControlCount: 0,
    genericLinkCount: 0,
    imageCount: 0,
    headingCount: 0,
    landmarkCount: 0,
    interactiveCount: 0,
    longLineCount: 0,
    averageFontSize: 0,
    bodyTextLength: 0,
    bodyScrollHeight: 0,
    viewportHeight,
  };
}

function machineReadableFormatName(visit: PageVisit): string {
  const contentType = visit.contentType.toLowerCase();
  if (isImplementationQueueVisit(visit)) return "markdown implementation queue";
  if (contentType.includes("json")) return "JSON";
  if (contentType.includes("markdown")) return "markdown";
  if (contentType.includes("text/plain")) return "plain text";
  return "machine-readable output";
}

async function captureDownloadedArtifactVisit(
  request: APIRequestContext,
  url: string,
  persona: PersonaProfile,
  device: DeviceProfile,
): Promise<PageVisit | undefined> {
  const response = await request.get(url, { timeout: 20_000 }).catch(() => undefined);
  if (!response?.ok()) return undefined;

  const contentType = response.headers()["content-type"] ?? "";
  const contentDisposition = response.headers()["content-disposition"] ?? "";
  const body = (await response.text().catch(() => "")).slice(0, 20_000);
  if (!contentDisposition.toLowerCase().includes("attachment") && !isMachineReadableVisit({ contentType, text: body, url } as PageVisit)) {
    return undefined;
  }

  return {
    personaId: persona.id,
    personaName: persona.name,
    deviceId: device.id,
    deviceLabel: device.label,
    url,
    title: contentDisposition || contentType || "Machine-readable artifact",
    contentType,
    text: body,
    linkCount: 0,
    formCount: 0,
    visualMetrics: blankVisualMetrics(device.viewport.height),
  };
}

function hasConsensusCollapse(priorOutputs: PriorPersonaOutput[]): boolean {
  if (priorOutputs.length < 4) return false;
  const normalizedThoughts = new Set(priorOutputs.map((output) => output.thought.toLowerCase().replace(/[^a-z]+/g, " ").trim()));
  const uniqueCategories = new Set(priorOutputs.map((output) => output.category ?? output.title ?? output.emotion ?? "unknown"));
  return normalizedThoughts.size <= Math.ceil(priorOutputs.length / 3) || uniqueCategories.size <= 2;
}

function routePath(value: string): string {
  try {
    return new URL(value, "http://snoopy.local").pathname || "/";
  } catch {
    return value || "/";
  }
}

function screenEvidenceId(deviceId: string, url: string): string {
  const route = routePath(url)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `screen-${deviceId}-${route || "root"}`;
}

function isMachineReadableContentType(contentType: string): boolean {
  const normalized = contentType.toLowerCase();
  return (
    normalized.includes("application/json") ||
    normalized.includes("application/problem+json") ||
    normalized.includes("application/ld+json") ||
    normalized.includes("text/markdown") ||
    normalized.includes("text/plain")
  );
}

async function captureScreenEvidence(page: Page, visit: PageVisit): Promise<CapturedScreen | undefined> {
  if (isMachineReadableContentType(visit.contentType)) return undefined;

  try {
    const viewport = page.viewportSize();
    const annotations = await captureScreenAnnotations(page);
    const image = await page.screenshot({ type: "jpeg", quality: 68, fullPage: false });
    return {
      id: screenEvidenceId(visit.deviceId, visit.url),
      route: routePath(visit.url),
      url: visit.url,
      deviceId: visit.deviceId,
      width: viewport?.width ?? 1,
      height: viewport?.height ?? visit.visualMetrics.viewportHeight,
      capturedAt: new Date().toISOString(),
      imageDataUrl: `data:image/jpeg;base64,${image.toString("base64")}`,
      altText: `${visit.deviceLabel} screenshot of ${visit.title || visit.url} captured during the Snoopy run.`,
      annotations,
    };
  } catch {
    return undefined;
  }
}

async function captureScreenAnnotations(page: Page): Promise<ScreenEvidenceAnnotation[]> {
  return page.evaluate(`
    (() => {
      function clean(value) {
        return String(value || "").replace(/\\s+/g, " ").trim();
      }
      function isVisible(element) {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none" && Number(style.opacity) > 0;
      }
      function labelFor(element) {
        return clean([
          element.getAttribute("aria-label"),
          element.getAttribute("alt"),
          element.getAttribute("title"),
          element.getAttribute("placeholder"),
          element.textContent
        ].filter(Boolean).join(" "));
      }
      function kindFor(element) {
        const tag = element.tagName.toLowerCase();
        const role = element.getAttribute("role") || "";
        if (/^h[1-6]$/.test(tag)) return "heading";
        if (tag === "a" || tag === "button" || role === "button" || role === "link") return "action";
        if (tag === "img" || element.querySelector("img")) return "image";
        if (tag === "form" || element.querySelector("input,textarea,select")) return "form";
        return "content";
      }
      function scoreFor(element, kind) {
        const tag = element.tagName.toLowerCase();
        const rect = element.getBoundingClientRect();
        const isNavigation = Boolean(element.closest("header,nav"));
        const topBonus = Math.max(0, 1 - rect.top / Math.max(window.innerHeight, 1)) * 0.2;
        const navigationPenalty = isNavigation ? 0.45 : 0;
        if (tag === "h1") return 1;
        if (tag === "h2") return 0.94;
        if (tag === "h3") return 0.86;
        if (kind === "form") return 0.82 + topBonus - navigationPenalty;
        if (kind === "action") return 0.8 + topBonus - navigationPenalty;
        if (kind === "image") return 0.72 + topBonus - navigationPenalty;
        return 0.52 + topBonus - navigationPenalty;
      }

      const selectors = "h1,h2,h3,a[href],button,[role='button'],[role='link'],form,img,main section";
      const seen = new Set();
      const candidates = Array.from(document.body?.querySelectorAll(selectors) || [])
        .filter((element) => {
          if (!isVisible(element)) return false;
          const label = labelFor(element);
          if (!label && !element.querySelector("img,input,textarea,select")) return false;
          const rect = element.getBoundingClientRect();
          if (rect.bottom <= 0 || rect.right <= 0 || rect.top >= window.innerHeight || rect.left >= window.innerWidth) return false;
          const key = [Math.round(rect.left), Math.round(rect.top), Math.round(rect.width), Math.round(rect.height), label.slice(0, 24)].join(":");
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .map((element) => {
          const rect = element.getBoundingClientRect();
          const kind = kindFor(element);
          const x = Math.max(0, Math.min(rect.left, window.innerWidth));
          const y = Math.max(0, Math.min(rect.top, window.innerHeight));
          const right = Math.max(x + 1, Math.min(rect.right, window.innerWidth));
          const bottom = Math.max(y + 1, Math.min(rect.bottom, window.innerHeight));
          const label = labelFor(element) || kind;
          return {
            kind,
            label: label.slice(0, 64),
            x: Math.round(x),
            y: Math.round(y),
            width: Math.round(right - x),
            height: Math.round(bottom - y),
            importance: Math.min(1, Math.max(0, scoreFor(element, kind))),
            evidence: kind + " visible in captured viewport"
          };
        })
        .sort((left, right) => right.importance - left.importance || left.y - right.y)
        .slice(0, 5)
        .map((annotation, index) => ({ id: "annotation-" + (index + 1), ...annotation }));

      return candidates;
    })()
  `) as Promise<ScreenEvidenceAnnotation[]>;
}

function priorOutputsForVisit(visit: PageVisit, priorOutputs: PriorPersonaOutput[]): PriorPersonaOutput[] {
  const currentPath = routePath(visit.url);
  return priorOutputs.filter((output) => !output.route || routePath(output.route) === currentPath);
}

function sourceLabel(referenceSources: ReferenceSource[]): string {
  const comparison = referenceSources.find((source) => source.kind === "comparison_site");
  const news = referenceSources.find((source) => source.kind === "market_news");
  return comparison?.title ?? news?.title ?? "available market references";
}

type ProfanityLevel = "none" | "mild" | "moderate";

function personaProfanityLevel(persona: PersonaProfile): ProfanityLevel {
  if (persona.voice?.profanityLevel) return persona.voice.profanityLevel;
  return persona.voice?.allowsMildProfanity ? "mild" : "none";
}

function humanVoice(persona: PersonaProfile, clean: string, mild: string, moderate = mild): string {
  const profanityLevel = personaProfanityLevel(persona);
  if (profanityLevel === "moderate") return moderate;
  if (profanityLevel === "mild" || persona.voice?.allowsMildProfanity) return mild;
  return clean;
}

function personaHasLens(persona: PersonaProfile, pattern: RegExp): boolean {
  const lensText = [persona.role, persona.skepticism, ...(persona.critiqueLens ?? [])].join(" ").toLowerCase();
  return pattern.test(lensText);
}

function bluntVisualThought(persona: PersonaProfile, visit: PageVisit): string {
  const metrics = visit.visualMetrics;
  const details = [
    metrics.lowContrastTextCount > 0 ? `${metrics.lowContrastTextCount} low-contrast text elements` : "",
    metrics.smallTextCount > 0 ? `${metrics.smallTextCount} tiny-text elements` : "",
    metrics.longLineCount > 0 ? `${metrics.longLineCount} overlong text lines` : "",
  ].filter(Boolean);
  const evidence = details.length > 0 ? details.join(", ") : "the page is dense and visually flat";

  return humanVoice(
    persona,
    `I think this page is harder to see and read than it should be: ${evidence}.`,
    `This page looks like ass: ${evidence} make it feel unfinished and hard to read.`,
    `This page looks like absolute ass: ${evidence} make it feel unfinished and hard to read.`,
  );
}

type ReactionSignals = {
  hasPricing: boolean;
  hasNextStep: boolean;
  hasTrust: boolean;
  hasOrientation: boolean;
  hasAgentReadiness: boolean;
  referenceSources: ReferenceSource[];
};

function metricEvidence(device: DeviceProfile, visit: PageVisit): string {
  const metrics = visit.visualMetrics;
  return `${device.label} capture: ${visit.linkCount} links, ${visit.text.length} characters, ${metrics.headingCount} headings, ${metrics.interactiveCount} controls, ${metrics.smallTextCount} tiny-text elements, ${metrics.lowContrastTextCount} low-contrast elements, ${metrics.imageCount} visible images.`;
}

function deviceContextForPersona(persona: PersonaProfile, device: DeviceProfile): string {
  const mobile = device.kind === "mobile";
  const tablet = device.kind === "tablet";
  const laptop = device.kind === "laptop";

  if (persona.id === "maya") {
    if (mobile) return "On mobile, I am judging the five-second skim before a budget meeting.";
    if (tablet) return "On tablet, I am checking whether the plan story stays clear without careful reading.";
    if (laptop) return "On laptop, I am looking for enough detail to defend the spend.";
    return "On desktop, I am comparing the offer, proof, and next step side by side.";
  }

  if (persona.id === "ivy" || personaHasLens(persona, /(accessibility|screen reader|keyboard|low vision|visually impaired)/i)) {
    if (mobile) return "On mobile, I am asking whether zoomed reading still leaves the task obvious.";
    if (tablet) return "On tablet, I am checking whether spacing and labels survive casual touch use.";
    if (laptop) return "On laptop, I am moving through the page like a keyboard and screen-reader user.";
    return "On desktop, I am checking whether dense report detail remains readable after a long session.";
  }

  if (persona.id === "mike-the-creator") {
    if (mobile) return "On mobile, I am asking whether the useful thing is obvious instantly.";
    if (tablet) return "On tablet, I am checking whether the product still has rhythm and flow.";
    if (laptop) return "On laptop, I am judging whether this looks like something people pay for.";
    return "On desktop, I am looking for the full product moment: conversation, evidence, fix, better screen.";
  }

  if (persona.id === "leo" || personaHasLens(persona, /(visual|readability|taste|ui quality|polish|typography|graphic|graphical|boring|design)/i)) {
    if (mobile) return "On mobile, I am checking whether the design still has a focal point when space gets tight.";
    if (tablet) return "On tablet, I am watching for awkward scaling and soft hierarchy.";
    if (laptop) return "On laptop, I am inspecting whether the screen feels designed instead of assembled.";
    return "On desktop, I am looking for memorable composition, not just tidy boxes.";
  }

  if (persona.id === "omar") {
    if (mobile) return "On mobile, I am looking for the revenue action before attention drops.";
    if (tablet) return "On tablet, I am checking whether the pitch works between other campaign work.";
    if (laptop) return "On laptop, I am deciding whether the fix can ship this week.";
    return "On desktop, I am scanning for the path from problem to money-moving change.";
  }

  if (persona.id === "nora") {
    if (mobile) return "On mobile, I am checking whether proof appears before I lose patience.";
    if (tablet) return "On tablet, I am looking for enough context to keep investigating.";
    if (laptop) return "On laptop, I am reading for evidence that would survive a founder's due diligence.";
    return "On desktop, I am comparing claims, evidence, and constraints with more scrutiny.";
  }

  if (persona.id === "quinn" || personaHasLens(persona, /(agent|automation|api|json|workflow|output usefulness|comparison context)/i)) {
    if (mobile) return "On mobile, I am checking whether the human-facing output still makes sense quickly.";
    if (tablet) return "On tablet, I am looking for a readable bridge between conversation and work item.";
    if (laptop) return "On laptop, I am inspecting whether the evidence can become an agent task.";
    return "On desktop, I am checking whether the report can drive the next automated improvement.";
  }

  if (mobile) return "On mobile, I am checking whether my point of view still has enough evidence.";
  if (tablet) return "On tablet, I am checking whether the page holds together in a casual review.";
  if (laptop) return "On laptop, I am checking whether the detail supports my decision.";
  return "On desktop, I am checking the full-page evidence through my lens.";
}

function positiveReactionForVisit(persona: PersonaProfile, device: DeviceProfile, visit: PageVisit, signals: ReactionSignals): Reaction {
  const comparisonNote = signals.referenceSources.length > 0 ? ` I am also comparing it against ${sourceLabel(signals.referenceSources)}.` : "";
  const evidence = metricEvidence(device, visit);
  const deviceContext = deviceContextForPersona(persona, device);

  if (persona.id === "maya") {
    return {
      personaId: persona.id,
      deviceId: device.id,
      url: visit.url,
      emotion: "confident",
      thought:
        `${deviceContext} I can see enough of the offer and next step to keep going. I still want the money story attached to the actual screen evidence, not floating in nice copy.`,
      evidence: `${evidence} Pricing language: ${signals.hasPricing ? "visible" : "missing"}. Next action: ${signals.hasNextStep ? "visible" : "missing"}.`,
      critiqueAxis: "pricing transparency",
    };
  }

  if (persona.id === "mike-the-creator") {
    return {
      personaId: persona.id,
      deviceId: device.id,
      url: visit.url,
      emotion: "curious",
      thought: humanVoice(
        persona,
        `${deviceContext} This is closer to the actual product: agent conversation, visible fixes, and the next screen. Keep cutting filler until the useful thing is impossible to miss.`,
        `${deviceContext} This is closer to the actual product: agent conversation, visible fixes, and the next screen. Keep cutting the damn filler until the useful thing is impossible to miss.`,
        `${deviceContext} This is closer to the actual product: agent conversation, visible fixes, and the next screen. Cut the damn filler until the useful thing is impossible to miss.`,
      ),
      evidence: `${evidence} Orientation language: ${signals.hasOrientation ? "visible" : "missing"}.`,
      critiqueAxis: "show do not tell",
    };
  }

  if (persona.id === "ivy" || personaHasLens(persona, /(accessibility|screen reader|keyboard|low vision|visually impaired)/i)) {
    return {
      personaId: persona.id,
      deviceId: device.id,
      url: visit.url,
      emotion: "confident",
      thought:
        `${deviceContext} I am not hitting a hard readability blocker on this pass. I still care about whether the important words survive zoom, keyboard review, and a tired reader.`,
      evidence: `${evidence} Landmarks: ${visit.visualMetrics.landmarkCount}. Unlabeled controls: ${visit.visualMetrics.unlabeledControlCount}.`,
      critiqueAxis: "accessibility",
    };
  }

  if (persona.id === "leo" || personaHasLens(persona, /(visual|readability|taste|ui quality|polish|typography|graphic|graphical|boring|design)/i)) {
    return {
      personaId: persona.id,
      deviceId: device.id,
      url: visit.url,
      emotion: "curious",
      thought:
        `${deviceContext} I am not seeing a hard visual failure here, but I am still judging whether this feels designed, not just assembled. The screen needs a focal point and a reason to remember it.`,
      evidence: `${evidence}${comparisonNote}`,
      critiqueAxis: "visual design",
    };
  }

  if (persona.id === "omar") {
    return {
      personaId: persona.id,
      deviceId: device.id,
      url: visit.url,
      emotion: "curious",
      thought:
        `${deviceContext} I can find a next action. Now I want the page to prove what changes this week: the bad moment, the better screen, and the fix that moves revenue.`,
      evidence: `${evidence} Commercial action language: ${signals.hasNextStep ? "visible" : "missing"}.`,
      critiqueAxis: "conversion urgency",
    };
  }

  if (persona.id === "nora") {
    return {
      personaId: persona.id,
      deviceId: device.id,
      url: visit.url,
      emotion: "confident",
      thought:
        `${deviceContext} I see enough proof language to continue. I trust the product more when evidence, screenshots, and critic disagreement do the work instead of soft reassurance.`,
      evidence: `${evidence} Proof language: ${signals.hasTrust ? "visible" : "missing"}.`,
      critiqueAxis: "trust evidence",
    };
  }

  if (persona.id === "quinn" || personaHasLens(persona, /(agent|automation|api|json|workflow|output usefulness|comparison context)/i)) {
    return {
      personaId: persona.id,
      deviceId: device.id,
      url: visit.url,
      emotion: "confident",
      thought:
        `${deviceContext} This is useful when the reaction becomes reusable output: stance, evidence, recommendations, and a fix queue another agent can pick up.`,
      evidence: `${evidence} Agent-readable output language: ${signals.hasAgentReadiness ? "visible" : "missing"}.${comparisonNote}`,
      critiqueAxis: "agent readiness",
    };
  }

  return {
    personaId: persona.id,
    deviceId: device.id,
    url: visit.url,
    emotion: "curious",
    thought: `${deviceContext} I can keep evaluating this page through my lens: ${(persona.critiqueLens ?? ["general usefulness"]).join(", ")}.`,
    evidence,
    critiqueAxis: persona.critiqueLens?.[0] ?? "general evaluation",
  };
}

function machineReadableReactionForVisit(
  persona: PersonaProfile,
  device: DeviceProfile,
  visit: PageVisit,
  context: ReactionContext,
  signals: ReactionSignals,
): Reaction {
  const scopedContext: ReactionContext = { ...context, priorPersonaOutputs: priorOutputsForVisit(visit, context.priorPersonaOutputs) };
  const formatName = machineReadableFormatName(visit);
  const evidence = `${device.label} ${formatName} capture: ${visit.contentType || "unknown content type"}, ${visit.text.length} readable characters, ${visit.linkCount} links, ${visit.formCount} forms.`;
  const hasExamples = hasWords(
    visit.text,
    /(example|fixture|minimumBody|valueContract|fieldContracts|responseShape|required|optional|responseFields|personaFields|recommendationWorkItemFields|localStorageSeeding|agent judgment context|acceptance criteria|implementation steps|latest reaction)/i,
  );
  const hasBoundaries = hasWords(
    visit.text,
    /(credential|credentials|availableWithoutCredentials|production|fallback|read-only|readonly|persistence|privacy|boundary)/i,
  );
  const hasImplementationQueueContext = isImplementationQueueVisit(visit) && hasExamples && hasWords(visit.text, /(thought|evidence|recommendation|task|source report|run)/i);

  if (persona.id === "quinn" || personaHasLens(persona, /(agent|automation|api|json|workflow|output usefulness|comparison context)/i)) {
    return applyPriorStance(
      {
        personaId: persona.id,
        deviceId: device.id,
        url: visit.url,
        emotion: signals.hasAgentReadiness && hasExamples ? "confident" : "skeptical",
        thought: hasImplementationQueueContext
          ? "I can use this markdown as an implementation queue: agent judgment context, evidence, recommendations, and acceptance criteria are visible without reopening the UI."
          : signals.hasAgentReadiness && hasExamples
            ? `I can use this ${formatName} as an agent contract: commands, artifacts, examples, and output fields are visible without opening the repo.`
            : `I am reading this as ${formatName}, and it still needs clearer commands, examples, and output fields before another agent can use it cleanly.`,
        evidence: `${evidence} Agent contract language: ${signals.hasAgentReadiness ? "visible" : "missing"}. Examples/fixtures: ${hasExamples ? "visible" : "missing"}.`,
        critiqueAxis: "agent readiness",
      },
      scopedContext,
    );
  }

  if (persona.id === "ivy" || personaHasLens(persona, /(accessibility|screen reader|keyboard|low vision|visually impaired)/i)) {
    return applyPriorStance(
      {
        personaId: persona.id,
        deviceId: device.id,
        url: visit.url,
        emotion: "curious",
        thought:
          `I am not scoring raw ${formatName} as a visual page. For accessibility, the important question is whether the same contract is documented or rendered in a readable human surface elsewhere.`,
        evidence,
        critiqueAxis: "accessibility",
      },
      scopedContext,
    );
  }

  if (persona.id === "leo" || personaHasLens(persona, /(visual|readability|taste|ui quality|polish|hard to see|typography|graphic|graphical|boring|design)/i)) {
    return applyPriorStance(
      {
        personaId: persona.id,
        deviceId: device.id,
        url: visit.url,
        emotion: "curious",
        thought:
          `This is raw machine output (${formatName}), so I am judging structure instead of visual polish. The product still needs a human-facing surface that shows this contract beautifully.`,
        evidence,
        critiqueAxis: "agent readiness",
      },
      scopedContext,
    );
  }

  if (persona.id === "nora") {
    return applyPriorStance(
      {
        personaId: persona.id,
        deviceId: device.id,
        url: visit.url,
        emotion: hasBoundaries ? "confident" : "skeptical",
        thought: hasBoundaries
          ? "I can see operational boundaries in the payload, which makes this safer for agents to call."
          : "I need credential and persistence boundaries in the payload before I would let agents rely on this endpoint.",
        evidence: `${evidence} Credential or persistence boundaries: ${hasBoundaries ? "visible" : "missing"}.`,
        critiqueAxis: "trust evidence",
      },
      scopedContext,
    );
  }

  return applyPriorStance(
    {
      personaId: persona.id,
      deviceId: device.id,
      url: visit.url,
      emotion: signals.hasAgentReadiness ? "confident" : "curious",
      thought:
        "This is not my buying screen; it is product plumbing. I care that it gives agents enough concrete instructions to run the useful workflow.",
      evidence,
      critiqueAxis: persona.critiqueLens?.[0] ?? "agent readiness",
    },
    scopedContext,
  );
}

function applyPriorStance(reaction: Reaction, context: ReactionContext): Reaction {
  const negative = reaction.emotion === "confused" || reaction.emotion === "skeptical" || reaction.emotion === "frustrated";
  const axis = reaction.critiqueAxis?.toLowerCase() ?? "";
  const matchingPriorOutputs = context.priorPersonaOutputs.filter((output) => {
    const haystack = [output.category, output.title, output.thought, output.evidence].filter(Boolean).join(" ").toLowerCase();
    return axis.length > 0 && haystack.includes(axis.split(" ")[0] ?? axis);
  });
  const matchingPrior = matchingPriorOutputs[0];
  const matchingOtherPrior = matchingPriorOutputs.find((output) => output.personaId !== reaction.personaId);

  if (!context.priorPersonaOutputs.length) {
    return applyCurrentRunStance({ ...reaction, stance: "independent" }, context);
  }

  if (negative && matchingPrior) {
    return withConversationReference(
      { ...reaction, stance: "supports_prior", respondsToPersonaId: matchingPrior.personaId, responseReason: "same_evidence" },
      context,
    );
  }

  if (negative) {
    return withConversationReference(
      { ...reaction, stance: "extends_prior", respondsToPersonaId: context.priorPersonaOutputs[0]?.personaId, responseReason: "prior_memory" },
      context,
    );
  }

  if (matchingPrior) {
    const targetPrior = matchingOtherPrior ?? matchingPrior;
    if (priorOutputWasProblem(matchingPrior) || reactionClaimsImprovement(reaction)) {
      return withConversationReference(
        { ...reaction, stance: "improved_since_prior", respondsToPersonaId: targetPrior.personaId, responseReason: "prior_improvement" },
        context,
      );
    }

    return withConversationReference(
      {
        ...reaction,
        stance: shouldExtendPrior(reaction) ? "extends_prior" : "supports_prior",
        respondsToPersonaId: targetPrior.personaId,
        responseReason: "same_evidence",
      },
      context,
    );
  }

  return applyCurrentRunStance({ ...reaction, stance: "independent" }, context);
}

function applyCurrentRunStance(reaction: Reaction, context: ReactionContext): Reaction {
  const currentPath = routePath(reaction.url);
  const selected = selectCurrentRunResponseTarget(reaction, context, currentPath);
  const priorCurrentRunReaction = selected?.reaction;

  if (!priorCurrentRunReaction) return reaction;

  const sameAxis = priorCurrentRunReaction.critiqueAxis === reaction.critiqueAxis;
  const polarityChanged = isNegativeReaction(priorCurrentRunReaction) !== isNegativeReaction(reaction);
  const stance: NonNullable<Reaction["stance"]> = polarityChanged ? "contradicts_prior" : sameAxis ? "supports_prior" : "extends_prior";
  const responseReason: NonNullable<Reaction["responseReason"]> = polarityChanged
    ? "polarity_shift"
    : sameAxis
      ? "same_evidence"
      : selected.facetDistance >= 0.28
        ? "facet_contrast"
        : "same_run_reply";
  const responseReasonDetail =
    responseReason === "facet_contrast" ? facetContrastDetail(reaction.personaId, priorCurrentRunReaction.personaId, context) : undefined;

  return withConversationReference(
    {
      ...reaction,
      stance,
      respondsToPersonaId: priorCurrentRunReaction.personaId,
      responseReason,
      responseReasonDetail,
    },
    context,
  );
}

function selectCurrentRunResponseTarget(reaction: Reaction, context: ReactionContext, currentPath: string) {
  const candidates = (context.currentRunReactions ?? [])
    .map((candidate, index) => ({ reaction: candidate, index, facetDistance: personaFacetDistance(reaction.personaId, candidate.personaId, context) }))
    .filter(({ reaction: candidate }) => routePath(candidate.url) === currentPath && candidate.personaId !== reaction.personaId);

  return candidates.toSorted((left, right) => responseTargetScore(right, reaction) - responseTargetScore(left, reaction))[0];
}

function responseTargetScore(candidate: { reaction: Reaction; index: number; facetDistance: number }, reaction: Reaction) {
  const polarityChanged = isNegativeReaction(candidate.reaction) !== isNegativeReaction(reaction);
  const sameAxis = candidate.reaction.critiqueAxis === reaction.critiqueAxis;
  return (polarityChanged ? 100 : 0) + (sameAxis ? 35 : 0) + candidate.facetDistance * 50 + candidate.index / 1000;
}

function personaFacetDistance(leftPersonaId: string, rightPersonaId: string, context: ReactionContext) {
  const left = context.personaProfilesById?.get(leftPersonaId)?.personalityFacets;
  const right = context.personaProfilesById?.get(rightPersonaId)?.personalityFacets;
  if (!left || !right) return 0;

  const keys = ["introversion", "extraversion", "sensing", "intuition", "thinking", "feeling", "judging", "perceiving"] as const;
  return keys.reduce((sum, key) => sum + Math.abs(left[key] - right[key]), 0) / keys.length;
}

function facetContrastDetail(leftPersonaId: string, rightPersonaId: string, context: ReactionContext) {
  const leftPersona = context.personaProfilesById?.get(leftPersonaId);
  const rightPersona = context.personaProfilesById?.get(rightPersonaId);
  const left = leftPersona?.personalityFacets;
  const right = rightPersona?.personalityFacets;
  if (!leftPersona || !rightPersona || !left || !right) return undefined;

  const keys = ["introversion", "extraversion", "sensing", "intuition", "thinking", "feeling", "judging", "perceiving"] as const;
  const leftLeans = keys
    .map((key) => ({ key, delta: left[key] - right[key] }))
    .filter(({ delta }) => delta > 0.18)
    .toSorted((a, b) => b.delta - a.delta)
    .slice(0, 2)
    .map(({ key }) => facetLabel(key));
  const rightLeans = keys
    .map((key) => ({ key, delta: right[key] - left[key] }))
    .filter(({ delta }) => delta > 0.18)
    .toSorted((a, b) => b.delta - a.delta)
    .slice(0, 2)
    .map(({ key }) => facetLabel(key));

  if (!leftLeans.length || !rightLeans.length) return undefined;
  return `${leftPersona.name} leans ${leftLeans.join("/")}; ${rightPersona.name} leans ${rightLeans.join("/")}.`;
}

function facetLabel(facet: keyof NonNullable<PersonaProfile["personalityFacets"]>) {
  return facet.replace(/_/g, " ");
}

function isNegativeReaction(reaction: Pick<Reaction, "emotion">) {
  return reaction.emotion === "confused" || reaction.emotion === "skeptical" || reaction.emotion === "frustrated";
}

function withConversationReference(reaction: Reaction, context: ReactionContext): Reaction {
  if (!reaction.respondsToPersonaId || !reaction.stance || reaction.stance === "independent") return reaction;

  const respondsToSelf = reaction.respondsToPersonaId === reaction.personaId;
  const targetName =
    context.personasById?.get(reaction.respondsToPersonaId) ??
    defaultPersonas.find((persona) => persona.id === reaction.respondsToPersonaId)?.name ??
    reaction.respondsToPersonaId;
  if (!respondsToSelf && reaction.thought.toLowerCase().includes(targetName.toLowerCase())) return reaction;

  const prefixByStance: Record<NonNullable<Reaction["stance"]>, string> = {
    independent: "",
    supports_prior: respondsToSelf ? "I agree with my earlier read here: " : `I agree with ${targetName} here: `,
    extends_prior: respondsToSelf ? "I am building on my earlier read: " : `I am building on ${targetName}'s read: `,
    contradicts_prior: respondsToSelf ? "I am changing my mind from my earlier read: " : `I am pushing back on ${targetName}: `,
    improved_since_prior: respondsToSelf ? "Compared with my earlier read, I think this improved: " : `Compared with ${targetName}'s earlier read, I think this improved: `,
  };
  const prefix = prefixByStance[reaction.stance];
  if (!prefix) return reaction;

  return {
    ...reaction,
    responseReason: respondsToSelf ? "self_memory" : reaction.responseReason,
    thought: `${prefix}${reaction.thought.trim()}`,
  };
}

function priorOutputWasProblem(output: PriorPersonaOutput) {
  const haystack = [output.emotion, output.category, output.title, output.thought, output.evidence]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/\b0\s+tiny-text elements?\b/g, "")
    .replace(/\b0\s+low-contrast elements?\b/g, "")
    .replace(/\b0\s+unlabeled controls?\b/g, "")
    .replace(/\bnot seeing a hard visual failure\b/g, "")
    .replace(/\bnot hitting a hard readability blocker\b/g, "");
  return /(confused|skeptical|frustrated|vague|unclear|missing|hard to|low contrast|tiny|blocked|problem|issue|risk|failed|failure|collapse)/i.test(haystack);
}

function reactionClaimsImprovement(reaction: Reaction) {
  const haystack = [reaction.thought, reaction.evidence].join(" ").toLowerCase();
  return /(improved|improvement|better than|stronger than|cleared|fixed|no longer|now shows|now exposes|now visible)/i.test(haystack);
}

function shouldExtendPrior(reaction: Reaction) {
  const axis = reaction.critiqueAxis?.toLowerCase() ?? "";
  return /agent readiness|accessibility|visual design|show do not tell|conversion urgency|customer-specific|memory|structured output/.test(axis);
}

async function reactionForVisit(persona: PersonaProfile, device: DeviceProfile, visit: PageVisit, context: ReactionContext): Promise<Reaction> {
  const seedReaction = deterministicReactionForVisit(persona, device, visit, context);
  return generateGemmaReaction({
    seedReaction,
    persona,
    device,
    visit,
    referenceSources: context.referenceSources,
    currentRunReactions: context.currentRunReactions ?? [],
    analyticsDistinctId: context.analyticsDistinctId,
    cycleId: context.cycleId,
    runId: context.runId,
  });
}

function deterministicReactionForVisit(persona: PersonaProfile, device: DeviceProfile, visit: PageVisit, context: ReactionContext): Reaction {
  const priorPersonaOutputs = priorOutputsForVisit(visit, context.priorPersonaOutputs);
  const scopedContext: ReactionContext = { ...context, priorPersonaOutputs };
  const currentPath = routePath(visit.url);
  const text = visit.text.toLowerCase();
  const hasPricing = hasWords(text, /(pricing|price|plans|paid|pay|billing|pilot|production|commercial|money|workspace|subscription)/i);
  const hasNextStep = hasWords(text, /(start|trial|demo|contact|buy|checkout|sign up|get started|run|create|try)/i);
  const hasTrust = hasWords(text, /(security|privacy|trusted|customers|soc 2|gdpr|compliance|credentials|proof|evidence|screen evidence|report|reports|demo teardown|before|after)/i);
  const hasOrientation = hasWords(text, /(how it works|features|benefits|use cases|faq|demo|example|workflow|steps|teardown|critic|critics|before|after|fix|fixes|conversation|screen evidence)/i);
  const hasAgentReadiness = hasWords(text, /(api|json|schema|webhook|agent|critic|critics|trace|metadata|export|docs|validation|first-person|conversation|before|after|recommendation|recommendations|evidence|screenshots)/i);
  const hasConsensusAccountability = hasWords(
    text,
    /(prior-cycle memory|prior cycle memory|route-scoped prior|stance counts|independent critique axes|consensus collapse|collapse risk|comparison sources|output schemas|schema fields|validation traces)/i,
  );

  if (isMachineReadableVisit(visit)) {
    return machineReadableReactionForVisit(persona, device, visit, scopedContext, {
      hasPricing,
      hasNextStep,
      hasTrust,
      hasOrientation,
      hasAgentReadiness,
      referenceSources: scopedContext.referenceSources,
    });
  }

  if (
    (persona.id === "ivy" || personaHasLens(persona, /(accessibility|screen reader|keyboard|low vision|visually impaired)/i)) &&
    hasAccessibilityProblem(visit.visualMetrics)
  ) {
    return applyPriorStance(
      {
        personaId: persona.id,
        deviceId: device.id,
        url: visit.url,
        emotion: "frustrated",
        thought: "I would struggle to use this comfortably with zoom, screen-reader habits, or keyboard review.",
        evidence: `Accessibility pass found ${visit.visualMetrics.unlabeledControlCount} unlabeled controls, ${visit.visualMetrics.lowContrastTextCount} low-contrast text elements, ${visit.visualMetrics.smallTextCount} tiny-text elements, and ${visit.visualMetrics.landmarkCount} landmarks.`,
        critiqueAxis: "accessibility",
      },
      scopedContext,
    );
  }

  if (
    (persona.id === "leo" || personaHasLens(persona, /(visual|readability|taste|ui quality|polish|hard to see|typography|graphic|graphical|boring|design)/i)) &&
    hasVisualPolishProblem(visit.visualMetrics)
  ) {
    return applyPriorStance(
      {
        personaId: persona.id,
        deviceId: device.id,
        url: visit.url,
        emotion: "frustrated",
        thought: bluntVisualThought(persona, visit),
        evidence: `Visual metrics on ${device.label}: ${visit.visualMetrics.smallTextCount} small-text elements, ${visit.visualMetrics.lowContrastTextCount} low-contrast elements, ${visit.visualMetrics.longLineCount} overlong lines, ${visit.visualMetrics.imageCount} visible images.`,
        critiqueAxis: "visual design",
      },
      scopedContext,
    );
  }

  if (persona.id === "quinn" || personaHasLens(persona, /(agent|automation|api|json|workflow|output usefulness|comparison context)/i)) {
    if (hasConsensusCollapse(priorPersonaOutputs) && hasConsensusAccountability) {
      const deviceContext = deviceContextForPersona(persona, device);
      return applyPriorStance(
        {
          personaId: persona.id,
          deviceId: device.id,
          url: visit.url,
          emotion: "confident",
          thought: `${deviceContext} I can see how this page turns prior-output agreement into reusable product data instead of hiding repeated agent output.`,
          evidence:
            "The captured text exposes route-scoped prior-cycle memory, stance counts, independent critique axes, consensus collapse risk, output schemas, comparison sources, and validation traces.",
          critiqueAxis: "agent readiness",
        },
        scopedContext,
      );
    }

    if (hasConsensusCollapse(priorPersonaOutputs)) {
      return applyPriorStance(
        {
          personaId: persona.id,
          deviceId: device.id,
          url: visit.url,
          emotion: "frustrated",
          thought: humanVoice(
            persona,
            "I see repeated prior output; the agents are echoing each other instead of creating useful coverage.",
            "I see repeated prior output; the agents are repeating the same damn critique instead of creating useful coverage.",
            "I see repeated prior output; the agents are producing the same damn warmed-over critique instead of creating useful coverage.",
          ),
          evidence: `${priorPersonaOutputs.length} prior persona outputs for ${currentPath} were available, but their categories or wording were too concentrated to feel like independent review.`,
          critiqueAxis: "agent readiness",
        },
        scopedContext,
      );
    }

    if (!hasAgentReadiness) {
      return applyPriorStance(
        {
          personaId: persona.id,
          deviceId: device.id,
          url: visit.url,
          emotion: "skeptical",
          thought: humanVoice(
            persona,
            "I cannot yet see enough reusable output, traces, or docs to trust this as an agent workflow.",
            "I see too much damn hand-waving and not enough reusable output, traces, or docs to trust this as an agent workflow.",
            "I see hand-wavy bullshit instead of the reusable output, traces, and docs needed to trust this as an agent workflow.",
          ),
          evidence: "The captured text did not expose API, JSON, schema, trace, metadata, docs, export, or validation language.",
          critiqueAxis: "agent readiness",
        },
        scopedContext,
      );
    }
  }

  if (persona.id === "maya" && !hasPricing) {
    return applyPriorStance(
      {
        personaId: persona.id,
        deviceId: device.id,
        url: visit.url,
        emotion: "confused",
        thought: "I cannot tell what this will cost or how much work my team is signing up for.",
        evidence: "The page did not expose pricing, plan, free, trial, buy, checkout, or subscription language.",
        critiqueAxis: "pricing transparency",
      },
      scopedContext,
    );
  }

  if (persona.id === "omar" && !hasNextStep) {
    return applyPriorStance(
      {
        personaId: persona.id,
        deviceId: device.id,
        url: visit.url,
        emotion: "frustrated",
        thought: humanVoice(
          persona,
          "I do not see the fast next action I need before this can affect revenue.",
          "This is annoying as hell because there is no fast next action before revenue can move.",
        ),
        evidence: "The page did not expose common action language such as start, trial, demo, contact, buy, checkout, sign up, run, create, or try.",
        critiqueAxis: "conversion urgency",
      },
      scopedContext,
    );
  }

  if (!hasTrust && persona.trustThreshold > 0.7) {
    return applyPriorStance(
      {
      personaId: persona.id,
      deviceId: device.id,
      url: visit.url,
      emotion: "skeptical",
      thought: "I want more proof before trusting this page.",
        evidence: "Security, privacy, compliance, or customer proof was not prominent in the captured text.",
        critiqueAxis: "trust evidence",
      },
      scopedContext,
    );
  }

  if (!hasPricing && !hasNextStep) {
    return applyPriorStance(
      {
      personaId: persona.id,
      deviceId: device.id,
      url: visit.url,
      emotion: "confused",
      thought: `I am not sure what to do next on ${device.label}.`,
        evidence: "The page did not expose common pricing or next-step language.",
        critiqueAxis: "product clarity",
      },
      scopedContext,
    );
  }

  if (!hasOrientation && scopedContext.referenceSources.length > 0) {
    return applyPriorStance(
      {
        personaId: persona.id,
        deviceId: device.id,
        url: visit.url,
        emotion: "skeptical",
        thought: `I am comparing this with ${sourceLabel(scopedContext.referenceSources)} and I need a clearer reason this product is meaningfully better.`,
        evidence: "Comparison or market references were supplied, but the page did not expose how-it-works, feature, use-case, FAQ, demo, example, workflow, or step language.",
        critiqueAxis: "comparison context",
      },
      scopedContext,
    );
  }

  if (visit.formCount > 0) {
    return applyPriorStance(
      {
      personaId: persona.id,
      deviceId: device.id,
      url: visit.url,
      emotion: "curious",
      thought: "I found a form. I can judge the pre-submit moment without sending anything.",
        evidence: `${visit.formCount} form${visit.formCount === 1 ? "" : "s"} detected and submission behavior was blocked.`,
        critiqueAxis: "conversion safety",
      },
      scopedContext,
    );
  }

  return applyPriorStance(
    positiveReactionForVisit(persona, device, visit, {
      hasPricing,
      hasNextStep,
      hasTrust,
      hasOrientation,
      hasAgentReadiness,
      referenceSources: scopedContext.referenceSources,
    }),
    scopedContext,
  );
}

function buildSnapshots(reactions: Reaction[]): SimulationSnapshot[] {
  return reactions.slice(0, 20).map((reaction, index) => ({
    id: `moment_${index + 1}`,
    personaId: reaction.personaId,
    deviceId: reaction.deviceId,
    moment: `Moment ${index + 1}`,
    x: 12 + (index % 5) * 18,
    y: 18 + Math.floor(index / 5) * 16,
    activity: reaction.url,
    mood: reaction.emotion,
    thought: reaction.thought,
  }));
}

function categoryForAxis(axis: string | undefined): Finding["category"] {
  const value = axis?.toLowerCase() ?? "";
  if (value.includes("accessibility") || value.includes("readability") || value.includes("screen reader")) return "accessibility";
  if (value.includes("visual") || value.includes("polish") || value.includes("taste")) return "visual_design";
  if (value.includes("trust") || value.includes("security")) return "trust_issue";
  if (value.includes("pricing") || value.includes("conversion") || value.includes("checkout")) return "conversion_friction";
  if (value.includes("agent") || value.includes("comparison") || value.includes("workflow")) return "agent_readiness";
  return "confusion";
}

function inferPersonaFindings(reactions: Reaction[]): Finding[] {
  const negativeReactions = reactions.filter(
    (reaction) => reaction.emotion === "confused" || reaction.emotion === "skeptical" || reaction.emotion === "frustrated",
  );
  const byCategory = new Map<Finding["category"], Reaction[]>();

  for (const reaction of negativeReactions) {
    const category = categoryForAxis(reaction.critiqueAxis);
    byCategory.set(category, [...(byCategory.get(category) ?? []), reaction]);
  }

  return Array.from(byCategory.entries()).map(([category, scoped]) => {
    const sample = scoped[0];
    const personaIds = Array.from(new Set(scoped.map((reaction) => reaction.personaId))).join(", ");
    const deviceIds = Array.from(new Set(scoped.map((reaction) => reaction.deviceId))).join(", ");
    const severity = scoped.length >= 4 || category === "accessibility" || category === "visual_design" ? "high" : "medium";
    const titleByCategory: Record<Finding["category"], string> = {
      accessibility: "Agents found hard-to-see or hard-to-use accessibility friction",
      visual_design: "Visual presentation is not clearing the design-agent bar",
      trust_issue: "Trust proof is still weak for skeptical agents",
      conversion_friction: "Commercial next step is not concrete enough",
      agent_readiness: "Agent output and comparison context need stronger proof",
      confusion: "Product story is not distinct enough across agent lenses",
      copy_problem: "Copy is not specific enough",
      dead_end: "Journey dead-ended for agents",
      suggested_fix: "Suggested improvement",
    };
    const recommendationByCategory: Record<Finding["category"], string> = {
      accessibility: "Raise contrast, increase small text, label controls, preserve landmarks, and validate keyboard and screen-reader paths.",
      visual_design: "Improve hierarchy, spacing, typography, screenshot quality, and visual proof until the page looks intentionally designed.",
      trust_issue: "Put credential boundaries, privacy proof, customer evidence, and security details before the first high-commitment action.",
      conversion_friction: "Make cost, setup effort, and the next commercial action visible before asking users to commit.",
      agent_readiness: "Show first-person critic reactions, reusable recommendations, comparison sources, and technical docs where agents can inspect them.",
      confusion: "Sharpen the first-screen explanation, product category, target user, and why-now value.",
      copy_problem: "Replace broad claims and generic CTA labels with concrete outcomes.",
      dead_end: "Add a visible primary next step and preserve it across routes and devices.",
      suggested_fix: "Turn low-confidence observations into a focused next-cycle hypothesis.",
    };

    return createFinding(
      category,
      severity,
      titleByCategory[category],
      `${personaIds} raised this on ${deviceIds}. Example: ${sample?.thought ?? "No sample thought captured"} Evidence: ${
        sample?.evidence ?? "No sample evidence captured"
      }`,
      recommendationByCategory[category],
      Math.min(0.9, 0.62 + scoped.length * 0.04),
    );
  });
}

function buildConsensusSignal(reactions: Reaction[]) {
  const uniqueCritiqueAxes = Array.from(new Set(reactions.map((reaction) => reaction.critiqueAxis).filter((axis): axis is string => Boolean(axis)))).sort();
  const stanceCounts = reactions.reduce<Record<string, number>>((acc, reaction) => {
    const stance = reaction.stance ?? "independent";
    acc[stance] = (acc[stance] ?? 0) + 1;
    return acc;
  }, {});
  const negativeCount = reactions.filter((reaction) => reaction.emotion === "confused" || reaction.emotion === "skeptical" || reaction.emotion === "frustrated").length;
  const nonIndependentStanceCount = Object.entries(stanceCounts).filter(([stance, count]) => stance !== "independent" && count > 0).length;
  const repeatedImprovementStance = reactions.length >= 6 && (stanceCounts.improved_since_prior ?? 0) === reactions.length;
  const collapseRisk: "low" | "medium" | "high" =
    repeatedImprovementStance || (contextHasPriorStances(stanceCounts) && nonIndependentStanceCount <= 1 && reactions.length >= 6)
      ? "medium"
      : negativeCount >= 6 && uniqueCritiqueAxes.length <= 2
        ? "high"
        : negativeCount >= 4 && uniqueCritiqueAxes.length <= 3
          ? "medium"
          : "low";

  return {
    uniqueCritiqueAxes,
    stanceCounts,
    collapseRisk,
    summary:
      collapseRisk === "high"
        ? "Agents are converging too tightly; add sharper lenses, prior-output rebuttals, or comparison evidence."
        : collapseRisk === "medium"
          ? "Agent disagreement exists, but the critique could still cover more independent axes."
          : "Agent coverage spans enough distinct critique axes to avoid obvious consensus collapse.",
  };
}

function contextHasPriorStances(stanceCounts: Record<string, number>) {
  return Object.keys(stanceCounts).some((stance) => stance !== "independent");
}

function workItemChangeType(category: Finding["category"]): NonNullable<Recommendation["implementationWorkItem"]>["changeType"] {
  if (category === "copy_problem") return "copy";
  if (category === "visual_design") return "visual_design";
  if (category === "accessibility") return "accessibility";
  if (category === "trust_issue") return "trust";
  if (category === "conversion_friction") return "conversion";
  if (category === "agent_readiness") return "agent_output";
  if (category === "dead_end") return "navigation";
  return "content";
}

function affectedRegionForFinding(finding: Finding): string {
  const byCategory: Record<Finding["category"], string> = {
    accessibility: "Readable UI, labels, focus states, and keyboard path",
    visual_design: "Visual hierarchy, page stage, screenshot proof, and spacing",
    trust_issue: "Proof block near the first high-commitment action",
    conversion_friction: "Pricing, commercial next step, and primary call to action",
    agent_readiness: "Report output, comparison sources, traces, and API-readable evidence",
    confusion: "First-screen product story and orientation copy",
    copy_problem: "Headline, supporting copy, and call-to-action language",
    dead_end: "Primary navigation path and next action",
    suggested_fix: "Next focused audit target",
  };
  return byCategory[finding.category];
}

function acceptanceCriteriaForFinding(finding: Finding): string[] {
  const base = [
    `The affected screen visibly addresses: ${finding.recommendation}`,
    "A nontechnical reviewer can describe the change without reading implementation docs.",
  ];

  if (finding.category === "accessibility") {
    return [...base, "Text, labels, and keyboard/focus behavior remain readable and usable at common zoom levels."];
  }

  if (finding.category === "visual_design") {
    return [...base, "The improved area has a clear focal point, readable hierarchy, and no overlong or cramped text blocks."];
  }

  if (finding.category === "agent_readiness") {
    return [...base, "The report keeps reusable evidence, affected personas, and comparison context attached to the recommendation."];
  }

  if (finding.category === "conversion_friction" || finding.category === "dead_end") {
    return [...base, "The primary next action is visible before the user has to scroll through secondary material."];
  }

  return [...base, "The change can be checked from the rendered page, not only from source code."];
}

function implementationStepsForFinding(finding: Finding): string[] {
  return [
    `Update ${affectedRegionForFinding(finding).toLowerCase()} with the recommended change.`,
    "Preserve the critic evidence and persona/device impact in the report.",
    "Verify the rendered page on mobile and desktop before closing the work item.",
  ];
}

function targetAreaForAxis(axis: string | undefined): Recommendation["targetArea"] {
  const value = axis?.toLowerCase() ?? "";
  if (value.includes("accessibility") || value.includes("readability")) return "accessibility";
  if (value.includes("visual") || value.includes("show do not tell")) return "visual_design";
  if (value.includes("pricing") || value.includes("conversion")) return "conversion_flow";
  if (value.includes("trust")) return "trust";
  if (value.includes("agent") || value.includes("comparison")) return "agent_readiness";
  return "product_clarity";
}

function positiveRecommendationCopy(axis: string | undefined) {
  const value = axis?.toLowerCase() ?? "";
  if (value.includes("visual") || value.includes("show do not tell")) {
    return {
      title: "Give the report a stronger visual focal point",
      recommendation: "Turn the clearest agent read into a more memorable visual moment with a stronger focal point, fewer repeated blocks, and a before/after cue.",
      affectedRegion: "Visual hierarchy, before/after stage, and repeated report sections",
      changeType: "visual_design" as const,
    };
  }
  if (value.includes("pricing") || value.includes("conversion")) {
    return {
      title: "Attach the money story to the visible screen evidence",
      recommendation: "Connect the recommended change to the business outcome directly beside the captured screen and next fix, so buyers can see why the work matters now.",
      affectedRegion: "Commercial proof, screen evidence, and first fix summary",
      changeType: "conversion" as const,
    };
  }
  if (value.includes("accessibility") || value.includes("readability")) {
    return {
      title: "Keep important words readable under tired-reader conditions",
      recommendation: "Check the most important labels, chips, and evidence snippets at mobile size and zoom, then increase contrast or size where the meaning depends on small text.",
      affectedRegion: "Readable labels, evidence snippets, and mobile report scanning",
      changeType: "accessibility" as const,
    };
  }
  if (value.includes("trust")) {
    return {
      title: "Put proof where the agent claim asks for belief",
      recommendation: "Keep screenshots, critic disagreement, production boundaries, and evidence receipts close to the claim they support instead of separating proof into later sections.",
      affectedRegion: "Proof near claims and first high-commitment action",
      changeType: "trust" as const,
    };
  }
  if (value.includes("agent") || value.includes("comparison")) {
    return {
      title: "Make the agent output easier to reuse as work",
      recommendation: "Keep each useful reaction connected to stance, source, affected region, and the fix handoff so another agent can continue the work without reconstructing context.",
      affectedRegion: "Agent conversation, source evidence, and implementation handoff",
      changeType: "agent_output" as const,
    };
  }
  return {
    title: "Turn this agent read into a clearer next test",
    recommendation: "Convert the repeated agent observation into a visible next-cycle test with evidence, affected route, and a concrete acceptance check.",
    affectedRegion: "Next focused audit target",
    changeType: "content" as const,
  };
}

function buildRoleSpecificRecommendations(baseRecommendations: Recommendation[], findings: Finding[], reactions: Reaction[]): Recommendation[] {
  const hasOnlyLowConfidenceFindings = findings.every((finding) => finding.severity === "low");
  if (!hasOnlyLowConfidenceFindings || baseRecommendations.length >= 3 || reactions.length === 0) return baseRecommendations;

  const candidates = Array.from(
    reactions.reduce<Map<string, Reaction[]>>((groups, reaction) => {
      const axis = reaction.critiqueAxis ?? "general evaluation";
      groups.set(axis, [...(groups.get(axis) ?? []), reaction]);
      return groups;
    }, new Map()),
  )
    .map(([axis, scoped]) => ({ axis, scoped }))
    .sort((left, right) => {
      const leftHasCustomerOwned = left.scoped.some((reaction) => reaction.personaId.startsWith("custom-"));
      const rightHasCustomerOwned = right.scoped.some((reaction) => reaction.personaId.startsWith("custom-"));
      if (leftHasCustomerOwned !== rightHasCustomerOwned) return leftHasCustomerOwned ? -1 : 1;
      return right.scoped.length - left.scoped.length;
    });

  const enriched = [...baseRecommendations];
  const usedTitles = new Set(enriched.map((recommendation) => recommendation.title));

  for (const { axis, scoped } of candidates) {
    if (enriched.length >= 3) break;
    const copy = positiveRecommendationCopy(axis);
    if (usedTitles.has(copy.title)) continue;
    const sample = scoped[0];
    const affectedPersonas = Array.from(new Set(scoped.map((reaction) => reaction.personaId))).slice(0, 10);
    const affectedDevices = Array.from(new Set(scoped.map((reaction) => reaction.deviceId))).slice(0, 4);
    enriched.push({
      priority: "low",
      title: copy.title,
      targetArea: targetAreaForAxis(axis),
      recommendation: copy.recommendation,
      evidence: `${affectedPersonas.join(", ")} raised ${axis} across ${affectedDevices.join(", ")}. Example: ${
        sample?.thought ?? "No sample thought captured"
      } Evidence: ${sample?.evidence ?? "No sample evidence captured"}`,
      affectedPersonas,
      affectedDevices,
      implementationWorkItem: {
        exportTitle: copy.title,
        affectedRegion: copy.affectedRegion,
        changeType: copy.changeType,
        implementationSteps: [
          `Update ${copy.affectedRegion.toLowerCase()} using the agent evidence from ${axis}.`,
          "Keep the before/after or source evidence visible beside the change.",
          "Verify the rendered report on mobile and desktop before closing the work item.",
        ],
        acceptanceCriteria: [
          `The affected screen visibly addresses: ${copy.recommendation}`,
          "A nontechnical reviewer can explain what changed without reading implementation docs.",
          "The recommendation still links to the personas, devices, and evidence that produced it.",
        ],
      },
    });
    usedTitles.add(copy.title);
  }

  return enriched;
}

function buildRecommendations(findings: Finding[], reactions: Reaction[]): Recommendation[] {
  const baseRecommendations: Recommendation[] = findings.map((finding) => {
    const related = reactions.filter((reaction) => {
      if (finding.category === "trust_issue") return reaction.emotion === "skeptical";
      if (finding.category === "confusion" || finding.category === "dead_end") return reaction.emotion === "confused";
      if (finding.category === "accessibility") return reaction.critiqueAxis === "accessibility";
      if (finding.category === "visual_design") return reaction.critiqueAxis === "visual design";
      if (finding.category === "agent_readiness") return reaction.critiqueAxis === "agent readiness" || reaction.critiqueAxis === "comparison context";
      return true;
    });
    const scoped = related.length > 0 ? related : reactions;
    return {
      priority: finding.severity === "high" ? "high" : finding.severity === "medium" ? "medium" : "low",
      title: finding.title,
      targetArea:
        finding.category === "trust_issue"
          ? "trust"
          : finding.category === "accessibility"
            ? "accessibility"
            : finding.category === "visual_design"
              ? "visual_design"
              : finding.category === "agent_readiness"
                ? "agent_readiness"
          : finding.category === "copy_problem"
            ? "copy"
            : finding.category === "conversion_friction"
              ? "conversion_flow"
              : finding.category === "dead_end"
                ? "user_experience"
                : "product_clarity",
      recommendation: finding.recommendation,
      evidence: finding.evidence,
      affectedPersonas: Array.from(new Set(scoped.map((reaction) => reaction.personaId))).slice(0, 10),
      affectedDevices: Array.from(new Set(scoped.map((reaction) => reaction.deviceId))).slice(0, 4),
      implementationWorkItem: {
        exportTitle: finding.title,
        affectedRegion: affectedRegionForFinding(finding),
        changeType: workItemChangeType(finding.category),
        implementationSteps: implementationStepsForFinding(finding),
        acceptanceCriteria: acceptanceCriteriaForFinding(finding),
      },
    };
  });

  return buildRoleSpecificRecommendations(baseRecommendations, findings, reactions);
}

export async function runSafeBrowserAudit(rawInput: unknown): Promise<RunResult> {
  const input = validateRunInput(rawInput);
  try {
  const events: BrowserEvent[] = [];
  const journeyEvents: JourneyEvent[] = [];
  const reactions: Reaction[] = [];
  const visited: PageVisit[] = [];
  const screenEvidence: ScreenEvidence[] = [];
  const capturedScreens = new Set<string>();
  const personas = (input.personas ?? defaultPersonas).map((persona, index) => toPersonaProfile(persona, `persona_${index + 1}`, input.goal));
  const devices = input.devices ?? defaultDeviceProfiles;
  const browser = await chromium.launch({ headless: true });
  let referenceSources: ReferenceSource[] | undefined;
  captureRunnerEvent(input.analyticsDistinctId, "snoopy_run_started", {
    run_id: input.runId,
    cycle_id: input.cycleId,
    target_url: input.targetUrl,
    goal_present: Boolean(input.goal),
    persona_count: personas.length,
    customer_owned_persona_count: personas.filter((persona) => persona.customerOwned).length,
    device_count: devices.length,
    comparison_url_count: input.comparisonUrls?.length ?? 0,
    news_url_count: input.newsUrls?.length ?? 0,
    max_pages: input.maxPages,
  });
  if (input.cycleId) await flushRunnerAnalytics();

  try {
    referenceSources = await collectReferenceSources(browser, input);
    const reactionContext: ReactionContext = {
      runId: input.runId,
      analyticsDistinctId: input.analyticsDistinctId,
      cycleId: input.cycleId,
      priorPersonaOutputs: input.priorPersonaOutputs ?? [],
      referenceSources,
      personasById: new Map(personas.map((persona) => [persona.id, persona.name])),
      personaProfilesById: new Map(personas.map((persona) => [persona.id, persona])),
      currentRunReactions: reactions,
    };

    for (const persona of personas) {
      for (const device of devices) {
        const context = await browser.newContext({
          viewport: device.viewport,
          userAgent: `${device.userAgent} SnoopyReadOnlyAudit/0.2`,
          isMobile: device.kind === "mobile",
          hasTouch: device.kind === "mobile" || device.kind === "tablet",
        });
        if (input.initialLocalStorage) {
          await context.addInitScript((entries) => {
            for (const [key, value] of Object.entries(entries)) {
              window.localStorage.setItem(key, value);
            }
          }, input.initialLocalStorage);
        }
        await context.route("**/*", async (route) => {
          const request = route.request();
          if (!["GET", "HEAD", "OPTIONS"].includes(request.method())) {
            const blockedEvent = {
              type: "blocked_submit" as const,
              url: request.url(),
              message: `Read-only capture skipped ${request.method()} request before data could be submitted.`,
              occurredAt: new Date().toISOString(),
            };
            events.push(blockedEvent);
            journeyEvents.push({
              personaId: persona.id,
              deviceId: device.id,
              type: "blocked_action",
              url: blockedEvent.url,
              message: blockedEvent.message,
              occurredAt: blockedEvent.occurredAt,
            });
            await route.abort("blockedbyclient");
            return;
          }

          await route.continue();
        });
        const page = await context.newPage();
        await page.addInitScript(() => {
          document.addEventListener(
            "submit",
            (event) => {
              event.preventDefault();
              event.stopImmediatePropagation();
            },
            true,
          );
          document.addEventListener(
            "click",
            (event) => {
              const target = event.target instanceof Element ? event.target.closest("button,input,a") : null;
              const type = target?.getAttribute("type")?.toLowerCase();
              const text = target?.textContent?.toLowerCase() ?? "";
              const href = target?.getAttribute("href")?.toLowerCase() ?? "";
              if (type === "submit" || text.includes("checkout") || text.includes("buy now") || href.includes("checkout")) {
                event.preventDefault();
                event.stopImmediatePropagation();
              }
            },
            true,
          );
        });

        const queue = [normalizeNavigableUrl(input.targetUrl)];
        const seen = new Set<string>();
        while (queue.length > 0 && seen.size < input.maxPages) {
          const nextUrl = queue.shift();
          const url = nextUrl ? normalizeNavigableUrl(nextUrl, input.targetUrl) : undefined;
          if (!url || seen.has(url)) continue;
          seen.add(url);
          const occurredAt = new Date().toISOString();
          const navMessage = `${persona.name} opened ${url} on ${device.label} with the goal: ${persona.goal}`;
          events.push({ type: "navigation", url, message: navMessage, occurredAt });
          journeyEvents.push({ personaId: persona.id, deviceId: device.id, type: "navigation", url, message: navMessage, occurredAt });

          try {
            const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20_000 });
            await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => undefined);
            const title = await page.title();
            const contentType = response?.headers()["content-type"] ?? "";
            const rawResponseText =
              contentType && isMachineReadableContentType(contentType) ? await response?.text().catch(() => "") : undefined;
            const text = (rawResponseText ?? (await page.locator("body").innerText({ timeout: 5_000 }).catch(() => ""))).slice(
              0,
              rawResponseText ? 20_000 : 6_000,
            );
            const formCount = await page.locator("form").count();
            const hrefs = await page.locator("a[href]").evaluateAll((anchors) =>
              anchors.map((anchor) => anchor.getAttribute("href") ?? "").filter(Boolean),
            );
            const visualMetrics = await captureVisualMetrics(page);
            const visit = {
              personaId: persona.id,
              personaName: persona.name,
              deviceId: device.id,
              deviceLabel: device.label,
              url: page.url(),
              title,
              contentType,
              text,
              linkCount: hrefs.length,
              formCount,
              visualMetrics,
            };
            visited.push(visit);
            const screenKey = `${device.id}:${routePath(visit.url)}`;
            if (!capturedScreens.has(screenKey)) {
              const captured = await captureScreenEvidence(page, visit);
              if (captured) {
                capturedScreens.add(screenKey);
                screenEvidence.push(captured);
              }
            }
            const obsMessage = `${persona.name} captured ${text.length} characters, ${hrefs.length} links, ${formCount} forms, ${visualMetrics.smallTextCount} tiny-text elements, and ${visualMetrics.lowContrastTextCount} low-contrast text elements from "${title || "untitled page"}" on ${device.label}.`;
            events.push({ type: "observation", url: page.url(), message: obsMessage, occurredAt: new Date().toISOString() });
            journeyEvents.push({
              personaId: persona.id,
              deviceId: device.id,
              type: "observation",
              url: page.url(),
              message: obsMessage,
              occurredAt: new Date().toISOString(),
            });
            const reaction = await reactionForVisit(persona, device, visit, reactionContext);
            reactions.push(reaction);
            if (input.cycleId) await flushRunnerAnalytics();
            journeyEvents.push({
              personaId: persona.id,
              deviceId: device.id,
              type: "reaction",
              url: reaction.url,
              message: reaction.thought,
              occurredAt: new Date().toISOString(),
            });
            if (formCount > 0) {
              const blockedMessage = `${persona.name} found forms on ${device.label}; read-only capture skipped submission behavior.`;
              events.push({
                type: "blocked_submit",
                url: page.url(),
                message: blockedMessage,
                occurredAt: new Date().toISOString(),
              });
              journeyEvents.push({
                personaId: persona.id,
                deviceId: device.id,
                type: "blocked_action",
                url: page.url(),
                message: blockedMessage,
                occurredAt: new Date().toISOString(),
              });
            }
            queue.push(...extractSameOriginLinks(input.targetUrl, hrefs, input.maxPages - seen.size + 1));
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown browser navigation error.";
            if (/download is starting/i.test(errorMessage)) {
              const artifactVisit = await captureDownloadedArtifactVisit(context.request, url, persona, device);
              if (artifactVisit) {
                visited.push(artifactVisit);
                const obsMessage = `${persona.name} captured downloadable ${machineReadableFormatName(artifactVisit)} with ${artifactVisit.text.length} readable characters from ${url} on ${device.label}.`;
                events.push({ type: "observation", url, message: obsMessage, occurredAt: new Date().toISOString() });
                journeyEvents.push({
                  personaId: persona.id,
                  deviceId: device.id,
                  type: "observation",
                  url,
                  message: obsMessage,
                  occurredAt: new Date().toISOString(),
                });
                const reaction = await reactionForVisit(persona, device, artifactVisit, reactionContext);
                reactions.push(reaction);
                if (input.cycleId) await flushRunnerAnalytics();
                journeyEvents.push({
                  personaId: persona.id,
                  deviceId: device.id,
                  type: "reaction",
                  url: reaction.url,
                  message: reaction.thought,
                  occurredAt: new Date().toISOString(),
                });
                continue;
              }
            }
            events.push({
              type: "error",
              url,
              message: errorMessage,
              occurredAt: new Date().toISOString(),
            });
            journeyEvents.push({
              personaId: persona.id,
              deviceId: device.id,
              type: "error",
              url,
              message: errorMessage,
              occurredAt: new Date().toISOString(),
            });
          }
        }

        await context.close();
      }
    }
  } finally {
    await browser.close();
  }

  const personaFindings = inferPersonaFindings(reactions);
  const inferredFindings = inferFindings(input, visited);
  const findings =
    personaFindings.length > 0
      ? [...inferredFindings.filter((finding) => finding.category !== "suggested_fix"), ...personaFindings]
      : inferredFindings;
  for (const finding of findings) {
    const event = {
      type: "finding" as const,
      url: input.targetUrl,
      message: `${finding.category}: ${finding.title}`,
      occurredAt: new Date().toISOString(),
    };
    events.push(event);
    journeyEvents.push({
      personaId: "all",
      deviceId: "all",
      type: "finding",
      url: input.targetUrl,
      message: event.message,
      occurredAt: event.occurredAt,
    });
  }

  const recommendations = buildRecommendations(findings, reactions);
  const report = buildSimulationReport({
    runId: input.runId,
    findings,
    personas,
    devices,
    referenceSources: referenceSources ?? [],
    consensus: buildConsensusSignal(reactions),
    journeyEvents,
    reactions,
    snapshots: buildSnapshots(reactions),
    screenEvidence,
    recommendations,
  });
  captureRunnerEvent(input.analyticsDistinctId, "snoopy_run_completed", {
    run_id: input.runId,
    cycle_id: input.cycleId,
    target_url: input.targetUrl,
    validation_status: "completed",
  });
  if (input.cycleId) await flushRunnerAnalytics();
  captureRunnerEvent(input.analyticsDistinctId, "snoopy_run_summary_completed", {
    run_id: input.runId,
    cycle_id: input.cycleId,
    target_url: input.targetUrl,
    persona_count: personas.length,
    device_count: devices.length,
    route_count: new Set(visited.map((visit) => visit.url)).size,
    reaction_count: reactions.length,
    finding_count: findings.length,
    recommendation_count: recommendations.length,
    consensus_collapse_risk: report.consensus?.collapseRisk,
    customer_owned_reaction_count: reactions.filter((reaction) => personas.find((persona) => persona.id === reaction.personaId)?.customerOwned).length,
  });
  await flushRunnerAnalytics();
  return { input, events, report };
  } catch (error) {
    captureRunnerEvent(input.analyticsDistinctId, "snoopy_run_failed", {
      run_id: input.runId,
      cycle_id: input.cycleId,
      target_url: input.targetUrl,
      validation_status: "failed",
      error_type: error instanceof Error ? error.name || "Error" : typeof error,
      reason: error instanceof Error ? error.message : "Unknown run audit error.",
    });
    await flushRunnerAnalytics();
    throw error;
  }
}
