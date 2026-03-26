import { RuntimeStorageObject, asRecord, findStorageObject } from "../progression";
import type { AdminRole, RuntimeContext, RuntimeLogger, RuntimeNakama } from "./types";

export const ADMIN_COLLECTION = "admins";
export const ADMIN_ROLE_KEY = "role";
export const RPC_ADMIN_WHOAMI = "rpc_admin_whoami";

const ADMIN_ROLE_RANK: Record<AdminRole, number> = {
  viewer: 1,
  operator: 2,
  admin: 3,
};

const readStringField = (value: unknown, keys: string[]): string | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  for (const key of keys) {
    const field = record[key];
    if (typeof field === "string" && field.trim().length > 0) {
      return field.trim();
    }
  }

  return null;
};

export const getContextUserId = (ctx: RuntimeContext): string => {
  const userId = readStringField(ctx, ["userId", "user_id"]);
  if (!userId) {
    throw new Error("Authentication required.");
  }

  return userId;
};

const normalizeAdminRole = (value: unknown): AdminRole | null => {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "viewer" || normalized === "operator" || normalized === "admin") {
      return normalized;
    }
  }

  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const role = readStringField(record, ["role"]);
  if (role === "viewer" || role === "operator" || role === "admin") {
    return role;
  }

  return null;
};

export const fetchAdminRole = (nk: RuntimeNakama, userId: string): AdminRole | null => {
  const objects = nk.storageRead([
    {
      collection: ADMIN_COLLECTION,
      key: ADMIN_ROLE_KEY,
      userId,
    },
  ]) as RuntimeStorageObject[];

  const object = findStorageObject(objects, ADMIN_COLLECTION, ADMIN_ROLE_KEY, userId);
  return normalizeAdminRole(object?.value ?? null);
};

export const hasRequiredRole = (actualRole: AdminRole | null, requiredRole: AdminRole): boolean => {
  if (!actualRole) {
    return false;
  }

  return ADMIN_ROLE_RANK[actualRole] >= ADMIN_ROLE_RANK[requiredRole];
};

export const assertAdmin = (
  ctx: RuntimeContext,
  requiredRole: AdminRole,
  nk: RuntimeNakama,
): AdminRole => {
  const userId = getContextUserId(ctx);
  const actualRole = fetchAdminRole(nk, userId);

  if (!hasRequiredRole(actualRole, requiredRole)) {
    throw new Error(`Unauthorized: ${requiredRole} role required.`);
  }

  return actualRole;
};

export const createAdminAuthorizer = (nk: RuntimeNakama) => ({
  fetchRole: (userId: string): AdminRole | null => fetchAdminRole(nk, userId),
  assertAdmin: (ctx: RuntimeContext, requiredRole: AdminRole): AdminRole => assertAdmin(ctx, requiredRole, nk),
});

type AdminWhoAmIResponse = {
  ok: true;
  userId: string;
  role: AdminRole;
  username: string | null;
  displayName: string | null;
  email: string | null;
};

const normalizeUserRecord = (value: unknown): Record<string, unknown> | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  return record;
};

const resolveAdminProfile = (
  nk: RuntimeNakama,
  userId: string,
): { username: string | null; displayName: string | null; email: string | null } => {
  if (typeof nk.usersGetId !== "function") {
    return {
      username: null,
      displayName: null,
      email: null,
    };
  }

  try {
    const rawUsers = nk.usersGetId([userId]);
    const users = Array.isArray(rawUsers) ? rawUsers : [];
    const profile =
      users
        .map((value: unknown) => normalizeUserRecord(value))
        .find((value): value is Record<string, unknown> => Boolean(value)) ?? null;

    return {
      username: readStringField(profile, ["username"]),
      displayName: readStringField(profile, ["displayName", "display_name"]),
      email: readStringField(profile, ["email"]),
    };
  } catch {
    return {
      username: null,
      displayName: null,
      email: null,
    };
  }
};

export const rpcAdminWhoAmI = (
  ctx: RuntimeContext,
  _logger: RuntimeLogger,
  nk: RuntimeNakama,
  _payload: string,
): string => {
  const role = assertAdmin(ctx, "viewer", nk);
  const userId = getContextUserId(ctx);
  const profile = resolveAdminProfile(nk, userId);

  const response: AdminWhoAmIResponse = {
    ok: true,
    userId,
    role,
    username: profile.username,
    displayName: profile.displayName,
    email: profile.email,
  };

  return JSON.stringify(response);
};
