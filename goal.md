Recursively use Snoopy on Snoopy to improve Snoopy into a commercially valuable, deployment-ready product that marketers can understand and want to use.

Keep making scoped progress without waiting for prompts. After each checkpoint, choose the next concrete recursive cycle action and continue unless blocked by a stop condition below. There is no fixed final cycle count: each cycle should leave Snoopy more useful, more vivid, more critical, more polished, easier to deploy, and easier for a non-technical buyer to understand than it was at the start.

Keep /workspace/commerce-template read-only and unmodified.

## Mission

Use Snoopy's own evaluations as reusable product data for Snoopy's improvement. Each cycle should run Snoopy against its own app, convert the resulting agent reactions into prioritized product work, implement the highest-leverage improvements, validate them, and feed the evidence into the next cycle.

The core product is not setup plumbing. The core product is a memorable multi-agent website critique system that helps marketers, founders, and product teams see what is hurting a site, why different real-seeming people react differently, what competitors or current examples do better, and what the site should become next.

The long-term product goal is a Snoopy service that is commercially valuable with minimal deployment effort: clear positioning, useful reports, credible agent simulation, visible disagreement between human-like evaluators, concrete before/after website improvement ideas, strong visual and readability critique, production-ready workspace behavior, useful APIs and docs for agents, and enough validation for a future deployer to move confidently.

Do not offer local mode as a product path. Missing credentials may exist as development plumbing, but customer-facing product surfaces should focus on real runs, reports, production workspaces, and deployable value.

## Persona Standard

The evaluator cast is Snoopy's most important differentiator. It must be exceptional.

- Run at least six default personas on each meaningful evaluation.
- Include a visually impaired persona who is explicitly sensitive to contrast, text size, focus order, low-vision scanning, unclear labels, and anything hard to see or read.
- Give the cast full weighted coverage across personality facets: introversion/extraversion, sensing/intuition, thinking/feeling, and judging/perceiving.
- Make personas close to real people: specific roles, constraints, memories, tastes, frustrations, buying habits, device habits, and tolerance thresholds.
- Let personas read prior-cycle outputs and other personas' prior reactions before judging the current site.
- Treat unanimous agreement as a signal to inspect. If everyone agrees because the site is plainly bad or excellent, say so and show evidence. If everyone agrees with the same wording or evidence, flag consensus collapse.
- Encourage useful disagreement, not theatrical disagreement. Personas may hate or like the same page by different amounts and for different reasons.
- Allow bounded mild or moderate profanity when it sounds like the simulated person and helps candid product critique. Critique the product experience, not people.
- Make each agent's thought visible in the run output so users can enjoy and learn from the interaction.
- Let users create additional agents and test those custom agents as part of the product experience.

## Cycle Loop

Every cycle is a concrete unit of work with inputs, outputs, implementation, validation, and feed-forward data.

1. Evaluate: run Snoopy against Snoopy's own app and key routes. Capture route coverage, agents, personality-facet coverage, device contexts, report outputs, recommendations, reactions, disagreement stances, comparison sources, traces, screenshots when available, PostHog signals when available, and any runner or setup friction.
2. Record: save a human-readable cycle writeup and structured data capturing findings, recommendations, route coverage, agent reactions, consensus/collapse signals, PostHog analytics signals, validation results, quality deltas, unresolved issues, and deployment notes.
3. Shape-check: before selecting implementation work, decide whether the finding is a small defect inside the current UI or a deeper product-shape problem. If the issue concerns flow, density, repeated sections, excitement, comprehension, or a page feeling like a long report, stop adding panels and evaluate a dashboard, board, tabbed workspace, split view, or task-focused tool shape instead.
4. Prioritize: select the highest-leverage improvements that compound product quality. Prefer changes that improve usefulness, marketer comprehension, agent believability, visual critique, report value, deployability, or validation confidence over isolated cosmetic changes.
5. Architecture before accretion: if two consecutive cycles have added major sections to the same page, the next cycle must evaluate information architecture before adding more UI to that page.
6. Implement: make focused changes that address the selected findings. Keep changes scoped, avoid destructive actions, and respect production credential boundaries.
7. Validate: run the required validation gates when code or product behavior changes. Record command results, failures, fixes, and any validation that could not be completed.
8. Summarize: write a checkpoint summary describing what changed, why it matters, evidence from Snoopy's output, relevant PostHog patterns, quality deltas, validation status, and remaining risks. Include a global improvement review that asks whether repeated analytics, agent behavior, or user interaction patterns suggest product-wide changes beyond the current route or UI.
9. Feed forward: update the recommendation backlog and next-cycle hypotheses so the Codex/engineering agent running the next cycle can read prior outputs, PostHog-derived hypotheses, model-behavior notes, challenge or extend them, and continue from evidence instead of restarting from intuition. The Gemma website-evaluator agents provide critique data; they are not responsible for global product strategy.

