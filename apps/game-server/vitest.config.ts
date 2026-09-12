import { config as loadEnv } from "dotenv";
import path from "node:path";
import { defineConfig } from "vitest/config";

loadEnv({ path: path.resolve(__dirname, "../../.env") });

export default defineConfig({
  resolve: {
    alias: {
      "@pm2/io": path.resolve(__dirname, "test/pm2-io-stub.ts"),
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    fileParallelism: false,
    setupFiles: ["./test/vitest.setup.ts"],
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});
