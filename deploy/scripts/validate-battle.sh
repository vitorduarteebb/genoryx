#!/usr/bin/env sh
set -eu
CREATURE=d9d89416-50c2-4a45-8224-2bcfd1132178
NYMPHA=fd21ee01-c56a-44fd-a278-55944f1f7c32
BASE=http://127.0.0.1:3101
USER_ID=$(docker exec nexora-alpha-postgres psql -U nexora -d nexora -tAc "SELECT u.id FROM users u JOIN characters ch ON ch.user_id=u.id JOIN creatures c ON c.owner_id=ch.id WHERE c.id='$CREATURE' LIMIT 1;")
TOKEN=$(docker exec -e USER_ID="$USER_ID" nexora-alpha-api node -e "const jwt=require('jsonwebtoken'); console.log(jwt.sign({sub:process.env.USER_ID,typ:'access'}, process.env.JWT_ACCESS_SECRET, {expiresIn:'10m'}));")
AUTH="Authorization: Bearer $TOKEN"

echo "==== policy ===="
docker exec nexora-alpha-api sh -c 'echo POLICY=$GENETIC_CARD_ART_POLICY; echo IDS=$GENETIC_CARD_ART_CREATURE_IDS'

echo "==== migrations ===="
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c "SELECT migration_name FROM _prisma_migrations WHERE migration_name LIKE '%card_art%' OR migration_name LIKE '%economy%' ORDER BY finished_at;"

echo "==== finish stale battles ===="
docker exec nexora-alpha-postgres psql -U nexora -d nexora -tAc \
  "SELECT id FROM battles WHERE status='ACTIVE' AND id IN (SELECT battle_id FROM battle_participants WHERE character_id=(SELECT owner_id FROM creatures WHERE id='$CREATURE'));" \
  | while read -r bid; do
      [ -z "$bid" ] && continue
      echo "flee $bid"
      curl -sS -H "$AUTH" -H "Content-Type: application/json" -X POST "$BASE/battles/$bid/actions" -d '{"type":"FLEE"}' > /tmp/flee.json || true
      head -c 180 /tmp/flee.json; echo
    done
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c \
  "UPDATE creatures SET lock='NONE' WHERE owner_id=(SELECT owner_id FROM creatures WHERE id='$CREATURE') AND lock='BATTLE';"

echo "==== party + map ===="
curl -sS -H "$AUTH" -H "Content-Type: application/json" -X PUT "$BASE/party" -d "{\"creatureIds\":[\"$CREATURE\"]}" > /tmp/party.json
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c \
  "UPDATE characters SET map_key='verdantis' WHERE id=(SELECT owner_id FROM creatures WHERE id='$CREATURE');"

echo "==== start wild ===="
curl -sS -H "$AUTH" -H "Content-Type: application/json" -X POST "$BASE/battles/wild" -d '{}' > /tmp/wild.json
node -e '
const fs=require("fs");
const b=JSON.parse(fs.readFileSync("/tmp/wild.json","utf8"));
if (b.error || (!b.battleId && !b.state)) {
  console.log(JSON.stringify(b,null,2).slice(0,2000));
  throw new Error("wild failed: "+(b.error&&b.error.message||b.message||b.code||"unknown"));
}
const sides=(b.state&&b.state.sides)||[];
const hand=(sides[0]&&sides[0].hand)||[];
const deck=(sides[0]&&sides[0].deck)||[];
console.log("BATTLE_ID", b.battleId);
console.log("status", b.state.status, "hand", hand.length, "deckCount", sides[0]&&sides[0].deckCount);
const earthKeys=new Set(["quake_stomp","boulder_toss","tremor_pulse","stone_guard","stone_brace","dust_cloud","rumble_guard","bedrock_pact","titan_growl","mountain_crash"]);
const earth=hand.filter(c=>earthKeys.has(c.definitionKey));
console.log("earth_in_hand", earth.length);
for (const card of hand) {
  console.log(["HAND", card.locus, card.name, card.text, card.artUrl, card.imageHash, card.definitionKey, card.element].join(" | "));
  if (!earthKeys.has(card.definitionKey)) continue;
  if (!card.artUrl) throw new Error("hand missing artUrl "+card.definitionKey);
  if (!/\?v=/.test(card.artUrl)) throw new Error("artUrl not versioned "+card.artUrl);
  if (/nature/i.test(card.artUrl)) throw new Error("nature in artUrl");
  if (card.element && card.element!=="EARTH") throw new Error("element "+card.element);
  if (card.sourceCreature && /flame|nature|florune|nympha/i.test(card.definitionKey)) throw new Error("wrong source");
}
const g1=hand.find(c=>c.definitionKey==="quake_stomp"||c.locus==="G1");
if (g1) {
  if (!(g1.text||"").includes("17")) throw new Error("battle G1 not 17: "+g1.text);
  if ((g1.text||"").includes("16") && !(g1.text||"").includes("17")) throw new Error("battle G1 still 16");
  if (!/Pisada/i.test(g1.name||"")) throw new Error("battle G1 name "+g1.name);
  console.log("BATTLE_G1_OK", g1.name, g1.text, g1.artUrl);
} else {
  console.log("G1_NOT_IN_OPENING_HAND");
}
if (!earth.length) throw new Error("no terranox cards in opening hand");
fs.writeFileSync("/tmp/wild-hand.json", JSON.stringify({battleId:b.battleId, hand}, null, 2));
console.log("BATTLE_HAND_OK");
'

echo "==== hand art HTTP ===="
node -e '
const {execSync}=require("child_process");
const hand=require("/tmp/wild-hand.json").hand;
for (const card of hand) {
  const path=card.artUrl.split("?")[0];
  const out=execSync("curl -sS -o /tmp/hand.png -w \"%{http_code} %{size_download} %{content_type}\" http://127.0.0.1:3101"+path, {encoding:"utf8"});
  console.log(card.locus||card.definitionKey, out, card.artUrl);
  if (!out.startsWith("200")) throw new Error("art HTTP "+out);
}
'

echo "==== leave ACTIVE battle for Alpha hand check ===="
node -e 'console.log("OPEN", require("/tmp/wild-hand.json").battleId)'
echo "DONE"
