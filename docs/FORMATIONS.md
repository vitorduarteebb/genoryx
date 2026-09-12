# Formações — GENORYX

Seleção de alvos e morte da Frente no fluxograma: `docs/COMBAT_SYSTEM.md` (ADR 0031). Este arquivo descreve a fatia V2 já prototipada.

## V2 (canônica competitiva)

`FRONT` / `MIDDLE` / `BACK`. Uma criatura viva por slot quando o time está completo.

Inimigo (profundidade): BACK → MIDDLE → FRONT → núcleo → FRONT → MIDDLE → BACK.

- FRONT: exposto. Alvo padrão.
- MIDDLE: janela alternada (ímpar protegido, par alvo). Definida pelo **round do engine**, não pelo relógio do browser.
- BACK: retaguarda. Só TargetRule específica ou colapso.

Colapso só a partir da morte do FRONT. Promoção imediata; a criatura que vira MIDDLE obedece a janela **atual**.

## V1 (replay / Alpha casual)

`FRONT` / `BACK_LEFT` / `BACK_RIGHT` permanece em batalhas `rulesVersion = V1`.

O cliente nunca escreve slot. `SET_FORMATION` só na fase de draft. Push/pull/swap passam pelo FormationResolver.
