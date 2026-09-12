# Sistema de combate — GENORYX: Genesis

Marca pública: **GENORYX: Genesis** (GDD §1, ADR 0012). Este arquivo é a transcrição organizada do fluxograma de combate. Não existe produto chamado NEXYROM.

Motor: servidor authoritative. Cliente envia intenção. `@nexora/game-engine` calcula. RNG só via `RandomService`. Números desta spec não são inventados — vêm do fluxograma. O que o fluxograma não define está em **[A DEFINIR]**.

ADR: `0031`. Relação com `COMBAT.md`, `COMBAT_MATRIX.md` e `COMBAT_ENGINE.md`: §31.

---

## 0. Regra absoluta

**Não alterar o fluxograma original.**

- Não substituir regras por alternativas.
- Não simplificar mecânicas.
- Não eliminar etapas.
- Não inventar regras para preencher lacunas.
- Não alterar valores, turnos, posições, custos ou condições já definidos.
- Não trocar a lógica por uma versão “mais simples”, “mais equilibrada” ou “mais intuitiva”.

A organização deste arquivo pode ser melhorada. A mecânica não.

Lista de preservação: §30.

---

## 1. Identidade do combate

O combate é tático e baseado em cartas.

Cada jogador participa da batalha utilizando:

- 1 personagem
- 3 criaturas
- cartas provenientes das criaturas, personagem, equipamentos e sistemas de combate
- Mana
- Momentum
- formação
- tipagens
- Unique Genetic Power
- efeitos
- combos
- fusões
- sistema de alcance
- sistema de descarte/reciclagem
- sistema de reação/Embate

O combate deve ser estratégico. O jogador constrói a vitória pela utilização das cartas e pela composição da equipe.

Condição de vitória / derrota: **[A DEFINIR]**.

---

## 2. Peças em campo

| Peça | Quantidade | Papel neste fluxograma |
| --- | ---: | --- |
| Personagem | 1 | participa; injeta cartas (equipamentos, sistemas de combate) |
| Criaturas | 3 | em campo, em formação; cada uma adiciona 10 cartas de poder e 1 Unique Genetic Power |

Como o personagem ocupa o tabuleiro (se ocupa): **[A DEFINIR]**.

---

## 3. Formação

Cada jogador possui 3 criaturas em campo.

Três posições:

1. Vanguarda / Frente
2. Meio
3. Retaguarda / Trás

A posição influencia diretamente a possibilidade de a criatura ser selecionada como alvo.

A formação não é apenas visual. É uma mecânica de combate.

Ordem de colocação na fase de Formação: **[A DEFINIR]**. Troca de posição durante a batalha (sem morte): **[A DEFINIR]**.

---

## 4. Identidade das posições

### Vanguarda

Sempre exposta.

Posição naturalmente associada a:

- Tank
- Counter
- Shield

### Meio

Possui vulnerabilidade alternada.

Adequada para criaturas que entram e saem da pressão:

- Aggro
- Bleed
- Combo

### Retaguarda

Protegida contra ataques de alcance curto e médio enquanto houver aliados à frente.

Adequada para:

- Heal
- Summon
- Sustain
- Burst

Cartas de Longo Alcance e Área podem atingir a retaguarda.

---

## 5. Seleção de alvos

Estas regras são obrigatórias e permanecem exatamente como definidas.

### Frente

A criatura da frente **sempre poderá tomar hit**.

É o alvo padrão dos ataques que respeitam a linha frontal.

### Meio

A criatura do meio **pode ser alvo turno sim, turno não**.

A vulnerabilidade do meio alterna entre os turnos.

Quando estiver no turno em que não pode ser alvejada por determinada categoria de ataque, ela deve ser considerada inalvejável para aquela categoria.

Qual turno inicia a janela (primeiro turno vulnerável ou protegido): **[A DEFINIR]**.

Quais categorias de ataque obedecem essa janela: **[A DEFINIR]** além do que o alcance já define.

### Trás

A criatura de trás possui proteção da formação.

Ela somente poderá ser alvo:

- quando uma carta possuir regra específica permitindo atingir a retaguarda
- através de cartas com alcance adequado
- ou quando a dinâmica da formação permitir após a morte da criatura da frente

