#!/usr/bin/env sh
set -eu
CREATURE=64ae34e9-086a-4f42-8e6e-db2a5a373ce7
USER_ID=$(docker exec nexora-alpha-postgres psql -U nexora -d nexora -tAc "SELECT u.id FROM users u JOIN characters ch ON ch.user_id=u.id JOIN creatures c ON c.owner_id=ch.id WHERE c.id='$CREATURE' LIMIT 1;")
TOKEN=$(docker exec -e USER_ID="$USER_ID" nexora-alpha-api node -e "const jwt=require('jsonwebtoken'); console.log(jwt.sign({sub:process.env.USER_ID,typ:'access'}, process.env.JWT_ACCESS_SECRET, {expiresIn:'10m'}));")
curl -sS -H "Authorization: Bearer $TOKEN" "http://127.0.0.1:3101/creatures/$CREATURE" > /tmp/c.json
node -e 'const c=require("/tmp/c.json"); const cards=(c.geneticPower&&c.geneticPower.cards)||[]; let ok=0; for (const row of cards) { const art=row.artUrl||""; console.log(row.locus, row.namePt||row.name, art?"ART":"NOART", art); if(art) ok++; } console.log("READY_ARTS", ok+"/"+cards.length); if(ok<10) process.exit(1);'
ids=$(docker exec nexora-alpha-postgres psql -U nexora -d nexora -tAc "SELECT id FROM card_art_assets WHERE creature_id='$CREATURE' AND status='READY' ORDER BY genetic_card_manifestation_id;")
for id in $ids; do
  curl -sS -o /tmp/p.png -w "$id %{http_code} %{size_download}\n" "http://127.0.0.1:3101/card-art/$id/image"
done
