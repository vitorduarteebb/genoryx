# Segurança — GENORYX: Genesis

## 1. Regra absoluta

O cliente nunca decide Gold, XP, drop, damage, loot, breeding, captura, resultado de PvP, **draw, energy ou efeito de carta**.

Qualquer endpoint que aceite esses valores do body é um bug. Posse de NFT **não** muda essa regra.

```ts
// ERRADO
awardGold(userId, dto.amount);

// CERTO
awardQuestGold(userId, questId); // amount vem de config no servidor
```

## 2. Autenticação

- Senha: **Argon2id** (ADR 0007). Nunca texto puro. `passwordHash` nunca sai na API.
- Access JWT de vida curta (`JWT_ACCESS_TTL`, alvo 15m).
- Refresh opaco, persistido **somente como hash SHA-256**, com rotação e revogação.
- Reuso de refresh revogado revoga a `Session` e os demais refresh da mesma sessão.
- Logout revoga refresh + marca `Session.revokedAt` no servidor.
- Rate limit Redis em register/login/refresh (`@nexora/config` `authConfig.rateLimit`). Em `NODE_ENV=test` o limite é ignorado.
- ValidationPipe com `whitelist` + `forbidNonWhitelisted` (gold, role, level no body = 400).
- Secrets só em variáveis de ambiente.

## 3. Autorização

- Jogador só muta recursos que possui.
- Admin usa role explícita (`User.role`) e outro guard.
- Game-server não aceita “sou dono desta criatura” vindo do socket sem checar o banco.

## 4. Economia

- Ledger obrigatório (`docs/ECONOMY.md`).
- Marketplace atômico com lock de ativo.
- Sem números de recompensa no cliente.
- NFT ≠ autoridade de gameplay. Level, XP, DNA, fertility, damage, rarity, mutation continuam recusados no body.

## 5. RNG e replay

Combate, captura, breeding e loot usam `RandomService` com seed persistida. Isso permite auditoria (“esse Pyron SS nasceu deste seed”) e testes.

## 6. Admin

Toda ação privilegiada grava `AdminActionLog`:

- `adminUserId`
- `action`
- `targetType` / `targetId`
- `payload`
- `reason`
- `createdAt`

Ban, grant, spawn edit e teleport sem log = inválido.

## 7. Superfície HTTP

- Helmet, CORS explícito (`WEB_URL`, `ADMIN_URL`).
- Rate limit (Redis) em auth, market e breed — auth já na M1; market/breed nas suas milestones.
- Validação de input com whitelist (class-validator / Zod). Sem mass assignment.
- Alpha VPS: só NGINX público. Postgres, Redis, admin e Prisma Studio fechados. Game-server CORS = `GAME_SERVER_ALLOWED_ORIGINS`. Ver `docs/DEPLOYMENT.md`.

## 8. Game client

- Phaser e Zustand não são fonte de verdade.
- Access token só em memória (Zustand). Refresh em `sessionStorage` (`nexora.refresh`). Sem `localStorage` para access.
- Não embutir service role, secret JWT nem connection string no bundle.
- Sem chave de minter no browser. Sem `NEXT_PUBLIC_` de private key.
- `OPENAI_API_KEY`, `OPENAI_CREATURE_IMAGE_MODEL`, `OPENAI_CARD_ART_MODEL` e `MESHY_API_KEY` só no backend/worker. Nunca `NEXT_PUBLIC_*`, Phaser, Three.js, localStorage ou metadata NFT. Jogador não regenera imagem, GLB nem arte de carta.

## 9. Dívida da M1 (não corrigir agora)

- Access JWT sem denylist: após logout o access segue válido até expirar (~15m).
- Redirect de logout em `/game` pode cair em `/login` (race de estado).
- `UsersModule` residual da M0.

Ver `docs/ROADMAP.md` § dívida técnica.

## 10. Anti-bot (backlog)

Rate limiting, fingerprint, análise de comportamento, captcha reativa, monitoring de transações. Depois do vertical slice; obrigatório antes de economia aberta na internet.

## 11. Dados sensíveis

- `.env` no `.gitignore`
- `legacy/aurora` pode conter configs antigas de outro produto — não reutilizar secrets
- Logs não imprimem senha, JWT completo, refresh token, private key, cookies nem `OPENAI_API_KEY` / `MESHY_API_KEY` / headers de auth
- Observabilidade de arte: creatureId, lifeStage, jobId, model, duration, retries, status, promptHash — não o segredo
- Private key de usuário ou minter: nunca plaintext no banco; nunca no frontend

## 12. Web3 (quando existir)

Mint/transfer só em serviço backend com AccessControl, Pausable, limites de mint, roles separadas, multisig em produção. Documentação: `docs/WEB3.md`, ADR 0008. Sem contratos na M2.