Regra original:

**o card de trás apenas pode ser alvo quando cards tiverem isso como regra ou quando o card da frente morrer.**

---

## 6. Mecânica após a morte da Frente

Quando a criatura da frente morrer, a formação muda sua dinâmica.

O meio passa a ocupar a posição frontal.

A regra de alternância entre meio e trás permanece.

Lógica:

- quando o Meio estiver vulnerável → Meio pode ser colocado como alvo
- quando o Meio estiver inalvejável → Trás fica habilitado para ser colocado como alvo

Portanto:

**quando o do meio está inalvejável, o de trás habilita ser posto alvo.**

A vulnerabilidade deve alternar entre Meio e Trás.

Exemplo (preservar):

| Turno | Meio | Trás |
| ---: | --- | --- |
| 6 | alvo permitido | protegido |
| 7 | protegido | alvo permitido |
| 8 | alvo permitido | protegido |
| 9 | protegido | alvo permitido |

Essa regra não deve ser substituída.

Morte do Meio ou do Trás com a Frente ainda viva: **[A DEFINIR]**.

Se a Frente morre e depois o (ex-)Meio morre: **[A DEFINIR]**.

---

## 7. Sistema de alcance das cartas

Cada carta de habilidade pode possuir um atributo de alcance.

O alcance determina quais posições podem ser selecionadas.

### Alcance curto — Frontal

Pode atingir apenas a criatura que estiver mais à frente na formação.

Se a vanguarda for destruída, o Meio passa a receber os ataques frontais.

Características previstas:

- dano alto
- baixo custo de Mana
- excelente contra criaturas que dependem da linha frontal

### Alcance médio — Flanco

Pode selecionar:

- Vanguarda
- Meio, quando estiver em sua janela de vulnerabilidade

Possui custo equilibrado.

Adequado para:

- cartas táticas
- aplicação de status
- pressão sobre a linha intermediária

### Alcance longo — Precisão

Ignora as linhas defensivas convencionais.

Pode atingir qualquer criatura do tabuleiro.

Pode atingir inclusive a retaguarda protegida.

A vantagem tática deve ser compensada pelo balanceamento de dano e/ou custo.

Valores desse balanceamento: **[A DEFINIR]**.

### Área — AoE

Pode atingir:

- duas criaturas
- ou as três criaturas

O dano individual pode ser menor, mas a carta possui valor estratégico por atingir múltiplos alvos.

Especialmente útil para:

- Burn
- Poison
- quebra de Shield
- pressão sobre múltiplas criaturas

Quando a carta escolhe duas ou três, e quais duas: **[A DEFINIR]**.

---

## 8. Integração entre alcance e tipos

O alcance também deve reforçar a identidade dos tipos.

### Speed + Control

Maior concentração de cartas de alcance longo.

### Aggro + Tank

Maior concentração de alcance curto.

### Poison + Burn

Maior concentração de alcance médio e Área.

### Summon

Pode utilizar invocações para criar presença temporária na Vanguarda e absorver ataques.

Proporções numéricas dessa concentração: **[A DEFINIR]**.

---

## 9. Os 15 tipos

O sistema possui exatamente 15 arquétipos. Esses tipos não devem ser substituídos. Cada tipo possui identidade mecânica própria.

1. Aggro
2. Control
3. Tank
4. Sustain
5. Burn
6. Poison
7. Bleed
8. Critical
9. Speed
10. Shield
11. Combo
12. Counter
13. Summon
14. Heal
15. Burst

---

## 10. Identidade dos 15 tipos

### Aggro

Especializado em:

- pressão constante
- ataques consecutivos
- atacar o mesmo alvo
- dano contra alvos feridos
- geração de Momentum através de sequência ofensiva

### Control

Especializado em:

- aumentar custos
- bloquear categorias
- manipular mão
- descarte
- redução de Momentum
- alteração de alvo
- silêncio
- negação

### Tank

Especializado em:

- redução de dano
- absorção
- proteção
- provocação
- conversão de dano recebido
- retaliação

### Sustain

Especializado em:

- regeneração
- recuperação de recursos
- recuperação de cartas
- redução progressiva de custos
- buffs persistentes

