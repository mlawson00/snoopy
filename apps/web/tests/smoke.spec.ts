import { readFile } from "node:fs/promises";
import { expect, test, type Locator, type Page } from "@playwright/test";

async function expectTextBefore(page: Page, earlier: string, later: string) {
  await page.waitForFunction(
    ({ earlierText, laterText }) => {
      const bodyText = document.body.textContent ?? "";
      return bodyText.includes(earlierText) && bodyText.includes(laterText);
    },
    { earlierText: earlier, laterText: later },
  );
  const bodyText = await page.evaluate(() => document.body.textContent ?? "");
  const earlierIndex = bodyText.indexOf(earlier);
  const laterIndex = bodyText.indexOf(later);

  expect(earlierIndex, `"${earlier}" should be present`).toBeGreaterThanOrEqual(0);
  expect(laterIndex, `"${later}" should be present`).toBeGreaterThanOrEqual(0);
  expect(earlierIndex, `"${earlier}" should appear before "${later}"`).toBeLessThan(laterIndex);
}

async function expectVisuallyBefore(earlier: Locator, later: Locator) {
  await expect(earlier).toBeVisible();
  await expect(later).toBeVisible();
  const earlierBox = await earlier.boundingBox();
  const laterBox = await later.boundingBox();

  expect(earlierBox, "earlier element should have a bounding box").toBeTruthy();
  expect(laterBox, "later element should have a bounding box").toBeTruthy();
  expect(earlierBox!.y, "earlier element should be visually above later element").toBeLessThan(laterBox!.y);
}

test("home page shows the product, not plumbing", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Your page goes in. The agent panel responds. A better page comes out." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Agent reactions, one visible conversation" })).toBeVisible();
  await expect(page.getByText("The product stage is more memorable now.")).toBeVisible();
  await expect(page.getByText("different people thinking in public")).toBeVisible();
  await expect(page.getByText("Security/privacy boundary")).toBeVisible();
  await expect(page.getByText("Production credentials stay server-side")).toBeVisible();
  await expect(page.getByText("Problem: the product value was hidden behind setup language.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Where the money is" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Pricing: scopes and budgets" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Agents: persistent cast + custom minds" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Trust: storage, credentials, and boundaries" })).toBeVisible();
});

test("auth pages point to the demo teardown", async ({ page }) => {
  await page.goto("/sign-in");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("link", { name: "View demo teardown" })).toBeVisible();
  await page.goto("/sign-up");
  await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible();
  await expect(page.getByRole("link", { name: "View demo teardown" })).toBeVisible();
});

test("dashboard and report render critic output", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Run dashboard" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "What matters here" })).toBeVisible();
  await expect(page.getByText("The dashboard should feel like the latest website conversation")).toBeVisible();
  await expect(page.getByText("Every run keeps the screenshot evidence, agent conversation, before/after fixes")).toBeVisible();
  await expect(page.getByText("Proof receipt")).toBeVisible();
  await expect(page.getByText("/settings/billing teardown")).toBeVisible();
  await expect(page.getByText("Privacy proof: customer-owned agents stay private workspace data.")).toBeVisible();
  await expect(page.getByRole("link", { name: /agent conversation/ })).toBeVisible();
  await expect(page.getByText("agents sound like different people")).toBeVisible();
  await expect(page.getByAltText("Snoopy report preview showing critic reactions and evidence output.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recent work" })).toBeVisible();
  await expect(page.getByText("Reopen the conversation, evidence, before/after recommendations, and implementation plan")).toBeVisible();
  await expect(page.getByText("Pricing teardown produced paid-plan clarity")).toBeVisible();
  await expect(page.getByText("7 voices").first()).toBeVisible();
  await expect(page.getByText("3 fixes").first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Open report/ }).first()).toBeVisible();
  await page.getByRole("link", { name: /Open report/ }).first().click();
  await expect(page).toHaveURL(/\/runs\/run_demo_pricing$/);
  const pricingReportBoardsNav = page.getByRole("navigation", { name: "Report boards" });
  await pricingReportBoardsNav.getByRole("button", { name: /Fixes/ }).click();
  await expect(page.getByText("Pricing needs product proof beside the paid step")).toBeVisible();
  await pricingReportBoardsNav.getByRole("button", { name: /Export/ }).click();
  await expect(page.getByText("snoopy-run-demo-pricing-implementation-queue.md")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Implementation plan" })).toBeVisible();
  await pricingReportBoardsNav.getByRole("button", { name: /Agents/ }).click();
  await expect(page.getByRole("heading", { name: "The run keeps each agent's profile attached." })).toBeVisible();
  await expect(page.getByText("Agent memory")).toBeVisible();
  await page.goto("/runs/demo");
  await expect(page.getByRole("heading", { name: "Run findings" })).toBeVisible();
  const reportBoardsNav = page.getByRole("navigation", { name: "Report boards" });
  await expect(reportBoardsNav).toBeVisible();
  await expect(reportBoardsNav.getByRole("button", { name: /Overview/ })).toBeVisible();
  await expect(reportBoardsNav.getByRole("button", { name: /Agents/ })).toBeVisible();
  await expect(reportBoardsNav.getByRole("button", { name: /Screens/ })).toBeVisible();
  await expect(reportBoardsNav.getByRole("button", { name: /Fixes/ })).toBeVisible();
  await expect(reportBoardsNav.getByRole("button", { name: /Sources/ })).toBeVisible();
  await expect(reportBoardsNav.getByRole("button", { name: /Export/ })).toBeVisible();
  await expect(page.locator('[data-report-board="overview"]')).toBeVisible();
  await expect(page.getByRole("heading", { name: "See the argument, the marked screen, and the fix to ship." })).toBeVisible();
  await expect(page.getByText("Workshop flow", { exact: true })).toBeVisible();
  await expect(page.getByText("Read this report in the order it becomes work.")).toBeVisible();
  await expect(page.getByText("Since prior runs")).toBeVisible();
  await expect(page.getByText("Consensus health")).toBeVisible();
  await expect(page.getByText("No prior memory in this report")).toBeVisible();
  await expect(page.getByText("Agents argue", { exact: true })).toBeVisible();
  await expect(page.getByText("Screen gets marked", { exact: true })).toBeVisible();
  await expect(page.getByText("Better version", { exact: true })).toBeVisible();
  await expect(page.getByText("Copy implementation plan", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("First fix to ship")).toBeVisible();
  await expect(page.getByText("Security/privacy boundary")).toBeVisible();
  await expect(page.getByText("production credentials stay server-side")).toBeVisible();
  await expect(page.getByAltText("Snoopy report preview showing agent reactions, evidence, and implementation handoff.")).toBeVisible();
  await expect(page.getByText("Visual proof: report evidence, agent reactions, and fix handoff stay together.")).toBeVisible();
  await reportBoardsNav.getByRole("button", { name: /Agents/ }).click();
  await expect(page.getByRole("heading", { name: "Agent voices. Useful disagreement." })).toBeVisible();
  await expect(page.locator('[data-report-board="agents"]')).toBeVisible();
  await expect(page.getByText("Conversation map")).toBeVisible();
  await expect(page.getByText("Before / after hypotheses")).toBeVisible();
  await expect(page.getByText("Personality coverage")).toBeVisible();
  await expect(page.getByText("4 / 4 axes represented")).toBeVisible();
  await expect(page.getByText("What the agents think should change.")).toBeVisible();
  await expect(page.getByText("Now").first()).toBeVisible();
  await expect(page.getByText("Next").first()).toBeVisible();
  await expect(page.getByText("supports").first()).toBeVisible();
  await expect(page.getByText("extends").first()).toBeVisible();
  await expect(page.getByText("MIKE THE CREATOR").first()).toBeVisible();
  await expect(page.getByText("Do not make them one voice repeated.").first()).toBeVisible();
  await expect(page.getByText("show do not tell")).toBeVisible();
  await expect(page.getByText("supports Leo").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "The run keeps each agent's profile attached." })).toBeVisible();
  await expect(page.getByText("Agent memory")).toBeVisible();
  await reportBoardsNav.getByRole("button", { name: /Screens/ }).click();
  await expect(page.getByRole("heading", { name: "What changes after the conversation" })).toBeVisible();
  await expect(page.locator('[data-report-board="screens"]')).toBeVisible();
  await expect(page.getByText("The page they reviewed")).toBeVisible();
  await expect(page.getByText("The next screen Snoopy recommends")).toBeVisible();
  await expect(page.getByText("Mock composition")).toBeVisible();
  await expect(page.getByText("Hero promise")).toBeVisible();
  await reportBoardsNav.getByRole("button", { name: /Export/ }).click();
  await expect(page.getByRole("heading", { name: "Implementation plan" })).toBeVisible();
  await reportBoardsNav.getByRole("button", { name: /Fixes/ }).click();
  await expect(page.getByRole("heading", { name: "Show fixes by agent exchange." })).toBeVisible();
  await expect(page.locator('[data-report-board="fixes"]')).toBeVisible();
  await expect(page.getByRole("button", { name: "All fixes" })).toBeVisible();
  await expect(page.locator("[data-relationship-filter-option]").first()).toBeVisible();
  await page.locator("[data-relationship-filter-option]").first().click();
  await expect(page.getByText(/visible fix/).first()).toBeVisible();
  await expect(page.locator("[data-relationship-filter-summary]")).toContainText(/is driving \d+ visible fix/);
  await expect(page.locator("[data-copied-task-relationship-context]").first()).toContainText("This fix handoff keeps this selected exchange:");
  await page.locator("[data-task-text-preview]").first().click();
  await expect(page.locator("[data-task-text-preview]").first()).toContainText("Preview exact fix handoff");
  await expect(page.locator("[data-task-text-preview]").first()).toContainText("Selected relationship filter:");
  await expect(page.locator("[data-task-text-preview]").first()).toContainText("Agent relationship behind this fix:");
  await page.getByRole("button", { name: "Copy this fix" }).first().click();
  await expect(page.getByRole("button", { name: "Copied fix" }).first()).toBeVisible();
  const copiedTaskWithRelationshipFilter = await page.evaluate(() => navigator.clipboard.readText());
  expect(copiedTaskWithRelationshipFilter).toContain("Selected relationship filter:");
  expect(copiedTaskWithRelationshipFilter).toContain("Agent relationship behind this fix:");
  await page.getByRole("button", { name: "All fixes" }).click();
  await expect(page.locator("[data-relationship-filter-summary]")).toHaveCount(0);
  await expect(page.getByText("Exportable work item").first()).toBeVisible();
  await expect(page.getByText("Preview exact fix handoff").first()).toBeVisible();
  await expect(page.getByText("Why this fix exists").first()).toBeVisible();
  await expect(page.locator("[data-why-this-fix-exists]").first()).toContainText("Region, agent exchange, and evidence stay together.");
  await expect(page.locator("[data-compact-fix-evidence]").first()).toBeVisible();
  await expect(page.locator("[data-compact-fix-evidence]").first()).toContainText("Evidence receipt, collapsed after the first rich fix.");
  await expect(page.locator("[data-compact-fix-evidence]").first()).toContainText("Open evidence details");
  await expect(page.getByText("Agent relationship behind this fix").first()).toBeVisible();
  await expect(page.getByText("Conversation thread").first()).toBeVisible();
  await expect(page.getByText("responded").first()).toBeVisible();
  const smallestRelationshipThreadText = await page.locator("[data-recommendation-relationship-thread]").first().evaluate((thread) => {
    const fontSizes = [thread, ...Array.from(thread.querySelectorAll("*"))]
        .filter((element) => (element.textContent ?? "").trim().length > 0)
        .map((element) => Number.parseFloat(window.getComputedStyle(element).fontSize))
        .filter((fontSize) => Number.isFinite(fontSize));
    return fontSizes.length ? Math.min(...fontSizes) : 0;
  });
  expect(smallestRelationshipThreadText).toBeGreaterThanOrEqual(14);
  await expect(page.getByText("Acceptance criteria").first()).toBeVisible();
  await reportBoardsNav.getByRole("button", { name: /Export/ }).click();
  await expect(page.getByText("Report artifact", { exact: true })).toBeVisible();
  await expect(page.getByText("snoopy-demo-implementation-queue.md")).toBeVisible();
  await page.getByRole("button", { name: "Copy implementation plan" }).click();
  await expect(page.getByRole("button", { name: "Copied plan" })).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download implementation plan" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("snoopy-demo-implementation-queue.md");
  const downloadPath = await download.path();
  expect(downloadPath).toBeTruthy();
  const queueText = await readFile(downloadPath!, "utf8");
  expect(queueText).toContain("# Snoopy Implementation Queue: demo");
  expect(queueText).toContain("## Agent Judgment Context");
  expect(queueText).toContain("## Task 1:");
  expect(queueText).toContain("Agent relationship behind this fix:");
  expect(queueText).toContain("Acceptance criteria:");
  await reportBoardsNav.getByRole("button", { name: /Fixes/ }).click();
  await page.getByRole("button", { name: "Copy this fix" }).first().click();
  await expect(page.getByRole("button", { name: "Copied fix" }).first()).toBeVisible();
});

