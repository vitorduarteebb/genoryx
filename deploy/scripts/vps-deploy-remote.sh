#!/usr/bin/env sh
set -eu
cd /opt/nexora

if [ ! -f /tmp/nexora-alpha.tgz ]; then
  echo "faltando /tmp/nexora-alpha.tgz"
  exit 1
fi

if [ ! -f .env.production ]; then
  echo "faltando /opt/nexora/.env.production"
  exit 1
fi

cp -a .env.production "/tmp/nexora.env.production.bak"

if docker ps --format '{{.Names}}' | grep -q '^nexora-alpha-postgres$'; then
  sh deploy/scripts/vps-backup.sh || true
fi

tar -xzf /tmp/nexora-alpha.tgz -C /opt/nexora
cp -a /tmp/nexora.env.production.bak .env.production

# CRLF from Windows tarball
find deploy -type f -name '*.sh' -exec sed -i 's/\r$//' {} +
find deploy -type f -name '*.yml' -exec sed -i 's/\r$//' {} +
sed -i 's/\r$//' docker-compose.vps.yml || true

if ! grep -q '^CREATURE_IMAGE_STORAGE_DIR=' .env.production; then
  printf '\nCREATURE_IMAGE_STORAGE_DIR=/app/var/creature-visuals\n' >> .env.production
fi
if ! grep -q '^CREATURE_MODEL_STORAGE_DIR=' .env.production; then
  printf 'CREATURE_MODEL_STORAGE_DIR=/app/var/creature-models\n' >> .env.production
fi
if ! grep -q '^CREATURE_VISUAL_GENERATION_CONCURRENCY=' .env.production; then
  printf 'CREATURE_VISUAL_GENERATION_CONCURRENCY=2\n' >> .env.production
fi
if grep -q '^CREATURE_IMAGE_PROVIDER=' .env.production; then
  sed -i 's/^CREATURE_IMAGE_PROVIDER=.*/CREATURE_IMAGE_PROVIDER=mock/' .env.production
else
  printf 'CREATURE_IMAGE_PROVIDER=mock\n' >> .env.production
fi
if grep -q '^SKIP_VISUAL_WORKER=' .env.production; then
  sed -i 's/^SKIP_VISUAL_WORKER=.*/SKIP_VISUAL_WORKER=1/' .env.production
else
  printf 'SKIP_VISUAL_WORKER=1\n' >> .env.production
fi
if grep -q '^EGG_AI_ART=' .env.production; then
  sed -i 's/^EGG_AI_ART=.*/EGG_AI_ART=false/' .env.production
else
  printf 'EGG_AI_ART=false\n' >> .env.production
fi
if ! grep -q '^OPENAI_CREATURE_IMAGE_MODEL=' .env.production; then
  printf 'OPENAI_CREATURE_IMAGE_MODEL=gpt-image-2-2026-04-21\n' >> .env.production
fi
if ! grep -q '^CARD_ART_STORAGE_DIR=' .env.production; then
  printf 'CARD_ART_STORAGE_DIR=/app/var/card-art\n' >> .env.production
fi
if grep -q '^CARD_ART_PROVIDER=' .env.production; then
  sed -i 's/^CARD_ART_PROVIDER=.*/CARD_ART_PROVIDER=mock/' .env.production
else
  printf 'CARD_ART_PROVIDER=mock\n' >> .env.production
fi
if grep -q '^OPENAI_CARD_ART_MODEL=' .env.production; then
  sed -i 's/^OPENAI_CARD_ART_MODEL=.*/OPENAI_CARD_ART_MODEL=gpt-image-2-2026-04-21/' .env.production
else
  printf 'OPENAI_CARD_ART_MODEL=gpt-image-2-2026-04-21\n' >> .env.production
fi
if grep -q '^BATTLE_RENDERER=' .env.production; then
  sed -i 's/^BATTLE_RENDERER=.*/BATTLE_RENDERER=web/' .env.production
else
  printf 'BATTLE_RENDERER=web\n' >> .env.production
