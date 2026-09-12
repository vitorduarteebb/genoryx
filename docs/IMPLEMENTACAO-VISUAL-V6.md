# GENORYX — implementação visual V5/V6

Implementação local em 11/09/2026. Nenhum deploy executado.

## Bocas 3D

| Cabeça expressa | Boca | Dentes |
|---|---|---:|
| HEAD_01_SMOOTH | Presas curtas | 8 |
| HEAD_02_PREDATOR | Caninos de sabre | 12 |
| HEAD_03_DRACONIC | Dentição serrilhada | 24 |
| HEAD_04_ARCANE | Bico dracônico com presas | 8 + bico |

`apps/web/src/lib/creature-mouth.ts` constrói lábios, interior escuro, dentes superiores/inferiores e presas curvas. O controlador central posiciona a boca sobre a superfície deformada da cabeça em Socket_Head. Um morph MouthOpen deforma a mandíbula durante ataques, rugido, reação e nascimento; os dentes inferiores acompanham a abertura. Movimento reduzido mantém uma expressão calma.

O tipo acompanha o gene de cabeça já expresso pelo servidor. Não foi criado um locus independente de boca nem alterado o DNA armazenado. As bocas entram nas criaturas modulares Art04 que usam o controlador central; modelos externos arbitrários sem esse socket não recebem a anatomia automaticamente.

Quatro arquivos em `apps/web/public/genoryx-art04/mouths/`, total de 358.112 bytes, com animação `Mouth_Roar`. São peças em coordenadas locais da cabeça. No jogo, a projeção se adapta à cabeça real; um GLB isolado precisa ser montado no socket correspondente.

## Trabalho visual anterior incorporado

- Máscaras genéticas identificadas pela soma dos canais, corrigindo a confusão entre COLOR_0 e a paleta de prévia COLOR_1; cores convertidas de sRGB corretamente.
- Quatro perfis de cabeça e cinco de olhos; deformação contínua preservando a região do pescoço.
- Cinco ovos 3D: salpicado, escamado, cristalino, obsidiana e celestial. GLBs com incubação, rachadura e eclosão em `public/genoryx-art04/eggs/`.
- Ovos integrados ao nascimento, cards e etapas anteriores à revelação. A aparência da casca usa informações públicas; o relógio do cliente não autoriza uma eclosão.
- Prévia dos pais no breeding conserva o chassis e estágio de vida. Respiração e piscadas usam o controlador compartilhado.

## Verificação

- TypeScript do web: passou.
- Build de produção do web: passou, com 27 páginas estáticas geradas. O cache do webpack emitiu aviso de snapshot; a compilação terminou com código 0.
- 10 testes do web: passaram. Incluem máscaras, 20 perfis cabeça/olhos, respiração/piscadas, cinco ovos, orientação de batalha e geometria/animação das quatro bocas.
- Quatro GLBs de boca: cabeçalho, tamanho, quantidade de dentes e canais de animação verificados.
- Reimportação dos quatro GLBs pelo GLTFLoader: passou. O AnimationMixer reproduziu Mouth_Roar e acionou os dois morphs de lábio/interior em cada arquivo.
- Laboratório no navegador: quatro tipos renderizados; nenhum erro de console observado. 30 fixtures distribuídas entre bebê, jovem e adulto passaram pela validação de 13 estados de animação, com DNA inalterado e transformações finitas.
- A validação de fixtures não equivale a teste de todas as combinações nem garante ausência de toda interseção durante combate. Houve pico inicial de compilação/renderização; não se apresenta isso como benchmark de desempenho final.
- O fluxo completo de nascimento foi exercitado com fixture local. Fluxo autenticado com banco de produção e build Unity não foram validados nesta etapa.

Prévia local: `/dev/creature-visual`. A seção de anatomia permite trocar cabeça/olhos e testar rugido. A galeria permite baixar as quatro bocas e cinco ovos.

## Publicação futura pelo Cursor — não executada

Esta alteração é de apresentação web. Não requer migração de DNA, reseed nem troca de provedor de imagens.

1. No PowerShell local, revisar os arquivos e executar `npm run typecheck` e `npm run build -w @nexora/web` na raiz do projeto.
2. Quando o responsável autorizar a publicação, executar `powershell -ExecutionPolicy Bypass -File deploy/scripts/vps-pack.ps1`. O script envia o pacote; não executar a sugestão final de `vps-deploy-remote.sh`, pois esse outro script também altera configuração e dados fora do escopo visual.
3. Conectar com `ssh -i "$env:USERPROFILE\.ssh\id_ed25519_vps_paesleme" root@85.31.60.84` e executar:

```sh
cd /opt/nexora
test -f .env.production
test -f /tmp/nexora-alpha.tgz
backup_dir="/opt/nexora-visual-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$backup_dir"
cp -a apps/web "$backup_dir/web"
cp -a package.json package-lock.json .env.production "$backup_dir/"
tar -xzf /tmp/nexora-alpha.tgz -C /opt/nexora
docker compose -f docker-compose.vps.yml --env-file .env.production build web
docker compose -f docker-compose.vps.yml --env-file .env.production up -d --no-deps web
docker compose -f docker-compose.vps.yml --env-file .env.production logs --tail=80 web
curl -f http://127.0.0.1:3100/genoryx-art04/mouths/manifest.json
```

4. Conferir coleção, breeding, nascimento e ataque em uma criatura existente. Não confirmar operações de breeding pagas apenas para testar. Preservar o backup para rollback do web se houver regressão.
