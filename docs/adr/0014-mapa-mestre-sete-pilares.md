# ADR 0014 — Mapa mestre GENORYX (7 pilares)

- Status: aceito
- Data: 2026-09-02

## Contexto

O Alpha Playable Loop V1 (ADR 0013) mostrou o jogo como sistema, não milestones isoladas. A identidade que emergiu: **tudo se conecta pela genética**. Um mindmap externo usou a grafia errada **NEXYROM**. A marca pública é **GENORYX**.

## Decisão

1. Nome público: só **GENORYX** / **GENORYX: Genesis**. NEXYROM é erro. NEXORA só em `@nexora/*` até o refactor (ADR 0012).
2. O mapa canônico do jogo são **7 pilares** + 5 braços, gravados em `docs/GAME_DESIGN.md` §3.1.
3. Combate competitivo alvo: roster 5 → ban 1 → pick 3 → formação → deck → batalha. Alpha casual permanece 1–3 sem draft.
4. Sinergia de arquétipos **cria** cartas. Demonstração: BURN + TANK → FORNALHA VIVA. Evolução futura: + VIDA + RESISTÊNCIA → FORTALEZA VIVA.
5. Genética física é em camadas (12 bodies, 4 heads, 5 eyes, 5 horns, membros, cauda, pattern, asas/costas, aura). Alpha V1 só persiste body + head.
6. **Nenhuma parte sozinha define a criatura.** Stats = soma genética + tetos em config.
7. Genética de cartas (10 loci × 2 alelos) é sistema separado da aparência; o breed cruza os dois.
8. Breeding é o núcleo (aparência ↔ cartas ↔ status ↔ mutação), não feature secundária.
9. Duas progressões distintas: **idade** (Egg → Filhote → Jovem → Adulto desbloqueia G1–G4 / G5–G8 / G9–G10) e **cópias de carta** (branch mecânico, nunca +% dano).
10. Duas torres: Poder (Lord of Floor) e Guilda (lab / território / buffs). Fora do Alpha V1.
11. Braços do mapa: Exploração/PvE, Economia, Marketplace, NFT/ownership, Social. Não autorizam implementação agora.

## Consequências

- Implementação continua fina e server-authoritative. Este ADR não abre NFT, ranked, torres, draft 5 ou camadas EYES/HORNS.
- TODOs críticos dos pilares novos entram em `docs/ROADMAP.md`.
- ADR 0011 (10 loci) permanece; o schema já existe no Alpha.
