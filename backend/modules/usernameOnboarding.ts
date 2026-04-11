import {
  ClaimUsernameRpcResponse,
  ClaimUsernameRpcRequest,
  ClaimUsernameErrorCode,
  UsernameOnboardingStatusRpcRequest,
  UsernameOnboardingStatusRpcResponse,
  sanitizeUsernameSuggestionBase,
  validateUsername,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from "../../shared/usernameOnboarding";
import {
  MAX_WRITE_ATTEMPTS,
  STORAGE_PERMISSION_NONE,
  RuntimeStorageObject,
  asRecord,
  findStorageObject,
  getErrorMessage,
  getStorageObjectVersion,
} from "./progression";

type RuntimeContext = any;
type RuntimeLogger = any;
type RuntimeNakama = any;

const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";

export const RPC_GET_USERNAME_ONBOARDING_STATUS = "get_username_onboarding_status";
export const RPC_CLAIM_USERNAME = "claim_username";

export const USERNAME_PROFILE_COLLECTION = "user_profile";
export const USERNAME_PROFILE_KEY = "profile";
export const USERNAME_CANONICAL_INDEX_COLLECTION = "username_canonical_index";

type UsernameProfile = {
  userId: string;
  usernameDisplay: string | null;
  usernameCanonical: string | null;
  onboardingComplete: boolean;
  authProvider: "google";
  createdAt: string;
  updatedAt: string;
};

type UsernameClaimIndexRecord = {
  userId: string;
  usernameDisplay: string;
  usernameCanonical: string;
  claimedAt: string;
  updatedAt: string;
};

const FALLBACK_SUGGESTION_BASES = ["Rosette", "Lapis", "Sumer", "Reed", "RoyalUr"];

const readStringField = (value: unknown, keys: string[]): string | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  for (const key of keys) {
    const field = record[key];
    if (typeof field === "string" && field.length > 0) {
      return field;
    }
  }

  return null;
};

const readBooleanField = (value: unknown, keys: string[]): boolean | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  for (const key of keys) {
    const field = record[key];
    if (typeof field === "boolean") {
      return field;
    }
  }

  return null;
};

const createDefaultUsernameProfile = (userId: string, now: string): UsernameProfile => ({
  userId,
  usernameDisplay: null,
  usernameCanonical: null,
  onboardingComplete: false,
  authProvider: "google",
  createdAt: now,
  updatedAt: now,
});

const normalizeUsernameProfile = (
  rawValue: unknown,
  userId: string,
  fallbackTimestamp = new Date().toISOString(),
): UsernameProfile => {
  const defaults = createDefaultUsernameProfile(userId, fallbackTimestamp);
  const usernameDisplay = readStringField(rawValue, ["usernameDisplay", "username_display"]);
  const usernameCanonical = readStringField(rawValue, ["usernameCanonical", "username_canonical"]);
  const createdAt = readStringField(rawValue, ["createdAt", "created_at"]) ?? defaults.createdAt;
  const updatedAt = readStringField(rawValue, ["updatedAt", "updated_at"]) ?? defaults.updatedAt;
  const onboardingComplete = readBooleanField(rawValue, ["onboardingComplete", "onboarding_complete"]);
  const hasValidUsername = Boolean(usernameDisplay && usernameCanonical);

  return {
    userId,
    usernameDisplay: usernameDisplay ?? null,
    usernameCanonical: usernameCanonical ? usernameCanonical.toLowerCase() : null,
    onboardingComplete: Boolean(onboardingComplete && hasValidUsername),
    authProvider: "google",
    createdAt,
    updatedAt,
  };
};

const normalizeUsernameClaimIndexRecord = (rawValue: unknown): UsernameClaimIndexRecord | null => {
  const record = asRecord(rawValue);
  if (!record) {
    return null;
  }

  const userId = readStringField(record, ["userId", "user_id"]);
  const usernameDisplay = readStringField(record, ["usernameDisplay", "username_display"]);
  const usernameCanonical = readStringField(record, ["usernameCanonical", "username_canonical"]);
  const claimedAt = readStringField(record, ["claimedAt", "claimed_at"]);
  const updatedAt = readStringField(record, ["updatedAt", "updated_at"]);

  if (!userId || !usernameDisplay || !usernameCanonical || !claimedAt || !updatedAt) {
    return null;
  }

  return {
    userId,
    usernameDisplay,
    usernameCanonical: usernameCanonical.toLowerCase(),
    claimedAt,
    updatedAt,
  };
};

