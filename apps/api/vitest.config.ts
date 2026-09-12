import { config as loadEnv } from "dotenv";
import path from "node:path";
import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

loadEnv({ path: path.resolve(__dirname, "../../.env") });

export default defineConfig({
  plugins: [
    swc.vite({
      jsc: {
        parser: { syntax: "typescript", decorators: true },
        transform: { legacyDecorator: true, decoratorMetadata: true },
      },
    }),
  ],
  test: {
    include: ["test/**/*.test.ts"],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
