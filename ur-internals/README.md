# Ur Internals

Minimal React + Vite admin dashboard for backend operations around `nakama.urgame.live`.

## Getting started

```bash
cd ur-internals
npm install
npm run dev
```

## Environment

Copy `.env.example` to `.env.local` if you want to override defaults.

```bash
VITE_NAKAMA_BASE_URL=https://nakama.urgame.live
VITE_API_TIMEOUT_MS=10000
VITE_USE_MOCK_DATA=true
```

`VITE_USE_MOCK_DATA=true` keeps the dashboard functional before the real admin endpoints exist.

## Routes

- `/` overview dashboard
- `/tournaments` tournaments list
- `/tournaments/:tournamentId` tournament detail
- `/tournaments/new` create tournament
- `/audit-log` admin activity stream

## Structure

```text
ur-internals/
├── public/
├── src/
│   ├── api/
│   ├── components/
│   ├── config/
│   ├── data/
│   ├── layout/
│   ├── pages/
│   ├── types/
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   ├── router.tsx
│   └── vite-env.d.ts
├── .env.example
├── index.html
├── package.json
└── vite.config.ts
```

## API notes

- `src/api/client.ts` centralizes fetch configuration and timeout handling.
- `src/api/tournaments.ts` and `src/api/auditLog.ts` are ready for real endpoints.
- Placeholder paths use `/internals/...` so they can later be proxied behind `nakama.urgame.live` or another admin gateway.
