import { clsx } from "clsx";
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({ className, style, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "relative inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold shadow-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950 disabled:cursor-not-allowed disabled:opacity-55",
        variant === "primary" && "border-transparent bg-slate-950 text-white hover:bg-slate-800",
        variant === "secondary" && "border-slate-300 bg-white text-slate-950 hover:bg-slate-50",
        variant === "ghost" && "border-transparent text-slate-700 shadow-none hover:bg-slate-100",
        className,
      )}
      style={variant === "primary" ? { backgroundColor: "rgb(2, 6, 23)", ...style } : style}
      {...props}
    />
  );
}

export function Card({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={clsx("rounded-lg border border-black/10 bg-white p-5 shadow-sm", className)} {...props} />;
}

export function Input({ className, ...props }: ComponentPropsWithoutRef<"input">) {
  return (
    <input
      className={clsx(
        "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: ComponentPropsWithoutRef<"textarea">) {
  return (
    <textarea
      className={clsx(
        "min-h-24 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10",
        className,
      )}
      {...props}
    />
  );
}

export function Badge({ className, ...props }: ComponentPropsWithoutRef<"span">) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full bg-amber-100 px-3 py-1 font-mono text-sm font-semibold uppercase tracking-wide text-amber-900",
        className,
      )}
      {...props}
    />
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return <main className="min-h-screen text-slate-950">{children}</main>;
}

export function Section({ className, ...props }: ComponentPropsWithoutRef<"section">) {
  return <section className={clsx("mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8", className)} {...props} />;
}

export function Heading<T extends ElementType = "h2">({
  as,
  className,
  ...props
}: {
  as?: T;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className">) {
  const Component = as ?? "h2";
  return <Component className={clsx("text-2xl font-semibold leading-tight tracking-normal text-slate-950", className)} {...props} />;
}
