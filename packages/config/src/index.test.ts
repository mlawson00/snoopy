import { describe, expect, it } from "vitest";
import { getPublicConfig, getServerConfig } from "./index";

describe("config", () => {
  it("uses local defaults for development", () => {
    expect(getPublicConfig({}).NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
  });

  it("normalizes boolean server settings", () => {
    expect(getServerConfig({ PLAYWRIGHT_HEADLESS: "false" }).PLAYWRIGHT_HEADLESS).toBe(false);
  });
});