### Burn

Especializado em:

- acúmulo de Burn
- detonação
- propagação
- renovação
- consumo das cargas

### Poison

Especializado em:

- acúmulo de Poison
- multiplicação
- infecção
- propagação
- anti-heal

### Bleed

Especializado em:

- dano associado à perda de HP
- Hemorrhage
- anti-heal
- execução
- consumo de stacks

### Critical

Especializado em:

- chance crítica
- multiplicador crítico
- Critical garantido em condições
- geração de cartas
- redução de custo
- reset de Combo

### Speed

Especializado em:

- ordem de ação
- ações adicionais
- redução de cooldown
- Momentum
- interrupção

### Shield

Especializado em:

- acumulação de Shield
- transferência
- consumo
- conversão de Shield em dano
- explosão de Shield

### Combo

Especializado em:

- uma carta modificar a próxima
- sequência de cartas
- aumento progressivo de eficiência
- finalização de sequência

### Counter

Especializado em:

- reação
- bloqueio
- reflexão
- redução de efeito
- punição de ações específicas

### Summon

Especializado em:

- criação de servos
- estruturas
- invocações temporárias
- sacrifício
- evolução
- multiplicação

### Heal

Especializado em:

- cura
- cura em área
- Critical Heal
- overheal
- conversão de overheal em Shield
- limpeza de efeitos negativos

### Burst

Especializado em:

- carregamento
- marcação de alvo
- consumo de Momentum
- ignorar defesa
- execução de alvos enfraquecidos

Números (stacks, % crítico, duração, etc.): **[A DEFINIR]** por carta / config. Este arquivo não inventa esses valores.

---

## 11. Cartas

Cada criatura adiciona **10 cartas de poder**.

As cartas devem ser geradas respeitando:

- espécie
- tipo
- genética
- Unique Genetic Power
- características da criatura
- equipamentos
- contexto de combate

A variedade deve ser extremamente grande.

A geração não significa aleatoriedade sem controle.

Deve existir uma gramática de geração de cartas.

Criaturas da mesma espécie e mesma tipagem podem apresentar alguma repetição, mas criaturas geneticamente diferentes devem possuir diferenças significativas.

Gramática formal (produções, tokens, catálogo): **[A DEFINIR]**.

Quantidade de cartas do personagem / equipamentos / sistemas de combate: **[A DEFINIR]**.

Tamanho da mão, compra por turno, teto da mão: **[A DEFINIR]**.

---

## 12. Unique Genetic Power

Cada criatura possui **1 Unique Genetic Power**.

Essa habilidade faz parte da identidade única da criatura e do NFT.

Combinação:

**Criatura única + habilidade única = identidade NFT.**

Nenhuma outra criatura deve simplesmente copiar essa habilidade.

A Unique Genetic Power pode influenciar cartas e fusões.

Ela não deve ser tratada como uma carta comum.

Modo de ativação no combate (passiva, slot próprio, custo): **[A DEFINIR]**.

---

## 13. Sistema de descarte

As cartas utilizadas não desaparecem definitivamente.

Existe uma **rotatividade de cartas**.

Cartas utilizadas entram no descarte e posteriormente são recicladas para retornar à rotação.

O sistema deve impedir que o jogador fique permanentemente sem determinadas cartas.

Momento da reciclagem, ordem, shuffle: **[A DEFINIR]**.

---

## 14. Mana

Mana é o recurso para jogar cartas.

- Mana máxima: **10 Mana**
- Custo normal máximo: **10 Mana**
- Não pode existir Mana infinita

Progressão:

| Turno | Mana máxima |
| ----: | ----------: |
|     1 |           1 |
|     2 |           2 |
|     3 |           3 |
|     4 |           4 |
|     5 |           5 |
|     6 |           6 |
|     7 |           7 |
|     8 |           8 |
|     9 |           9 |
|   10+ |          10 |

A Mana é restaurada no início de cada turno até o limite daquele turno.

Efeitos de criaturas, equipamentos e poderes únicos podem:

- reduzir custos
- gerar Mana
- alterar temporariamente o limite

