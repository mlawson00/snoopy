"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/runs/new", label: "New run" },
  { href: "/agents", label: "Agents" },
  { href: "/runs/demo", label: "Demo" },
  { href: "/integrations", label: "Handoff" },
  { href: "/trust", label: "Trust" },
  { href: "/settings/billing", label: "Pricing" },
];

const proofItems = [
  { href: "/settings/billing", label: "Pricing: scopes and budgets" },
  { href: "/runs/demo", label: "Example: demo teardown" },
  { href: "/agents", label: "Agents: persistent cast + custom minds" },
  { href: "/trust", label: "Trust: storage, credentials, and boundaries" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const showProofRail = pathname === "/";
  const visibleNavItems = pathname === "/runs/new" ? navItems.filter((item) => item.href !== "/integrations") : navItems;

  return (
    <header className="px-4 pt-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 rounded-2xl border border-black/10 bg-white/88 px-5 py-3 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:rounded-full">
        <Link href="/" className="inline-flex items-center gap-3 font-mono text-sm font-semibold uppercase tracking-[0.18em] text-slate-950">
          <span aria-hidden className="grid grid-cols-3 items-center gap-1">
            <span className="size-2 rounded-full bg-red-300" />
            <span className="size-2 rotate-45 bg-amber-300" />
            <span className="size-2 rounded-sm bg-sky-300" />
          </span>
          <span>Snoopy</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
          {visibleNavItems.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-full px-3 py-2 hover:bg-slate-950 hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      {showProofRail ? (
        <div className="mx-auto mt-3 grid max-w-7xl grid-cols-1 gap-2 text-sm font-semibold text-slate-950 sm:grid-cols-2 lg:grid-cols-4">
          {proofItems.map((item) => (
            <Link key={item.label} href={item.href} className="rounded-full border border-black/10 bg-white/90 px-4 py-2 shadow-sm hover:bg-amber-100">
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}
    </header>
  );
}
