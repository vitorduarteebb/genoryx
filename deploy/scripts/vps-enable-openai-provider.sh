#!/usr/bin/env sh
# Liga o provider OpenAI no Alpha. Não imprime nem grava a chave.
set -eu
cd /opt/nexora

if [ ! -f .env.production ]; then
  echo "faltando /opt/nexora/.env.production"
  exit 1
fi

if grep -q '^CREATURE_IMAGE_PROVIDER=' .env.production; then
  sed -i 's/^CREATURE_IMAGE_PROVIDER=.*/CREATURE_IMAGE_PROVIDER=openai/' .env.production
else
  printf '\nCREATURE_IMAGE_PROVIDER=openai\n' >> .env.production
fi

if grep -q '^OPENAI_CREATURE_IMAGE_MODEL=' .env.production; then
  sed -i 's/^OPENAI_CREATURE_IMAGE_MODEL=.*/OPENAI_CREATURE_IMAGE_MODEL=gpt-image-2-2026-04-21/' .env.production
else
  printf 'OPENAI_CREATURE_IMAGE_MODEL=gpt-image-2-2026-04-21\n' >> .env.production
fi

if ! grep -q '^OPENAI_API_KEY=.' .env.production; then
  echo "OPENAI_API_KEY ausente em /opt/nexora/.env.production"
  echo "Coloque uma NOVA chave neste arquivo (não use chave antiga, não cole no chat)."
  exit 2
fi

echo "provider=openai model=gpt-image-2-2026-04-21 key=present"