Sobra de Mana entre turnos (se existe): o texto diz “restaurada … até o limite daquele turno”. Persistência da sobra: **[A DEFINIR]**.

---

## 15. Momentum

Momentum é separado de Mana.

- Mana serve para pagar cartas.
- Momentum representa o ritmo e a construção da batalha.

Não tratar Mana e Momentum como o mesmo recurso.

Geração, teto, gasto e conversão: **[A DEFINIR]**, exceto o que os 15 tipos já afirmam (Aggro gera por sequência ofensiva; Control reduz; Speed envolve Momentum; Burst consome).

---

## 16. Estrutura dos turnos

### Turnos 1–4 — Fase de construção

O jogador constrói sua estratégia através da utilização das cartas.

Ainda não existe a primeira janela normal de Fusão.

### Turno 5 — Primeira janela de Fusão

O sistema analisa os tipos utilizados anteriormente.

### Turnos 6–9 — Fase de escalada

O combate passa a trabalhar com:

- fusões
- reações
- combos
- efeitos acumulados
- maior disponibilidade de Mana

### Turno 10+ — Fase de alto impacto

Cartas de altíssimo custo e Ultimates podem entrar em destaque.

Quem começa, se os turnos são alternados ou simultâneos: **[A DEFINIR]**.

---

## 17. Fluxo geral do combate

Este fluxo não deve ser reorganizado.

```text
Preparação
    ↓
Formação
    ↓
Turnos 1–4
    ↓
Utilização das cartas
    ↓
Construção dos tipos
    ↓
Turno 5
    ↓
Análise dos tipos utilizados
    ↓
Desbloqueio de Fusão
    ↓
Slot Tático
    ↓
Janela de ativação
    ↓
Fusão
    ↓
Embate/Reações quando aplicável
    ↓
Resolução reversa
    ↓
Turnos 6–9
    ↓
Novas combinações
    ↓
Escalada
    ↓
Turno 10+
    ↓
Cartas de alto impacto / Ultimates
    ↓
Desfecho da batalha
```

O fluxo competitivo de roster / ban / pick (GDD §3.1) é **pré-batalha**. Não substitui nem reordena este fluxograma.

---

## 18. Fusão

A Fusão é uma recompensa pela construção tática durante a partida.

Regra fundamental:

**A fusão não é aleatória.**

Ela é determinada pelos tipos utilizados na sequência de batalha.

O jogador constrói deliberadamente a combinação necessária para desbloquear determinada habilidade.

A fusão deve funcionar através de uma **gramática de poderes**.

Não criar combinações aleatórias sem coerência.

Cada combinação deve combinar as identidades mecânicas dos tipos.

A fusão não deve ser apenas: “Tipo A + Tipo B = +20% de dano.”

Ela deve criar uma interação mecânica.

---

## 19. Primeira fusão — turno 5

No início do turno 5, o sistema verifica quais tipologias foram efetivamente utilizadas pelas três criaturas durante os turnos anteriores.

Se o jogador utilizou **2 tipos diferentes**:

- desbloqueia a fusão correspondente ao par

Se o jogador utilizou **3 tipos diferentes**:

- desbloqueia as combinações duplas correspondentes
- e também pode acessar uma Fusão Tripla

A partir do turno 5, novas fusões podem ser descobertas conforme novos tipos são utilizados.

O que conta como “tipo efetivamente utilizado” (carta jogada, carta resolvida, carta do personagem): **[A DEFINIR]** além de “utilizadas pelas três criaturas”.

---

## 20. Exemplo de fusão

Se as criaturas utilizarem:

Burn + Control + Heal

O sistema identifica:

- Burn + Control
- Control + Heal
- Burn + Heal

E pode identificar a combinação:

- Burn + Control + Heal

A fusão depende da sequência necessária.

Não deve ser sorteada aleatoriamente.

Definição formal de “sequência necessária” (ordem, janela de turnos, cartas específicas): **[A DEFINIR]**.

---

## 21. Quantidade de combinações

Existem **105 combinações duplas** entre os 15 tipos.

Existem **455 combinações triplas** entre os 15 tipos.

O sistema deve tratar essas combinações como uma matriz de possibilidades.

