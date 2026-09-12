#!/usr/bin/env sh
set -eu
docker exec nexora-alpha-postgres psql -U nexora -d nexora -tAc "SELECT CASE WHEN owner_id=(SELECT id FROM characters WHERE name='QaFichaV2') THEN 'qa' ELSE 'original' END || ' ' || genetic_hash || ' ' || temperament || ' ' || life_stage FROM creatures WHERE id='84ae443c-a1e8-41eb-afe1-aff5763eaf01';"