## Product Shape Check

Before implementing any cycle improvement, future Codex/engineering agents must answer this question in the cycle writeup or working notes:

> Am I improving the right product shape, or only decorating the current implementation?

If the honest answer is "decorating," prioritize restructuring the product surface before adding more local UI. Do not keep stacking sections onto an already dense page when the critique is really about flow, density, scannability, product excitement, or comprehension.

The report detail surface should be treated as an analysis workspace, not a long document. The default direction for report work is a Catalyst-style dashboard/admin board using the provided commerce-template direction where applicable:

- Overview board: strongest agent read, customer-owned contribution, current screen, better screen, and first fix to ship
- Agents board: persistent cast cards, first-person reactions, memories, stances, disagreements, and customer-owned agents
- Screens board: screenshots, pinned reads, hard-to-see/read notes, before/after visual evidence, and accessibility concerns
- Fixes board: recommendation cards, filters, implementation queue, affected regions, and acceptance checks
- Sources board: competitor sites, market/news context, prior-cycle outputs, and which agents used them
- Export/handoff board: markdown plan, API links, service metadata, validation status, and agent-readable artifacts

Do not add another major report section until checking whether that work belongs in one of these boards, a tab, or a separate focused panel. If the product starts feeling like a scrollable report instead of a working analysis room, fixing the workspace shape outranks adding more content.

## Self-Audit Targets

Each cycle should cover as many of these Snoopy surfaces as practical, and explicitly record any gaps in coverage:

- Homepage and first impression for a marketer or founder
- Run setup and target submission flow
- Dashboard and run history
- Report workspace shape, including whether report detail is behaving like a Catalyst-style dashboard/board system or regressing into one long page
- Report detail, recommendations, evidence, traces, reactions, disagreement, consensus signals, screenshots, and agent output
- Billing, pricing, plan, settings, and commercial surfaces when present
- Auth and production workspace behavior
- Service metadata, API routes, machine-readable discovery, and agent-oriented usage paths
- Documentation for technical setup, deployment, and agent use

## Improvement Areas

Use Snoopy findings to compound improvement across these areas:

- Product usefulness: show what users can do with Snoopy to improve a website, not just how the system is wired
- Marketer clarity: reduce techno-speak on product pages and save implementation detail for docs likely read by agents or technical operators
- UX flow: clearer user journeys, fewer dead ends, better task completion, and more obvious next actions
- Information architecture: prefer scannable dashboards, boards, tabs, and task-specific panels over long stacked pages when the user needs to compare, inspect, filter, or act
- Visual polish: professional layout, hierarchy, spacing, responsive behavior, readability, contrast, and product-specific visual identity
- Before/after value: show what a site looks like now, what Snoopy thinks is broken, and what it could look like after fixes
- Report usefulness: concrete recommendations, strong evidence, route coverage, severity, priority, and actionable next steps
- Agent simulation quality: believable human-like agents, full personality-facet coverage, device-aware behavior, realistic skepticism, useful disagreement, readable prior-output memory, comparison/news context, candid voice, blunt visual critique when warranted, and clear evidence trails
- Agent usability: discoverable service metadata, predictable APIs, structured outputs, and automation-friendly docs
- Commercial readiness: clear positioning, plan signals, credibility, support paths, production workspace readiness, and confidence signals
- Accessibility: semantic structure, keyboard paths, readable contrast, labels, focus states, and reduced ambiguity
- Performance: fast workflows, efficient report rendering, stable builds, and measured regressions where possible
- Deployability: minimal setup friction, documented env vars, clear production credential boundaries, smokeable deployments, and migration notes

