#!/usr/bin/env sh
set -eu
echo "==== party.json ===="
head -c 1500 /tmp/party.json; echo
echo "==== battle.json ===="
head -c 2000 /tmp/battle.json; echo
echo "==== creature lock/party ===="
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c \
"SELECT c.id, c.lock, c.owner_id, p.slot FROM creatures c LEFT JOIN party_slots p ON p.creature_id=c.id WHERE c.id='d9d89416-50c2-4a45-8224-2bcfd1132178';"
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c \
"SELECT p.slot, c.id, s.key, c.lock FROM party_slots p JOIN creatures c ON c.id=p.creature_id JOIN creature_species s ON s.id=c.species_id JOIN characters ch ON ch.id=p.character_id JOIN creatures t ON t.owner_id=ch.id WHERE t.id='d9d89416-50c2-4a45-8224-2bcfd1132178' ORDER BY p.slot;"
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c \
"SELECT ch.map_key, b.id, b.status, b.type FROM characters ch JOIN creatures c ON c.owner_id=ch.id LEFT JOIN battles b ON b.status='ACTIVE' AND EXISTS (SELECT 1 FROM battle_participants bp WHERE bp.battle_id=b.id AND bp.character_id=ch.id) WHERE c.id='d9d89416-50c2-4a45-8224-2bcfd1132178';"
