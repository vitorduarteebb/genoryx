const { execSync } = require("node:child_process");
const { existsSync } = require("node:fs");
const { join } = require("node:path");

const generated = join(__dirname, "..", "generated", "index.js");

try {
  execSync("npx prisma generate", { stdio: "inherit", cwd: join(__dirname, "..") });
} catch {
  if (!existsSync(generated)) {
    process.exit(1);
  }
  console.warn("prisma generate bloqueado (arquivo em uso). Reusando generated existente.");
}
