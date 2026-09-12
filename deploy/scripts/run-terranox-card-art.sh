#!/usr/bin/env sh
set -eu
sed -i 's/\r$//' /tmp/generate-terranox-card-art.mjs
mkdir -p /tmp/terranox-card-art
docker run --rm --env-file /opt/nexora/.env.production \
  -e CARD_ART_OUT_DIR=/out \
  -e CANONICAL_REF_PNG=/ref.png \
  -v /tmp/terranox-card-art:/out \
  -v /tmp/terranox-canonical.png:/ref.png \
  -v /tmp/generate-terranox-card-art.mjs:/gen.mjs \
  node:20-bookworm node /gen.mjs
