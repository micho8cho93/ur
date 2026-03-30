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
- `NAKAMA_CONSOLE_USERNAME`
- `NAKAMA_CONSOLE_PASSWORD`
- `NAKAMA_CONSOLE_SIGNING_KEY`
- `NAKAMA_SESSION_ENCRYPTION_KEY`
- `NAKAMA_SESSION_REFRESH_ENCRYPTION_KEY`

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

The Nakama console username, password, console signing key, and session encryption keys are injected at runtime from env vars. Do not commit real values into `nakama.yml`.

## Authoritative multiplayer contract

The server runtime uses shared protocol definitions from:

- `/Users/Michel/Desktop/ur/shared/urMatchProtocol.ts`

Core op codes:

- `ROLL_REQUEST`
- `MOVE_REQUEST`
- `STATE_SNAPSHOT`
- `SERVER_ERROR`

The match handler applies game rules authoritatively and broadcasts canonical snapshots.

## Progression + challenge backend

Progression storage, challenge definitions, and match-completion processing live in:

- `/Users/Michel/Desktop/ur/backend/modules/index.ts`
- `/Users/Michel/Desktop/ur/backend/modules/progression.ts`
- `/Users/Michel/Desktop/ur/backend/modules/challenges.ts`
- `/Users/Michel/Desktop/ur/shared/progression.ts`
- `/Users/Michel/Desktop/ur/shared/challenges.ts`

### Data flow

1. A Nakama-authenticated player joins an authoritative match.
2. The authoritative runtime ties every action to the authenticated Nakama user ID that joined the match.
3. On each verified roll/move, the runtime updates server-side telemetry needed for challenge evaluation:
   - total applied moves
   - max-roll count
   - captures made / suffered
   - contested shared-tile landings
   - deterministic comeback checkpoints
4. When a match ends, the runtime builds a normalized `CompletedMatchSummary` for each authenticated participant.
5. The winner still receives the existing authoritative PvP win XP through `awardXpForMatchWin(...)`.
6. The backend then calls `processCompletedMatch(...)` for each player summary. That function:
   - evaluates challenge completion from trusted match telemetry only
   - updates per-user challenge completion state
   - grants challenge XP exactly once with idempotent ledger writes
   - records the processed match result to prevent replay/double-processing
7. Clients read challenge definitions, challenge progress, and XP totals through authenticated RPCs only.

### Storage layout

All challenge/progression objects are written server-side with `permissionRead=0` and `permissionWrite=0`.

- `challenge_definitions`
  - key `<challengeId>`
  - global/system object
  - canonical registry copy used for deployment-time synchronization
- `user_challenge_progress`
  - key `progress`
  - owner `<nakama user id>`
  - stores permanent completion state per challenge
- `progression`
  - key `profile`
  - owner `<nakama user id>`
  - stores `totalXp`, cached rank title, and `lastUpdatedAt`
- `xp_reward_ledger`
  - key `pvp_win:<matchId>` for authoritative PvP win XP
  - key `challenge:<challengeId>` for one-time challenge XP
  - owner `<nakama user id>`
  - auditable XP ledger with before/after totals
- `processed_match_results`
  - key `<matchId>`
  - owner `<nakama user id>`
  - stores the normalized match summary and the challenge-processing outcome for replay protection

### RPC/API surface

Authenticated RPCs:

- `get_progression`
- `get_user_xp_progress`
- `get_challenge_definitions`
- `get_user_challenge_progress`

The completed-match processor is intentionally **not** a public client RPC. It is an internal trusted backend function invoked from the authoritative match-end path.

### Challenge rules implemented

- `first_victory`: first win against any opponent
- `beat_easy_bot`: win vs `easy_bot`
- `fast_finish`: win with `totalMoves < 100`
- `safe_play`: win with `piecesLost === 0`
- `lucky_roll`: win with `maxRollCount >= 3`
- `home_stretch`: win with `capturesMade === 0`
- `capture_master`: any completed match with `capturesMade >= 3` (win not required)
- `comeback_win`: win after the deterministic backend checkpoint marks the player as behind
- `risk_taker`: win with `contestedTilesLandedCount >= 3`
- `beat_medium_bot`: win vs `medium_bot`
- `beat_hard_bot`: win vs `hard_bot`
- `beat_perfect_bot`: win vs `perfect_bot`

The comeback rule is deterministic: at each checkpoint, a player is considered behind if the opponent either has more borne-off pieces or leads by at least 4 board-progress points (roughly one full roll of positional advantage).

### Reading data from the client

Client RPC helpers:

- `/Users/Michel/Desktop/ur/services/progression.ts`
- `/Users/Michel/Desktop/ur/services/challenges.ts`

### Adding a new permanent challenge later

1. Add a stable challenge definition to `/Users/Michel/Desktop/ur/shared/challenges.ts`.
2. Add one evaluator entry in `CHALLENGE_EVALUATORS` inside `/Users/Michel/Desktop/ur/backend/modules/challenges.ts`.
3. If the challenge needs a new trusted match statistic, add it to the authoritative telemetry in `/Users/Michel/Desktop/ur/backend/modules/index.ts` and to `CompletedMatchSummary`.
4. Rebuild and redeploy the Nakama runtime. On startup, `ensureChallengeDefinitions(...)` syncs the canonical registry into Nakama storage.