const readUsernameProfileObject = (nk: RuntimeNakama, userId: string): RuntimeStorageObject | null => {
  const objects = nk.storageRead([
    {
      collection: USERNAME_PROFILE_COLLECTION,
      key: USERNAME_PROFILE_KEY,
      userId,
    },
  ]) as RuntimeStorageObject[];

  return findStorageObject(objects, USERNAME_PROFILE_COLLECTION, USERNAME_PROFILE_KEY, userId);
};

const readUsernameProfile = (
  nk: RuntimeNakama,
  userId: string,
): { object: RuntimeStorageObject | null; profile: UsernameProfile } => {
  const object = readUsernameProfileObject(nk, userId);
  return {
    object,
    profile: normalizeUsernameProfile(object?.value, userId),
  };
};

const readUsernameCanonicalIndex = (
  nk: RuntimeNakama,
  usernameCanonical: string,
): { object: RuntimeStorageObject | null; record: UsernameClaimIndexRecord | null } => {
  const objects = nk.storageRead([
    {
      collection: USERNAME_CANONICAL_INDEX_COLLECTION,
      key: usernameCanonical,
      userId: SYSTEM_USER_ID,
    },
  ]) as RuntimeStorageObject[];
  const object = findStorageObject(
    objects,
    USERNAME_CANONICAL_INDEX_COLLECTION,
    usernameCanonical,
    SYSTEM_USER_ID,
  );

  return {
    object,
    record: normalizeUsernameClaimIndexRecord(object?.value),
  };
};

const buildClaimUsernameError = (
  errorCode: ClaimUsernameErrorCode,
  errorMessage: string,
): ClaimUsernameRpcResponse => ({
  success: false,
  errorCode,
  errorMessage,
});

const buildClaimUsernameSuccess = (usernameDisplay: string): ClaimUsernameRpcResponse => ({
  success: true,
  usernameDisplay,
  onboardingComplete: true,
});

const parseStatusRequest = (payload: string): UsernameOnboardingStatusRpcRequest => {
  if (!payload) {
    return {};
  }

  const data = asRecord(JSON.parse(payload));
  if (!data) {
    return {};
  }

  return {
    displayNameHint: typeof data.displayNameHint === "string" ? data.displayNameHint : null,
    emailHint: typeof data.emailHint === "string" ? data.emailHint : null,
  };
};

const parseClaimUsernameRequest = (payload: string): ClaimUsernameRpcRequest => {
  if (!payload) {
    return {
      username: "",
    };
  }

  const data = asRecord(JSON.parse(payload));
  return {
    username: typeof data?.username === "string" ? data.username : "",
  };
};

const ensureUsernameProfile = (
  nk: RuntimeNakama,
  userId: string,
): { object: RuntimeStorageObject | null; profile: UsernameProfile } => {
  const existing = readUsernameProfile(nk, userId);
  if (existing.object) {
    return existing;
  }

  const createdAt = new Date().toISOString();
  const nextProfile = createDefaultUsernameProfile(userId, createdAt);

  try {
    nk.storageWrite([
      {
        collection: USERNAME_PROFILE_COLLECTION,
        key: USERNAME_PROFILE_KEY,
        userId,
        value: nextProfile,
        version: "*",
        permissionRead: STORAGE_PERMISSION_NONE,
        permissionWrite: STORAGE_PERMISSION_NONE,
      },
    ]);
  } catch {
    // Another request may have created the profile concurrently.
  }

  return readUsernameProfile(nk, userId);
};

const createDeterministicNumber = (input: string, digits = 3): string => {
  let total = 0;
  for (let index = 0; index < input.length; index += 1) {
    total = (total * 33 + input.charCodeAt(index)) % 100000;
  }

  const lowerBound = Math.pow(10, Math.max(1, digits) - 1);
  const range = Math.pow(10, Math.max(1, digits)) - lowerBound;
  const value = lowerBound + (range > 0 ? total % range : total % 10);
  return String(value);
};

