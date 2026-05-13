import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BillingScopeBrief } from "@/components/billing-scope-brief";
import { VisualProofStage } from "@/components/visual-proof-stage";
import { getDefaultBillingStatus } from "@snoopy/billing";
import { Badge, Heading, Section } from "@snoopy/ui";

export default function BillingPage() {
  const billing = getDefaultBillingStatus();
  const billingReceipts = [
    { label: "Current workspace", value: billing.plan.charAt(0).toUpperCase() + billing.plan.slice(1), detail: "Demo workspace shows the package boundary before production storage is connected." },
    { label: "Run limit", value: String(billing.runLimit), detail: "Free workspace capacity before a scoped paid package." },
    { label: "Output", value: "Reports", detail: "Persisted reports, private customer agents, billing, and team access belong in paid workspaces." },
  ];

  return (
    <>
      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="order-2 rounded-[2rem] border border-black/10 bg-white/78 p-8 shadow-sm lg:order-1">
            <Badge>Billing</Badge>
            <Heading as="h1" className="mt-3 text-4xl sm:text-5xl">
              Pricing for website teardown work.
            </Heading>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">
              Start with one critique package: screen evidence, agent disagreement, before/after direction, and a fix queue your team can ship.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/runs/new" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                Run a teardown <ArrowRight size={16} />
              </Link>
              <Link href="/trust" className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-100">
                Trust boundaries <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          <VisualProofStage
            className="order-1 lg:order-2"
            eyebrow="Billing proof"
            title="The paid product is the report artifact."
            copy="Paid workspaces add persisted reports, billing, team access, private customer agents, and deployment support."
            imageAlt="Snoopy report preview used as billing proof for evidence, agent reactions, and fix handoff."
            receipts={billingReceipts}
          />
        </div>
      </section>

      <Section className="pt-0">
        <BillingScopeBrief />

        <div className="mt-6 rounded-[1.5rem] border border-black/10 bg-white/84 p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <Badge>Package boundary</Badge>
              <Heading as="h2" className="mt-3 text-2xl">
                Pilot proves the teardown. Production preserves the workspace.
              </Heading>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-black/10 bg-slate-50 p-4">
                <div className="text-lg font-semibold">Pilot</div>
                <p className="mt-2 text-sm leading-6 text-slate-700">Scoped teardown, core cast, saved custom agents, and before/after fixes.</p>
              </div>
              <div className="rounded-lg border border-black/10 bg-slate-50 p-4">
                <div className="text-lg font-semibold">Production</div>
                <p className="mt-2 text-sm leading-6 text-slate-700">Persisted runs, team access, billing, expanded agents, and deployment support.</p>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
