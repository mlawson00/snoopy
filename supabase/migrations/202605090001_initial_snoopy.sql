create extension if not exists "pgcrypto";

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null,
  role text not null check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table public.target_sites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  url text not null,
  created_at timestamptz not null default now()
);

create table public.personas (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  role text not null,
  backstory text not null,
  trust_threshold numeric(3,2) not null default 0.65,
  created_at timestamptz not null default now()
);

create table public.test_goals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  instructions text not null,
  created_at timestamptz not null default now()
);

create table public.runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  target_site_id uuid not null references public.target_sites(id) on delete cascade,
  persona_id uuid not null references public.personas(id) on delete restrict,
  test_goal_id uuid not null references public.test_goals(id) on delete restrict,
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'failed')),
  safe_mode boolean not null default true,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.browser_events (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.runs(id) on delete cascade,
  event_type text not null,
  url text not null,
  message text not null,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create table public.findings (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.runs(id) on delete cascade,
  category text not null check (category in ('confusion', 'dead_end', 'trust_issue', 'copy_problem', 'conversion_friction', 'accessibility', 'visual_design', 'agent_readiness', 'suggested_fix')),
  severity text not null check (severity in ('low', 'medium', 'high')),
  title text not null,
  evidence text not null,
  recommendation text not null,
  confidence numeric(3,2) not null check (confidence >= 0 and confidence <= 1),
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null unique references public.runs(id) on delete cascade,
  summary text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.report_artifacts (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  run_id uuid not null references public.runs(id) on delete cascade,
  artifact_key text not null,
  title text not null,
  kind text not null check (kind in ('implementation_queue')),
  format text not null check (format in ('markdown')),
  media_type text not null,
  href text not null,
  file_name text not null,
  description text not null,
  item_count integer not null default 0 check (item_count >= 0),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (report_id, artifact_key)
);

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.target_sites enable row level security;
alter table public.personas enable row level security;
alter table public.test_goals enable row level security;
alter table public.runs enable row level security;
alter table public.browser_events enable row level security;
alter table public.findings enable row level security;
alter table public.reports enable row level security;
alter table public.report_artifacts enable row level security;

create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_members.workspace_id = target_workspace_id
      and workspace_members.user_id = auth.uid()
  );
$$;

create policy "members can read workspaces"
  on public.workspaces for select
  using (public.is_workspace_member(id));

create policy "authenticated users can create workspaces"
  on public.workspaces for insert
  to authenticated
  with check (true);

create policy "members can read workspace memberships"
  on public.workspace_members for select
  using (public.is_workspace_member(workspace_id));

create policy "users can create their own membership"
  on public.workspace_members for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "members can read target sites"
  on public.target_sites for select
  using (public.is_workspace_member(workspace_id));

create policy "members can create target sites"
  on public.target_sites for insert
  to authenticated
  with check (public.is_workspace_member(workspace_id));

create policy "members can read personas"
  on public.personas for select
  using (public.is_workspace_member(workspace_id));

create policy "members can create personas"
  on public.personas for insert
  to authenticated
  with check (public.is_workspace_member(workspace_id));

create policy "members can read test goals"
  on public.test_goals for select
  using (public.is_workspace_member(workspace_id));

create policy "members can create test goals"
  on public.test_goals for insert
  to authenticated
  with check (public.is_workspace_member(workspace_id));

create policy "members can read runs"
  on public.runs for select
  using (public.is_workspace_member(workspace_id));

create policy "members can create runs"
  on public.runs for insert
  to authenticated
  with check (public.is_workspace_member(workspace_id));

create policy "members can update runs"
  on public.runs for update
  to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "members can read browser events"
  on public.browser_events for select
  using (exists (
    select 1 from public.runs
    where runs.id = browser_events.run_id
      and public.is_workspace_member(runs.workspace_id)
  ));

create policy "members can create browser events"
  on public.browser_events for insert
  to authenticated
  with check (exists (
    select 1 from public.runs
    where runs.id = browser_events.run_id
      and public.is_workspace_member(runs.workspace_id)
  ));

create policy "members can read findings"
  on public.findings for select
  using (exists (
    select 1 from public.runs
    where runs.id = findings.run_id
      and public.is_workspace_member(runs.workspace_id)
  ));

create policy "members can create findings"
  on public.findings for insert
  to authenticated
  with check (exists (
    select 1 from public.runs
    where runs.id = findings.run_id
      and public.is_workspace_member(runs.workspace_id)
  ));

create policy "members can read reports"
  on public.reports for select
  using (exists (
    select 1 from public.runs
    where runs.id = reports.run_id
      and public.is_workspace_member(runs.workspace_id)
  ));

create policy "members can create reports"
  on public.reports for insert
  to authenticated
  with check (exists (
    select 1 from public.runs
    where runs.id = reports.run_id
      and public.is_workspace_member(runs.workspace_id)
  ));

create policy "members can read report artifacts"
  on public.report_artifacts for select
  using (exists (
    select 1 from public.runs
    where runs.id = report_artifacts.run_id
      and public.is_workspace_member(runs.workspace_id)
  ));

create policy "members can create report artifacts"
  on public.report_artifacts for insert
  to authenticated
  with check (exists (
    select 1 from public.runs
    where runs.id = report_artifacts.run_id
      and public.is_workspace_member(runs.workspace_id)
  ));
