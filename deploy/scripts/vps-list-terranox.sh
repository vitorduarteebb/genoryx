#!/usr/bin/env sh
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c \
"SELECT c.id, c.name, c.life_stage, s.key, v.id AS visual_id, v.status, v.provider, v.image_hash, v.storage_key, ch.name AS owner
 FROM creatures c
 JOIN creature_species s ON s.id=c.species_id
 JOIN characters ch ON ch.id=c.owner_id
 LEFT JOIN creature_visual_assets v ON v.creature_id=c.id AND v.status='READY'
 WHERE s.key='terranox'
 ORDER BY c.birth_date;"
