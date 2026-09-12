# Deployment — GENORYX ALPHA

Versão pública da M2 para testers. Identidade: **GENORYX ALPHA**.

| | URL |
| --- | --- |
| Alpha | https://alpha.genoryx.com.br |
| Apex | https://genoryx.com.br → Alpha |
| www | https://www.genoryx.com.br → Alpha |
| Legado | https://srv1568762.hstgr.cloud:8443 (continua no ar) |
| Jogo futuro | https://play.genoryx.com.br |

VPS `85.31.60.84`. AURORA permanece em `srv1568762.hstgr.cloud:443`. O Alpha na 443 usa **SNI** no hostname `alpha.genoryx.com.br`.

Alpha Playable Loop V1 (ADR 0013) entra neste deploy: starter, combate, captura, breeding, mercado e PvP casual. Contratos NFT **não**.

---

## 1. Arquitetura pública

```text
Internet
   │
   ▼
NGINX :80 / :443
   ├── /              → apps/web :3000
   ├── /api/          → apps/api :3001
   ├── /colyseus/     → apps/game-server :2567  (HTTP matchmake + WSS)
   └── /ready         → nginx
          │
          ▼
   rede interna
   postgres :5432
   redis :6379
```

Postgres, Redis, Prisma Studio e `apps/admin` **não** têm porta na internet.

HTTPS na página. Colyseus só via **WSS**. Página HTTPS + `ws://` é proibido.

---

## 2. Requisitos da VPS

- Docker Engine + Compose v2
- 2 vCPU / 4 GB RAM (mínimo Alpha)
- Domínio apontando para o IP (A/AAAA)
- Portas 80 e 443
- Sem publicar 5432, 6379, 3001, 2567, 3002

---

## 3. Ambientes

| | development | production (Alpha) |
| --- | --- | --- |
| Arquivo | `.env` (raiz) | `.env.production` |
| Exemplo | `.env.example` | `.env.production.example` |
| Compose | `docker-compose.yml` (só Postgres/Redis locais, portas no host) | `docker-compose.prod.yml` |
| WebSocket | `ws://localhost:2567` | `wss://SEU_DOMINIO/colyseus` |
| API pública | `http://localhost:3001` | `https://SEU_DOMINIO/api` |

`NEXT_PUBLIC_*` entra no **bundle** na build da imagem web. Só URLs e canal. **Nunca** JWT, senha ou private key.

Trocar URL pública exige **rebuild** da imagem `web`.

---

## 4. Variáveis

Conceituais: `NODE_ENV`, `DATABASE_URL`, `REDIS_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `WEB_URL`, `API_URL`, `GAME_SERVER_URL`.

Públicas no Next: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_GAME_SERVER_URL`, `NEXT_PUBLIC_RELEASE_CHANNEL=alpha`, `NEXT_PUBLIC_BUILD_ID`.

Internas: `GAME_SERVER_ALLOWED_ORIGINS` (origens do browser Alpha), `POSTGRES_*`.

Gere secrets novos para Alpha. Não recicle o `.env` de desenvolvimento.

---

## 4b. DNS (`genoryx.com.br`)

Registrado em 2026-09-02 (Hostinger / Registro.br). Nameservers atuais: `athena.dns-parking.com`, `apollo.dns-parking.com`.

No hPanel, zona DNS do domínio — **não** overwrite cego. Adicione:

| Nome | Tipo | Conteúdo | TTL |
| --- | --- | --- | --- |
| `@` | A | `85.31.60.84` | 300 |
| `www` | A | `85.31.60.84` | 300 |
| `alpha` | A | `85.31.60.84` | 300 |
| `play` | A | `85.31.60.84` | 300 |

DNS A live (2026-09-06). Certificado Let's Encrypt em `/etc/letsencrypt/live/alpha.genoryx.com.br/` (alpha + apex + www). Vhost SNI: `deploy/nginx/genoryx-alpha.conf`. `:8443` permanece no ar; redirect 301 fica para depois.

## 5. SSL

1. Primeiro boot: `sh deploy/scripts/make-selfsigned.sh SEU_DOMINIO` (só para o nginx subir).
2. Let's Encrypt (recomendado para testers):

```bash
# no host; o volume ./deploy/nginx/certbot é o webroot do nginx
certbot certonly --webroot -w "$(pwd)/deploy/nginx/certbot" -d SEU_DOMINIO
cp /etc/letsencrypt/live/SEU_DOMINIO/fullchain.pem deploy/nginx/certs/
cp /etc/letsencrypt/live/SEU_DOMINIO/privkey.pem deploy/nginx/certs/
```