Nome e efeito de cada célula da matriz, salvo os exemplos já definidos: **[A DEFINIR]**.

---

## 22. Raridade das fusões

| Nível | Requisito | Frequência | Poder |
| --- | --- | --- | --- |
| Comum | 2 tipos | Comum | Alto |
| Rara | 3 tipos | Rara | Muito alto |
| Épica | 3 tipos + condição específica | Épica | Extremamente alto |
| Lendária | 3 tipos + Unique Genetic Power | Lendária | Exclusiva |
| Genesis | Fusão + Unique Power + condição de campo | Genesis | Excepcional |

Condição específica da Épica: **[A DEFINIR]**.

---

## 23. Fusão Lendária

A Fusão Lendária exige **3 tipos + Unique Genetic Power**.

A Unique Genetic Power funciona como modificador da carta gerada.

A fusão resultante não deve ser perfeitamente replicável por outra criatura com tipagens iguais, mas genética diferente.

Exemplo (preservar):

Unique Power: **Eco Abissal**

A fusão pode executar sua ação principal e repetir 50% do efeito no turno seguinte sem custo adicional.

---

## 24. Fusão Genesis

Exige:

- Fusão
- Unique Genetic Power
- condição de campo/bioma

O bioma deve possuir sinergia direta com a tipagem primária da criatura.

A Fusão Genesis pode alterar regras fundamentais do turno.

Exemplos (preservar):

- zerar mitigação de dano inimiga
- paralisar o ganho de Mana do oponente no turno seguinte

Lista de biomas e tabela de sinergia com tipagem primária: **[A DEFINIR]**.

---

## 25. Slot de fusão

A carta de Fusão não entra diretamente na mão principal.

Ela aparece em **Slot Tático / Extra Zone**.

Quando o sistema identificar a sequência necessária, a carta será apresentada nesse espaço.

Quantos slots táticos simultâneos: **[A DEFINIR]**.

---

## 26. Janela de ativação da fusão

A carta de Fusão possui uma janela de ativação.

O jogador normalmente possui **1 a 2 turnos** para pagar o custo e utilizá-la.

Se não for utilizada dentro da janela: **a carta se dissipa**.

A sequência deverá ser reconstruída.

Duração exata (1 ou 2, ou por nível): **[A DEFINIR]**.

---

## 27. Custo das fusões

O custo de uma Fusão deve considerar:

- custos das cartas utilizadas
- quantidade de tipos
- nível da fusão
- Unique Genetic Power
- condição de campo
- poder gerado

A fórmula matemática definida para o sistema utiliza **Poder Total** e **Custo de Energia/Mana**.

Para uma fusão:

`P_Base` = soma do poder das cartas utilizadas.

O Potencial Genético do NFT varia de **0–100**.

O sistema pode utilizar modificadores conforme o nível da fusão.

| Nível | Tipos | M_R | F_M | T_R | Bônus de Campo |
| --- | ---: | ---: | ---: | ---: | ---: |
| Comum | 2 | 1,2 | 0,0 | 0 | 0 |
| Rara | 3 | 1,4 | 0,0 | 0 | 0 |
| Épica | 3 + condição | 1,6 | 0,0 | +1 | 0 |
| Lendária | 3 + Unique Power | 1,8 | 0,4 | +1 | 0 |
| Genesis | Fusão + Unique Power + Bioma | 2,0 | 0,5 | +2 | +15 a +30 |

Como o Bônus de Campo entra no Poder (soma em `P_F` ou outro): **[A DEFINIR]**. O exemplo da Lendária não o usa (valor 0).

---

## 28. Exemplo matemático de fusão

Este exemplo deve ser preservado como referência matemática.

Uma criatura possui:

- Unique Genetic Power: **Coração Incandescente**
- Potência Genética: **92**

Durante o turno 5 utiliza:

| Tipo | P | C |
| --- | ---: | ---: |
| Burn | 18 | 3 |
| Control | 12 | 2 |
| Heal | 20 | 3 |

`P_Base`: 18 + 12 + 20 = 50

`V_Gen`: 92

Fusão Lendária: `M_R` = 1,8 · `F_M` = 0,4

Poder:

