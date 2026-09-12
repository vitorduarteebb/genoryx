#!/usr/bin/env sh
# Liga Card Art OpenAI no Alpha. Não imprime a chave.
set -eu
cd /opt/nexora

if [ ! -f .env.production ]; then
  echo "faltando /opt/nexora/.env.production"
  exit 1
fi

if grep -q '^CARD_ART_PROVIDER=' .env.production; then
  sed -i 's/^CARD_ART_PROVIDER=.*/CARD_ART_PROVIDER=openai/' .env.production
else
  printf '\nCARD_ART_PROVIDER=openai\n' >> .env.production
fi

if grep -q '^OPENAI_CARD_ART_MODEL=' .env.production; then
  sed -i 's/^OPENAI_CARD_ART_MODEL=.*/OPENAI_CARD_ART_MODEL=gpt-image-2-2026-04-21/' .env.production
else
  printf 'OPENAI_CARD_ART_MODEL=gpt-image-2-2026-04-21\n' >> .env.production
fi

if ! grep -q '^CARD_ART_STORAGE_DIR=' .env.production; then
  printf 'CARD_ART_STORAGE_DIR=/app/var/card-art\n' >> .env.production
fi

if ! grep -q '^OPENAI_API_KEY=.' .env.production; then
  echo "OPENAI_API_KEY ausente em /opt/nexora/.env.production"
  exit 2
fi

echo "card-art provider=openai model=gpt-image-2-2026-04-21 key=present"
