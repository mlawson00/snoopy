import { z } from "zod";

const publicSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.url().optional(),
});

const serverSchema = publicSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  GEMMA_OPENAI_BASE_URL: z.url().optional(),
  GEMMA_OPENAI_API_KEY: z.string().optional(),
  GEMMA_OPENAI_MODEL: z.string().optional(),
  PLAYWRIGHT_HEADLESS: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
});

export type PublicConfig = z.infer<typeof publicSchema>;
export type ServerConfig = z.infer<typeof serverSchema>;

export function getPublicConfig(env: NodeJS.ProcessEnv = process.env): PublicConfig {
  return publicSchema.parse(env);
}

export function getServerConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  return serverSchema.parse(env);
}
