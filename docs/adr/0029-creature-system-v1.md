# ADR 0029 — GENORYX Creature System V1 (chassi modular 3D)

- Status: aceito
- Data: 2026-09-04

## Contexto

O ADR 0016 usa Meshy para gerar criaturas inteiras e o ADR 0015 renderiza arte 2D por
genética. Nenhum dos dois serve para o mundo 3D: gerar uma malha por criatura significa
chamar um serviço externo no nascimento/breeding, com custo por indivíduo, latência e
resultado não reprodutível entre cliente e servidor.

O que o jogo precisa é o inverso: um chassi único, peças modulares e montagem instantânea
a partir do DNA, com o mesmo skeleton e as mesmas animações para qualquer combinação.

## Decisão

1. **Meshy é produção de asset, nunca runtime.** Breeding, spawn e captura montam a
   criatura a partir de IDs. Nenhum caminho de código de gameplay chama Meshy.
2. **Chassi único** `GENORYX_CORE_CHASSIS_V1` e **skeleton único** `GENORYX_CORE_RIG`
   (21 bones: 13 deformantes + 8 sockets). Toda combinação usa este rig; os sockets são
   contrato e não se movem para acomodar peça.
3. **V1 é procedural.** `CreatureMeshLab` gera as malhas de todos os slots e o
   `GenoryxCreatureSystemBuilder` as materializa em `.asset` versionados. Uma peça vinda de
   Meshy + Blender substitui a malha na `CreaturePartDefinition` sem tocar no runtime.
4. **Superfície analítica como fonte de verdade.** `CreatureChassisSurface` avalia o mesmo
   perfil que gera a malha, e `CreatureAssembler.ReseatRigidParts` desliza cada peça rígida
   até a pele da cabeça/corpo atual. Isso substitui teste de AABB e sondagem amostrada, que
   reprovavam peças corretas.
5. **Um Material por arquétipo.** Variação vai por `MaterialPropertyBlock`; nunca se
   instancia Material por criatura.
6. **Renderers persistentes.** Trocar peça troca `sharedMesh`, não destrói e recria objeto:
   1000 swaps não podem vazar GameObject, Animator, skeleton nem Material.
7. **O perfil da silhueta é interpolado por Hermite com tangente em Z.** Não é detalhe de
   estilo: interpolação por segmento com derivada nula nos nós (smoothstep) dava um patamar
   por slice e a criatura saía listrada de anéis concêntricos no dorso. Qualquer perfil
   novo tem que manter continuidade C1, senão o defeito volta.
8. **Volume de crânio e queixo entram como bump local, não como escala em torno do pivô.**
   Escalando, perto do focinho a distância ao pivô é pequena e a cabeça mais alta ganhava
   9 mm sobre a mais baixa: os quatro estilos ficavam indistinguíveis e, de perfil, a
   criatura lia como peixe-boi sem cabeça identificável.

9. **O bundle WebGL publicado sai só da cena de criaturas, em gzip com
   `decompressionFallback`.** Incluir `HavenSlice`/`CharacterCreation` arrasta o acervo GLB
   do pipeline de personagem, porque o Unity copia `StreamingAssets` inteiro: o bundle ia a
   330 MB para uma cena que não lê nada de lá. O fallback existe porque quem serve
   `public/` é o Next, que não devolve `Content-Encoding` por extensão — sem ele o browser
   recebe o `.gz` como wasm cru e o loader morre em "magic word". Com as duas decisões o
   deploy fica em ~20 MB e não depende de configuração de servidor.
10. **Shader resolvido por `Shader.Find` precisa estar em Always Included Shaders.** No
    editor `Shader.Find` enxerga o projeto todo; no player só o que o build incluiu, e
    nenhum material de cena referencia os shaders de partícula. Sem registrar, a aura caía
    num shader sem textura e virava um quadrado branco em tela. Pelo mesmo motivo o
    billboard recebe um sprite radial gerado em código: partícula sem textura é um quad
    opaco em qualquer plataforma.
11. **Fenótipo do chassi é único no servidor.** `chassisSignature` (peças + cores, sem
    growth) é unique no banco. Breeding e spawn recusam colisão e sorteiam de novo.
    Duas criaturas vivas não podem parecer iguais. O retrato da coleção pinta esse DNA
    — a arte 2D antiga não substitui a fisionomia do chassi.

## Consequências

- Breeding tem custo zero de asset e é determinístico por IDs: multiplayer-ready.
- Baby/Juvenile/Adult são escala sobre o mesmo rig, não modelos novos.
- O visual depende de conseguirmos boas peças; a troca por assets autorados é incremental,
  peça a peça, sem migração de dados.
- Todo ajuste de geometria precisa passar pelo rebake dos `.asset`. O teste
  `BAKED_MESH_FRESHNESS` existe porque um asset congelado torna invisível qualquer mudança
  de forma e desalinha as peças rígidas em silêncio.
- O bundle WebGL é artefato de build commitado em `apps/web/public/unity-game`, e a imagem
  `web` o serve como estático. Mudança na cena de criaturas só chega ao Alpha depois de
  `GENORYX/Build/WebGL` e um novo deploy: não há CI de Unity.
- Diferença entre editor e player agora tem rede de proteção fora do Unity:
  `deploy/scripts/smoke-unity-webgl.mjs` sobe um Chromium headless contra a URL publicada e
  falha se o runtime não inicializar. Foi assim que os quadrados brancos da aura
  apareceram — nenhuma captura de editor os mostrava.
