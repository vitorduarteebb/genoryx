#!/usr/bin/env sh
set -eu
CREATURE=d9d89416-50c2-4a45-8224-2bcfd1132178
BASE=http://127.0.0.1:3101
USER_ID=$(docker exec nexora-alpha-postgres psql -U nexora -d nexora -tAc "SELECT u.id FROM users u JOIN characters ch ON ch.user_id=u.id JOIN creatures c ON c.owner_id=ch.id WHERE c.id='$CREATURE' LIMIT 1;")
TOKEN=$(docker exec -e USER_ID="$USER_ID" nexora-alpha-api node -e "const jwt=require('jsonwebtoken'); console.log(jwt.sign({sub:process.env.USER_ID,typ:'access'}, process.env.JWT_ACCESS_SECRET, {expiresIn:'10m'}));")
AUTH="Authorization: Bearer $TOKEN"

docker exec nexora-alpha-postgres psql -U nexora -d nexora -tAc \
  "SELECT id FROM battles WHERE status='ACTIVE' AND id IN (SELECT battle_id FROM battle_participants WHERE character_id=(SELECT owner_id FROM creatures WHERE id='$CREATURE'));" \
  | while read -r bid; do
      [ -z "$bid" ] && continue
      curl -sS -H "$AUTH" -H "Content-Type: application/json" -X POST "$BASE/battles/$bid/actions" -d '{"type":"FLEE"}' >/dev/null || true
    done
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c \
  "UPDATE creatures SET lock='NONE' WHERE owner_id=(SELECT owner_id FROM creatures WHERE id='$CREATURE') AND lock='BATTLE';
   UPDATE characters SET map_key='verdantis' WHERE id=(SELECT owner_id FROM creatures WHERE id='$CREATURE');
   DELETE FROM party_slots WHERE character_id=(SELECT owner_id FROM creatures WHERE id='$CREATURE');
   INSERT INTO party_slots (id, character_id, slot, creature_id) VALUES (gen_random_uuid(), (SELECT owner_id FROM creatures WHERE id='$CREATURE'), 0, '$CREATURE');"

curl -sS -H "$AUTH" -H "Content-Type: application/json" -X POST "$BASE/battles/wild" -d '{}' > /tmp/wild.json
node -e '
const b=require("/tmp/wild.json");
if(!b.battleId) { console.log(JSON.stringify(b).slice(0,800)); throw new Error("wild failed"); }
const hand=b.state.sides[0].hand;
console.log("BATTLE", b.battleId);
console.log("PUBLIC https://srv1568762.hstgr.cloud:8443/game/battle/"+b.battleId);
for (const card of hand) {
  console.log([card.locus||"-", card.name, card.text, card.artUrl?"ART":"NOART", card.definitionKey].join(" | "));
}
const earth=hand.filter(c=>c.artUrl && /card-art\/[0-9a-f-]{36}/.test(c.artUrl));
if(!earth.length) throw new Error("no creature art in hand");
const g1=hand.find(c=>c.definitionKey==="quake_stomp");
if(g1) console.log("G1", g1.name, g1.text);
console.log("OPEN_OK");
'