```text
P_F = floor((50 × 1,8) + (92 × 0,4))
P_F = floor(90 + 36,8)
P_F = 126
```

Custo:

Soma dos custos: 3 + 2 + 3 = 8

```text
C_F = max(1, ceil(8 / 2) + 1)
C_F = 5 Mana
```

O `+ 1` deste exemplo é o `T_R` da Lendária.

---

## 29. Efeitos, combos e exemplos de fusão

As cartas devem possuir efeitos coerentes com os 15 tipos.

Os efeitos devem criar sinergias entre os tipos.

Exemplos já estabelecidos — não remover:

| Tipos | Nome | Efeito definido |
| --- | --- | --- |
| Burn + Tank | **Fornalha Viva** | +1 HP e +1 RES para aliados. +1 Burn para inimigos. |
| Speed + Critical | **Golpe Relâmpago** | A próxima ação ocorre imediatamente. Critical pode conceder ação adicional. |
| Poison + Control | **Toxina Paralisante** | Poison acumulado interfere no custo das próximas cartas. |
| Shield + Burst | **Colapso Cinético** | Consome Shield para causar dano proporcional ao Shield consumido. |
| Summon + Bleed | **Sacrifício Sangrento** | Sacrifica um Summon para aplicar Bleed proporcional ao HP máximo do Summon. |

Unidade de HP/RES/Burn (+1), fórmula do dano proporcional, janela de “próximas cartas”: **[A DEFINIR]** além do texto acima.

---

## 30. Embate / Guerra Mágica

O combate possui uma **Pilha de Resolução**.

Quando uma carta é jogada, ela entra em estado de **Anúncio**.

O defensor recebe uma janela de poucos segundos para utilizar uma carta de **Intervenção**.

A carta de Intervenção é colocada na pilha.

Duração exata da janela em segundos: **[A DEFINIR]**.

### Resolução reversa

A resolução ocorre: **último a entrar → primeiro a resolver**.

```text
Ação inicial
    ↓
Intervenção
    ↓
Resposta
    ↓
Nova intervenção
```

Quando nenhum jogador puder ou quiser adicionar outra carta, a pilha resolve de trás para frente.

### Sobretaxa de combate

Para impedir guerras infinitas de cartas baratas:

| Passo | Custo |
| --- | --- |
| Ação inicial | custo normal |
| 1ª intervenção | custo normal |
| 2ª intervenção | custo da carta +1 Mana |
| 3ª intervenção | custo da carta +2 Mana |

A sobretaxa continua aumentando conforme necessário.

O limite máximo normal de Mana continua sendo **10 Mana por turno**.

Incremento da 4ª intervenção em diante: o texto diz que continua aumentando. Passo de +1 por intervenção adicional está implícito na progressão 0 / +1 / +2. Confirmar se a 4ª é +3: **[A DEFINIR]** se não for essa leitura da progressão já escrita.

### Exemplos de intervenção

#### Counter

Pode cancelar ou punir uma ação.

Exemplo: se a Vanguarda receber dano naquele turno:

- cancela o ataque
- devolve dano equivalente ao atacante

#### Shield

Pode criar uma barreira instantânea no alvo que está prestes a receber Burst.

#### Speed

Pode alterar o alvo do ataque inimigo para uma criatura mais resistente.

#### Control

Pode aumentar o custo da carta inimiga.

Exemplo: Fusão inimiga +2 Mana.

Se o oponente não possuir Mana suficiente: a carta falha e vai para o descarte.

---

## 31. Princípio de balanceamento

Não transformar todas as vantagens em aumento percentual de dano.

As vantagens devem acontecer através de:

- controle
- posicionamento
- alcance
- tempo
- custo
- status
- reação
- formação
- Momentum
- Mana
- combos
- fusões

O jogador deve conseguir responder à estratégia adversária.

---

## 32. Princípio genético

A genética é parte central.

Cada criatura possui:

- espécie
- genética
- genes dominantes
- genes recessivos
- mutações
- linhagem
- genealogia
- Unique Genetic Power

A genética deve influenciar a identidade da criatura.

---

## 33. Evolução por consumo

Existe um sistema de evolução através do consumo de outras criaturas da mesma espécie.

Estrutura definida:

