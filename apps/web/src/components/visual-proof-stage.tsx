import Image from "next/image";
import { Sparkles } from "lucide-react";
import { Heading } from "@snoopy/ui";

type ProofReceipt = {
  label: string;
  value: string;
  detail: string;
};

type VisualProofStageProps = {
  eyebrow: string;
  title: string;
  copy: string;
  imageAlt: string;
  receipts: ProofReceipt[];
  className?: string;
};

export function VisualProofStage({ eyebrow, title, copy, imageAlt, receipts, className = "" }: VisualProofStageProps) {
  return (
    <div className={`rounded-[2rem] border border-black/10 bg-slate-950 p-4 text-white shadow-sm ${className}`}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.05fr_0.95fr]">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-white md:aspect-[16/10]">
          <Image src="/snoopy-report-preview.png" alt={imageAlt} fill sizes="(min-width: 768px) 45vw, 92vw" className="origin-top object-cover object-[50%_18%] scale-125" priority={false} />
          <div className="pointer-events-none absolute inset-3 rounded-xl border border-slate-200 bg-white/88 p-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-[0.62rem] font-bold uppercase tracking-wide text-emerald-700">Report</div>
                <div className="text-base font-black leading-none text-slate-950">Run findings</div>
              </div>
              <div className="rounded-full bg-amber-200 px-2 py-1 text-[0.62rem] font-bold uppercase tracking-wide text-slate-950">Fix queue</div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {["Screen", "Agents", "Fix"].map((label) => (
                <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                  <div className="h-2 w-10 rounded-full bg-teal-300" />
                  <div className="mt-2 text-[0.68rem] font-bold leading-none text-slate-950">{label}</div>
                  <div className="mt-2 h-7 rounded bg-white" />
                </div>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-[1fr_0.8fr] gap-2">
              <div className="rounded-lg bg-sky-50 p-2">
                <div className="h-16 rounded border border-sky-100 bg-white" />
              </div>
              <div className="space-y-1 rounded-lg border border-slate-200 bg-white p-2">
                <div className="h-2 w-16 rounded-full bg-slate-300" />
                <div className="h-2 w-12 rounded-full bg-slate-200" />
                <div className="h-2 w-14 rounded-full bg-slate-200" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-between gap-4 p-1">
          <div>
            <div className="flex items-center gap-2 font-mono text-sm font-semibold uppercase tracking-wide text-amber-200">
              <Sparkles size={16} /> {eyebrow}
            </div>
            <Heading as="h2" className="mt-2 text-2xl text-white">
              {title}
            </Heading>
            <p className="mt-3 text-sm leading-6 text-slate-300">{copy}</p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-1">
            {receipts.map((receipt) => (
              <div key={`${receipt.label}-${receipt.value}`} className="rounded-xl bg-white/10 p-3">
                <div className="text-sm font-semibold uppercase tracking-wide text-slate-300">{receipt.label}</div>
                <div className="mt-1 text-xl font-semibold">{receipt.value}</div>
                <p className="mt-1 text-sm leading-5 text-slate-300">{receipt.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