const appendNumericSuffix = (base: string, suffix: string): string => {
  const suffixValue = suffix.replace(/[^0-9]/g, "");
  if (!suffixValue) {
    return base.slice(0, USERNAME_MAX_LENGTH);
  }

  const trimmedBase = base.slice(0, Math.max(0, USERNAME_MAX_LENGTH - suffixValue.length));
  return `${trimmedBase}${suffixValue}`.slice(0, USERNAME_MAX_LENGTH);
};

const buildSuggestionBaseCandidates = (request: UsernameOnboardingStatusRpcRequest, userId: string): string[] => {
  const displayNameHints = [
    request.displayNameHint ?? "",
    request.displayNameHint?.split(/\s+/)[0] ?? "",
  ];
  const emailHint = request.emailHint?.split("@")[0] ?? "";
  const fallbackBases = FALLBACK_SUGGESTION_BASES.map((base) => {
    const themedBase = sanitizeUsernameSuggestionBase(base);
    const suffix = createDeterministicNumber(`${userId}:${base}`, 3);
    return appendNumericSuffix(themedBase, suffix);
  });

  const rawCandidates = [
    ...displayNameHints,
    emailHint,
    ...FALLBACK_SUGGESTION_BASES,
    ...fallbackBases,
  ];
  const deduped = new Set<string>();

  rawCandidates.forEach((candidate) => {
    const sanitized = sanitizeUsernameSuggestionBase(candidate);
    if (!sanitized) {
      return;
    }

    deduped.add(sanitized);

    if (sanitized.length < USERNAME_MIN_LENGTH) {
      deduped.add(sanitizeUsernameSuggestionBase(`Ur${sanitized}`));
    }

    deduped.add(appendNumericSuffix(sanitized, createDeterministicNumber(`${userId}:${sanitized}`, 3)));
    deduped.add(appendNumericSuffix(sanitized, createDeterministicNumber(`${sanitized}:${userId}`, 4)));
  });

  return [...deduped].filter((candidate) => validateUsername(candidate).isValid);
};

const isUsernameCanonicalAvailable = (
  nk: RuntimeNakama,
  usernameCanonical: string,
  userId: string,
): boolean => {
  const existing = readUsernameCanonicalIndex(nk, usernameCanonical).record;
  return !existing || existing.userId === userId;
};

const suggestAvailableUsername = (
  nk: RuntimeNakama,
  request: UsernameOnboardingStatusRpcRequest,
  userId: string,
): string => {
  const candidates = buildSuggestionBaseCandidates(request, userId);

  for (const candidate of candidates) {
    const validation = validateUsername(candidate);
    if (!validation.isValid) {
      continue;
    }

    if (isUsernameCanonicalAvailable(nk, validation.canonical, userId)) {
      return validation.display;
    }
  }

  for (let attempt = 0; attempt < 200; attempt += 1) {
    const base = FALLBACK_SUGGESTION_BASES[attempt % FALLBACK_SUGGESTION_BASES.length];
    const suffix = createDeterministicNumber(`${userId}:${attempt}`, 4);
    const candidate = appendNumericSuffix(sanitizeUsernameSuggestionBase(base), suffix);
    const validation = validateUsername(candidate);

    if (validation.isValid && isUsernameCanonicalAvailable(nk, validation.canonical, userId)) {
      return validation.display;
    }
  }

  return "UrPlayer";
};

export const getUsernameOnboardingProfile = (nk: RuntimeNakama, userId: string): UsernameProfile =>
  readUsernameProfile(nk, userId).profile;

export const isUsernameOnboardingComplete = (nk: RuntimeNakama, userId: string): boolean => {
  const { object, profile } = readUsernameProfile(nk, userId);
  return Boolean(object && profile.onboardingComplete);
};

export const requireCompletedUsernameOnboarding = (nk: RuntimeNakama, userId: string): void => {
  const { object, profile } = readUsernameProfile(nk, userId);
  if (!object || profile.onboardingComplete) {
    return;
  }

  throw new Error("Choose a username before accessing multiplayer or social features.");
};

export const rpcGetUsernameOnboardingStatus = (
  ctx: RuntimeContext,
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  payload: string,
): string => {
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }

  const request = parseStatusRequest(payload);
  const { profile } = ensureUsernameProfile(nk, ctx.userId);

  const response: UsernameOnboardingStatusRpcResponse = profile.onboardingComplete && profile.usernameDisplay
    ? {
        onboardingComplete: true,
        currentUsername: profile.usernameDisplay,
        suggestedUsername: null,
      }
    : {
        onboardingComplete: false,
        currentUsername: null,
        suggestedUsername: suggestAvailableUsername(nk, request, ctx.userId),
      };

  logger.info("Username onboarding status requested for user %s (complete=%s).", ctx.userId, response.onboardingComplete);
  return JSON.stringify(response);
};

