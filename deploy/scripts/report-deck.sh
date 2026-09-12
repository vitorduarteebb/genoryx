#!/usr/bin/env sh
set -eu
CREATURE=d9d89416-50c2-4a45-8224-2bcfd1132178
USER_ID=$(docker exec nexora-alpha-postgres psql -U nexora -d nexora -tAc "SELECT u.id FROM users u JOIN characters ch ON ch.user_id=u.id JOIN creatures c ON c.owner_id=ch.id WHERE c.id='$CREATURE' LIMIT 1;")
TOKEN=$(docker exec -e USER_ID="$USER_ID" nexora-alpha-api node -e "const jwt=require('jsonwebtoken'); console.log(jwt.sign({sub:process.env.USER_ID,typ:'access'}, process.env.JWT_ACCESS_SECRET, {expiresIn:'10m'}));")
curl -sS -H "Authorization: Bearer $TOKEN" http://127.0.0.1:3101/deck > /tmp/deck.json
node -e '
const d=require("/tmp/deck.json");
console.log("party", (d.creatures||[]).map(c=>c.speciesKey).join(","));
console.log("cards", (d.cards||[]).length);
for (const c of d.cards||[]) console.log([c.locus||"-", c.name, c.artUrl?"ART":"NOART", c.catalogKey].join(" | "));
'
echo "==== backups ===="
ls -lh /opt/nexora/backups | tail -8
echo "==== extra creature arts ===="
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c "SELECT scope, creature_id, count(*) FROM card_art_assets WHERE scope='CREATURE' GROUP BY 1,2;"
