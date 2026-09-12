#!/usr/bin/env sh
set -eu
DOMAIN="${1:-alpha.nexora.local}"
DIR="$(CDPATH= cd -- "$(dirname -- "$0")/../nginx/certs" && pwd)"
mkdir -p "$DIR"
openssl req -x509 -nodes -newkey rsa:2048 -days 30 \
  -keyout "$DIR/privkey.pem" \
  -out "$DIR/fullchain.pem" \
  -subj "/CN=${DOMAIN}"
echo "certificado autoassinado em ${DIR} para ${DOMAIN}"
echo "substitua por Let's Encrypt antes de testers reais (ver docs/DEPLOYMENT.md)"