## Cycle Artifacts

Every cycle must leave durable artifacts that future Codex/engineering agents can inspect and reuse. Prefer existing project locations and naming conventions; create a clear location if none exists.

- Human-readable cycle writeup with summary, findings, selected improvements, validation, quality deltas, risks, and next steps
- A product-shape answer: whether the cycle improved the right product shape or merely decorated the current implementation, plus any decision to keep, split, or restructure the current surface
- Structured JSON or equivalent machine-readable data for findings, recommendations, agents, reactions, stances, consensus/collapse risk, route coverage, traces, screenshots when available, comparison sources, metrics, validation results, unresolved issues, and deployment notes
- Each agent's visible thoughts, criticism level, stance, evidence, and disagreement relationship to other agents
- PostHog observability summary when analytics are available, including model-call behavior, agent interaction metrics, fallbacks, latency/error patterns, user interaction friction, and global improvement hypotheses
- Before/after hypotheses showing what the current website communicates and what the improved version should communicate
- Recommendation backlog with status, priority, evidence, expected impact, and whether each item was selected, deferred, or blocked
- Validation log with commands run, pass/fail status, relevant output summaries, fixes applied, and skipped gates with reasons
- Next-cycle hypotheses describing what Snoopy should evaluate next and why those checks are likely to improve commercial or deployment readiness

## Validation Gates

Before marking a cycle complete after code, behavior, dependency, documentation that affects setup, or deployment changes, run and record:

- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm lint`
- `corepack pnpm build`
- `corepack pnpm e2e:smoke`

If a gate fails, fix it when the fix is responsibly inferable. If a failure requires a product decision, credentials, destructive action, or external service access that is unavailable, record the blocker and stop under the conditions below.

For a cycle that only updates this goal or other non-behavioral planning text, code validation is optional, but the cycle record must still make clear what changed and why.

If PostHog credentials are unavailable, record that observability was skipped and continue only with the local artifacts available. If local Gemma is unavailable, record model unavailability and use deterministic fallback only for development continuity.

## Commercial Readiness

Snoopy should become easier to understand, buy, use, automate, trust, and deploy after every cycle. Future Codex/engineering agents should prefer improvements that reduce adoption friction and increase confidence:

- Clear service positioning for marketers, founders, product teams, and agents
- Concrete examples of how Snoopy improves a website through critique, disagreement, comparison, and before/after recommendations
- Clear run/report API contracts and machine-readable service metadata for technical docs and agent use
- Production workspace readiness without presenting local mode as a customer offer
- Documentation for setup, operation, validation, deployment, and troubleshooting
- Confidence signals such as test coverage, smoke flows, credible examples, traceable recommendations, and deployment notes
- Minimal deployment friction, with environment requirements, build commands, runtime assumptions, and known limitations documented

## Stop Conditions

Future Codex/engineering agents should keep cycling and improving until stopped by one of these conditions:

- The user explicitly stops, redirects, or changes the product direction
- Production credentials are required and unavailable
- A destructive action, irreversible migration, purchase, submission, or external side effect is required
- Validation cannot be completed or fixed without a product decision
- A material product decision cannot be responsibly inferred from existing evidence

When stopping, record the exact blocker, the evidence gathered, the safest next action, and the state of validation so the next agent can resume cleanly.

# Live Product Goals: Snoopy Agent System

This file captures the current product direction that is not yet fully represented in `goal.md` or the working site. Treat it as the live alignment brief until the user redirects or replaces it.

## Core Concept

Snoopy is not selling "aggressive critics" or a premise. It is a working website-improvement product built around persistent, believable agents.

The interesting part is the agents themselves: distinct characters with memory, taste, history, voice, and evolving opinions. They should review websites like simulated people, respond to each other, form memories from prior runs, and produce useful improvement work.

Directness is allowed, but aggression is not the product. A good agent can praise, hesitate, disagree, support another agent, revise its view, or criticize sharply when evidence warrants it. The output should feel like different people thinking in public, not one angry voice copied several times.

## Working Product Requirement

Everything visible in the website should work. Do not build decorative claims that imply features are complete when they are only aspirational.

If a feature is shown in the product UI, it should do something real now, even if the first version is narrow:

- Agent generation should create a usable structured agent profile.
- Custom agents should be usable in a run.
- Agent profiles should expose backstory, tastes, voice, memories, source diet, and role.
- Generated agents should be storable at least in the current browser/session until production persistence is built.
- Reports should show what each agent thought, how they responded to other agents, and what changed as a result.
- Any limitation should be framed as an operational limitation, not a customer-facing product path.

## Agent Cast Model

The entry tier should include a persistent core cast, not disposable one-run prompts. The value of the core cast compounds because their tastes, memories, and prior judgments develop over time.

The core cast is a starting panel, not a ceiling. Avoid copy that makes the product sound limited to 5, 6, or 7 agents. It is fine to say "default cast" or "core cast" when referring to the included starting characters.

Higher tiers or paid add-ons should support more agents, specialist agents, and customer-owned agents.

## Customer-Owned Agents

Users should be able to create agents that are unique to their workspace. These agents should be customizable and persistent.

Customer-owned agents should support:

- Name
- Role
- Backstory
- Face or portrait
- Voice style
- Tastes
- Blind spots
- Memories
- Critique lenses
- Source diet
- Day plan or recurring activities
- Relationship to the customer's business
- Whether the agent is private/customer-exclusive

These agents are potentially something users pay for because they become richer and more useful over time.

## LLM-Powered Agent Generator

There should be an LLM-powered agent generator that helps users create these characters from a plain-language brief.

The generator should produce a structured profile, not just a name and description. It should create a believable person-like agent with:

- A clear point of view
- A backstory
- A voice
- Tastes and dislikes
- Memories or starting assumptions
- Source diet
- Day plan
- Critique lenses
- How they should interact with other agents
- How they should evaluate websites

When local Gemma credentials are present, use Gemma through the Vercel AI SDK. OpenAI credentials may remain a legacy or secondary development path, but they are not the primary target for Snoopy's internal agents. When model credentials or the local model are missing, provide a deterministic fallback that still generates a usable agent so the website works during development and demos.

## Local Gemma Agent Runtime

Local Gemma 4 is the intended model runtime for internal agent opinion formation, argument, revision, and customer-owned agent generation in the current development setup. The Vercel AI SDK is the intended integration layer for calling the local OpenAI-compatible Gemma server. This is a runtime choice for building and validating the product, not a customer-facing "local mode" offer.

Agents should use the model to form opinions from website evidence, prior reactions, other agents' positions, memories, source context, device context, and their own profile. The desired product behavior is not template text; it is believable agent judgment that can praise, hesitate, disagree, revise, support another agent, or sharply criticize when evidence warrants it.

Deterministic generation and deterministic reactions are development fallbacks only. They may keep local demos and validation moving when credentials or the local model are unavailable, but they should not be treated as the target product experience.

## PostHog Observability Requirement

Use PostHog broadly to monitor how agents and users behave during recursive Snoopy-on-Snoopy runs. Product analytics and session replay should make it easier to see where humans struggle to create agents, start runs, inspect reports, understand disagreement, and act on recommendations.

Track structured events for agent generation, run start and completion, route coverage, model calls, agent reactions, stance and disagreement patterns, consensus collapse, fallback usage, errors, latency, report usage, saved-agent usage, and validation outcomes.

Prefer stable event properties that support analysis across cycles: `run_id`, `cycle_id`, `persona_id`, `agent_type`, `route`, `device`, `model`, `generation_status`, `stance`, `critique_axis`, `emotion`, `fallback_reason`, `latency_ms`, `error_type`, and `validation_status`.

At the end of each goal cycle, the Codex/engineering agent running the cycle must evaluate PostHog signals alongside Snoopy's own report output. Look for global improvements that would make the whole product clearer, more useful, more observable, or more commercially ready, not only local fixes to the specific page under review. The Gemma-powered Snoopy agents should generate website-evaluation opinions and interaction data; they should not own the global product-improvement review.

## Agent Pages

Each important agent should have its own page or profile surface.

An agent page should show:

- Face or portrait
- Voice
- Backstory
- Tastes
- Memories
- Recent judgments
- Sites or sources they have read
- Other agents they often agree or disagree with
- How their opinion has changed over time
- Controls to customize them when the user owns the agent

The profile page should make the agent feel like a durable product asset, not a hidden prompt.

## Faces And Voices

Agents can have faces and voices. This should not be treated as fluff. Faces and voices make the agents legible, memorable, and commercially interesting.

Start with simple generated avatar cards or symbolic portraits if full media generation is not available. Later, support richer generated portraits and voice settings.

Voice does not mean "more profanity." Voice means a stable way of thinking and speaking: warm, skeptical, visual, exacting, commercial, cautious, direct, funny, patient, etc.

## Agent Activity

Paid agents can do things outside a single website run, if the customer pays for that level of work.

Examples:

- Read competitor websites
- Read news or market context
- Read books, docs, essays, or user-provided materials
- Revisit prior Snoopy reports
- Talk to other agents
- Watch a website over time
- Form and update memories
- Prepare for a future critique
- Compare the current site against references
- Track whether previous recommendations were implemented

Do not fake long-running background work. If this is not implemented yet, represent it as a roadmap or paid mode clearly separated from currently working actions.

## Agent Conversation

The report should show a real conversation structure, not isolated comments.

Agents should be able to:

- Agree with another agent and explain why
- Disagree with another agent and explain why
- Extend another agent's point
- Notice when consensus is useful
- Notice when consensus has collapsed into sameness
- Change opinion based on evidence or prior runs
- Remember what they said before
- Refer to what another agent said in a prior iteration

Disagreement should not be forced. If a website is terrible, many agents can dislike it. If it is excellent, many agents can like it. The difference should be in why, how much, and what each agent notices.

## Constructive Critique Standard

The agents should be critical enough to be useful, especially about UI, readability, visual quality, and hard-to-see elements. But the copy should not imply that negativity is the whole product.

Every critique should aim toward improvement:

- What works
- What does not work
- What is hard to see or understand
- Why this matters for a real user
- What a better version would do
- What work item should happen next

Profanity may be supported as a controlled voice setting, but it should be rare, character-specific, and never a substitute for useful judgment.

## Product Shape Check

Before implementing any improvement, future Codex/engineering agents must decide whether the issue is a local defect inside the current UI or a deeper product-shape problem. If the problem is flow, density, repeated sections, excitement, comprehension, or the product feeling like a long report, do not keep adding panels to the same page.

Every cycle should answer:

> Am I improving the right product shape, or only decorating the current implementation?

If the answer is "decorating," restructure the surface first.

For report detail, the default product shape should be a Catalyst-style dashboard or board workspace, not one long stacked document:

- Overview board: strongest read, customer-owned-agent impact, current screen, better screen, and first fix
- Agents board: cast, memories, speech bubbles, stances, disagreement, and customer-owned profiles
- Screens board: screenshots, annotations, readability issues, low-vision notes, and before/after visuals
- Fixes board: recommendations, filters, implementation queue, priorities, and acceptance checks
- Sources board: competitor pages, news/market context, prior-cycle outputs, and source usage by agent
- Export board: markdown handoff, API links, validation log, and deployment notes

Anti-accretion rule: if two consecutive cycles add major sections to the same page, the next cycle must evaluate information architecture before adding more UI. Fixing the workspace shape outranks adding more content when the page is becoming dense or boring.

## Commercial Shape

Snoopy should make money by making the agent system valuable:

- Lowest tier: persistent core cast with developing tastes and memory
- Paid/custom tier: customer-owned agents with profiles, voices, faces, and memories
- Higher tier: larger panels, specialist agents, source reading, recurring watches, and deeper cross-agent conversation

The website should show the working core product first. Pricing should be wrapped around the product after the user can see why the agents are valuable.

## Immediate Implementation Bias

When choosing next work, prefer these over more marketing polish:

- Make agent generation real and usable
- Persist generated agents locally or in workspace storage
- Let generated agents participate in runs
- Add agent profile pages
- Show memories and prior opinions in reports
- Show agent-to-agent responses clearly
- Add tests that prove visible agent features work
- Remove copy that frames the product as only a fixed number of agents
- Remove copy that frames the product as aggression instead of constructive conversation

## Stop And Research

If it is unclear how to implement believable persistent agents, spend time researching product patterns and technical approaches before inventing UI copy. The goal is a working product users could pay for, not a theatrical mockup.
