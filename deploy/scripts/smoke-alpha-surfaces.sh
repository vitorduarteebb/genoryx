#!/usr/bin/env sh
set -eu
CREATURE=d9d89416-50c2-4a45-8224-2bcfd1132178
BASE=http://127.0.0.1:3101
USER_ID=$(docker exec nexora-alpha-postgres psql -U nexora -d nexora -tAc "SELECT u.id FROM users u JOIN characters ch ON ch.user_id=u.id JOIN creatures c ON c.owner_id=ch.id WHERE c.id='$CREATURE' LIMIT 1;")
TOKEN=$(docker exec -e USER_ID="$USER_ID" nexora-alpha-api node -e "const jwt=require('jsonwebtoken'); console.log(jwt.sign({sub:process.env.USER_ID,typ:'access'}, process.env.JWT_ACCESS_SECRET, {expiresIn:'10m'}));")
AUTH="Authorization: Bearer $TOKEN"

echo "==== health ===="
curl -sS -o /dev/null -w "api/health %{http_code}\n" "$BASE/health"
curl -sS -o /dev/null -w "web %{http_code}\n" http://127.0.0.1:3100/
curl -sk -o /dev/null -w "public/ready %{http_code}\n" https://127.0.0.1:8443/ready
curl -sk -o /dev/null -w "public/api/health %{http_code}\n" https://127.0.0.1:8443/api/health
curl -sS -o /dev/null -w "colyseus %{http_code}\n" http://127.0.0.1:3567/health || true

echo "==== earth static ===="
curl -sS -o /dev/null -w "EarthCardFrame %{http_code}\n" http://127.0.0.1:3100/card-frames/EarthCardFrame.svg
curl -sS -o /dev/null -w "EarthUltimate %{http_code}\n" http://127.0.0.1:3100/card-frames/EarthUltimateCardFrame.svg
curl -sS -o /dev/null -w "EarthSignature %{http_code}\n" http://127.0.0.1:3100/card-frames/EarthSignatureCardFrame.svg
curl -sS -o /dev/null -w "earth.svg %{http_code}\n" http://127.0.0.1:3100/card-icons/earth.svg
curl -sS http://127.0.0.1:3100/card-frames/EarthCardFrame.svg | grep -qi nature && { echo "EARTH FRAME LEAKS NATURE"; exit 1; } || echo "EarthCardFrame no nature leak"
curl -sS http://127.0.0.1:3100/card-icons/earth.svg | grep -qi nature && { echo "earth icon leaks nature"; exit 1; } || echo "earth.svg no nature leak"

echo "==== card arts G1-G10 ===="
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c \
  "SELECT genetic_card_manifestation_id, id, status, image_hash, public_url FROM card_art_assets WHERE creature_id='$CREATURE' ORDER BY genetic_card_manifestation_id;"
ids=$(docker exec nexora-alpha-postgres psql -U nexora -d nexora -tAc \
  "SELECT id||'|'||image_hash FROM card_art_assets WHERE creature_id='$CREATURE' AND status='READY' ORDER BY genetic_card_manifestation_id;")
count=0
for row in $ids; do
  id=${row%%|*}
  hash=${row##*|}
  curl -sS -o /tmp/card.png -w "$id %{http_code} %{size_download} %{content_type}\n" "$BASE/card-art/$id/image?v=$hash"
  count=$((count+1))
done
echo "ready_count $count"
[ "$count" -eq 10 ] || { echo "expected 10 READY arts"; exit 1; }
extra=$(docker exec nexora-alpha-postgres psql -U nexora -d nexora -tAc "SELECT count(*) FROM card_art_assets WHERE scope='CREATURE' AND creature_id<>'$CREATURE';")
echo "other_creature_arts $extra"
[ "$extra" = "0" ] || { echo "unexpected extra creature arts"; exit 1; }

echo "==== profile + deck + surfaces ===="
curl -sS -o /dev/null -w "me %{http_code}\n" -H "$AUTH" "$BASE/auth/me" || curl -sS -o /dev/null -w "characters/me %{http_code}\n" -H "$AUTH" "$BASE/characters/me"
curl -sS -o /dev/null -w "creatures %{http_code}\n" -H "$AUTH" "$BASE/creatures"
curl -sS -o /dev/null -w "creature %{http_code}\n" -H "$AUTH" "$BASE/creatures/$CREATURE"
curl -sS -o /dev/null -w "party %{http_code}\n" -H "$AUTH" "$BASE/party"
curl -sS -o /dev/null -w "deck %{http_code}\n" -H "$AUTH" "$BASE/deck"
curl -sS -o /dev/null -w "eggs %{http_code}\n" -H "$AUTH" "$BASE/eggs"
curl -sS -o /dev/null -w "breeding/history %{http_code}\n" -H "$AUTH" "$BASE/breeding/history"
curl -sS -o /dev/null -w "market %{http_code}\n" -H "$AUTH" "$BASE/market"
curl -sS -o /dev/null -w "quests %{http_code}\n" -H "$AUTH" "$BASE/quests"

curl -sS -H "$AUTH" "$BASE/creatures/$CREATURE" > /tmp/creature.json
curl -sS -H "$AUTH" "$BASE/deck" > /tmp/deck.json
node -e '
const c=require("/tmp/creature.json");
const d=require("/tmp/deck.json");
const gp=c.geneticPower||{};
console.log("PROFILE", c.speciesName, c.lifeStage, gp.name||gp.namePt, gp.element, gp.typology);
const cards=gp.cards||[];
if (cards.length!==10) throw new Error("profile cards "+cards.length);
const g1=cards.find(r=>r.locus==="G1");
if (!g1) throw new Error("G1 missing");
if (!(g1.text||"").includes("17")) throw new Error("profile G1 not 17 "+g1.text);
if (!/Pisada/i.test(g1.namePt||g1.name||"")) throw new Error("profile G1 name");
if ((g1.namePt||g1.name||"").includes("Quake")) throw new Error("EN name leaked");
for (const row of cards) {
  if (!row.artUrl) throw new Error("missing art "+row.locus);
  if (!/\?v=/.test(row.artUrl)) throw new Error("unversioned "+row.artUrl);
  if (/nature/i.test(row.artUrl||"")) throw new Error("nature "+row.locus);
  console.log(row.locus, row.namePt||row.name, row.text, row.artUrl);
}
const deck=(d.deck||d.cards||[]);
console.log("DECK_SIZE", deck.length, "party", (d.creatures||[]).map(x=>x.speciesKey).join(","));
const deckG1=deck.find(r=>r.key==="quake_stomp"||r.definitionKey==="quake_stomp"||r.locus==="G1");
if (deckG1) {
  const text=deckG1.text||deckG1.description||"";
  const name=deckG1.namePt||deckG1.name||"";
  console.log("DECK_G1", name, text, deckG1.artUrl||deckG1.art);
  if (text && text.includes("16") && !text.includes("17")) throw new Error("deck G1 16");
}
console.log("PROFILE_OK");
'
