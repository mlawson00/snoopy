import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type AuthSession = {
  userId: string;
  email: string | null;
};

export function createBrowserAuthClient(url?: string, anonKey?: string): SupabaseClient | null {
  if (!url || !anonKey) return null;
  return createClient(url, anonKey);
}

export function requireSession(session: AuthSession | null): AuthSession {
  if (!session) {
    throw new Error("Authentication is required.");
  }
  return session;
}
