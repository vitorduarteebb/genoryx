# ADR 0032 — Criatura montada em 3D como visual canônico

- Status: aceito
- Data: 2026-09-10

## Contexto

O visual da criatura passou por três fases. Primeiro retrato gerado por OpenAI (ADR 0018). Depois, sem crédito na conta, um sprite 2D escolhido por heurística de elemento/chifre (`gxrPreviewSrc`, pacote Art03): a mesma imagem servia muitas criaturas diferentes, então a genética não aparecia.

O pacote Art04 (`GENORYX_Art04_Genetics.zip`) trouxe peças separadas com sockets e um rig de 12 ossos. Com ele, o fenótipo do GDD §3 (BODY + HEAD + EYES + HORNS + membros + cauda + back + core + pattern + aura) pode ser montado de verdade a partir do DNA que o servidor já persiste em `visualGenomeJson.chassis`.

## Decisão

1. O visual canônico da criatura é o **chassi montado em 3D** a partir do DNA do servidor. Retrato de IA volta a ser opcional e só aparece quando não há chassi.
2. `CreatureGxrFigure` é o único ponto de entrada visual. Coleção, ficha, cartas, formação, grimório, gênese, mercado e arena usam esse componente — não cada tela o seu próprio caminho.
3. O cliente **não gera fenótipo**. Sem chassi, monta peça neutra (`HEAD_01_SMOOTH`, `HORNS_NONE`, `LIMBS_01_SOFT`…). Nunca sorteia gene, cor ou mutação: seria servidor authoritative quebrado por decoração.
4. `apps/web/public/genoryx-art04/manifest.json` é o contrato. `serverGeneMapping` traduz o ID de gene do servidor para a peça. Trocar arte é trocar manifesto, sem tocar em breeding.
5. Um único contexto WebGL compartilhado por aba. Criatura fora da tela pausa, FPS por contexto (`CARD` 8, `MARKET` 12, `BREEDING` 20, `BATTLE`/`PROFILE`/`HATCH` 30) e no máximo dois desenhos por frame.
6. Estados de animação vêm dos eventos do servidor, não de temporizador do cliente: `DAMAGE` → HIT, `CARD_PLAYED` → ATTACK/CAST, `CREATURE_KO` → KO, vitória → VICTORY, nascimento → HATCH.
7. O pacote não traz clipe de morte, defesa nem vitória. Esses estados são procedurais e limitados (inclinação do corpo, respiração), declarados como tal. Não inventamos animação e não a chamamos de oficial.
8. Idade altera escala e ritmo, não peça: BABY 0,72 e cabeça 1,10; YOUNG 0,88; ADULT 1. Filhote não é adulto reduzido no card.

## Consequências

- Removido o seletor de sprite 2D (`gxrArt03Key`, `gxrPreviewFile`, `gxrPreviewSrc`) e a prop `assembled`, que não tinha efeito no renderizador novo.
- Peso: 12,8 MB em `apps/web/public/genoryx-art04` (42 peças, 11 texturas). As dez animações foram extraídas para um `motions.glb` de 120 KB, em vez de repetir o exemplar em cada clipe.
- `three` entra como dependência de runtime do web; o renderizador é carregado por `import()` dinâmico, fora do bundle inicial.
- `/dev/creature-visual` é a prova visual: estágios de vida, combinações genéticas, estados de combate e grade de doze criaturas para medir custo. Em produção responde 404 sem `CREATURE_VISUAL_LAB=1`.
- OpenAI (`CREATURE_IMAGE_PROVIDER`, `CARD_ART_PROVIDER`) segue em `mock` no Alpha. Reativar é decisão de produto, não de infraestrutura.
- ROADMAP registra a fatia em Visual World.
