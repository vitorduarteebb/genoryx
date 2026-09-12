import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

const key = join(homedir(), ".ssh", "id_ed25519_vps_paesleme");
const dest = resolve(process.cwd(), ".env.meshy.local");

try {
  const out = execFileSync(
    "ssh",
    [
      "-i",
      key,
      "-o",
      "BatchMode=yes",
      "-o",
      "ConnectTimeout=12",
      "-o",
      "StrictHostKeyChecking=accept-new",
      "root@85.31.60.84",
      "grep '^MESHY_API_KEY=' /opt/nexora/.env.production || true",
    ],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
  const line = out
    .split(/\r?\n/)
    .find((row) => row.startsWith("MESHY_API_KEY=") && row.split("=", 2)[1]?.trim());
  if (!line) {
    console.log("meshy_key=absent");
    process.exit(2);
  }
  writeFileSync(dest, `${line.trim()}\n`, { encoding: "utf8" });
  const value = line.slice("MESHY_API_KEY=".length).trim();
  console.log("meshy_key=present");
  console.log(`meshy_len=${value.length}`);
  console.log("wrote=.env.meshy.local");
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.log(`ssh_failed=${message.replace(/msy_[A-Za-z0-9_\-]+/g, "msy-***")}`);
  process.exit(1);
}
