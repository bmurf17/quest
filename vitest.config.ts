import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    // Keep unit tests away from the real Supabase project even when a local
    // `.env` is present.
    env: {
      VITE_SUPABASE_URL: "http://127.0.0.1:54321",
      VITE_SUPABASE_ANON_KEY: "test-anon-key",
    },
    include: ["src/**/*.test.ts", "src/**/*.test.tsx", "src/**/__tests__/**/*.ts"],
    coverage: {
      provider: "v8",
      include: ["src/state/**/*.ts", "src/queries/**/*.ts"],
      exclude: ["src/**/__tests__/**", "src/state/slices/types.ts", "src/state/GameState.ts"],
      reporter: ["text", "html"],
      thresholds: {
        "src/state/**": {
          statements: 55,
          branches: 60,
          functions: 40,
          lines: 55,
        },
        "src/queries/**": {
          statements: 35,
          branches: 65,
          functions: 20,
          lines: 35,
        },
      },
    },
  },
});
