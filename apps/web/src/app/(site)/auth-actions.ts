"use server";

import { redirect } from "next/navigation";
import { getPublicConfig } from "@snoopy/config";
import { createBrowserAuthClient } from "@snoopy/auth";

function getEmail(formData: FormData): string {
  const email = formData.get("email");
  if (typeof email !== "string" || !email.includes("@")) {
    throw new Error("A valid email address is required.");
  }
  return email;
}

export async function sendSignInLink(formData: FormData) {
  const email = getEmail(formData);
  const config = getPublicConfig();
  const client = createBrowserAuthClient(config.NEXT_PUBLIC_SUPABASE_URL, config.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!client) {
    redirect(`/sign-in?status=local&email=${encodeURIComponent(email)}`);
  }

  const { error } = await client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${config.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    redirect(`/sign-in?status=error&message=${encodeURIComponent(error.message)}`);
  }

  redirect(`/sign-in?status=sent&email=${encodeURIComponent(email)}`);
}

export async function sendSignUpLink(formData: FormData) {
  const email = getEmail(formData);
  const config = getPublicConfig();
  const client = createBrowserAuthClient(config.NEXT_PUBLIC_SUPABASE_URL, config.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!client) {
    redirect(`/sign-up?status=local&email=${encodeURIComponent(email)}`);
  }

  const { error } = await client.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${config.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    redirect(`/sign-up?status=error&message=${encodeURIComponent(error.message)}`);
  }

  redirect(`/sign-up?status=sent&email=${encodeURIComponent(email)}`);
}
