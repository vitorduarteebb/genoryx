# GENORYX — Direção de arte dos personagens

Canônico dos **humanos e NPCs** no World. Criaturas: `docs/ART_BIBLE.md`. Mundo/câmera/escala: `docs/VISUAL_DESIGN.md`.

Frase:

> O humano é estilizado e elegante. A criatura é o destaque visual.

---

## Linha fechada

**3D estilizado moderno.** Fantasia + anime ocidental + RPG/MMO limpo.

Não é: realista, low poly cru, chibi, cartoon de criança, guerreiro medieval genérico, mago genérico.

Leitura em 3/4 a 16–26 m. Silhueta primeiro, detalhe depois.

NEX não vende poder. Cosmético não muda captura, dano, genes nem MMR.

---

## Proporção

| | Valor |
| --- | --- |
| Altura | 1,75–1,85 m (slice: 1,80 m) |
| Cabeças | **6,5–7** |
| Cabeça | um pouco maior que o real, não chibi |
| Ombros | largura legível |
| Mãos / botas | um pouco marcantes |
| Pernas | separadas, leem na câmera 3/4 |

De longe o jogador distingue: cabeça, ombros, roupa, player vs NPC, arquétipo.

---

## Player — Tamer / Explorer / Breeder

Não é herói pré-pronto. É o avatar que o jogador cria. O **kit inicial** (antes da customização) já parece do universo.

Identidade: explora, cria criaturas, entra em floresta e dungeon, ligado ao Genesis.

### Roupa inicial

- camisa por baixo
- colete / casaco curto
- calça ajustada
- botas
- cinto utilitário
- braçadeira ou luva
- insígnia / cristal Genesis (ciano)
- pochete lateral

Paleta: neutros (areia, couro, grafite) + **um** acento Genesis. Sem armadura de tank, sem robe de mago.

### Rosto e cabelo

- olhos um pouco maiores que o real
- nariz e boca simples
- cabelo com volume e 2–3 mechas (não bloco liso)
- expressão leve

Customização (já no GDD): corpo, pele, rosto, cabelo, cor, olhos. Cosmético depois.

---

## Arquétipos de NPC (Haven)

Não clonar o player com outra cor.

| Papel | Silhueta | Paleta |
| --- | --- | --- |
| **Guarda** | peitoral, elmo baixo, lança, postura firme | pedra + metal + acento da cidade |
| **Comerciante** | avental, bolsas, pose relaxada | ouro / tecido quente |
| **Pesquisador** | gola técnica, cristal, instrumento | azul-cinza + ciano |
| **Breeder** | faixa orgânica, tons de planta | terra + violeta suave |
| **Aventureiro** | mochila, capa curta | verde musgo + couro |

Quatro a seis arquétipos bastam na slice. Cidadão genérico só se a praça precisar de densidade.

---

## Materiais (leitura, não PBR de filme)

Diferença visível entre: pele, tecido, couro, metal, cristal, cabelo.

Cristal Genesis: emissão baixa, ciano/verde. Nunca “neon de menu”.

---

## Animação mínima (slice)

Procedural até haver rig final:

- idle: respiração no torso
- walk: pernas e braços em oposição, peso
- parada: desacelera, não teleporta o ângulo
- criatura: bounce + follow no chão

Depois (modelo): idle, walk, run, turn, interact. Sem cutscene longa.

---

## Criatura ao lado do humano

O Baby lê **na frente** do tamer: cor, orelhas, chama, silhueta de animal. Humano não compete em saturação nem em VFX.

Escala: humano 1,80 m · Baby ~0,78 m · follow 1,65 m (`WorldScale`).

---

## Qualidade alvo

Modelo desenhado + texturas limpas + materiais estilizados + silhueta forte. Não ultra-realista (multiplayer e identidade). Não pino/cápsula.

Ordem: **1 tamer base → guarda → comerciante → breeder → Baby** na mesma praça. Só então multiplicar.

---

## Fora desta fatia

- Mixamo / store como “personagem oficial”
- 12 classes visuais
- face blendshapes
- art pass de Haven inteira
