# Nakama backend (local dev)

## Prerequisites
- Docker + Docker Compose

## Configure environment
Create a `.env` file in `backend/` (not committed) with values for secrets:

```bash
POSTGRES_PASSWORD=replace-me
NAKAMA_SOCKET_SERVER_KEY=replace-me
NAKAMA_HTTP_KEY=replace-me
```

> Keep these values out of the Expo client. The client should only use the public
> socket server key (or a dedicated public key) and the host/port it connects to.

## Run locally
From the repo root:

```bash
cd backend
cp .env.example .env # optional, or create manually
docker compose up
```

## Exposed ports
- `7350` (Nakama API + socket)
- `7351` (Nakama console)
- `5432` (Postgres)

## Runtime modules
Place TypeScript/JavaScript modules in `backend/modules/`.
Nakama loads `/nakama/data/modules/index.js` as the entrypoint, so compile
`index.ts` to `index.js` as part of your build process.

### Implemented RPCs
| RPC name | Inputs | Outputs | Client usage |
| --- | --- | --- | --- |
| `auth_link_custom` | `{ "customId": string, "username"?: string }` | `{ "userId": string, "customId": string }` | Call after session auth to link a custom ID for a logged-in user via the Nakama JS client (`client.rpc(session, "auth_link_custom", payload)`). |
| `matchmaker_add` | `{ "minCount"?: number, "maxCount"?: number, "query"?: string, "stringProperties"?: object, "numericProperties"?: object }` | `{ "ticket": string }` | Call after session auth to place the player into matchmaking (`client.rpc(session, "matchmaker_add", payload)`). |

### Matchmaking orchestration
The `matchmakerMatched` hook creates an authoritative match (`authoritative_match`)
with the matched user IDs and returns the match ID so Nakama can connect clients.

### Authoritative match handler
The `authoritative_match` handler manages state initialization, join/leave events,
tick processing, and message broadcasting. Client messages are rebroadcast to
other participants with the same op code.