- nível inicial
- consumo de cópias
- evolução progressiva
- fortalecimento das cartas

A evolução não deve copiar a Unique Genetic Power de outra criatura.

A Unique Genetic Power permanece vinculada à identidade genética da criatura.

Valor do nível inicial, quantas cópias, o que “fortalecimento das cartas” altera: **[A DEFINIR]**.

---

## 34. Crescimento por tempo de vida

O crescimento da criatura é separado do nível.

Estados: **Filhote → Jovem → Adulto**

O crescimento acontece através do tempo de vida.

O tempo de vida pode influenciar:

- atributos
- potencial
- cartas
- desenvolvimento

Não confundir idade com nível.

Duração de cada estado: **[A DEFINIR]**.

---

## 35. Potencial genético

Cada criatura possui **Potencial Genético de 0 a 100**.

O potencial pode influenciar a capacidade da criatura e de sua linhagem.

A genética pode ser transmitida para descendentes.

O potencial de descendentes pode considerar:

- qualidade dos pais
- herança
- compatibilidade
- mutações
- potencial genético

A perda de potencial não deve simplesmente destruir o valor do NFT original.

Fórmula de herança: **[A DEFINIR]**.

---

## 36. Contrato para implementação

Isto não adiciona mecânica. Só nomeia o que o fluxograma já exige no motor.

### Autoridade

O cliente não envia: dano, loot, alvo “válido” calculado no cliente, vencedor, Mana/Momentum resultantes, fusão sorteada.

O servidor valida alvo pela formação + alcance + turno + regras de carta.

### Estado mínimo implícito no fluxograma

Por lado:

- personagem
- 3 criaturas (posição, HP, tipo(s) utilizados, Unique Genetic Power, Potencial Genético 0–100)
- Mana (0–10, teto do turno)
- Momentum (recurso separado)
- mão
- descarte
- Slot Tático / Extra Zone
- histórico de tipos efetivamente utilizados
- fusão apresentada (nível, janela restante) ou dissipada

Global:

- número do turno
- formação de cada lado
- Pilha de Resolução (ordem de anúncio)
- profundidade da sobretaxa
- bioma / condição de campo (Genesis)

### RNG

Geração de cartas usa gramática, não aleatoriedade sem controle.

Fusão: sem sorteio.

Reciclagem: se houver embaralhamento, só `RandomService`. O fluxograma não define o algoritmo.

### Ordem de implementação sugerida (não altera o fluxo)

1. Formação + seleção de alvos + alcance + morte da Frente (incluindo o exemplo dos turnos 6–9).
2. Mana 1–10 e restauração no início do turno.
3. 10 cartas por criatura + descarte/reciclagem.
4. Histórico de tipos + primeira janela no turno 5 + Slot Tático + dissipação.
5. Fórmulas `P_F` / `C_F` com a tabela e o exemplo da Lendária.
6. Pilha + resolução reversa + sobretaxa + Intervenção.
7. Gramática dos 15 tipos e matriz 105 / 455 (células **[A DEFINIR]** entram vazias, sem efeito inventado).
8. Unique Genetic Power nas Lendária / Genesis.
9. Ligação no `reduceBattle` atrás de flag. Alpha casual V1 não é reescrito por esta spec.

---

## 37. Registro [A DEFINIR]

Nada abaixo é regra. É o que o fluxograma ainda não fechou.

