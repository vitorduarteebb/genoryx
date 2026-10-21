# Card Face UX — auditoria e hierarquia

Data: 2026-09-14

## Problema

A face misturava `rulesText` do Genome (fórmula, RES, “Ferramenta…”) com o texto legado. Tags de locus/função competiam com o efeito. Frame usava o elemento do catálogo da carta, não o da criatura.

## Decisão

1. Face: nome → custo → arte → efeito em linhas → condição → badges → keywords.
2. Fórmula, defesa enfrentada, locus e genome ficam em Detalhes.
3. Frame = elemento da criatura (`element` prop), com fallback na carta.
4. Kits selados não são rerolados. Domínio físico por fantasia do nome (Mordida/Golpe) só na hidratação de leitura.
5. Requisito ≠ consumo: o lock explica os dois (`Precisa de 1+ · consome 2`).

## Exemplos validados

| Carta | Face | Detalhes |
| --- | --- | --- |
| Labareda Incandescente | 11 Dano Mágico · Queimadura · 3 | 35% MAG · RES |
| Pulso Ardente | Consuma 2 Calor · Energia +1 | sem “Ferramenta…” |
| Retorno Ígneo | gatilho de reação + efeito condicional | badges Reação |
| Mordida Ardente | Dano Físico (fantasia corporal) | ATK / DEF |

## Redundâncias / nomes

Cartas de escudo 18 vs 19 no mesmo kit continuam no snapshot. Diferenciação clara exige passe de conteúdo (fase seguinte), não reroll.

Nomes como Descarga Elétrica em carta só de energia permanecem no kit; a face agora mostra o efeito real (Energia +1), não prosa genérica.

## Screenshots

- `docs/world/shots/card-face-before-after-labareda.png`
- `docs/world/shots/card-face-after-gallery.png`

Preview local: `/dev/card-face`
