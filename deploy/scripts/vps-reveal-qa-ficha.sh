#!/usr/bin/env sh
set -eu
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c "UPDATE creatures SET reveal_status='REVEALED' WHERE owner_id=(SELECT id FROM characters WHERE name='QaFichaV2') RETURNING id, name, species_id, reveal_status;"
