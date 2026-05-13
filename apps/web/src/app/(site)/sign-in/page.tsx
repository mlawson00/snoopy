import Link from "next/link";
import { sendSignInLink } from "../auth-actions";
import { Button, Card, Heading, Input, Section } from "@snoopy/ui";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; email?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <Section className="max-w-md">
      <Card>
        <Heading as="h1" className="text-2xl">
          Sign in
        </Heading>
        <form action={sendSignInLink} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Email
            <Input className="mt-2" name="email" type="email" placeholder="you@example.com" required />
          </label>
          <Button className="w-full" type="submit">
            Email sign-in link
          </Button>
        </form>
        <AuthStatus status={params.status} email={params.email} message={params.message} />
        <p className="mt-4 text-sm text-slate-600">
          New to Snoopy? <Link href="/sign-up">Create an account</Link>
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
  if (status === "sent") return <p className="mt-4 text-sm text-emerald-700">Check {email} for a sign-in link.</p>;
  if (status === "local") return <p className="mt-4 text-sm text-slate-600">Account sign-in is not configured in this environment.</p>;
  return <p className="mt-4 text-sm text-red-700">{message ?? "Unable to send sign-in link."}</p>;
}
