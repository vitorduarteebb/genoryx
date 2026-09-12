import path from "node:path";
import { createServer } from "node:http";
import { createGameHttpApp, createGameServer } from "./server";

try {
  const { config: loadEnv } = require("dotenv") as { config: (opts: { path: string }) => void };
  loadEnv({ path: path.resolve(__dirname, "../../../.env") });
} catch {
  // produção: env vem do compose / processo
}

const port = Number(process.env.GAME_SERVER_PORT ?? 2567);
const app = createGameHttpApp();
const httpServer = createServer(app);
const gameServer = createGameServer(httpServer);

void gameServer.listen(port).then(() => {
  console.log(`[game-server] GENORYX listening on ${port}`);
});