export const rpcClaimUsername = (
  ctx: RuntimeContext,
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  payload: string,
): string => {
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }

  const request = parseClaimUsernameRequest(payload);
  const validation = validateUsername(request.username);

  if (!validation.isValid) {
    return JSON.stringify(
      buildClaimUsernameError("INVALID_USERNAME", validation.errorMessage ?? "Username is invalid."),
    );
  }

  for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt += 1) {
    const objects = nk.storageRead([
      {
        collection: USERNAME_PROFILE_COLLECTION,
        key: USERNAME_PROFILE_KEY,
        userId: ctx.userId,
      },
      {
        collection: USERNAME_CANONICAL_INDEX_COLLECTION,
        key: validation.canonical,
        userId: SYSTEM_USER_ID,
      },
    ]) as RuntimeStorageObject[];

    const profileObject = findStorageObject(objects, USERNAME_PROFILE_COLLECTION, USERNAME_PROFILE_KEY, ctx.userId);
    const indexObject = findStorageObject(
      objects,
      USERNAME_CANONICAL_INDEX_COLLECTION,
      validation.canonical,
      SYSTEM_USER_ID,
    );
    const profile = normalizeUsernameProfile(profileObject?.value, ctx.userId);
    const existingIndexRecord = normalizeUsernameClaimIndexRecord(indexObject?.value);

    if (profile.onboardingComplete && profile.usernameDisplay && profile.usernameCanonical === validation.canonical) {
      return JSON.stringify(buildClaimUsernameSuccess(profile.usernameDisplay));
    }

    if (profile.onboardingComplete) {
      return JSON.stringify(
        buildClaimUsernameError("USERNAME_ALREADY_SET", "Your username has already been claimed."),
      );
    }

    if (existingIndexRecord && existingIndexRecord.userId !== ctx.userId) {
      return JSON.stringify(
        buildClaimUsernameError("USERNAME_TAKEN", "That username is already taken."),
      );
    }

    const now = new Date().toISOString();
    const nextProfile: UsernameProfile = {
      userId: ctx.userId,
      usernameDisplay: validation.display,
      usernameCanonical: validation.canonical,
      onboardingComplete: true,
      authProvider: "google",
      createdAt: profile.createdAt,
      updatedAt: now,
    };
    const nextIndexRecord: UsernameClaimIndexRecord = {
      userId: ctx.userId,
      usernameDisplay: validation.display,
      usernameCanonical: validation.canonical,
      claimedAt: existingIndexRecord?.claimedAt ?? now,
      updatedAt: now,
    };

    try {
      nk.storageWrite([
        {
          collection: USERNAME_PROFILE_COLLECTION,
          key: USERNAME_PROFILE_KEY,
          userId: ctx.userId,
          value: nextProfile,
          version: profileObject ? (getStorageObjectVersion(profileObject) ?? "") : "*",
          permissionRead: STORAGE_PERMISSION_NONE,
          permissionWrite: STORAGE_PERMISSION_NONE,
        },
        {
          collection: USERNAME_CANONICAL_INDEX_COLLECTION,
          key: validation.canonical,
          userId: SYSTEM_USER_ID,
          value: nextIndexRecord,
          version: indexObject ? (getStorageObjectVersion(indexObject) ?? "") : "*",
          permissionRead: STORAGE_PERMISSION_NONE,
          permissionWrite: STORAGE_PERMISSION_NONE,
        },
      ]);

      logger.info("User %s claimed username %s.", ctx.userId, validation.display);
      return JSON.stringify(buildClaimUsernameSuccess(validation.display));
    } catch (error) {
      logger.warn(
        "Username claim write attempt %d/%d failed for user %s (%s): %s",
        attempt,
        MAX_WRITE_ATTEMPTS,
        ctx.userId,
        validation.canonical,
        getErrorMessage(error),
      );
    }
  }

  return JSON.stringify(
    buildClaimUsernameError("SERVER_ERROR", "Unable to claim a username right now. Please try again."),
  );
};
