# GENORYX — mandíbula articulada e montagem bípede

Implementado no projeto local em 12/09/2026. Sem deploy.

## Montagem concluída

- Mandíbula separada por recorte dos triângulos da cabeça. A malha superior não é esticada durante a abertura; UVs e canais de cor são interpolados no corte.
- Pele inferior, lábio e dentes inferiores giram no mesmo pivô. A abertura foi limitada a um arco mais suave; a boca permanece fechada em repouso. O interior recebe teto e fundo escuros.
- Quatro bocas preservadas: presas curtas, sabre, serrilhada e bico dracônico. Os GLBs em `apps/web/public/genoryx-art04/mouths/` foram atualizados com `MandiblePivot` e animação `Mouth_Roar`.
- Corpos `BIPED`, `INSECTOID_BIPED` e `HUMANOID_BEAST` usam a montagem bípede. Torso, pelve, braços, pernas, patas e garras têm geometria própria; as cabeças, olhos, chifres, caudas, núcleos e peças das costas continuam usando as peças genéticas existentes.
- O gene de membros controla a espessura da anatomia bípede. As malhas de patas quadrúpedes não são deformadas para formar o corpo ereto.
- Postura, caminhada, corrida, ataque e rugido usam adaptação do esqueleto de 12 ossos. Respiração e piscada permanecem ativas. O apoio considera somente os pés traseiros, e o enquadramento reserva espaço para a altura do bípede.
- Plano corporal repassado às prévias da coleção, seleção, perfil, pais no breeding e nascimento. A batalha já fornece esse dado ao controlador compartilhado.

## Genética

O plano corporal já existia no servidor. Florune pode expressar `BIPED`; o cruzamento de progenitores com planos diferentes pode herdar o plano expresso de um deles. A implementação torna esse dado visível em 3D. Não foram criados novos sorteios no cliente nem modificados DNA, IDs ou criaturas existentes.

## Verificação

- 12 testes visuais passaram; os testes específicos da mandíbula foram repetidos após o ajuste final.
- 221 testes do motor passaram, incluindo o teste novo com 64 sementes de cruzamento bípede/quadrúpede. Foi necessário recompilar `types` e `config`, pois o artefato de configuração anterior não expunha os valores usados pelo combate atual.
- TypeScript do web passou.
- Laboratório: 30 combinações bípedes distribuídas entre bebê, jovem e adulto, cada uma em 13 estados, passaram nos critérios de transformações finitas, esqueleto e preservação de DNA.
- Os quatro GLBs foram reimportados; pivô, hierarquia do lábio inferior e reprodução da animação passaram.
- Inspeção no navegador: montagem bípede, caminhada e abertura da mandíbula; sem erros de console observados na captura final.

A auditoria automática não substitui revisão artística de todas as combinações e não é um benchmark de desempenho. O fluxo autenticado no servidor de produção e o cliente Unity não foram exercitados nesta etapa. A montagem bípede é gerada no renderizador web; não foi exportado um novo personagem Unity.

## Revisão local

Na raiz do projeto, iniciar `npm run dev -w @nexora/web` e abrir `/dev/creature-visual`. Selecionar **Corpo → Bípede**, variar idade e movimento. A seção de anatomia permite comparar as quatro bocas e acionar o rugido.

Implementação principal: `creature-jaw.ts`, `creature-mouth.ts`, `creature-biped.ts` e `creature-visual-controller.ts`, em `apps/web/src/lib/`.

Build final de produção do web: PASS, código 0, 27 páginas estáticas geradas. Sem deploy.
