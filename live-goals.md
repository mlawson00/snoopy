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

The default cast should include at least six visible agents. One required default agent must represent a visually impaired or low-vision user. That agent should reliably notice contrast, small type, visual hierarchy failures, keyboard/screen-reader friction, ambiguous icons, hard-to-see focus states, and screenshots that are simply hard to read.

Do not hard-code the product story around exactly six agents. Six is the minimum default cast needed right now. The product should be able to support dozens or hundreds of agents when the user pays for larger panels, specialist panels, recurring watchers, or customer-owned characters.

## Personality Facets And Coverage

Agents should not differ only by name and tone. Each agent should carry weighted personality facets covering introversion/extraversion, sensing/intuition, thinking/feeling, and judging/perceiving. The product should use these weights to keep panels diverse, make disagreements easier to understand, and detect when the cast has collapsed into one generic reviewer.

Users should be able to inspect and tune these facets for customer-owned agents. Future run setup and report surfaces should show aggregate panel coverage so the customer can see why adding a specialist agent changes the critique.

Facet coverage should be weighted, visible, and useful. A panel that technically has several agents but is emotionally, visually, or analytically homogeneous has failed. The system should call that out, recommend missing perspectives, and let the user generate or add agents that repair the gap.

Include a "Mike the Creator" persona as a customer-style exemplar: direct, impatient with boring UI, allergic to empty marketing, focused on commercial usefulness, and willing to say when something is hard to see, hard to read, or not worth paying for. Treat this as one strong taste profile, not a license to make every agent aggressive.

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

When OpenAI credentials are present, use the LLM. When credentials are missing, provide a deterministic fallback that still generates a usable agent so the website works during development and demos.

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

Agents must be able to read prior outputs, including what other agents said in earlier cycles. If every agent keeps finding the same issues with the same wording and no meaningful response to prior commentary, the simulation has collapsed. The product should detect and expose that collapse as a quality problem.

Conversation should be shown as first-person speech or thought bubbles where practical. The fun is seeing different people-like agents react, challenge, soften, double down, or change their mind. Avoid turning the most novel part into a table of generic recommendations.

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

Agents should not be polite to the point of uselessness. If a screenshot is visually weak, boring, cramped, low contrast, confusing, or hard to read, an agent should say so directly and explain what would make it better.

Direct does not mean violent, abusive, or performatively hostile. The goal is believable critique with taste, not a cast of caricatures shouting insults.

Each agent should have its own ratio of praise, suspicion, patience, commercial hunger, visual sensitivity, accessibility awareness, and tolerance for risk. Constructive disagreement is more valuable than consensus because it lets the user see tradeoffs.

## Core Product Flow

The primary customer flow should be simple: enter a URL, run the agents, see the result. Avoid asking the user to pick a website type before the product has delivered value. Use strong defaults that can be changed later.

Use fewer forms and more defaults. Forms are for customization after the user has seen why customization matters.

The run output should show the useful product, not explain the idea. Lead with what the agents saw, what they argued about, what changed from previous runs, and what the site should become next.

## Product Shape Check

Before implementing any improvement, future agents must decide whether the issue is a local defect inside the current UI or a deeper product-shape problem. If the problem is flow, density, repeated sections, excitement, comprehension, or the product feeling like a long report, do not keep adding panels to the same page.

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

## Show, Do Not Tell

Snoopy should demonstrate improvement visually. Reports should make before/after thinking obvious:

- What the site looks like now
- What specific agents noticed on the current screen
- What a better version would change
- How previous recommendations changed the next version
- Which issues disappeared, persisted, or got worse
- Screenshots, annotations, reaction bubbles, and concrete deltas before abstract explanation

Use metaphorical fireworks in the product experience: visible agent activity, strong visual comparison, surprising but useful reactions, and clear transformation from current state to better state. Keep technical explanation in docs where agent readers can consume it.

## Audience And Copy

The buyer is often non-technical, distracted, and motivated by money. The website should not require the buyer to understand evaluation frameworks, local hosting, implementation details, or agent infrastructure before seeing value.

Customer-facing copy should be direct, visual, and concrete. Prefer "Your checkout looks unfinished on mobile" over "multi-agent UX evaluation surfaced conversion concerns." Save technical detail for documentation, API pages, and agent-readable metadata.

The website should be useful before it is persuasive. Less CTA noise, more product evidence. Wrap pricing and sales material around the working experience after the value is obvious.

## Design System Direction

The product should use the provided commerce template direction where applicable and should lean on Tailwind and Catalyst-style components instead of drifting into unrelated bespoke UI.

For admin-like product surfaces, prefer the dashboard, board, table, tab, sidebar, and panel patterns implied by Catalyst and the provided template. Do not invent a bespoke long-form report page when the product needs a scannable analysis workspace.

The design should feel like a polished commercial product, not a local developer dashboard. Strong visual hierarchy, legible type, accessible contrast, memorable agent cards, useful report pages, and clean mobile behavior matter more than additional marketing sections.

If an agent would say a UI "looks bad" or "is boring," the product should be able to show the screenshot and the reason, then turn that into a concrete improvement.

## Production Stance

Local mode is not an acceptable customer-facing product promise. It can exist as an internal development fallback, but the site should not sell or foreground local hosting as the path to value.

Production credential boundaries, hosted deployment, persistence, and paid capability tiers should be treated as real product constraints. Missing credentials should block production-only features cleanly rather than being presented as a virtue.

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
