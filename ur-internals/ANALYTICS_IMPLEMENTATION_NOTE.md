# Analytics Implementation Note

This note captures the current best-fit plan for the owner-facing analytics surface in `ur-internals`.

## Planned UI location

- Dedicated `ur-internals` route: `/analytics`
- New analytics UI stays separate from the tournament control center overview and tournament CRUD pages.

## Planned backend/API location

- New Nakama admin analytics RPC module under `backend/modules/analytics`
- `ur-internals` will consume analytics through the same RPC transport pattern it already uses for internals admin APIs
- Planned RPC surface:
  - `rpc_admin_get_analytics_summary`
  - `rpc_admin_get_analytics_overview`
  - `rpc_admin_get_analytics_players`
  - `rpc_admin_get_analytics_gameplay`
  - `rpc_admin_get_analytics_tournaments`
  - `rpc_admin_get_analytics_progression`
  - `rpc_admin_get_analytics_realtime`

## Existing data and services to reuse

- Tournament admin storage and run metadata from:
  - `backend/modules/tournaments/admin.ts`
  - `backend/modules/tournaments/matchResults.ts`
  - `backend/modules/tournaments/liveStatus.ts`
  - `backend/modules/tournaments/auth.ts`
- Elo/ranked match data from:
  - `backend/modules/elo.ts`
  - `shared/elo.ts`
- Progression/XP data from:
  - `backend/modules/progression.ts`
  - `shared/progression.ts`
- Match mode metadata from:
  - `logic/matchConfigs.ts`
- Existing internals layout/components from:
  - `ur-internals/src/layout/DashboardLayout.tsx`
  - `ur-internals/src/components/*`

## Metrics that appear computable from real persisted data today

- Tournament runs created/opened/finalized
- Tournament entrant counts and bracket progress
- Tournament completion rate and per-round completion/dropout signals
- Tournament match counts and durations for recorded tournament matches
- Tournament match win/loss outcomes
- Ranked Elo leaderboard state and Elo distribution for leaderboard-visible players
- XP/rank state for players that can be resolved from known user IDs
- Current online player count from the presence RPC

## Metrics that are currently partial or unavailable without new tracking

- True login/session-based DAU and WAU
- New vs returning users from authenticated session activity
- Non-tournament match start/completion funnel across all modes
- Global disconnect/error rate outside currently persisted tournament/ranked records
- Queue size and wait time history
- Cross-mode activity for casual/private/bot/practice matches before analytics tracking exists
- Reliable retention cohorts until enough session/signup data is captured
- Detailed gameplay event metrics such as rosette frequency unless explicitly tracked

## Implementation rule

Analytics responses and UI states must distinguish between:

- metric value is truly zero
- metric is unavailable
- tracking is not implemented
- not enough data exists yet

No mock or fabricated analytics data should be introduced.
