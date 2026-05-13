# Snoopy Architecture

Snoopy follows the same broad shape as `/workspace/commerce-template`: a pnpm/Turbo monorepo with a Next.js App Router frontend and shared packages for domain boundaries. The template remains a read-only architecture reference.

## Packages

- `apps/web`: marketing, auth shell, dashboard, run setup, report detail, settings, and API routes.
- `packages/config`: typed public/server environment loading.
- `packages/ui`: reusable UI primitives used by the app.
- `packages/auth`: Supabase auth client/session helpers.
- `packages/db`: database-facing types and helpers.
- `packages/billing`: Stripe billing shell types.
- `packages/content`: fallback marketing content, with room for Payload-backed content.
- `packages/runner`: safe-mode browser audit input validation and execution contract.
- `packages/reports`: finding categories and report normalization.

## Data Model

The first Supabase migration creates workspace membership plus Snoopy domain tables for target sites, personas, test goals, runs, browser events, findings, and reports. Core run data stays in Supabase; Payload is reserved for operator-editable public content.

## MVP Runner

The current runner validates a target URL, persona, and goal, launches Playwright in safe mode, samples same-origin public pages, blocks form submissions and non-read HTTP requests, records structured browser events, and generates categorized report findings.

Recursive self-audits use the same runner and can seed browser `localStorage` before capture. This is used to test browser-persisted product states, such as saved customer-owned agents, without treating the empty first-visit state as the only product path. `/api/service-metadata` exposes the self-audit command, fixture path, accepted `--local-storage-file` / `--local-storage-json` flags, and a complete example state object for agent automation.

## Report Output Contract

Reports expose first-person `reactions` with persona, device, emotion, thought, evidence, critique axis, and optional stance metadata. Stance values are `independent`, `supports_prior`, `extends_prior`, `contradicts_prior`, and `improved_since_prior`; `respondsToPersonaId` links a reaction back to the prior critic it is supporting, extending, pushing back on, or showing improvement against. `/api/service-metadata` lists these fields and stance values for agent consumers.
