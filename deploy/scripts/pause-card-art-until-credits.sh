#!/usr/bin/env sh
# Pausa geração até créditos OpenAI — reativar com run-all-card-art-now.sh
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c \
  "UPDATE card_art_assets SET next_attempt_at = NOW() + interval '24 hours' WHERE scope='CREATURE' AND status = 'PENDING';"
echo "PAUSED until credits added. Run: sh /tmp/run-all-card-art-now.sh"
