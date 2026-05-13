# Snoopy

Snoopy is a persona-led browser audit SaaS for testing public marketing and commerce flows. It is now structured as a pnpm/Turbo monorepo patterned after `/workspace/commerce-template`, with the template kept read-only as an architecture reference.

## Product App

```bash
corepack pnpm install
corepack pnpm dev
```

When running through the Codex Docker workbench, publish the app port with:

```bash
./codex-workbench.sh web
```

Then open:

```text
http://localhost:3100
```

Core validation commands:

```bash
corepack pnpm typecheck
corepack pnpm test
corepack pnpm lint
corepack pnpm build
corepack pnpm e2e:smoke
```

Recursive self-audits write JSON, markdown, backlog, validation, hypothesis, and screenshot artifacts under `docs/self-audits`:

```bash
corepack pnpm self-audit -- --base-url http://127.0.0.1:3100 --cycle cycle-055 --routes /agents,/runs/new --max-pages 1
```

To audit browser-persisted states, seed `localStorage` with a JSON object whose values are strings. The saved-agent fixture exercises the customer-owned-agent path from `/agents` into `/runs/new`:

```bash
corepack pnpm self-audit -- --base-url http://127.0.0.1:3100 --cycle cycle-saved-agent --routes /agents,/runs/new --local-storage-file docs/self-audits/fixtures/saved-agent-local-storage.json
```

For inline state, pass the same object shape to `--local-storage-json`; values must already be serialized strings because browsers store string values:

```bash
corepack pnpm self-audit -- --base-url http://127.0.0.1:3100 --cycle cycle-inline-state --routes /runs/new --local-storage-json '{"snoopy.savedAgents":"[]"}'
```

Summarize PostHog lifecycle events for a cycle after a run:

```bash
corepack pnpm posthog:cycle -- --cycle cycle-169-posthog-verification
```

This uses `POSTHOG_PERSONAL_API_KEY`, `POSTHOG_PROJECT_ID`, and optional `POSTHOG_API_HOST` from `.env.local`/`.env` to report run requests, starts, completions, persistence, failures, model calls, AI generations, agent generation, saved-agent interactions, run form activity, report filters, and implementation handoffs by `cycle_id`. Model-call output includes operation totals and a route/device/persona drilldown for finding slow or expensive evaluator paths.

Verify that browser-side Snoopy events can reach PostHog with a known cycle ID:

```bash
corepack pnpm posthog:browser -- --cycle cycle-browser-check
```

This starts the web app locally, generates and saves an agent, selects the saved agent in the run form, runs a fresh review, opens the generated report, copies the implementation plan, waits for browser `POST /capture/` requests, then polls PostHog for the expected browser and server lifecycle events with the same `cycle_id`.

To verify the same path with local Gemma model calls included, pass `--enable-gemma`. This requires `GEMMA_OPENAI_BASE_URL` and `GEMMA_OPENAI_API_KEY` to point at a reachable OpenAI-compatible Gemma server:

```bash
corepack pnpm posthog:browser -- --cycle cycle-browser-gemma --enable-gemma --timeout-ms 300000
```

The v1 app lives in `apps/web`. Shared boundaries live in `packages/*`, and the initial Supabase schema lives in `supabase/migrations/202605090001_initial_snoopy.sql`.

See `ARCHITECTURE.md` for the current package map and MVP data model. See `docs/deployment.md` for production environment variables, deployment commands, smoke checks, and credential boundaries.

## Production Deployment

Snoopy should be deployed as a hosted product with production persistence. Development fallbacks exist so validation and demos keep working, but they are not the customer product path.

Minimum production environment:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SNOOPY_DEFAULT_WORKSPACE_ID`

Optional paid-product integrations:

- `GEMMA_OPENAI_BASE_URL`, `GEMMA_OPENAI_API_KEY`, and `GEMMA_OPENAI_MODEL` for the current OpenAI-compatible Gemma runtime used by agent generation and internal evaluator reactions.
- `OPENAI_API_KEY` and `OPENAI_AGENT_GENERATOR_MODEL` as a legacy/secondary hosted generator path.
- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` for billing.

Production build/start:

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm build
corepack pnpm start
```

Run the smoke suite against the deployed app or a production build before customer use:

```bash
PLAYWRIGHT_BASE_URL=https://your-snoopy-host.example corepack pnpm e2e:smoke
```

## Codex Workbench

Codex runs inside a Docker
container with the repo mounted at `/workspace`.

The default container is intentionally useful for development while still
avoiding broad host access:

- mounted: this repo, Codex state volume, cache volume
- enabled by default: GPU access
- not mounted: host home directory, SSH keys, Docker socket
- not enabled: privileged mode or extra mount namespace control

## Start Codex

```bash
./codex-workbench.sh
```

The first run may ask for a Codex device code. After login, auth is stored in
the Docker volume `snoopy_codex_home`, so it should persist across normal runs.

You may need to log in again if you delete volumes, use a different Compose
project name, revoke auth, or run `docker compose down -v`.

## Start a Shell

```bash
./codex-workbench.sh shell
```

Run a one-off command inside the workbench:

```bash
./codex-workbench.sh shell -lc 'codex --version && nvidia-smi'
```

## Start OmniFocus Web Login Browser

This starts a temporary browser desktop exposed through noVNC so you can log in
yourself. The browser profile is stored in `.omnifocus-chrome-profile/`, which
is ignored by Git.

```bash
CODEX_WORKBENCH_BUILD=1 ./codex-workbench.sh omnifocus
```

Then open:

```text
http://localhost:6080/vnc.html?autoconnect=1&resize=remote
```

## Rebuild

The launcher builds the image if it is missing. Force a rebuild after changing
the Dockerfile:

```bash
CODEX_WORKBENCH_BUILD=1 ./codex-workbench.sh shell
```

## API Key Option

Device-code login is the normal interactive path. For a one-off API-key run:

```bash
OPENAI_API_KEY=... ./codex-workbench.sh
```

## Security Notes

The container is the security boundary. Codex runs inside the container with:

```bash
codex --sandbox danger-full-access
```

That gives Codex full access inside `/workspace`, not to the host filesystem.
Keep the Docker socket out of this setup unless you intentionally want to grant
near-host-root power. Treat `privileged: true`, `CAP_SYS_ADMIN`, and broad mount
namespace control the same way.
