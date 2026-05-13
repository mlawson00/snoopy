import type { NextConfig } from "next";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(appDir, "../..");

loadWorkspacePublicPostHogEnv(workspaceRoot);

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  },
  transpilePackages: [
    "@snoopy/auth",
    "@snoopy/billing",
    "@snoopy/config",
    "@snoopy/content",
    "@snoopy/db",
    "@snoopy/reports",
    "@snoopy/runner",
    "@snoopy/ui",
  ],
};

export default nextConfig;

function loadWorkspacePublicPostHogEnv(root: string) {
  const allowedKeys = new Set(["NEXT_PUBLIC_POSTHOG_HOST", "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN"]);
  for (const fileName of [".env.local", ".env"]) {
    const filePath = path.join(root, fileName);
    if (!existsSync(filePath)) continue;
    for (const line of readFileSync(filePath, "utf8").split(/\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (!allowedKeys.has(key ?? "")) continue;
      if (!key || process.env[key] !== undefined) continue;
      process.env[key] = rawValue?.replace(/^["']|["']$/g, "") ?? "";
    }
  }
}