test("new run starts from one URL with optional edits", async ({ page }) => {
  await page.goto("/runs/new");
  await expect(page.getByRole("heading", { name: "Website teardown agents for the next fix." })).toBeVisible();
  await expect(page.getByLabel("Website URL")).toBeVisible();
  await expect(page.getByText("The persistent core cast reviews it first.")).toBeVisible();
  await expect(page.getByText("Panel personality coverage").first()).toBeVisible();
  await expect(page.getByText("4 / 4 axes covered")).toBeVisible();
  await expect(page.getByText("Customer-owned agents are private workspace data.")).toBeVisible();
  await expect(page.getByText("Production credentials stay server-side.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Run review" })).toBeVisible();
  await expect(page.getByText("What the run should hand back")).toBeVisible();
  await expect(page.getByLabel("Before teardown screen showing a vague website hero with weak proof.")).toBeVisible();
  await expect(page.getByLabel("After Snoopy screen showing a rewritten hero with visible proof and one clear fix.")).toBeVisible();
  await expect(page.getByAltText("Snoopy report screenshot showing screen evidence, critic reactions, and recommendation cards.")).toBeVisible();
  await expect(page.getByText("Fix plan preview").first()).toBeVisible();
  await expect(page.getByText("Change the brief after the URL")).toBeVisible();
  await expect(page.getByText("Add a critic")).toBeVisible();
});

