#!/usr/bin/env sh
set -eu
echo "==== HTTP ===="
for id in 4b864480-2d8d-4a9e-bfb0-a65cdec65415 ef51818e-90ee-467b-b625-eba3fb9c150d 49e1df06-c3e7-4ae3-b427-2ee780c8ae5d 82474616-1640-4926-920b-f2701fb2100a b976c0f2-0644-4e9a-8fd6-ffd9b67affee 233026ca-5f83-4fe9-9d3d-f55ff7ff2f4c 2dbf7f7e-6baa-43e8-9d21-960173a868e7 f3d6c393-4c78-4f40-949a-d7157cd7e7ee fc8ed535-5a24-44f9-8495-336060862031 4ee4a2b7-281b-4a59-8247-1ff0dc1fccfe; do
  curl -sS -o /tmp/c.png -w "$id %{http_code} %{size_download} %{content_type}\n" "http://127.0.0.1:3101/card-art/$id/image"
done
echo "==== magic ===="
docker exec nexora-alpha-api node -e 'const fs=require("fs"); const p="/app/var/card-art/bedrock_pact/BASE/d9edbc282c6a90c525885ffb57ef5b9d6e0e7c5c806d6444ac98e31d8a853bdb.png"; const b=fs.readFileSync(p); console.log(p, b.length, b.slice(0,8).toString("hex"));'
echo "==== proof G8 ===="
curl -sS http://127.0.0.1:3101/card-art/creature-proof/d9d89416-50c2-4a45-8224-2bcfd1132178 | node -e 'let s="";process.stdin.on("data",d=>s+=d);process.stdin.on("end",()=>{const p=JSON.parse(s); for (const c of p.cards||[]) console.log(c.locus,c.cardKey,c.status,c.imageUrl);});'
echo "==== battle GET ===="
CREATURE=d9d89416-50c2-4a45-8224-2bcfd1132178
USER_ID=$(docker exec nexora-alpha-postgres psql -U nexora -d nexora -tAc "SELECT u.id FROM users u JOIN characters ch ON ch.user_id=u.id JOIN creatures c ON c.owner_id=ch.id WHERE c.id='$CREATURE' LIMIT 1;")
TOKEN=$(docker exec -e USER_ID="$USER_ID" nexora-alpha-api node -e "const jwt=require('jsonwebtoken'); console.log(jwt.sign({sub:process.env.USER_ID,typ:'access'}, process.env.JWT_ACCESS_SECRET, {expiresIn:'10m'}));")
curl -sS -H "Authorization: Bearer $TOKEN" http://127.0.0.1:3101/battles/b3ced500-2e11-4b89-9ec0-6e93a35732e7 | node -e 'let s="";process.stdin.on("data",d=>s+=d);process.stdin.on("end",()=>{const b=JSON.parse(s); const hand=b.state&&b.state.sides&&b.state.sides[0]&&b.state.sides[0].hand||[]; for (const c of hand) console.log(c.locus,c.definitionKey,c.artUrl); console.log("err",b.message||b.code||"");});'
echo "==== provider/approved G8 ===="
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c "SELECT genetic_card_manifestation_id, provider, approved_at IS NOT NULL AS approved, status FROM card_art_assets WHERE creature_id='d9d89416-50c2-4a45-8224-2bcfd1132178' ORDER BY genetic_card_manifestation_id;"
