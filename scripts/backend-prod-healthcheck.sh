#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/backend/deploy/env.production"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}. Copy backend/deploy/env.production.example first." >&2
  exit 1
fi

DOMAIN="$(
  sed -n 's/^NAKAMA_DOMAIN=//p' "${ENV_FILE}" |
    tail -n 1 |
    tr -d '\r' |
    sed 's/^"//; s/"$//; s/^'\''//; s/'\''$//'
)"

if [[ -z "${DOMAIN}" ]]; then
  echo "NAKAMA_DOMAIN is not set in ${ENV_FILE}." >&2
  exit 1
fi

HEALTH_URL="https://${DOMAIN}/healthcheck"

echo "Checking ${HEALTH_URL} ..."
curl --fail --silent --show-error --location "${HEALTH_URL}"
echo
echo "Healthcheck passed."