test("demo report shows screen evidence before the long conversation on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/runs/demo");

  const reportBoardsNav = page.getByRole("navigation", { name: "Report boards" });
  await expect(page.locator('[data-report-board="overview"]')).toBeVisible();
  await reportBoardsNav.getByRole("button", { name: /Screens/ }).click();
  await expect(page.getByRole("heading", { name: "What changes after the conversation" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Agent voices. Useful disagreement." })).toHaveCount(0);
  await reportBoardsNav.getByRole("button", { name: /Agents/ }).click();
  await expect(page.getByRole("heading", { name: "Agent voices. Useful disagreement." })).toBeVisible();
  await reportBoardsNav.getByRole("button", { name: /Export/ }).click();
  await expect(page.getByText("Implementation plan").first()).toBeVisible();
  await expect(page.getByText("Agent memory")).toHaveCount(0);
});

test("agents page generates, saves, and sends a customer-owned agent into a run", async ({ page }) => {
  await page.route("**/api/agents/generate", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        generation: { status: "llm" },
        agent: {
          id: "custom-brand-guardian",
          name: "Brand Guardian",
          role: "Customer-owned brand guardian",
          face: "BG",
          voice: "Plainspoken, visual, and commercially strict",
          goal: "Protect premium brand quality while improving conversion.",
          backstory: "Generated for a customer that wants a durable agent with taste and memory.",
          memories: ["Remembers when weak screenshots hurt trust.", "Tracks whether each run feels more premium."],
          tastes: ["premium visuals", "clear hierarchy", "specific proof"],
          blindSpots: ["May over-protect visual polish when conversion clarity is more urgent.", "Needs another agent to challenge whether the brand taste fits new buyers."],
          motivations: ["Protect customer taste", "Find issues the core cast may miss"],
          likes: ["Evidence near claims", "Visible before and after"],
          deviceHabits: ["Checks mobile first", "Reviews evidence on desktop"],
          skepticism: "Distrusts generic praise and generic criticism.",
          critiqueLens: ["brand quality", "visual hierarchy", "customer-specific taste"],
          voiceSettings: { style: "plainspoken", profanityLevel: "none" },
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
          dayPlan: ["Read prior reports", "Respond to another agent"],
          sourceDiet: ["Customer site history", "Competitor pages"],
          customerRelationship: "Private recurring reviewer for Acme Growth homepage quality.",
          privateExclusive: true,
          customerOwned: true,
        },
      }),
    });
  });

  await page.goto("/agents");
  await expect(page.getByRole("heading", { name: "The agents are the product asset." })).toBeVisible();
  await expect(page.getByText("Starts with 7")).toBeVisible();
  await expect(page.getByText("Can grow to hundreds")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Same page. Different objections. One first fix." })).toBeVisible();
  await expect(page.getByText("Show the report artifact first, then the package boundary, then the run action.")).toBeVisible();
  await expect(page.getByText("Fix artifact")).toBeVisible();
  await expect(page.getByText("One objection becomes a changed screen.")).toBeVisible();
  await expect(page.getByText("Work item: put output before pitch.")).toBeVisible();
  await expect(page.getByText("The report shows the argument, the marked screen, and the first fix.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "The report keeps disagreement usable." })).toBeVisible();
  await expect(page.getByText("Agents read the same screen and leave different evidence.")).toBeVisible();
  await expect(page.getByText("They keep useful memory.")).toBeVisible();
  await expect(page.getByText("They answer each other.")).toBeVisible();
  await expect(page.getByText("Route evidence")).toBeVisible();
  await expect(page.getByText("The first recommendation becomes a work item.")).toBeVisible();
  await expect(page.getByText("Six different tastes, one run.")).toHaveCount(0);
  await expect(page.getByText("Report proof")).toBeVisible();
  await expect(page.getByText("28 reactions per run")).toBeVisible();
  await expect(page.getByText("Customer agents stay private")).toBeVisible();
  await page.getByRole("button", { name: "Core cast" }).click();
  await expect(page.getByRole("heading", { name: "A starting cast with different tastes." })).toBeVisible();
  await expect(page.getByText("not a chorus")).toBeVisible();
  await expect(page.getByText("Skeptical founder")).toBeVisible();
  await expect(page.getByText("Memory", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Reads", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Today", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Custom agents" }).click();
  await expect(page.getByRole("heading", { name: "Create a customer-owned agent" })).toBeVisible();
  await page.getByRole("button", { name: "Generate agent" }).click();
  await expect(page.getByRole("heading", { name: "Brand Guardian" })).toBeVisible();
  await expect(page.getByText("Source diet", { exact: true })).toBeVisible();
  await expect(page.getByText("Personality facets", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Save agent" }).click();
  await expect(page.getByText("1 saved")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your saved agents are in the room." })).toBeVisible();
  await expect(page.getByText("These are not one-off prompts.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Run with this agent" })).toHaveAttribute("href", "/runs/new?agentId=custom-brand-guardian");
  await page.goto("/agents/custom-brand-guardian");
  await expect(page.getByRole("heading", { name: "Brand Guardian" })).toBeVisible();
  await expect(page.getByText("Customer-owned", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "This agent has a saved point of view." })).toBeVisible();
  await expect(page.getByText("Memory update")).toBeVisible();
  await expect(page.getByText("Source habit")).toBeVisible();
  await expect(page.getByText("Next disagreement")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Relationship to this business" })).toBeVisible();
  await expect(page.getByText("Private recurring reviewer for Acme Growth homepage quality.").last()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Blind spots" })).toBeVisible();
  await expect(page.getByText("Competitor pages", { exact: true })).toBeVisible();
  await expect(page.getByText("Respond to another agent", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Personality facets" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Customize this agent." })).toBeVisible();
  await page.getByText("Edit full profile").click();
  await expect(page.getByText("Tune how this agent thinks")).toBeVisible();
  await page.getByLabel("Role").fill("Customer-owned premium brand watcher");
  await page.getByLabel("Relationship to this business").fill("Private recurring reviewer for Acme Growth launch quality and buyer confidence.");
  await page.getByLabel("Edit tastes").fill("Award-worthy polish\nclear hierarchy\nspecific proof");
  await page.getByLabel("Edit memories").fill("Remembers when weak screenshots hurt trust.\nTracks whether each run feels more premium.\nPrefers evidence that looks worth paying for.");
  await page.getByLabel("Edit blind spots").fill("Can love polish too much when the money path is unclear.\nNeeds Ivy to challenge readability assumptions.");
  await page.locator("#agent-facet-thinking").evaluate((input) => {
    const range = input as HTMLInputElement;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(range, "0.91");
    range.dispatchEvent(new Event("input", { bubbles: true }));
    range.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("button", { name: "Saved changes" })).toBeVisible();
  await expect(page.getByText("Customer-owned premium brand watcher", { exact: true })).toBeVisible();
  await expect(page.getByText("Award-worthy polish", { exact: true })).toBeVisible();
  await expect(page.getByText("Prefers evidence that looks worth paying for.", { exact: true })).toBeVisible();
  await expect(page.getByText("Can love polish too much when the money path is unclear.", { exact: true })).toBeVisible();

  await page.goto("/agents/mike-the-creator");
  await expect(page.getByRole("heading", { name: "MIKE" })).toBeVisible();
  await expect(page.getByText("Core cast")).toBeVisible();
  await expect(page.getByText("Prior self-audits", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Personality facets" })).toBeVisible();
  await expect(page.getByText("Thinking").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Difference from the panel" })).toBeVisible();
  await expect(page.getByText("before the cast collapses into one generic reviewer")).toBeVisible();

  await page.route("**/api/runs", async (route) => {
    const requestBody = JSON.parse(route.request().postData() ?? "{}") as {
      additionalPersonas?: Array<{
        id?: string;
        name?: string;
        role?: string;
        memories?: string[];
        tastes?: string[];
        blindSpots?: string[];
        critiqueLens?: string[];
        sourceDiet?: string[];
        dayPlan?: string[];
        customerRelationship?: string;
        privateExclusive?: boolean;
        personalityFacets?: { thinking?: number; feeling?: number };
      }>;
    };
    const brandGuardian = requestBody.additionalPersonas?.find((persona) => persona.id === "custom-brand-guardian");
    expect(brandGuardian?.name).toBe("Brand Guardian");
    expect(brandGuardian?.role).toBe("Customer-owned premium brand watcher");
    expect(brandGuardian?.memories).toContain("Prefers evidence that looks worth paying for.");
    expect(brandGuardian?.tastes).toContain("Award-worthy polish");
    expect(brandGuardian?.blindSpots).toContain("Can love polish too much when the money path is unclear.");
    expect(brandGuardian?.critiqueLens).toContain("brand quality");
    expect(brandGuardian?.sourceDiet).toContain("Competitor pages");
    expect(brandGuardian?.dayPlan).toContain("Read prior reports");
    expect(brandGuardian?.customerRelationship).toBe("Private recurring reviewer for Acme Growth launch quality and buyer confidence.");
    expect(brandGuardian?.privateExclusive).toBe(true);
    expect(brandGuardian?.personalityFacets?.thinking).toBeCloseTo(0.91);
    expect(brandGuardian?.personalityFacets?.feeling).toBeCloseTo(0.42);
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        report: {
          summary: "Customer-owned agent joined the run.",
          personas: [
            {
              id: "custom-brand-guardian",
              name: "Brand Guardian",
              role: "Customer-owned premium brand watcher",
              face: "BG",
              goal: "Protect premium brand quality while improving conversion.",
              backstory: "Generated for a customer that wants a durable agent with taste and memory.",
              memories: ["Prefers evidence that looks worth paying for."],
              tastes: ["Award-worthy polish"],
              blindSpots: ["Can love polish too much when the money path is unclear."],
              motivations: ["Protect customer taste"],
              likes: ["Evidence near claims"],
              deviceHabits: ["Checks mobile first"],
              skepticism: "Distrusts generic praise and generic criticism.",
              trustThreshold: 0.72,
              personalityFacets: {
                introversion: 0.46,
                extraversion: 0.54,
                sensing: 0.62,
                intuition: 0.38,
                thinking: 0.91,
                feeling: 0.42,
                judging: 0.66,
                perceiving: 0.34,
              },
              critiqueLens: ["brand quality"],
              sourceDiet: ["Customer site history", "Competitor pages"],
              dayPlan: ["Read prior reports", "Respond to another agent"],
              customerRelationship: "Private recurring reviewer for Acme Growth launch quality and buyer confidence.",
              privateExclusive: true,
              customerOwned: true,
            },
            {
              id: "leo",
              name: "Leo",
              role: "Visual critic",
              goal: "Judge whether the page looks premium enough to trust.",
              backstory: "Designs high-converting product pages and notices weak visual hierarchy quickly.",
              memories: ["Dropped a vendor because screenshots looked rough."],
              tastes: ["premium visuals", "clear hierarchy"],
              motivations: ["Protect brand trust"],
              likes: ["Crisp screenshots"],
              deviceHabits: ["Reviews evidence on desktop"],
              skepticism: "If it looks generic, he assumes the product is generic.",
              trustThreshold: 0.6,
            },
          ],
          reactions: [
            {
              personaId: "custom-brand-guardian",
              deviceId: "desktop",
              url: "https://example.com",
              emotion: "curious",
              thought: "I can see the brand idea, but the proof needs to look more premium.",
              evidence: "The saved agent carried its brand-quality lens into the run.",
              critiqueAxis: "brand quality",
              stance: "extends_prior",
              respondsToPersonaId: "leo",
              responseReason: "same_run_reply",
              responseReasonDetail: "Brand Guardian is applying a customer-specific brand lens to Leo's visual read.",
            },
            {
              personaId: "custom-brand-guardian",
              deviceId: "mobile",
              url: "https://example.com",
              emotion: "curious",
              thought: "Leo is right on polish; I am adding the customer-specific reason this needs to look premium.",
              evidence: "The saved agent repeated the Leo extension from a mobile read.",
              critiqueAxis: "brand quality",
              stance: "extends_prior",
              respondsToPersonaId: "leo",
              responseReason: "same_run_reply",
              responseReasonDetail: "The same customer-owned agent keeps extending Leo with brand-specific evidence.",
            },
            {
              personaId: "leo",
              deviceId: "desktop",
              url: "https://example.com",
              emotion: "curious",
              thought: "Brand Guardian is right that premium proof matters; I am adding the layout reason.",
              evidence: "Leo responded to the customer-owned agent with a visual hierarchy angle.",
              critiqueAxis: "visual design",
              stance: "supports_prior",
              respondsToPersonaId: "custom-brand-guardian",
              responseReason: "same_run_reply",
              responseReasonDetail: "Leo supports Brand Guardian's brand-quality read with a visual design reason.",
            },
          ],
          snapshots: [],
          recommendations: [],
          findings: [],
        },
        events: [],
        persistence: { status: "generated", reference: { runId: "agent_test" } },
      }),
    });
  });

  await page.goto("/runs/new?agentId=custom-brand-guardian");
  await expect(page.getByText("Saved customer agents")).toBeVisible();
  await expect(page.getByText("Memory", { exact: true })).toBeVisible();
  await expect(page.getByText("Remembers when weak screenshots hurt trust.")).toBeVisible();
  await expect(page.getByText("Private recurring reviewer for Acme Growth launch quality and buyer confidence.").last()).toBeVisible();
  await expect(page.getByText("Lens", { exact: true })).toBeVisible();
  await expect(page.getByText("brand quality / visual hierarchy")).toBeVisible();
  await expect(page.getByText("Blind spot", { exact: true })).toBeVisible();
  await expect(page.getByText("Can love polish too much when the money path is unclear.")).toBeVisible();
  await expect(page.getByText("Source diet", { exact: true })).toBeVisible();
  await expect(page.getByText("Customer site history / Competitor pages")).toBeVisible();
  await expect(page.getByText("Difference from panel", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/than the core cast/).first()).toBeVisible();
  await expect(page.getByText("Include when this run needs Award-worthy polish + clear hierarchy.")).toBeVisible();
  await expect(page.getByLabel(/Brand Guardian/)).toBeChecked();
  await page.getByRole("button", { name: "Run review" }).click();
  await expect(page.getByText("I can see the brand idea")).toBeVisible();
  await page.goto("/agents/custom-brand-guardian");
  await expect(page.getByRole("heading", { name: "This agent remembers the last run." })).toBeVisible();
  await expect(page.getByText("session run memory")).toBeVisible();
  await expect(page.getByText("Latest run reaction")).toBeVisible();
  await expect(page.getByText("I can see the brand idea, but the proof needs to look more premium.")).toBeVisible();
  await expect(page.getByText("Run evidence")).toBeVisible();
  await expect(page.getByText("The saved agent carried its brand-quality lens into the run.")).toBeVisible();
  await expect(page.getByText("Conversation memory").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Who this agent reacts to." })).toBeVisible();
  await expect(page.getByText("Leo").last()).toBeVisible();
  await expect(page.getByText("extends 2")).toBeVisible();
  await expect(page.getByText("Same-run reply from example.com").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Who reacts to this agent." })).toBeVisible();
  await expect(page.getByText("Often hears from")).toBeVisible();
  await expect(page.getByText("supports 1")).toBeVisible();
  await expect(page.getByText("Leo supported Brand Guardian here.")).toBeVisible();
  await page.goto("/runs/new");
  await expect(page.getByText("Last run: extended Leo on brand quality.")).toBeVisible();
  await expect(page.getByText("Pattern: often extends Leo on brand quality (2 reads).")).toBeVisible();
  await page.goto("/agents");
  await page.getByRole("button", { name: "Custom agents" }).click();
  await expect(page.getByRole("heading", { name: "Your saved agents are in the room." })).toBeVisible();
  await expect(page.getByText("Latest run reaction")).toBeVisible();
  await expect(page.getByText("I can see the brand idea, but the proof needs to look more premium.")).toBeVisible();
});

test("billing page focuses on paid product value", async ({ page }) => {
  await page.goto("/settings/billing");
  await expect(page.getByRole("heading", { name: "Pricing for website teardown work." })).toBeVisible();
  await expect(page.getByText("Pilot proves the teardown. Production preserves the workspace.")).toBeVisible();
  await expect(page.getByText("Scoped teardown, core cast, saved custom agents, and before/after fixes.")).toBeVisible();
  await expect(page.getByText("Persisted runs, team access, billing, expanded agents, and deployment support.")).toBeVisible();
  await expect(page.getByText("Paid workspaces add persisted reports, billing, team access, private customer agents, and deployment support.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Pricing", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Turn the quote into a concrete first work packet." })).toBeVisible();
  await expect(page.getByText("Pilot scope: 3-route pilot, core cast, fix queue.")).toBeVisible();
  await page.getByLabel("Routes").selectOption("six-route");
  await page.getByLabel("Agents").selectOption("owned");
  await page.getByLabel("Handoff").selectOption("deploy");
  await expect(page.getByText("Launch scope: 6-route launch, customer-owned, deploy support.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Start scoped teardown" })).toHaveAttribute("href", "/runs/new");
  await expect(page.getByRole("link", { name: "Trust boundaries" })).toHaveAttribute("href", "/trust");
  await expect(page.getByAltText("Snoopy report preview used as billing proof for evidence, agent reactions, and fix handoff.")).toBeVisible();
});

test("integration handoff page translates metadata into usable work", async ({ page }) => {
  await page.goto("/integrations");
  await expect(page.getByRole("heading", { name: "The report becomes work another agent can use." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Not a summary. A work packet." })).toBeVisible();
  await expect(page.getByAltText("Snoopy report preview showing agent reactions, recommendation cards, and implementation handoff output")).toBeVisible();
  await expect(page.getByText("Affected region: homepage hero")).toBeVisible();
  await expect(page.getByText("Fix: put the product output before setup copy")).toBeVisible();
  await expect(page.getByRole("heading", { name: "The contract agents can inspect." })).toBeVisible();
  await expect(page.getByText("/api/runs/{runId}/implementation-queue").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "The cool parts are callable." })).toBeVisible();
  await expect(page.getByText("targetUrl: https://example.com")).toBeVisible();
  await expect(page.getByText("brief: Low-vision conversion reviewer")).toBeVisible();
  await expect(page.getByText("saved profile can join additionalPersonas")).toBeVisible();
  await expect(page.getByText("recommendation.implementationWorkItem")).toBeVisible();
  await expect(page.getByText("Production credentials stay server-side.")).toBeVisible();
  await expect(page.getByText("security, privacy, customer-data, and credential boundaries")).toBeVisible();
  await expect(page.getByRole("link", { name: "Raw agent contract" })).toHaveAttribute("href", "/api/service-metadata");
  await expect(page.getByRole("link", { name: "Read service metadata" })).toHaveAttribute("href", "/api/service-metadata");
  await expect(page.getByRole("link", { name: "Open trust boundaries" })).toHaveAttribute("href", "/trust");
});

test("trust page states current storage and credential boundaries", async ({ page }) => {
  await page.goto("/trust");
  await expect(page.getByRole("heading", { name: "What Snoopy can touch, store, and hand off." })).toBeVisible();
  await expect(page.getByText("Browser", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Credentials" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Customer agents" })).toBeVisible();
  await expect(page.getByText("Not a legal privacy policy, DPA, SOC 2 report, or security whitepaper.")).toBeVisible();
  await expect(page.getByText("PostHog MCP still needs OAuth login in Codex.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Read metadata" })).toHaveAttribute("href", "/api/service-metadata");
});

test("creating a test run renders mocked critic conversation", async ({ page }) => {
  await page.route("**/api/runs", async (route) => {
    const requestBody = JSON.parse(route.request().postData() ?? "{}") as {
      goal?: string;
      additionalPersonas?: Array<{ name?: string; critiqueLens?: string[]; voice?: { style?: string; allowsMildProfanity?: boolean; profanityLevel?: string } }>;
    };
    expect(requestBody.goal).toContain("buyer");
    expect(requestBody.additionalPersonas?.[0]?.name).toBe("Claire");
    expect(requestBody.additionalPersonas?.[0]?.critiqueLens).toContain("UI quality");
    expect(requestBody.additionalPersonas?.[0]?.voice?.style).toBe("blunt");
    expect(requestBody.additionalPersonas?.[0]?.voice?.profanityLevel).toBe("moderate");

    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        report: {
          summary: "8 critics tested 4 devices and found 1 issue, including 0 high severity.",
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
            },
            {
              id: "custom-2",
              name: "Claire",
              role: "Product owner",
              goal: "Evaluate novelty.",
              backstory: "Created during test.",
              memories: ["Wants sharper critique."],
              tastes: ["UI quality"],
              motivations: ["Improve the product"],
              likes: ["Blunt output"],
              deviceHabits: ["Desktop review"],
              skepticism: "Agreement needs evidence.",
              trustThreshold: 0.72,
            },
          ],
          reactions: [
            {
              personaId: "maya",
              deviceId: "iphone",
              url: "https://example.com",
              emotion: "confused",
              thought: "I cannot tell what happens next.",
              evidence: "CTA was vague.",
            },
            {
              personaId: "custom-2",
              deviceId: "desktop",
              url: "https://example.com",
              emotion: "frustrated",
              thought: "This is boring and the UI needs a stronger idea.",
              evidence: "The hero has no visual payoff.",
            },
          ],
          snapshots: [],
          recommendations: [
            {
              priority: "medium",
              title: "Clarify the next step",
              targetArea: "copy",
              recommendation: "Use action-specific copy and show the visual payoff.",
              evidence: "Maya hesitated on mobile.",
              affectedPersonas: ["maya", "custom-2"],
              affectedDevices: ["iphone", "desktop"],
            },
          ],
          findings: [
            {
              category: "confusion",
              severity: "medium",
              title: "CTA copy is ambiguous",
              evidence: "The critic could not tell what happens next.",
              recommendation: "Use action-specific copy.",
              confidence: 0.81,
            },
          ],
        },
        events: [],
        persistence: { status: "persisted", reference: { runId: "run_test" } },
      }),
    });
  });

  await page.goto("/runs/new");
  await page.getByText("Add a critic").click();
  await page.getByLabel("Critic name").fill("Claire");
  await page.getByLabel("What do they care about?").fill("UI quality, novelty");
  await page.getByLabel("Voice").selectOption("blunt");
  await page.getByLabel("Profanity").selectOption("moderate");
  await page.getByRole("button", { name: "Add critic" }).click();
  await page.getByRole("button", { name: "Run review" }).click();
  await expect(page.getByText("Critics: Maya, Claire")).toBeVisible();
  await expect(page.getByText("Panel personality coverage").first()).toBeVisible();
  await expect(page.getByText("I cannot tell what happens next.")).toBeVisible();
  await expect(page.getByText("This is boring and the UI needs a stronger idea.")).toBeVisible();
  await expect(page.getByText("Clarify the next step")).toBeVisible();
  await expect(page.getByText("CTA copy is ambiguous")).toBeVisible();
});

test("generated runs can be reopened as their own reports", async ({ page, request }) => {
  await page.goto("/settings/billing");
  const targetUrl = page.url();
  const runId = `smoke_${Date.now()}`;

  const response = await request.post("/api/runs", {
    data: {
      runId,
      targetUrl,
      goal: "Check whether generated reports can reopen with implementation work items.",
      personas: [
        {
          id: "smoke-critic",
          name: "Smoke Critic",
          role: "Report reopen tester",
          goal: "Verify the generated report can be inspected later.",
          backstory: "Checks whether critique output survives long enough to become work.",
          memories: ["Lost useful reports when tools only displayed one transient response."],
          tastes: ["Reopenable reports", "Implementation-ready tasks"],
          motivations: ["Keep generated work reusable"],
          likes: ["Copyable work items"],
          deviceHabits: ["Desktop browser"],
          skepticism: "If a run cannot reopen, the product is not operational.",
          trustThreshold: 0.7,
          face: "SC",
          customerOwned: true,
          sourceDiet: ["Prior Snoopy reports", "Customer site history"],
          dayPlan: ["Read the previous run", "Leave one exportable work item"],
        },
      ],
      devices: [
        {
          id: "desktop",
          label: "Desktop",
          kind: "desktop",
          viewport: { width: 1024, height: 768 },
          userAgent: "Snoopy smoke test",
        },
      ],
      maxPages: 1,
    },
  });

  expect(response.ok()).toBeTruthy();
  const created = await response.json();
  expect(created.persistence.status).toBe("generated");
  expect(created.persistence.reference.runId).toBe(runId);
  expect(created.report.recommendations[0].implementationWorkItem.acceptanceCriteria.length).toBeGreaterThan(0);
  expect(created.report.artifacts[0].kind).toBe("implementation_queue");
  expect(created.report.artifacts[0].href).toBe(`/api/runs/${runId}/implementation-queue`);

  const readResponse = await request.get(`/api/runs/${runId}`);
  expect(readResponse.ok()).toBeTruthy();
  const read = await readResponse.json();
  expect(read.persistence.status).toBe("generated");
  expect(read.report.payload.runId).toBe(runId);
  expect(read.report.payload.recommendations[0].implementationWorkItem.affectedRegion).toBeTruthy();
  expect(read.report.payload.artifacts[0].fileName).toContain("implementation-queue.md");

  await page.goto(`/runs/${runId}`);
  await expect(page.getByText("Source: generated run")).toBeVisible();
  const generatedBoardsNav = page.getByRole("navigation", { name: "Report boards" });
  await generatedBoardsNav.getByRole("button", { name: /Screens/ }).click();
  await expect(page.getByText("Pinned screen reads")).toBeVisible();
  await generatedBoardsNav.getByRole("button", { name: /Fixes/ }).click();
  await expect(page.getByText("Why this fix exists").first()).toBeVisible();
  await expect(page.getByText("Recommendation evidence trace").first()).toBeVisible();
  await expect(page.getByText("Match:").first()).toBeVisible();
  await expect(page.getByText("Screen evidence for this fix:").first()).toBeVisible();
  await generatedBoardsNav.getByRole("button", { name: /Agents/ }).click();
  await expect(page.getByRole("heading", { name: "The run keeps each agent's profile attached." })).toBeVisible();
  await expect(page.getByText("Personality coverage")).toBeVisible();
  await expect(page.getByText("Next agent to add")).toBeVisible();
  await expect(page.getByText("Add an introversion-heavy reviewer")).toBeVisible();
  await page.getByRole("link", { name: "Open prefilled generator" }).first().click();
  await expect(page).toHaveURL(/\/agents\?/);
  await expect(page.getByRole("heading", { name: "Create a customer-owned agent" })).toBeVisible();
  await expect(page.locator("#agent-brief")).toHaveValue(/introversion-heavy website reviewer/);
  await expect(page.locator("#agent-tone")).toHaveValue("skeptical");

  await page.goto(`/runs/${runId}`);
  const reopenedGeneratedBoardsNav = page.getByRole("navigation", { name: "Report boards" });
  await reopenedGeneratedBoardsNav.getByRole("button", { name: /Agents/ }).click();
  await expect(page.getByText("customer-owned", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Prior Snoopy reports", { exact: true })).toBeVisible();
  await expect(page.getByText("Leave one exportable work item")).toBeVisible();
  await expect(page.getByText("Latest report reaction").first()).toBeVisible();
  await reopenedGeneratedBoardsNav.getByRole("button", { name: /Fixes/ }).click();
  await expect(page.getByText("Exportable work item").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy this fix" }).first()).toBeVisible();
  await reopenedGeneratedBoardsNav.getByRole("button", { name: /Export/ }).click();
  await expect(page.getByText("Report artifact", { exact: true })).toBeVisible();
  await expect(page.getByText("Open markdown endpoint")).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy implementation plan" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Download implementation plan" })).toBeVisible();

  const queueResponse = await request.get(`/api/runs/${runId}/implementation-queue`);
  expect(queueResponse.ok()).toBeTruthy();
  expect(queueResponse.headers()["content-type"]).toContain("text/markdown");
  const expectedQueueFile = `snoopy-${runId.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}-implementation-queue.md`;
  expect(queueResponse.headers()["content-disposition"]).toContain(expectedQueueFile);
  const markdown = await queueResponse.text();
  expect(markdown).toContain(`# Snoopy Implementation Queue: ${runId}`);
  expect(markdown).toContain("## Agent Judgment Context");
  expect(markdown).toContain("## Screen Evidence");
  expect(markdown).toContain("Screen evidence:");
  expect(markdown).toContain("annotations:");
  expect(markdown).toContain("## Operational Boundaries");
  expect(markdown).toContain("Production credentials stay server-side");
  expect(markdown).toContain("Latest reaction:");
  expect(markdown).toContain("Affected screen region:");
  expect(markdown).toContain("Acceptance criteria:");
});

test("customer-owned agent can join a real generated run and reopen with memory", async ({ page, request, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/integrations");
  const targetUrl = page.url();
  const runId = `brand_guardian_${Date.now()}`;

  const response = await request.post("/api/runs", {
    data: {
      runId,
      targetUrl,
      goal: "Verify a saved customer-owned brand guardian can join the handoff page audit and survive into the reopened report.",
      comparisonUrls: [new URL("/agents", targetUrl).toString()],
      marketContext: "Compare the handoff page against the current agent profile surface and judge whether the customer-owned agent value is visible enough to sell.",
      additionalPersonas: [
        {
          id: "custom-brand-guardian",
          name: "Brand Guardian",
          role: "Customer-owned brand guardian",
          face: "BG",
          goal: "Protect premium brand quality while improving conversion.",
          backstory: "Generated for a customer that wants a durable agent with taste and memory.",
          memories: ["Remembers when weak screenshots hurt trust.", "Tracks whether each run feels more premium."],
          tastes: ["premium visuals", "clear hierarchy", "specific proof"],
          blindSpots: ["May over-protect visual polish when conversion clarity is more urgent."],
          motivations: ["Protect customer taste", "Find issues the core cast may miss"],
          likes: ["Evidence near claims", "Visible before and after"],
          deviceHabits: ["Checks mobile first", "Reviews evidence on desktop"],
          skepticism: "Distrusts generic praise and generic criticism.",
          trustThreshold: 0.72,
          critiqueLens: ["brand quality", "visual hierarchy", "customer-specific taste"],
          sourceDiet: ["Customer site history", "Competitor pages", "Prior Snoopy reports"],
          dayPlan: ["Read prior reports", "Respond to another agent", "Leave one customer-specific recommendation"],
          customerRelationship: "Private recurring reviewer for Acme Growth launch quality.",
          privateExclusive: true,
          customerOwned: true,
          voice: { style: "plainspoken", allowsMildProfanity: false, profanityLevel: "none" },
        },
      ],
      devices: [
        {
          id: "desktop",
          label: "Desktop",
          kind: "desktop",
          viewport: { width: 1024, height: 768 },
          userAgent: "Snoopy saved-agent smoke test",
        },
      ],
      maxPages: 1,
    },
  });

  expect(response.ok()).toBeTruthy();
  const created = await response.json();
  expect(created.persistence.status).toBe("generated");
  expect(created.persistence.reference.runId).toBe(runId);
  expect(created.report.personas.some((persona: { id: string; customerOwned?: boolean }) => persona.id === "custom-brand-guardian" && persona.customerOwned)).toBe(
    true,
  );
  expect(created.report.reactions.some((reaction: { personaId: string }) => reaction.personaId === "custom-brand-guardian")).toBe(true);
  expect(created.report.recommendations.length).toBeGreaterThan(1);

  await page.goto(`/runs/${runId}`);
  await expect(page.getByText("Source: generated run")).toBeVisible();
  const customerRunBoardsNav = page.getByRole("navigation", { name: "Report boards" });
  await expect(page.locator("[data-top-agent-signal]")).toBeVisible();
  await expect(page.locator("[data-top-agent-signal]")).toContainText("Customer-owned agent in this run");
  await expect(page.locator("[data-top-agent-signal]")).toContainText("Brand Guardian is already shaping the read.");
  await expect(page.locator("[data-top-agent-signal]")).toContainText("credited fixes");
  await expect(page.locator("[data-top-agent-signal]")).toContainText("source habit");
  await expect(page.locator("[data-customer-owned-delta]")).toBeVisible();
  await expect(page.locator("[data-customer-owned-delta]")).toContainText("What changed because of this agent");
  await expect(page.locator("[data-customer-owned-delta]")).toContainText("Core cast saw");
  await expect(page.locator("[data-customer-owned-delta]")).toContainText("Brand Guardian added");
  await expect(page.locator("[data-customer-owned-report-influence]")).toBeVisible();
  await expect(page.locator("[data-customer-owned-report-influence]")).toContainText("Brand Guardian shaped this report.");
  await expect(page.locator("[data-customer-owned-report-influence]")).toContainText("reactions in this report");
  await expect(page.locator("[data-customer-owned-report-influence]")).toContainText("credited fixes");
  await expect(page.locator("[data-customer-owned-report-influence]")).toContainText("Customer site history");
  await customerRunBoardsNav.getByRole("button", { name: /Fixes/ }).click();
  await expect(page.locator("[data-compact-fix-evidence]").first()).toBeVisible();
  await expect(page.locator("[data-compact-fix-evidence]").first()).toContainText("Evidence receipt, collapsed after the first rich fix.");
  await customerRunBoardsNav.getByRole("button", { name: /Sources/ }).click();
  await expect(page.locator("[data-reference-sources-panel]")).toBeVisible();
  await expect(page.getByRole("heading", { name: "What the agents read before judging." })).toBeVisible();
  await expect(page.locator("[data-reference-sources-panel]")).toContainText("Comparison site");
  await expect(page.locator("[data-reference-sources-panel]")).toContainText("/agents");
  await expect(page.locator("[data-reference-sources-panel]")).toContainText("Market context");
  await expect(page.locator("[data-reference-sources-panel]")).toContainText("customer-owned agent value");
  await expect(page.getByRole("heading", { name: "Show work shaped by one source." })).toBeVisible();
  await expect(page.locator("[data-source-filter-option]").first()).toBeVisible();
  await page.locator("[data-source-filter-option]").first().click();
  await expect(page.locator("[data-source-filter-summary]")).toContainText(/visible reactions? and \d+ visible fix(?:es)?/);
  await customerRunBoardsNav.getByRole("button", { name: /Agents/ }).click();
  await expect(page.locator("[data-agent-source-reference]").first()).toBeVisible();
  await expect(page.locator("[data-agent-source-reference]").first()).toContainText("Compared with:");
  await customerRunBoardsNav.getByRole("button", { name: /Fixes/ }).click();
  await expect(page.locator("[data-recommendation-source-receipt]").first()).toBeVisible();
  await expect(page.locator("[data-source-influence-panel]").first()).toBeVisible();
  await expect(page.locator("[data-source-influence-panel]").first()).toContainText("Source influence");
  await expect(page.locator("[data-source-influence-panel]").first()).toContainText("translated it");
  await expect(page.locator("[data-source-influence-card]").first()).toBeVisible();
  await expect(page.locator("[data-copied-task-source-context]").first()).toContainText("This fix handoff keeps this selected source:");
  await page.locator("[data-task-text-preview]").first().click();
  await expect(page.locator("[data-task-text-preview]").first()).toContainText("Selected source filter:");
  await page.getByRole("button", { name: "Copy this fix" }).first().click();
  await expect(page.getByRole("button", { name: "Copied fix" }).first()).toBeVisible();
  const copiedTaskWithSourceFilter = await page.evaluate(() => navigator.clipboard.readText());
  expect(copiedTaskWithSourceFilter).toContain("Selected source filter:");
  expect(copiedTaskWithSourceFilter).toContain("Source used by agent:");
  await customerRunBoardsNav.getByRole("button", { name: /Export/ }).click();
  await expect(page.getByRole("heading", { name: "Copy this filtered implementation plan." })).toBeVisible();
  await expect(page.locator("[data-implementation-queue-scope]")).toContainText("This implementation plan contains");
  await expect(page.locator("[data-implementation-queue-scope]")).toContainText(/of \d+ total fix(?:es)?/);
  await expect(page.locator("[data-implementation-queue-scope]")).toContainText(/fix(?:es)? (?:is|are) hidden by the current filters/);
  await expect(page.locator("[data-filtered-queue-preview]")).toContainText("This visible fix plan will be copied or downloaded.");
  await expect(page.locator("[data-filtered-queue-count]")).toContainText(/of \d+ total fix(?:es)?/);
  await expect(page.locator("[data-filtered-queue-omitted-count]")).toContainText(/fix(?:es)? (?:is|are) hidden by the current filters/);
  await expect(page.locator("[data-filtered-queue-task]").first()).toBeVisible();
  await expect(page.locator("[data-filtered-queue-preview-context]")).toContainText(/visible reactions? and \d+ visible fix(?:es)?/);
  await page.getByRole("button", { name: "Copy visible fix plan" }).click();
  await expect(page.getByRole("button", { name: "Copied plan" })).toBeVisible();
  const copiedVisibleQueue = await page.evaluate(() => navigator.clipboard.readText());
  expect(copiedVisibleQueue).toContain("Queue scope:");
  expect(copiedVisibleQueue).toContain("hidden by the current filters");
  expect(copiedVisibleQueue).toContain("Selected source filter:");
  expect(copiedVisibleQueue).toContain("Source used by agent:");
  await customerRunBoardsNav.getByRole("button", { name: /Sources/ }).click();
  await page.getByRole("button", { name: "All sources" }).click();
  await expect(page.locator("[data-source-filter-summary]")).toHaveCount(0);
  await customerRunBoardsNav.getByRole("button", { name: /Agents/ }).click();
  await expect(page.getByText("Brand Guardian").first()).toBeVisible();
  await expect(page.getByText("customer-owned", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Latest report reaction").first()).toBeVisible();
  await expect(page.getByText("Customer site history", { exact: true })).toBeVisible();
  await expect(page.getByText("May over-protect visual polish")).toBeVisible();
  await expect(page.getByText("Private recurring reviewer for Acme Growth launch quality.").first()).toBeVisible();
  await expect(page.getByText("Respond to another agent")).toBeVisible();
  await customerRunBoardsNav.getByRole("button", { name: /Fixes/ }).click();
  await expect(page.getByText("Exportable work item").first()).toBeVisible();
  await expect(page.locator("[data-recommendation-source-receipt]").first()).toBeVisible();
  await expect(page.locator("[data-recommendation-source-receipt]").first()).toContainText("source-backed");
  await expect(page.locator("[data-customer-owned-recommendation-credit]").first()).toBeVisible();
  await expect(page.locator("[data-customer-owned-recommendation-credit]").first()).toContainText("Brand Guardian");
  await expect(page.locator("[data-customer-owned-recommendation-credit]").first()).toContainText("customer-owned");
  const customerOwnedRecommendation = page.locator("[data-customer-owned-recommendation-credit]").first().locator("xpath=ancestor::*[@data-recommendation-card][1]");
  await customerOwnedRecommendation.locator("[data-task-text-preview]").click();
  await expect(customerOwnedRecommendation.locator("[data-task-text-preview]")).toContainText("Customer-owned contribution:");
  await expect(customerOwnedRecommendation.locator("[data-task-text-preview]")).toContainText("Brand Guardian");
  const sourceBackedRecommendation = page.locator("[data-recommendation-source-receipt]").first().locator("xpath=ancestor::*[@data-recommendation-card][1]");
  await sourceBackedRecommendation.locator("[data-task-text-preview]").click();
  await expect(sourceBackedRecommendation.locator("[data-task-text-preview]")).toContainText("Source used by agent:");
  await customerRunBoardsNav.getByRole("button", { name: /Export/ }).click();
  await expect(page.getByText("Report artifact", { exact: true })).toBeVisible();

  const queueResponse = await request.get(`/api/runs/${runId}/implementation-queue`);
  expect(queueResponse.ok()).toBeTruthy();
  const queueMarkdown = await queueResponse.text();
  expect(queueMarkdown).toContain("Customer-owned contribution:");
  expect(queueMarkdown).toContain("Brand Guardian");
  expect(queueMarkdown).toContain("Source used by agent:");
});

test("service metadata is agent-readable", async ({ request }) => {
  const response = await request.get("/api/service-metadata");
  expect(response.ok()).toBeTruthy();
  const metadata = await response.json();
  expect(metadata.service.capabilities).toContain("persistent core cast, including MIKE THE CREATOR, with personality-facet coverage");
  expect(metadata.service.capabilities).toContain("LLM-powered customer-owned agent generator with deterministic fallback when credentials are absent");
  expect(metadata.service.capabilities).toContain("self-audit runs can seed browser localStorage so saved-agent states are testable with the same artifact pipeline");
  expect(metadata.service.capabilities).toContain("deployment documentation lists production environment variables, validation commands, smoke checks, and credential boundaries");
  expect(metadata.service.capabilities).toContain("run setup shows saved customer-agent memory, critique lenses, source diet, and tastes before selection");
  expect(metadata.service.capabilities).toContain("run setup shows a saved customer-agent's latest conversation-memory signal before selection when prior run history exists");
  expect(metadata.service.capabilities).toContain("run setup summarizes repeated saved-agent relationship patterns when enough prior stance history exists");
  expect(metadata.service.capabilities).toContain("agent profiles show inbound conversation memory for other agents that respond to a saved or core agent");
  expect(metadata.service.capabilities).toContain("core cast profile pages expose weighted personality facets so buyers can see why agents differ");
  expect(metadata.service.capabilities).toContain("agent profiles explain how an agent's personality weights differ from the rest of the core cast");
  expect(metadata.service.capabilities).toContain(
    "customer-owned profile pages can update saved agent name, role, face, voice, backstory, memories, tastes, blind spots, critique lenses, source diet, personality facets, customer relationship, exclusivity, and day plan",
  );
  expect(metadata.service.capabilities).toContain("report detail includes a conversation map with stance counts and visible agent-to-agent links");
  expect(metadata.service.capabilities).toContain(
    "report detail exposes Overview, Agents, Screens, Fixes, Sources, and Export board navigation so agents and humans can jump to the right workspace area",
  );
  expect(metadata.service.capabilities).toContain(
    "report detail shows a top customer-owned agent signal with latest thought, reaction count, credited fixes, source habit, and stance mix",
  );
  expect(metadata.service.capabilities).toContain("report detail compares the core-cast read with the customer-owned agent contribution before the long recommendation list");
  expect(metadata.service.capabilities).toContain(
    "report detail surfaces customer-owned agent influence near the workshop flow with reaction counts, credited fixes, and source habits",
  );
  expect(metadata.service.capabilities).toContain(
    "report recommendation cards and implementation-plan fixes show the agent relationship behind each fix when reaction links are available",
  );
  expect(metadata.service.capabilities).toContain("report recommendation cards keep the first evidence module rich and collapse repeated evidence receipts on later fixes");
  expect(metadata.service.capabilities).toContain("report recommendation cards render linked agent relationships as compact conversation threads");
  expect(metadata.service.capabilities).toContain("report recommendation cards combine affected region, agent relationship, and screen evidence into a Why this fix exists module");
  expect(metadata.service.capabilities).toContain("report recommendation cards and implementation-plan fixes credit customer-owned agents when they shape a recommendation");
  expect(metadata.service.capabilities).toContain("report detail can filter recommendations by the agent relationship that produced the fix");
  expect(metadata.service.capabilities).toContain("report detail summarizes the visible fixes produced by a selected agent relationship filter");
  expect(metadata.service.capabilities).toContain("copied fix handoffs preserve selected relationship-filter context when the user copies from a filtered fix list");
  expect(metadata.service.capabilities).toContain("bulk implementation-plan copy and download apply the visible report filters and preserve selected source or relationship context");
  expect(metadata.service.capabilities).toContain("filtered implementation plans preview the exact visible fixes before copy or download");
  expect(metadata.service.capabilities).toContain("filtered implementation plans compare visible fix count against the full recommendation set");
  expect(metadata.service.capabilities).toContain("filtered implementation plans state how many recommendation fixes are hidden by the current filters");
  expect(metadata.service.capabilities).toContain("report recommendation cards preview the exact copied fix handoff before the user puts it on the clipboard");
  expect(metadata.service.capabilities).toContain("report detail shows comparison URLs and market/news context as visible agent reading evidence");
  expect(metadata.service.capabilities).toContain("report reaction bubbles show when an agent used a visible comparison or market source");
  expect(metadata.service.capabilities).toContain("report detail can filter reactions and recommendations by the comparison or market source that shaped them");
  expect(metadata.service.capabilities).toContain(
    "recommendation cards combine the source-backed fix receipt with a visual source influence panel linking an outside read to the agent translation behind a fix",
  );
  expect(metadata.service.capabilities).toContain("copied fix handoffs preserve selected source-filter context when the user copies from a source-filtered fix list");
  expect(metadata.service.capabilities).toContain("copied fix handoffs and implementation plans include source references when source-linked reactions shaped a fix");
  expect(metadata.service.capabilities).toContain("recommendation cards show source-backed fix evidence before the exact task preview");
  expect(metadata.service.capabilities).toContain("report detail shows before/after hypotheses with current agent read, improved state, and evidence");
  expect(metadata.service.capabilities).toContain(
    "screen evidence can include captured viewport annotations for visible headings, actions, forms, images, and content regions",
  );
  expect(metadata.service.capabilities).toContain("report detail agent-memory cards show each persona profile beside that persona's latest preserved report reaction");
  expect(metadata.service.capabilities).toContain("implementation queue markdown includes agent judgment context from preserved persona reactions");
  expect(metadata.service.capabilities).toContain("implementation queue markdown includes captured screen evidence annotations when available");
  expect(metadata.service.capabilities).toContain("implementation queue markdown includes operational boundaries for credentials, persistence, and destructive actions");
  expect(metadata.api.createRun.path).toBe("/api/runs");
  expect(metadata.api.readImplementationQueue.path).toBe("/api/runs/{runId}/implementation-queue");
  expect(metadata.api.generateAgent.path).toBe("/api/agents/generate");
  expect(metadata.api.readAgentProfile.path).toBe("/agents/{agentId}");
  expect(metadata.examples.createRun.request.body.targetUrl).toBe("https://example.com");
  expect(metadata.examples.createRun.responseShape.report).toContain("before/after hypotheses");
  expect(metadata.examples.generateAgent.request.body.brief).toContain("low-vision conversion reviewer");
  expect(metadata.examples.generateAgent.responseShape.agent).toContain("additionalPersonas");
  expect(metadata.examples.readImplementationQueue.responseShape).toContain("Markdown work packet");
  expect(metadata.fieldContracts.createRunBody.required).toContain("targetUrl");
  expect(metadata.fieldContracts.createRunBody.optional).toContain("additionalPersonas");
  expect(metadata.fieldContracts.generatedAgent.required).toContain("personalityFacets");
  expect(metadata.fieldContracts.generatedAgent.notes.join(" ")).toContain("weights from 0 to 1");
  expect(metadata.fieldContracts.reaction.optional).toContain("responseReasonDetail");
  expect(metadata.fieldContracts.recommendation.optional).toContain("implementationWorkItem");
  expect(metadata.fieldContracts.screenEvidence.optional).toContain("annotations");
  expect(metadata.fieldContracts.persistence.statuses).toContain("generated");
  expect(metadata.fieldContracts.persistence.notes.join(" ")).toContain("not a customer-facing product path");
  expect(metadata.output.reportFields).toContain("recommendations");
  expect(metadata.output.reportFields).toContain("recommendations.implementationWorkItem");
  expect(metadata.output.reportFields).toContain("beforeAfterHypotheses");
  expect(metadata.output.reportFields).toContain("screenEvidence");
  expect(metadata.output.reportFields).toContain("artifacts");
  expect(metadata.output.beforeAfterHypothesisFields).toContain("improvedSignal");
  expect(metadata.output.screenEvidenceFields).toContain("imageDataUrl");
  expect(metadata.output.screenEvidenceFields).toContain("annotations");
  expect(metadata.output.screenEvidenceAnnotationFields).toContain("importance");
  expect(metadata.output.generatedAgentFields).toContain("sourceDiet");
  expect(metadata.output.generatedAgentFields).toContain("personalityFacets");
  expect(metadata.output.generatedAgentFields).toContain("blindSpots");
  expect(metadata.output.generatedAgentFields).toContain("customerRelationship");
  expect(metadata.output.generatedAgentFields).toContain("privateExclusive");
  expect(metadata.output.generatedAgentFields).toContain("dayPlan");
  expect(metadata.output.personaFields).toContain("sourceDiet");
  expect(metadata.output.personaFields).toContain("personalityFacets");
  expect(metadata.output.personaFields).toContain("blindSpots");
  expect(metadata.output.personaFields).toContain("customerRelationship");
  expect(metadata.output.personaFields).toContain("customerOwned");
  expect(metadata.output.reactionFields).toContain("stance");
  expect(metadata.output.reactionFields).toContain("responseReason");
  expect(metadata.output.reactionFields).toContain("responseReasonDetail");
  expect(metadata.output.reactionStanceValues).toContain("improved_since_prior");
  expect(metadata.output.reactionResponseReasonValues).toContain("self_memory");
  expect(metadata.output.reactionResponseReasonValues).toContain("same_run_reply");
  expect(metadata.output.reactionResponseReasonValues).toContain("facet_contrast");
  expect(metadata.output.artifactFields).toContain("href");
  expect(metadata.output.artifactKinds).toContain("implementation_queue");
  expect(metadata.output.artifactPersistence).toContain("report_artifacts");
  expect(metadata.output.recommendationWorkItemFields).toContain("acceptanceCriteria");
  expect(metadata.output.visibleReportActions).toContain("copy one recommendation as a fix handoff");
  expect(metadata.output.visibleReportActions).toContain("copy the full implementation plan with agent judgment context");
  expect(metadata.output.visibleReportActions).toContain("download the implementation plan as markdown");
  expect(metadata.output.reportFields).toContain("disagreement");
  expect(metadata.automation.selfAudit.localStorageSeeding.cliFlags).toContain("--local-storage-file");
  expect(metadata.automation.selfAudit.localStorageSeeding.fixture).toBe("docs/self-audits/fixtures/saved-agent-local-storage.json");
  expect(metadata.automation.selfAudit.exampleCommands[0]).toContain("--local-storage-file");
  expect(metadata.automation.selfAudit.exampleCommands[1]).toContain("--local-storage-json");
  expect(metadata.automation.selfAudit.localStorageSeeding.valueContract).toContain("already-serialized strings");
  expect(metadata.automation.selfAudit.localStorageSeeding.exampleLocalStorageJson["snoopy.savedAgents"]).toContain("Brand Guardian");
  expect(metadata.deployment.docs).toBe("docs/deployment.md");
  expect(metadata.deployment.requiredProductionEnv).toContain("SNOOPY_DEFAULT_WORKSPACE_ID");
  expect(metadata.deployment.optionalIntegrationEnv).toContain("GEMMA_OPENAI_BASE_URL");
  expect(metadata.deployment.optionalIntegrationEnv).toContain("GEMMA_OPENAI_API_KEY");
  expect(metadata.deployment.optionalIntegrationEnv).toContain("OPENAI_API_KEY");
  expect(metadata.deployment.boundaries.join(" ")).toContain("GEMMA_OPENAI_API_KEY");
  expect(metadata.deployment.commands.smoke).toContain("PLAYWRIGHT_BASE_URL");
});

test("agent generator API returns a usable structured profile without LLM credentials", async ({ request }) => {
  const response = await request.post("/api/agents/generate", {
    data: {
      customerName: "Acme Growth",
      tone: "visual",
      brief: "Create a customer-owned competitor watcher called Mira who reads SaaS homepages and remembers whether the visual proof is improving.",
      customerOwned: true,
      mode: "deterministic",
    },
  });

  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  expect(payload.agent.name).toBe("Mira");
  expect(payload.agent.customerOwned).toBe(true);
  expect(payload.agent.backstory).toContain("Acme Growth");
  expect(payload.agent.tastes.length).toBeGreaterThanOrEqual(3);
  expect(payload.agent.blindSpots.length).toBeGreaterThanOrEqual(2);
  expect(payload.agent.memories.length).toBeGreaterThanOrEqual(2);
  expect(payload.agent.personalityFacets.intuition).toBeGreaterThan(0.6);
  expect(payload.agent.personalityFacets.feeling).toBeGreaterThan(0.6);
  expect(payload.agent.customerRelationship).toContain("Acme Growth");
  expect(payload.agent.privateExclusive).toBe(true);
  expect(payload.agent.sourceDiet).toContain("Prior Snoopy reports");
  expect(payload.agent.dayPlan.length).toBeGreaterThanOrEqual(2);
});
