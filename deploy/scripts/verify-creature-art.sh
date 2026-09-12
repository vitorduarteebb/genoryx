#!/usr/bin/env sh
set -eu
CREATURE="${1:-71c65553-a3a1-4ea7-a52b-60b4693eb89b}"
USER_ID=$(docker exec nexora-alpha-postgres psql -U nexora -d nexora -tAc "SELECT u.id FROM users u JOIN characters ch ON ch.user_id=u.id JOIN creatures c ON c.owner_id=ch.id WHERE c.id='$CREATURE' LIMIT 1;")
TOKEN=$(docker exec -e USER_ID="$USER_ID" nexora-alpha-api node -e "const jwt=require('jsonwebtoken'); console.log(jwt.sign({sub:process.env.USER_ID,typ:'access'}, process.env.JWT_ACCESS_SECRET, {expiresIn:'10m'}));")
curl -sS -H "Authorization: Bearer $TOKEN" "http://127.0.0.1:3101/creatures/$CREATURE" | docker exec -i nexora-alpha-api node -e "
const fs=require('fs'); const c=JSON.parse(fs.readFileSync(0,'utf8'));
const cards=(c.geneticPower&&c.geneticPower.cards)||[];
console.log('creature', c.id, c.speciesName||c.speciesKey, 'cards', cards.length, 'withArt', cards.filter(r=>r.artUrl).length);
for (const row of cards) console.log(row.locus, row.artUrl ? 'OK' : 'NO', row.artUrl||'');
"
