#!/usr/bin/env sh
set -eu
CREATURE=64ae34e9-086a-4f42-8e6e-db2a5a373ce7
echo "==== creature ===="
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c "SELECT c.id, s.key, c.life_stage, c.visual_status, c.lock FROM creatures c JOIN creature_species s ON s.id=c.species_id WHERE c.id='$CREATURE';"
echo "==== visuals ===="
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c "SELECT id, life_stage, status, provider, left(image_hash,16) FROM creature_visual_assets WHERE creature_id='$CREATURE';"
echo "==== card arts ===="
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c "SELECT genetic_card_manifestation_id, card_definition_id, status, failure_reason, public_url FROM card_art_assets WHERE creature_id='$CREATURE' ORDER BY genetic_card_manifestation_id;"
echo "==== counts ===="
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c "SELECT visual_status, count(*) FROM creatures GROUP BY 1;"
echo "==== job totals ===="
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c "SELECT scope, status, count(*) FROM card_art_assets GROUP BY 1,2 ORDER BY 1,2;"
USER_ID=$(docker exec nexora-alpha-postgres psql -U nexora -d nexora -tAc "SELECT u.id FROM users u JOIN characters ch ON ch.user_id=u.id JOIN creatures c ON c.owner_id=ch.id WHERE c.id='$CREATURE' LIMIT 1;")
echo "owner $USER_ID"
if [ -n "$USER_ID" ]; then
  TOKEN=$(docker exec -e USER_ID="$USER_ID" nexora-alpha-api node -e "const jwt=require('jsonwebtoken'); console.log(jwt.sign({sub:process.env.USER_ID,typ:'access'}, process.env.JWT_ACCESS_SECRET, {expiresIn:'10m'}));")
  curl -sS -H "Authorization: Bearer $TOKEN" "http://127.0.0.1:3101/creatures/$CREATURE" > /tmp/c.json
  node -e 'const c=require("/tmp/c.json"); const gp=c.geneticPower||{}; console.log("name",c.speciesName,c.visualStatus,c.lifeStage); console.log("power",gp.name||gp.namePt,gp.element); const cards=gp.cards||[]; console.log("cards",cards.length); for (const row of cards) console.log(row.locus, row.catalogKey||row.key, row.artUrl||"NOART", (row.imageHash||"").slice(0,8));'
fi
