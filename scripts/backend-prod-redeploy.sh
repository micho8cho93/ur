#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/backend/deploy/env.production"
COMPOSE_FILE="${ROOT_DIR}/backend/deploy/docker-compose.prod.yml"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}. Copy backend/deploy/env.production.example first." >&2
  exit 1
fi

cd "${ROOT_DIR}"

echo "Building Nakama runtime bundle..."
npm run build:backend

echo "Recreating the production Nakama container..."
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" up -d --force-recreate --no-deps nakama

echo "Current production stack status:"
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" ps

for attempt in 1 2 3 4 5 6 7 8 9 10 11 12; do
  if "${ROOT_DIR}/scripts/backend-prod-healthcheck.sh" >/dev/null; then
    echo "Production healthcheck passed."
    exit 0
  fi

  echo "Healthcheck not ready yet (attempt ${attempt}/12). Waiting 5s..."
  sleep 5
done

echo "Production healthcheck did not pass in time. Check logs with:" >&2
echo "npm run backend:prod:logs" >&2
exit 1
