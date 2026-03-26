#!/usr/bin/env node

import { Client } from "@heroiclabs/nakama-js";

const RPC = {
  createTournamentRun: "rpc_admin_create_tournament_run",
  listTournaments: "rpc_admin_list_tournaments",
  openTournament: "rpc_admin_open_tournament",
  getTournamentStandings: "rpc_admin_get_tournament_standings",
};

function parseBoolean(value, fallback) {
  if (value === undefined) {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();
  if (normalized === "true" || normalized === "1" || normalized === "yes") {
    return true;
  }

  if (normalized === "false" || normalized === "0" || normalized === "no") {
    return false;
  }

  return fallback;
}

function parseInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.floor(parsed) : fallback;
}

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function buildClient() {
  const host = process.env.NAKAMA_HOST?.trim() || "nakama.urgame.live";
  const port = String(parseInteger(process.env.NAKAMA_PORT, 443));
  const useSSL = parseBoolean(process.env.NAKAMA_USE_SSL, true);
  const serverKey = process.env.NAKAMA_SERVER_KEY?.trim() || "defaultkey";
  const timeoutMs = parseInteger(process.env.NAKAMA_TIMEOUT_MS, 7000);

  return new Client(serverKey, host, port, useSSL, timeoutMs);
}

function tryParseJson(value) {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function unwrapRpcPayload(response) {
  if (response && typeof response === "object" && typeof response.payload === "string") {
    return tryParseJson(response.payload);
  }

  return tryParseJson(response);
}

async function callRpc(client, session, rpcId, payload = {}) {
  const response = await client.rpc(session, rpcId, payload);
  return unwrapRpcPayload(response);
}

function buildCreatePayload() {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const startTime = parseInteger(process.env.NAKAMA_TEST_START_TIME, nowSeconds + 300);
  const duration = parseInteger(process.env.NAKAMA_TEST_DURATION_SECONDS, 3600);
  const endTime = parseInteger(process.env.NAKAMA_TEST_END_TIME, startTime + duration);
  const runId =
    process.env.NAKAMA_TEST_RUN_ID?.trim() || `admin-rpc-smoke-${Date.now().toString(36)}`;
  const title =
    process.env.NAKAMA_TEST_RUN_TITLE?.trim() ||
    `Admin RPC Smoke ${new Date().toISOString()}`;

  return {
    runId,
    title,
    description: "Created by scripts/test-nakama-tournament-admin-rpcs.mjs",
    category: parseInteger(process.env.NAKAMA_TEST_CATEGORY, 0),
    authoritative: parseBoolean(process.env.NAKAMA_TEST_AUTHORITATIVE, true),
    sortOrder: process.env.NAKAMA_TEST_SORT_ORDER?.trim() || "desc",
    operator: process.env.NAKAMA_TEST_OPERATOR?.trim() || "incr",
    resetSchedule: process.env.NAKAMA_TEST_RESET_SCHEDULE?.trim() || "",
    metadata: {
      gameMode: process.env.NAKAMA_TEST_GAME_MODE?.trim() || "Classic ladder",
      region: process.env.NAKAMA_TEST_REGION?.trim() || "Global",
      buyIn: process.env.NAKAMA_TEST_BUY_IN?.trim() || "Free",
      source: "scripts/test-nakama-tournament-admin-rpcs.mjs",
    },
    startTime,
    endTime,
    duration,
    maxSize: parseInteger(process.env.NAKAMA_TEST_MAX_SIZE, 32),
    maxNumScore: parseInteger(process.env.NAKAMA_TEST_MAX_NUM_SCORE, 3),
    joinRequired: parseBoolean(process.env.NAKAMA_TEST_JOIN_REQUIRED, true),
    enableRanks: parseBoolean(process.env.NAKAMA_TEST_ENABLE_RANKS, true),
  };
}

function printStep(title, payload) {
  console.log(`\n=== ${title} ===`);
  console.log(JSON.stringify(payload, null, 2));
}

async function main() {
  const client = buildClient();
  const email = requireEnv("NAKAMA_ADMIN_EMAIL");
  const password = requireEnv("NAKAMA_ADMIN_PASSWORD");

  console.log("Authenticating with Nakama...");
  const session = await client.authenticateEmail(email, password, false);
  printStep("Authenticated", {
    email,
    tokenPreview: `${session.token.slice(0, 12)}...${session.token.slice(-8)}`,
  });

  const createPayload = buildCreatePayload();
  const createdRun = await callRpc(client, session, RPC.createTournamentRun, createPayload);
  printStep("Created Tournament Run", createdRun);

  const runId =
    createdRun?.run?.runId ||
    createdRun?.run?.run_id ||
    createPayload.runId;

  if (!runId) {
    throw new Error("Unable to resolve runId from create response.");
  }

  const openedRun = await callRpc(client, session, RPC.openTournament, { runId });
  printStep("Opened Tournament Run", openedRun);

  const listedRuns = await callRpc(client, session, RPC.listTournaments, {
    limit: parseInteger(process.env.NAKAMA_TEST_LIST_LIMIT, 10),
  });
  printStep("Listed Tournament Runs", listedRuns);

  const standings = await callRpc(client, session, RPC.getTournamentStandings, {
    runId,
    limit: parseInteger(process.env.NAKAMA_TEST_STANDINGS_LIMIT, 20),
  });
  printStep("Fetched Standings", standings);

  console.log("\nAdmin RPC smoke test completed successfully.");
}

main().catch((error) => {
  console.error("\nAdmin RPC smoke test failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