1. Condição de vitória / desfecho.
2. Papel espacial do personagem no tabuleiro.
3. Colocação e troca de formação sem morte.
4. Turno inicial da janela do Meio (antes da morte da Frente).
5. Categorias de ataque que usam a inalvoabilidade do Meio, além do alcance.
6. Morte do Meio ou do Trás com a Frente viva; segunda morte após o colapso da Frente.
7. Balanceamento numérico de Longo Alcance.
8. Escolha AoE (duas vs três criaturas).
9. Proporções de alcance por pares de tipos.
10. Números de status / crítico / stacks por tipo.
11. Gramática formal de geração de cartas.
12. Cartas do personagem, equipamentos e sistemas de combate (quantidade).
13. Mão, compra, teto.
14. Ativação da Unique Genetic Power no combate.
15. Momento e algoritmo da reciclagem.
16. Persistência da sobra de Mana.
17. Economia completa de Momentum.
18. Iniciativa / simultaneidade dos turnos.
19. Definição formal de “tipo efetivamente utilizado” e de “sequência necessária”.
20. Nome e efeito das 105 + 455 células não exemplificadas.
21. Condição específica da Fusão Épica.
22. Biomas e sinergia com tipagem primária.
23. Aplicação do Bônus de Campo no `P_F`.
24. Quantidade de Slots Táticos simultâneos.
25. Duração exata da janela de fusão (1 ou 2).
26. Duração em segundos da janela de Intervenção.
27. Sobretaxa da 4ª intervenção em diante, se a leitura da progressão 0 / +1 / +2 não for suficiente.
28. Unidades e fórmulas restantes dos cinco exemplos de fusão.
29. Números da evolução por consumo.
30. Duração Filhote / Jovem / Adulto.
31. Fórmula de potencial dos descendentes.

---

## 38. O que deve ser preservado

1. Todos os nomes.
2. Os 15 tipos.
3. A formação.
4. As regras de seleção de alvos.
5. A alternância do Meio.
6. A habilitação do Trás quando o Meio estiver inalvejável.
7. O sistema de alcance.
8. Mana máxima de 10.
9. A progressão de Mana.
10. Momentum como recurso separado.
11. Os 10 cards por criatura.
12. A Unique Genetic Power.
13. O sistema de descarte/reciclagem.
14. A primeira janela de Fusão no turno 5.
15. A Fusão determinística.
16. As 105 combinações duplas.
17. As 455 combinações triplas.
18. As categorias Comum, Rara, Épica, Lendária e Genesis.
19. A interação com Unique Genetic Power.
20. A condição de bioma da Genesis.
21. O Slot Tático.
22. A janela de 1–2 turnos para ativação.
23. A dissipação da Fusão.
24. A Pilha de Resolução.
25. A resolução reversa.
26. A Sobretaxa de Combate.
27. As cartas de Intervenção.
28. Os exemplos de fusão já definidos.
29. A integração entre alcance e tipagens.
30. A estrutura geral do fluxo de combate.

Não fazer redesign. Não balancear por conta própria. Não substituir uma mecânica por outra. Não remover regra por parecer complexa. Não adicionar regra sem marcá-la **[A DEFINIR]**.

---

## 39. Relação com a documentação e o código atuais

Este arquivo é o fluxograma. Os documentos abaixo **não o substituem**.

| Documento / módulo | Papel | Desvio conhecido (não copiar para cima deste fluxograma) |
| --- | --- | --- |
| `docs/COMBAT.md` | Visão geral do combate tático, autoridade, deck competitivo | Mão 5 / compra 2 / deck ~16 / Convergence no 7 **não** estão neste fluxograma |
| `docs/COMBAT_MATRIX.md` | Fatia V2 já prototipada | Draft 5→ban→pick; colapso MIDDLE→FRONT e BACK→MIDDLE; Convergence no 7 |
| `docs/COMBAT_ENGINE.md` + ADR 0030 | Guerra Mágica e memória de draft já extraídas | Janela do Meio fixada em round par; AoE = todos os vivos; Momentum paga defesa emergencial; `P_F` / `C_F` com `M_R`/`F_M`/`T_R` diferentes da tabela §27; exemplo 78/3 em vez de 126/5 |
| `docs/FORMATIONS.md` | Slots V1/V2 | “ímpar protegido, par alvo” e promoção BACK→MIDDLE não estão neste fluxograma |
| `packages/config/src/combat-engine.ts` | Números da fatia ADR 0030 | `rarityMultiplier` / `manifestationFactor` / `rarityManaTax` ≠ tabela §27; sobretaxa limitada a `[0, 1, 2]` |
| `fusion-formula.ts` | Funções puras da fatia | Usam os números do config acima |
| GDD §3.1 / §27 | Mapa mestre e party | Roster/ban/pick é pré-batalha; Convergence 7 é outro recorte |

Reconciliação futura: ajustar a fatia de código **para este fluxograma**, não o contrário. Sem preencher **[A DEFINIR]**.
