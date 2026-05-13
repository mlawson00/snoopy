import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Database, FileText, KeyRound, ShieldCheck, TriangleAlert, UserRoundCheck } from "lucide-react";
import { Badge, Heading, Section } from "@snoopy/ui";

const boundaryCards = [
  {
    icon: KeyRound,
    title: "Credentials",
    now: "Server env vars only.",
    production: "Deployer owns rotation, access, and secret storage.",
  },
  {
    icon: UserRoundCheck,
    title: "Customer agents",
    now: "Browser-saved demo profiles.",
    production: "Private workspace data with explicit persistence.",
  },
  {
    icon: Database,
    title: "Reports",
    now: "Demo runs stay usable without storage.",
    production: "Supabase-backed runs, reports, and handoff artifacts.",
  },
  {
    icon: ShieldCheck,
    title: "Audits",
    now: "Read-only page review.",
    production: "No purchases, submissions, or destructive browser actions.",
  },
];

const limits = [
  "Not a legal privacy policy, DPA, SOC 2 report, or security whitepaper.",
  "No approved public prices yet.",
  "PostHog MCP still needs OAuth login in Codex.",
];

export default function TrustPage() {
  return (
    <>
      <Section>
        <div className="overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="p-8">
              <Badge>Trust boundaries</Badge>
              <Heading as="h1" className="mt-4 max-w-3xl text-5xl">
                What Snoopy can touch, store, and hand off.
              </Heading>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-700">
                This is an operational boundary map, not a legal policy. It shows what works in the demo today and what a production deployer must own before real customer data enters the workspace.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/api/service-metadata" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-base font-semibold text-white hover:bg-slate-800">
                  Read metadata <FileText size={16} />
                </Link>
                <Link href="/integrations" className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-base font-semibold text-slate-950 hover:bg-amber-100">
                  Agent handoff <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            <div className="relative min-h-[420px] overflow-hidden bg-slate-950">
              <Image
                src="/snoopy-report-preview.png"
                alt="Snoopy report preview behind trust boundary labels"
                fill
                sizes="(min-width: 1024px) 54vw, 92vw"
                className="object-cover object-top opacity-72"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-b from-slate-950/15 via-slate-950/35 to-slate-950" />
              <div className="absolute inset-x-4 bottom-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  ["Browser", "Demo agents only"],
                  ["Server", "Secrets and model calls"],
                  ["Workspace", "Production persistence"],
                ].map(([label, copy]) => (
                  <div key={label} className="rounded-2xl bg-white/92 p-4 text-slate-950 shadow-sm backdrop-blur">
                    <div className="font-semibold uppercase tracking-wide text-emerald-700">{label}</div>
                    <div className="mt-2 text-lg font-black leading-6">{copy}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section className="pt-0">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {boundaryCards.map(({ icon: Icon, title, now, production }) => (
            <div key={title} className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <Icon className="text-amber-900" size={24} />
              <Heading as="h2" className="mt-4 text-xl">
                {title}
              </Heading>
              <div className="mt-4 grid grid-cols-1 gap-2">
                <BoundaryLine label="Now" value={now} />
                <BoundaryLine label="Production" value={production} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section className="pt-0">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-2xl border border-amber-200 bg-amber-100 p-5">
            <TriangleAlert className="text-amber-950" size={24} />
            <Heading as="h2" className="mt-4 text-2xl">
              Still owner-approved work
            </Heading>
            <div className="mt-4 grid grid-cols-1 gap-3">
              {limits.map((item) => (
                <div key={item} className="rounded-xl bg-white/72 p-4 text-base font-semibold leading-7 text-slate-900">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-slate-950 p-5 text-white shadow-sm">
            <Badge>Commercial handoff</Badge>
            <Heading as="h2" className="mt-3 text-3xl text-white">
              Link boundaries before asking for commitment.
            </Heading>
            <p className="mt-3 text-base leading-7 text-slate-200">
              Agents flagged trust as a product-wide blocker. This page gives every commercial surface one honest place to send skeptical buyers while pricing and legal policy remain explicit owner decisions.
            </p>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { href: "/agents", label: "Agents" },
                { href: "/settings/billing", label: "Pricing" },
                { href: "/integrations", label: "Handoff" },
              ].map(({ href, label }) => (
                <Link key={href} href={href} className="inline-flex items-center justify-between rounded-xl bg-white px-4 py-3 text-base font-semibold text-slate-950 hover:bg-amber-100">
                  {label} <ArrowRight size={16} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}

function BoundaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 rounded-xl bg-slate-50 p-3 text-base leading-6 text-slate-800">
      <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-700" size={17} />
      <div>
        <div className="font-semibold text-slate-950">{label}</div>
        <div>{value}</div>
      </div>
    </div>
  );
}