fi
if grep -q '^NEXT_PUBLIC_BATTLE_RENDERER=' .env.production; then
  sed -i 's/^NEXT_PUBLIC_BATTLE_RENDERER=.*/NEXT_PUBLIC_BATTLE_RENDERER=web/' .env.production
else
  printf 'NEXT_PUBLIC_BATTLE_RENDERER=web\n' >> .env.production
fi
# Matrix V2 no Alpha. PvE, Casual e Ranked nascem em rulesVersion V2.
if grep -q '^COMBAT_DRAFT_V2=' .env.production; then
  sed -i 's/^COMBAT_DRAFT_V2=.*/COMBAT_DRAFT_V2=true/' .env.production
else
  printf 'COMBAT_DRAFT_V2=true\n' >> .env.production
fi
if grep -q '^FORMATION_LINEAR_V2=' .env.production; then
  sed -i 's/^FORMATION_LINEAR_V2=.*/FORMATION_LINEAR_V2=true/' .env.production
else
  printf 'FORMATION_LINEAR_V2=true\n' >> .env.production
fi
if grep -q '^FUSION_V2=' .env.production; then
  sed -i 's/^FUSION_V2=.*/FUSION_V2=true/' .env.production
else
  printf 'FUSION_V2=true\n' >> .env.production
fi
if grep -q '^CONVERGENCE_V1=' .env.production; then
  sed -i 's/^CONVERGENCE_V1=.*/CONVERGENCE_V1=true/' .env.production
else
  printf 'CONVERGENCE_V1=true\n' >> .env.production
fi
if grep -q '^GENETIC_CARD_ART_POLICY=' .env.production; then
  sed -i 's/^GENETIC_CARD_ART_POLICY=.*/GENETIC_CARD_ART_POLICY=FULL_CREATURE/' .env.production
else
  printf 'GENETIC_CARD_ART_POLICY=FULL_CREATURE\n' >> .env.production
fi
if grep -q '^GENETIC_CARD_ART_CREATURE_IDS=' .env.production; then
  sed -i 's/^GENETIC_CARD_ART_CREATURE_IDS=.*/GENETIC_CARD_ART_CREATURE_IDS=/' .env.production
else
  printf 'GENETIC_CARD_ART_CREATURE_IDS=\n' >> .env.production
fi
# Laboratório visual da criatura: 404 em produção sem esta flag.
if grep -q '^CREATURE_VISUAL_LAB=' .env.production; then
  sed -i 's/^CREATURE_VISUAL_LAB=.*/CREATURE_VISUAL_LAB=1/' .env.production
else
  printf 'CREATURE_VISUAL_LAB=1\n' >> .env.production
fi
if grep -q '^ECONOMY_PROFILE=' .env.production; then
  sed -i 's/^ECONOMY_PROFILE=.*/ECONOMY_PROFILE=alpha/' .env.production
else
  printf 'ECONOMY_PROFILE=alpha\n' >> .env.production
fi
if ! grep -q '^CHASSIS_RESEED_TOKEN=.\+' .env.production; then
  sed -i '/^CHASSIS_RESEED_TOKEN=/d' .env.production
  printf 'CHASSIS_RESEED_TOKEN=%s\n' "$(openssl rand -hex 24)" >> .env.production
fi

sh deploy/scripts/vps-up-api-web.sh

# Plantel legado (sem chassisSignature) vira 5 criaturas únicas. Idempotente:
# quem já tem assinatura não é tocado. Token só no host, API escuta em 127.0.0.1.
token=$(grep '^CHASSIS_RESEED_TOKEN=' .env.production | cut -d= -f2)
if [ -n "$token" ]; then
  curl -sS -X POST -H "x-reseed-token: $token" http://127.0.0.1:3101/internal/chassis-reseed || true
  i=0
  while [ "$i" -lt 20 ]; do
    if curl -sf http://127.0.0.1:3101/health >/dev/null 2>&1; then
      break
    fi
    i=$((i + 1))
    sleep 2
  done
  curl -sS -X POST -H "x-reseed-token: $token" http://127.0.0.1:3101/internal/alpha-test-boost || true
fi
