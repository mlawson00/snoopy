import Link from "next/link";
import { sendSignUpLink } from "../auth-actions";
import { Button, Card, Heading, Input, Section } from "@snoopy/ui";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; email?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <Section className="max-w-md">
      <Card>
        <Heading as="h1" className="text-2xl">
          Create account
        </Heading>
        <form action={sendSignUpLink} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Work email
            <Input className="mt-2" name="email" type="email" placeholder="you@example.com" required />
          </label>
          <Button className="w-full" type="submit">
            Email sign-up link
          </Button>
        </form>
        <AuthStatus status={params.status} email={params.email} message={params.message} />
        <p className="mt-4 text-sm text-slate-600">
          Already have an account? <Link href="/sign-in">Sign in</Link>
        </p>
        <Link
          href="/runs/demo"
          className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-950 hover:bg-slate-50"
        >
          View demo teardown
        </Link>
      </Card>
    </Section>
  );
}

function AuthStatus({ status, email, message }: { status?: string; email?: string; message?: string }) {
  if (!status) return null;
  if (status === "sent") return <p className="mt-4 text-sm text-emerald-700">Check {email} for a sign-up link.</p>;
  if (status === "local") return <p className="mt-4 text-sm text-slate-600">Account sign-up is not configured in this environment.</p>;
  return <p className="mt-4 text-sm text-red-700">{message ?? "Unable to send sign-up link."}</p>;
}
