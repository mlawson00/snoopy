"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/runs/new", label: "New run" },
  { href: "/agents", label: "Agents" },
  { href: "/runs/demo", label: "Demo" },
  { href: "/trust", label: "Trust" },
  { href: "/settings/billing", label: "Pricing" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const visibleNavItems = pathname === "/runs/new" ? navItems.filter((item) => item.href !== "/integrations") : navItems;

  return (
    <header className="px-4 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-black/10 bg-white/80 px-5 py-3 shadow-sm backdrop-blur">
        <Link href="/" className="inline-flex items-center gap-3 font-mono text-sm font-semibold uppercase tracking-[0.18em] text-slate-950">
          <span aria-hidden className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-red-300" />
            <span className="size-2 rotate-45 bg-amber-300" />
            <span className="size-2 rounded-sm bg-sky-300" />
          </span>
          <span>Snoopy</span>
        </Link>
        <nav className="hidden items-center gap-1 text-sm text-slate-600 sm:flex">
          {visibleNavItems.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-full px-3 py-1.5 hover:bg-slate-950 hover:text-white transition-colors">
              {item.label}
            </Link>
          ))}
        </nav>
        <Link href="/runs/new" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800 transition-colors">
          Start free
        </Link>
      </div>
    </header>
  );
}
