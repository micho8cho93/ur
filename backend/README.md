# Nakama Backend (Canonical Local Stack)

This is the canonical local backend for the Royal Game of Ur app.

- Compose file: `/Users/Michel/Desktop/ur/backend/docker-compose.yml`
- Runtime config: `/Users/Michel/Desktop/ur/backend/nakama.yml`
- Runtime module entrypoint loaded by Nakama: `/nakama/data/modules/build/backend/modules/index.js`

## Prerequisites

- Docker + Docker Compose
- Root project dependencies installed (`npm install`)

## Environment

Create `backend/.env` (not committed) from `backend/.env.example`.

```bash
cp backend/.env.example backend/.env
```

Expected values:

- `POSTGRES_PASSWORD`
- `NAKAMA_SOCKET_SERVER_KEY`
- `NAKAMA_HTTP_KEY`

## Build + Run

From repo root:

```bash
npm run build:backend
npm run backend:dev
```

`backend/docker-compose.yml` runs DB migration before server startup:

- `nakama migrate up --database.address "$NAKAMA_DATABASE_ADDRESS"`
- then `nakama --config /nakama/data/nakama.yml`

## Exposed ports

- `7350` Nakama API + socket
- `7351` Nakama console
- `5432` Postgres

## Production deployment (Vercel web clients)

Use the dedicated production stack in `/Users/Michel/Desktop/ur/backend/deploy`.

- Compose file: `/Users/Michel/Desktop/ur/backend/deploy/docker-compose.prod.yml`
- TLS reverse proxy: `/Users/Michel/Desktop/ur/backend/deploy/Caddyfile`
- Env template: `/Users/Michel/Desktop/ur/backend/deploy/env.production.example`

This keeps raw Nakama ports off the public internet and serves Nakama at `https://nakama.<your-domain>` for HTTPS/WSS browser clients.

## Authoritative multiplayer contract

The server runtime uses shared protocol definitions from:

- `/Users/Michel/Desktop/ur/shared/urMatchProtocol.ts`

Core op codes:

- `ROLL_REQUEST`
- `MOVE_REQUEST`
- `STATE_SNAPSHOT`
- `SERVER_ERROR`

The match handler applies game rules authoritatively and broadcasts canonical snapshots.

## Progression system

Progression storage and helpers live in:

- `/Users/Michel/Desktop/ur/backend/modules/progression.ts`
- `/Users/Michel/Desktop/ur/shared/progression.ts`

### Where XP is stored

- Per-user progression profile:
  collection `progression`, key `profile`, owner `<nakama user id>`
- Processed win records for idempotency:
  collection `progression_awards`, key `pvp_win:<matchId>`, owner `<nakama user id>`

The progression profile stores:

- `totalXp`
- `currentRankTitle` (derived cache)
- `lastUpdatedAt`

Both objects are server-write-only (`permissionRead=0`, `permissionWrite=0`). The frontend reads progression through RPC instead of touching storage directly.

### Where XP is awarded

XP is awarded in the authoritative match runtime after a winning move is applied:

- `/Users/Michel/Desktop/ur/backend/modules/index.ts`

Flow:

1. The server applies a verified move.
2. If that move produces `gameState.winner`, the runtime resolves the winning Nakama user ID from match assignments.
3. The runtime calls `awardXpForMatchWin(...)`.
4. Nakama writes the updated progression profile and the processed match award record in one storage transaction.
5. The winner receives a `PROGRESSION_AWARD` socket payload with the award result.

This keeps the client from directly setting XP and prevents duplicate awards for the same match ID.

### Frontend API

Fetch current progression with RPC `get_progression`.

Client helper:

- `/Users/Michel/Desktop/ur/services/progression.ts`

Use `getUserProgression()` after authentication to retrieve:

- `totalXp`
- `currentRank`
- `currentRankThreshold`
- `nextRank`
- `nextRankThreshold`
- `xpIntoCurrentRank`
- `xpNeededForNextRank`
- `progressPercent`

During an online match, the winning client can also listen for `MatchOpCode.PROGRESSION_AWARD` on the match socket to animate the immediate XP/rank change.

### Adding future XP sources

To add a new authoritative XP source later:

1. Add the source and award amount to `/Users/Michel/Desktop/ur/shared/progression.ts` in `XP_SOURCE_CONFIG`.
2. Reuse `awardXpForMatchWin(...)` as the model for a new award entry point, or generalize it to call the same storage transaction with a different `source`.
3. Use a unique idempotency key per source event (for example `daily_login:<date>` or `challenge:<challengeId>`), so each reward source stays independently replay-safe.
