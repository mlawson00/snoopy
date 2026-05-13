import { RunSetupForm } from "@/components/run-setup-form";
import { Badge, Heading, Section } from "@snoopy/ui";

export default function NewRunPage() {
  return (
    <Section>
      <div className="grid grid-cols-1 items-end gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <Badge>Teardown</Badge>
          <Heading as="h1" className="mt-3 text-5xl">
            Website teardown agents for the next fix.
          </Heading>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-700">
            Paste a public page. Snoopy turns the core cast's disagreement into screen evidence, priority fixes, and an implementation queue a team can hand off.
          </p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-black/10 bg-slate-950 p-3 text-white shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[0.76fr_1fr]">
            <div className="rounded-xl bg-white p-2">
              <img
                src="/snoopy-report-preview.png"
                alt="Snoopy report preview with screen evidence, agent reactions, and recommendations."
                className="aspect-[4/3] w-full rounded-lg border border-black/10 object-cover object-top"
              />
            </div>
            <div className="flex flex-col justify-between gap-3 p-2">
              <div>
                <div className="font-mono text-sm font-semibold uppercase tracking-wide text-amber-200">What comes back</div>
                <div className="mt-2 text-2xl font-semibold leading-tight">Screen evidence, critic disagreement, and the first fix.</div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-sm font-semibold">
                <div className="rounded-lg bg-white/10 p-2">7 critics</div>
                <div className="rounded-lg bg-white/10 p-2">4 devices</div>
                <div className="rounded-lg bg-amber-200 p-2 text-slate-950">1 queue</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8">
        <RunSetupForm />
      </div>
    </Section>
  );
}
