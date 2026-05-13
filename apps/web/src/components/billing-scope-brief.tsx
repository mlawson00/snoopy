"use client";

import Link from "next/link";
import { ArrowRight, ClipboardCheck, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { Heading } from "@snoopy/ui";
import { captureClientEvent } from "@/lib/client-analytics";

const routeOptions = [
  { id: "three-route", label: "3-route pilot", detail: "Homepage, pricing, and one proof page.", routeCount: 3 },
  { id: "six-route", label: "6-route launch", detail: "Core funnel plus report handoff.", routeCount: 6 },
  { id: "workspace", label: "Workspace program", detail: "Recurring audits for a live team.", routeCount: 12 },
] as const;

const agentOptions = [
  { id: "core", label: "Core cast", detail: "Default persistent panel." },
  { id: "specialist", label: "Specialists", detail: "Adds focused reviewers." },
  { id: "owned", label: "Customer-owned", detail: "Private agents with memory." },
] as const;

const handoffOptions = [
  { id: "report", label: "Report", detail: "Findings and evidence." },
  { id: "queue", label: "Fix queue", detail: "Prioritized implementation tasks." },
  { id: "deploy", label: "Deploy support", detail: "Validation and release notes." },
] as const;

const packageByRouteCount = {
  3: "Pilot scope",
  6: "Launch scope",
  12: "Production scope",
} as const;

export function BillingScopeBrief() {
  const [routeId, setRouteId] = useState<(typeof routeOptions)[number]["id"]>("three-route");
  const [agentId, setAgentId] = useState<(typeof agentOptions)[number]["id"]>("core");
  const [handoffId, setHandoffId] = useState<(typeof handoffOptions)[number]["id"]>("queue");

  const selectedRoute = routeOptions.find((option) => option.id === routeId) ?? routeOptions[0];
  const selectedAgent = agentOptions.find((option) => option.id === agentId) ?? agentOptions[0];
  const selectedHandoff = handoffOptions.find((option) => option.id === handoffId) ?? handoffOptions[1];

  const packageLabel = packageByRouteCount[selectedRoute.routeCount as keyof typeof packageByRouteCount];
  const brief = useMemo(
    () => ({
      packageLabel,
      routeLabel: selectedRoute.label,
      agentLabel: selectedAgent.label,
      handoffLabel: selectedHandoff.label,
      summary: `${packageLabel}: ${selectedRoute.label.toLowerCase()}, ${selectedAgent.label.toLowerCase()}, ${selectedHandoff.label.toLowerCase()}.`,
    }),
    [packageLabel, selectedAgent.label, selectedHandoff.label, selectedRoute.label],
  );

  function selectOption(kind: "routes" | "agents" | "handoff", value: string) {
    if (kind === "routes") setRouteId(value as typeof routeId);
    if (kind === "agents") setAgentId(value as typeof agentId);
    if (kind === "handoff") setHandoffId(value as typeof handoffId);
    captureClientEvent("snoopy_billing_scope_changed", {
      kind,
      value,
      route_count: selectedRoute.routeCount,
      agent_scope: kind === "agents" ? value : agentId,
      handoff_scope: kind === "handoff" ? value : handoffId,
    });
  }

  function captureStart() {
    captureClientEvent("snoopy_billing_scope_started", {
      package_label: brief.packageLabel,
      route_scope: routeId,
      route_count: selectedRoute.routeCount,
      agent_scope: agentId,
      handoff_scope: handoffId,
    });
  }

  return (
    <section className="rounded-[1.5rem] border border-black/10 bg-slate-950 p-5 text-white shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 font-mono text-sm font-semibold uppercase tracking-wide text-amber-200">
            <SlidersHorizontal size={16} /> Scope brief
          </div>
          <Heading as="h2" className="mt-3 max-w-2xl text-2xl text-white sm:text-3xl">
            Turn the quote into a concrete first work packet.
          </Heading>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            Public dollar prices are still owner-approved work. The buying step Snoopy can show today is the exact scope, output, and evidence package a team receives before committing.
          </p>
        </div>
        <div className="rounded-xl bg-white/10 p-4 lg:w-80">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-300">
            <ClipboardCheck size={16} /> Selected package
          </div>
          <div className="mt-2 text-2xl font-semibold">{brief.packageLabel}</div>
          <p className="mt-2 text-sm leading-6 text-slate-200">{brief.summary}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <OptionGroup title="Routes" options={routeOptions} value={routeId} onChange={(value) => selectOption("routes", value)} />
        <OptionGroup title="Agents" options={agentOptions} value={agentId} onChange={(value) => selectOption("agents", value)} />
        <OptionGroup title="Handoff" options={handoffOptions} value={handoffId} onChange={(value) => selectOption("handoff", value)} />
      </div>

      <div className="mt-5 flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-300">Next commercial action</div>
          <p className="mt-1 text-sm leading-6 text-slate-200">Start a run using this scope, then use the report as the pricing proof packet.</p>
        </div>
        <Link
          href="/runs/new"
          onClick={captureStart}
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Start scoped teardown <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}

function OptionGroup({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: readonly { id: string; label: string; detail: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  const selectedOption = options.find((option) => option.id === value) ?? options[0]!;

  return (
    <fieldset className="rounded-xl bg-white/10 p-4">
      <label className="block text-sm font-semibold uppercase tracking-wide text-slate-300" htmlFor={`billing-${title.toLowerCase()}`}>
        {title}
      </label>
      <select
        id={`billing-${title.toLowerCase()}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-white px-3 text-sm font-semibold text-slate-950 shadow-sm outline-none focus:border-amber-200 focus:ring-2 focus:ring-amber-200/30"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <p className="mt-2 min-h-10 text-sm leading-5 text-slate-300">{selectedOption.detail}</p>
    </fieldset>
  );
}
