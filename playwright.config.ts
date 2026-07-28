import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 120_000,
  retries: 0,
  reporter: "list",
  use: {
    browserName: "chromium",
    headless: true,
    screenshot: "off",
    trace: "off",
    launchOptions: {
      args: ["--no-sandbox"],
    },
  },
  webServer: {
    command: "pnpm dev",
    port: 5173,
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
