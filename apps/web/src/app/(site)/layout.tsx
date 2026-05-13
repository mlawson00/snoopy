import { PageShell } from "@snoopy/ui";
import { SiteHeader } from "@/components/site-header";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageShell>
      <SiteHeader />
      {children}
    </PageShell>
  );
}
