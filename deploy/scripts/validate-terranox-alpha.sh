#!/usr/bin/env sh
set -eu
CREATURE=d9d89416-50c2-4a45-8224-2bcfd1132178
BASE=http://127.0.0.1:3101

echo "==== health ===="
curl -sS -o /dev/null -w "api/health %{http_code}\n" "$BASE/health"
curl -sS -o /dev/null -w "web %{http_code}\n" http://127.0.0.1:3100/
curl -sk -o /dev/null -w "public/ready %{http_code}\n" https://127.0.0.1:8443/ready
curl -sk -o /dev/null -w "public/api/health %{http_code}\n" https://127.0.0.1:8443/api/health
curl -sS -o /dev/null -w "colyseus %{http_code}\n" http://127.0.0.1:3567/health || true

echo "==== earth static ===="
curl -sS -o /dev/null -w "EarthCardFrame %{http_code}\n" http://127.0.0.1:3100/card-frames/EarthCardFrame.svg
curl -sS -o /dev/null -w "EarthUltimate %{http_code}\n" http://127.0.0.1:3100/card-frames/EarthUltimateCardFrame.svg
curl -sS -o /dev/null -w "earth.svg %{http_code}\n" http://127.0.0.1:3100/card-icons/earth.svg

echo "==== proof ===="
curl -sS "$BASE/card-art/creature-proof/$CREATURE" > /tmp/proof.json
node -e 'const p=require("/tmp/proof.json"); console.log("power",p.geneticPower,"stage",p.lifeStage,"cards",p.cards.length); for (const c of p.cards) console.log(c.locus,c.name,c.text,c.status,(c.imageHash||"").slice(0,16),c.imageUrl);'

USER_ID=$(docker exec nexora-alpha-postgres psql -U nexora -d nexora -tAc "SELECT u.id FROM users u JOIN characters ch ON ch.user_id=u.id JOIN creatures c ON c.owner_id=ch.id WHERE c.id='$CREATURE' LIMIT 1;")
echo "owner $USER_ID"
TOKEN=$(docker exec -e USER_ID="$USER_ID" nexora-alpha-api node -e "const jwt=require('jsonwebtoken'); console.log(jwt.sign({sub:process.env.USER_ID,typ:'access'}, process.env.JWT_ACCESS_SECRET, {expiresIn:'10m'}));")
AUTH="Authorization: Bearer $TOKEN"

echo "==== profile ===="
curl -sS -H "$AUTH" "$BASE/creatures/$CREATURE" > /tmp/creature.json
node -e '
const c=require("/tmp/creature.json");
const gp=c.geneticPower||{};
console.log("name",c.name,"element",c.elementPrimary||c.element);
console.log("power",gp.name,gp.element,gp.typology);
const cards=gp.cards||[];
console.log("cards",cards.length);
for (const row of cards) console.log(row.locus,row.namePt||row.name,row.text,row.artUrl, (row.imageHash||"").slice(0,16));
const g1=cards.find((row)=>row.locus==="G1");
if(!g1) throw new Error("G1 missing");
if(!(g1.text||"").includes("17")) throw new Error("G1 not 17: "+g1.text);
if(!(g1.namePt||g1.name||"").includes("Pisada")) throw new Error("G1 name "+g1.namePt);
if((g1.text||"").includes("16")) throw new Error("G1 still 16");
if(!g1.artUrl) throw new Error("G1 no artUrl");
if((g1.artUrl||"").includes("Nature")) throw new Error("nature in artUrl");
console.log("G1_OK");
'

echo "==== party/world/market ===="
curl -sS -o /dev/null -w "party %{http_code}\n" -H "$AUTH" "$BASE/party"
curl -sS -o /dev/null -w "creatures %{http_code}\n" -H "$AUTH" "$BASE/creatures"
curl -sS -o /dev/null -w "market %{http_code}\n" -H "$AUTH" "$BASE/market/listings"

echo "==== wild battle ===="
curl -sS -H "$AUTH" -H "Content-Type: application/json" -X PUT "$BASE/party" -d "{\"creatureIds\":[\"$CREATURE\"]}" > /tmp/party.json || true
curl -sS -H "$AUTH" -H "Content-Type: application/json" -X POST "$BASE/battles/wild" -d '{}' > /tmp/battle.json || true
node -e '
const b=require("/tmp/battle.json");
console.log("battle", b.battleId||b.id, b.message||b.code||b.status||"");
const sides=(b.state&&b.state.sides)||[];
const hand=(sides[0]&&sides[0].hand)||[];
console.log("hand", hand.length);
for (const card of hand) console.log(card.locus, card.name, card.text, card.artUrl, card.definitionKey);
const q=hand.find((c)=>c.definitionKey==="quake_stomp"||c.locus==="G1");
if(q){
  console.log("BATTLE_G1", q.name, q.text, q.artUrl);
  if(!(q.text||"").includes("17")) throw new Error("battle G1 not 17");
  if(!q.artUrl) throw new Error("battle G1 no art");
  console.log("BATTLE_OK");
} else {
  console.log("BATTLE_HAND", hand.map((c)=>c.definitionKey));
}
'
