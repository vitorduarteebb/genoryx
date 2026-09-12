#!/usr/bin/env sh
set -eu

mkdir -p /opt/nexora
tar -xzf /tmp/nexora-alpha.tgz -C /opt/nexora
cd /opt/nexora

if [ ! -f .env.production ]; then
  PW="$(openssl rand -hex 24)"
  JA="$(openssl rand -hex 32)"
  JR="$(openssl rand -hex 32)"
  PUBLIC="https://srv1568762.hstgr.cloud:8443"
  cat > .env.production <<EOF
NODE_ENV=production
RELEASE_CHANNEL=alpha
POSTGRES_USER=nexora
POSTGRES_PASSWORD=${PW}
POSTGRES_DB=nexora
DATABASE_URL=postgresql://nexora:${PW}@postgres:5432/nexora?schema=public
REDIS_URL=redis://redis:6379
JWT_ACCESS_SECRET=${JA}
JWT_REFRESH_SECRET=${JR}
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
WEB_URL=${PUBLIC}
ADMIN_URL=
API_URL=${PUBLIC}/api
GAME_SERVER_URL=wss://srv1568762.hstgr.cloud:8443/colyseus
GAME_SERVER_ALLOWED_ORIGINS=${PUBLIC}
NEXT_PUBLIC_API_URL=${PUBLIC}/api
NEXT_PUBLIC_GAME_SERVER_URL=wss://srv1568762.hstgr.cloud:8443/colyseus
NEXT_PUBLIC_RELEASE_CHANNEL=alpha
NEXT_PUBLIC_BUILD_ID=m2-alpha-20260901
API_PORT=3001
GAME_SERVER_PORT=2567
EOF
  chmod 600 .env.production
  echo "env criado em /opt/nexora/.env.production"
else
  echo "env já existia — não sobrescrito"
fi

install -m 0644 deploy/nginx/nexora-alpha-host.conf /etc/nginx/sites-available/nexora-alpha
ln -sfn /etc/nginx/sites-available/nexora-alpha /etc/nginx/sites-enabled/nexora-alpha
nginx -t
systemctl reload nginx

ufw allow 8443/tcp comment "NEXORA ALPHA"
ufw status | sed -n "1,40p"

echo "bootstrap ok"