3. Edite `server_name` em `deploy/nginx/nexora-alpha.conf`.
4. Recarregue o nginx.

Headers WebSocket no proxy: `Upgrade`, `Connection`, timeouts longos, `proxy_buffering off`.

---

## 6. Subida

No repositório, na VPS:

```bash
cp .env.production.example .env.production
# edite secrets e o domínio

sh deploy/scripts/alpha-up.sh
sh deploy/scripts/alpha-ready.sh https://SEU_DOMINIO
```

`alpha-up.sh` faz: build → **migrate deploy** (explícito, uma vez) → sobe postgres, redis, api, game-server, web, nginx.

Antes de migrate em Alpha: backup do PostgreSQL. As artes canônicas ficam no volume Docker `creature_visuals` (`/app/var/creature-visuals`). Ilustrações de carta ficam em `card_art` (`/app/var/card-art`). Rebuild da API **não** pode apagar esses volumes. Provider de imagem: `CREATURE_IMAGE_PROVIDER` / `CARD_ART_PROVIDER` + chave **nova** (`OPENAI_API_KEY`); CI continua mock.

**Seed não roda no restart.** Só quando você pedir:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production --profile seed run --rm seed
```

O seed atual faz upsert de espécies, mapas, NPCs e orbs. Não use em loop. Não é destroy de jogadores, mas também não é “a cada boot”.

---

## 7. Health / readiness

| URL | Serviço |
| --- | --- |
| `https://SEU_DOMINIO/ready` | nginx |
| `https://SEU_DOMINIO/api/health` | API + Postgres + Redis |
| `https://SEU_DOMINIO/colyseus/health` | game-server |
| `https://SEU_DOMINIO/` | web |

Script: `deploy/scripts/alpha-ready.sh https://SEU_DOMINIO`

---

## 8. Logs

```bash
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f game-server
docker compose -f docker-compose.prod.yml logs -f web
docker compose -f docker-compose.prod.yml logs -f nginx
```

Prefixos: `[api]`, `[game-server]`. Não logar password, JWT completo, refresh token ou private key.

---

## 9. Backup (antes de migration futura)

```bash
sh deploy/scripts/backup-postgres.sh
```

Gera `backups/nexora-UTC.sql.gz`. Copie para fora da VPS.

Restore de emergência (VPS vazia, depois de conferir o dump):

```bash
gunzip -c backups/nexora-XXXX.sql.gz | docker compose -f docker-compose.prod.yml --env-file .env.production exec -T postgres \
  sh -c 'psql -U "$POSTGRES_USER" "$POSTGRES_DB"'
```

---

