# ADR 0031 — Fluxograma canônico do combate

- Status: aceito
- Data: 2026-09-06

## Contexto

O combate competitivo já tinha fatias em `COMBAT.md`, `COMBAT_MATRIX.md`, `COMBAT_ENGINE.md`, ADR 0022 e ADR 0030. Essas fatias implementaram recortes (Convergence no 7, colapso BACK→MIDDLE, números de fusão diferentes, Momentum como pagamento emergencial).

O fluxograma de design precisa existir inteiro, sem redesign e sem preencher lacunas.

## Decisão

1. `docs/COMBAT_SYSTEM.md` é a spec do fluxograma de batalha. Organização pode melhorar; mecânica não.
2. Marca pública: GENORYX. O briefing de origem usava outro nome de trabalho. Código, docs e UI não usam NEXYROM (GDD §1).
3. O que o fluxograma não fecha fica **[A DEFINIR]**. Implementação não inventa a célula.
4. Fatias já extraídas (ADR 0022, ADR 0030) continuam como código/prova. Não substituem o fluxograma. Reconciliação futura alinha a fatia ao fluxograma, não o contrário.
5. Roster 5 → ban 1 → pick 3 (GDD §3.1) permanece pré-batalha. Não reordena o fluxo Preparação → Formação → turnos 1–4 → turno 5 → …

## Consequências

- Preservar formação F/M/B, alvos, morte da Frente, alcance, Mana 1–10, Momentum separado, 10 cartas, Unique Genetic Power, descarte, fusão determinística no 5, 105/455, raridades, Slot Tático, janela 1–2, dissipação, pilha LIFO, sobretaxa, exemplos Fornalha Viva / Golpe Relâmpago / Toxina Paralisante / Colapso Cinético / Sacrifício Sangrento, e o exemplo matemático `P_F=126` / `C_F=5`.
- Não ligar o fluxograma completo ao `reduceBattle` nesta ADR. Alpha V1 intacto.
- ROADMAP M4 aponta esta spec.
