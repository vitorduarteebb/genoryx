// Smoke do bundle WebGL publicado: abre a pagina estatica do Unity num Chromium
// headless e espera o runtime realmente inicializar.
//
//   npm i --no-save playwright@1.56.0        # fora do lock: 90 MB que o CI nao precisa
//   npx --yes playwright@1.56.0 install chromium
//   node deploy/scripts/smoke-unity-webgl.mjs https://srv1568762.hstgr.cloud:8443
//
// Serve /unity-game/index.html e nao /game-unity porque a rota do app exige sessao:
// aqui o que esta sob teste e o bundle, nao o login.
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://localhost:3000";
const url = `${base.replace(/\/$/, "")}/unity-game/index.html`;
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS ?? 180000);

const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ ignoreHTTPSErrors: true });

const logs = [];
page.on("console", (message) => logs.push(`[${message.type()}] ${message.text()}`));
page.on("pageerror", (error) => logs.push(`[pageerror] ${error.message}`));
page.on("response", (response) => {
  if (response.status() >= 400) {
    logs.push(`[http ${response.status()}] ${response.url()}`);
  }
});

let failure = null;
try {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

  // O #boot so e removido no then() de createUnityInstance, ou seja, quando o
  // runtime terminou de subir. E o sinal mais honesto de "o jogo abriu".
  await page.waitForFunction(() => document.getElementById("boot") === null, null, {
    timeout: timeoutMs,
    polling: 1000,
  });

  const canvas = await page.evaluate(() => {
    const node = document.querySelector("#unity-canvas");
    const gl = node?.getContext?.("webgl2") ?? node?.getContext?.("webgl");
    return { width: node?.width ?? 0, height: node?.height ?? 0, context: gl ? "ok" : "missing" };
  });

  if (canvas.width < 2 || canvas.height < 2) {
    failure = `canvas sem tamanho: ${canvas.width}x${canvas.height}`;
  } else {
    console.log(`OK unity iniciou em ${url} canvas=${canvas.width}x${canvas.height}`);
  }

  if (!failure && process.env.SMOKE_SCREENSHOT) {
    // Uns segundos de folga: o runtime sobe antes de a cena montar as criaturas.
    await page.waitForTimeout(Number(process.env.SMOKE_SCREENSHOT_DELAY_MS ?? 15000));
    await page.screenshot({ path: process.env.SMOKE_SCREENSHOT });
    console.log(`screenshot: ${process.env.SMOKE_SCREENSHOT}`);
  }
} catch (error) {
  failure = error.message;
}

await browser.close();

if (failure) {
  console.error(`FALHOU ${url}: ${failure}`);
  console.error(logs.slice(-40).join("\n"));
  process.exit(1);
}