## 10. Restart e rollback básico

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production restart api game-server web nginx
```

Rollback de imagem: mantenha a tag anterior (`NEXT_PUBLIC_BUILD_ID`) e faça `docker compose up -d` com a imagem antiga. Rollback de schema: restaure o dump do passo 9 **antes** de aplicar a migration nova. Alpha não tem blue/green.

---

## 11. Segurança

- Rate limit M1 (API) permanece; nginx adiciona teto em `/api/` e `/colyseus/`.
- CORS do game-server: só `GAME_SERVER_ALLOWED_ORIGINS` / `WEB_URL`.
- Admin placeholder: **fora** do compose de produção.
- Prisma Studio: só em máquina local, nunca na VPS pública.

---

## 12. Validação Alpha (dois clients externos)

**Live em 2026-09-02 (VPS `85.31.60.84`) — Alpha Playable Loop V1**

| | |
| --- | --- |
| URL | https://alpha.genoryx.com.br |
| API | https://alpha.genoryx.com.br/api |
| Colyseus | wss://alpha.genoryx.com.br/colyseus |
| Legado | https://srv1568762.hstgr.cloud:8443 |
| Health | `milestone: alpha-loop`, `channel: alpha` |
| Código | `/opt/nexora` |
| Compose | `docker-compose.vps.yml` (sem publicar 80/443) |
| Backup pré-loop | `/opt/nexora/backups/nexora-20260902-pre-loop.sql.gz` |
| Migration | `20260902040000_alpha_playable_loop` aplicada (3 no total) |

Esta VPS já servia AURORA (`srv1568762.hstgr.cloud:443`) e Palworld (80 default). O Alpha na 443 usa **SNI** no hostname `alpha.genoryx.com.br` e não substitui o vhost AURORA. `:8443` continua no certificado do hostname Hostinger.

| Check | Resultado |
| --- | --- |
| `/api/health`, Colyseus `/health`, web `/` | ok, postgres/redis up |
| Contas existentes | preservadas (13 testers + 2 contas A/B de validação) |
| Seed | idempotente (first-hunt, mutações, tonic); profile `seed` |
| A/B live | A captura → breed → ovo → hatch → lista; B compra (lock/fee/transfer); A vs B PvP com `pvp_matches` |
| Browser | nav World/Creatures/Party/Deck/Breeding/Market/Inventory/Shop/Arena; coleção G1–G10; Gold/NexOrb; Theo; Arena IDLE |
| AURORA em `:443` | intacta |
| Postgres/Redis | só rede Docker; 3100/3101/3567 só em `127.0.0.1` |

Seed de catálogo roda **sob profile**, sob demanda. Não entra no restart.

---

## 12b. Deploy a partir da máquina local

Não há CI de deploy. O ciclo é empacotar → enviar → aplicar no remoto:

```powershell
powershell -File deploy/scripts/vps-pack.ps1     # tar + scp para /tmp/nexora-alpha.tgz
ssh root@85.31.60.84 "cd /opt/nexora && sh deploy/scripts/vps-deploy-remote.sh"
```

`vps-pack.ps1` exclui `apps/unity-game` (a pasta `Library` sozinha tem 3,5 GB) e preserva
o `.env.production` da VPS. `vps-deploy-remote.sh` faz backup do Postgres, extrai, normaliza
CRLF, garante as variáveis de ambiente e chama `vps-up-api-web.sh` (build → `migrate deploy`
→ up de api/web). Postgres, Redis e os volumes de imagem não são tocados.

Mudança em `deploy/nginx/nexora-alpha-host.conf` **não** é aplicada pelo script; o nginx é do
host, fora do Docker:

```bash
cp -a /etc/nginx/sites-available/nexora-alpha /root/nexora-alpha.nginx.bak.$(date -u +%Y%m%dT%H%M%SZ)
sed 's/\r$//' /opt/nexora/deploy/nginx/nexora-alpha-host.conf > /etc/nginx/sites-available/nexora-alpha
nginx -t && systemctl reload nginx
```

## 12c. Cliente Unity (WebGL)

O bundle é artefato de build versionado em `apps/web/public/unity-game`, servido como
estático pela imagem `web`. Sem Editor no CI, quem gera é a máquina local:

```powershell
& "C:\Program Files\Unity\Hub\Editor\6000.1.14f1\Editor\Unity.exe" -batchmode -quit -nographics `
  -projectPath apps/unity-game -logFile unity-webgl.log `
  -executeMethod Genoryx.Editor.GenoryxWebGLBuild.Build
```

Só a cena de criaturas entra: as cenas de personagem arrastam o acervo GLB de
`StreamingAssets` e levariam o bundle de ~20 MB para 330 MB. Compressão é gzip **com**
`decompressionFallback`, porque quem serve `public/` é o Next e ele não devolve
`Content-Encoding` por extensão.

Validação obrigatória depois de publicar — o que roda no editor pode não rodar no player:

```bash
npm i --no-save playwright@1.56.0        # fora do lock: 90 MB que o CI não precisa
npx --yes playwright@1.56.0 install chromium
node deploy/scripts/smoke-unity-webgl.mjs https://alpha.genoryx.com.br
```

O smoke abre `/unity-game/index.html` (não `/game-unity`, que exige sessão) e falha se o
runtime não inicializar. `SMOKE_SCREENSHOT=caminho.png` também salva a tela.

## 13. Dockerfiles

| Imagem | Arquivo | Papel |
| --- | --- | --- |
| web | `deploy/docker/Dockerfile.web` | Next standalone |
| api | `deploy/docker/Dockerfile.api` | Nest |
| game-server | `deploy/docker/Dockerfile.game-server` | Colyseus 0.16.24 |
| migrate | `deploy/docker/Dockerfile.migrate` | `prisma migrate deploy` (profile) |
| seed | `deploy/docker/Dockerfile.seed` | seed explícito (profile) |

Multi-stage. Compose dedicado: `docker-compose.prod.yml` (nginx 80/443).  
VPS compartilhada: `docker-compose.vps.yml` + `deploy/nginx/nexora-alpha-host.conf` + `deploy/scripts/vps-up.sh`.
