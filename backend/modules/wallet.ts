import {
  PREMIUM_CURRENCY_KEY,
  SOFT_CURRENCY_KEY,
  WalletBalances,
  WalletRpcResponse,
  buildWalletRpcResponse,
  calculateChallengeSoftCurrencyReward,
  parseWalletBalances,
} from "../../shared/wallet";

type RuntimeContext = any;
type RuntimeLogger = any;
type RuntimeNakama = any;

type RuntimeRecord = Record<string, unknown>;

export const RPC_GET_WALLET = "get_wallet";

const WALLET_LEDGER_PAGE_SIZE = 100;
const CHALLENGE_COMPLETION_CURRENCY_SOURCE = "challenge_completion";

const asRecord = (value: unknown): RuntimeRecord | null =>
  typeof value === "object" && value !== null ? (value as RuntimeRecord) : null;

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

const readNumberField = (value: unknown, keys: string[]): number | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  for (const key of keys) {
    const field = record[key];
    if (typeof field === "number" && Number.isFinite(field)) {
      return field;
    }
    if (typeof field === "string" && field.trim().length > 0) {
      const parsed = Number(field);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
};

const parseJsonRecord = (value: unknown): RuntimeRecord | null => {
  if (typeof value === "string" && value.trim().length > 0) {
    try {
      return asRecord(JSON.parse(value));
    } catch {
      return null;
    }
  }

  return asRecord(value);
};

export const getWalletForUser = (nk: RuntimeNakama, userId: string): WalletBalances => {
  const account = nk.accountGetId(userId);
  return parseWalletBalances(account?.wallet);
};

export const getWalletResponseForUser = (nk: RuntimeNakama, userId: string): WalletRpcResponse => {
  const wallet = getWalletForUser(nk, userId);
  return buildWalletRpcResponse(wallet[SOFT_CURRENCY_KEY], wallet[PREMIUM_CURRENCY_KEY]);
};

type ChallengeSoftCurrencyMetadata = {
  source: typeof CHALLENGE_COMPLETION_CURRENCY_SOURCE;
  currency: typeof SOFT_CURRENCY_KEY;
  matchId: string;
  challengeId: string;
  amount: number;
};

const buildChallengeSoftCurrencyMetadata = (
  matchId: string,
  challengeId: string,
  amount: number
): ChallengeSoftCurrencyMetadata => ({
  source: CHALLENGE_COMPLETION_CURRENCY_SOURCE,
  currency: SOFT_CURRENCY_KEY,
  matchId,
  challengeId,
  amount,
});

const normalizeWalletLedgerResult = (result: unknown): { items: RuntimeRecord[]; cursor: string | null } => {
  if (Array.isArray(result)) {
    return {
      items: result.filter((item): item is RuntimeRecord => asRecord(item) !== null),
      cursor: null,
    };
  }

  const record = asRecord(result);
  if (!record) {
    return { items: [], cursor: null };
  }

  const rawItems = Array.isArray(record.items)
    ? record.items
    : Array.isArray(record.walletLedgerItems)
      ? record.walletLedgerItems
      : Array.isArray(record.runtimeItems)
        ? record.runtimeItems
        : [];

  return {
    items: rawItems.filter((item): item is RuntimeRecord => asRecord(item) !== null),
    cursor: readStringField(record, ["cursor"]),
  };
};

const getLedgerItemMetadata = (item: RuntimeRecord): RuntimeRecord | null =>
  parseJsonRecord(item.metadata ?? item.Metadata);

const getLedgerItemChangeset = (item: RuntimeRecord): RuntimeRecord | null =>
  parseJsonRecord(item.changeset ?? item.Changeset);

const isMatchingChallengeSoftCurrencyLedgerItem = (
  item: RuntimeRecord,
  metadata: ChallengeSoftCurrencyMetadata
): boolean => {
  const ledgerMetadata = getLedgerItemMetadata(item);
  if (!ledgerMetadata) {
    return false;
  }

  const metadataAmount = readNumberField(ledgerMetadata, ["amount"]);
  if (
    readStringField(ledgerMetadata, ["source"]) !== metadata.source ||
    readStringField(ledgerMetadata, ["currency"]) !== metadata.currency ||
    readStringField(ledgerMetadata, ["matchId", "match_id"]) !== metadata.matchId ||
    readStringField(ledgerMetadata, ["challengeId", "challenge_id"]) !== metadata.challengeId ||
    metadataAmount !== metadata.amount
  ) {
    return false;
  }

  const changeset = getLedgerItemChangeset(item);
  if (!changeset) {
    return true;
  }

  return readNumberField(changeset, [SOFT_CURRENCY_KEY]) === metadata.amount;
};

export const hasChallengeSoftCurrencyLedgerEntry = (
  nk: RuntimeNakama,
  userId: string,
  metadata: ChallengeSoftCurrencyMetadata
): boolean => {
  let cursor = "";

  while (true) {
    const result = cursor
      ? nk.walletLedgerList(userId, WALLET_LEDGER_PAGE_SIZE, cursor)
      : nk.walletLedgerList(userId, WALLET_LEDGER_PAGE_SIZE);
    const { items, cursor: nextCursor } = normalizeWalletLedgerResult(result);

    if (items.some((item) => isMatchingChallengeSoftCurrencyLedgerItem(item, metadata))) {
      return true;
    }

    if (!nextCursor || nextCursor === cursor) {
      return false;
    }

    cursor = nextCursor;
  }
};

export const awardChallengeSoftCurrency = (
  nk: RuntimeNakama,
  logger: RuntimeLogger,
  params: {
    userId: string;
    matchId: string;
    challengeId: string;
    rewardXp: number;
  }
): { awardedSoftCurrency: number; duplicate: boolean } => {
  const awardedSoftCurrency = calculateChallengeSoftCurrencyReward(params.rewardXp);
  if (awardedSoftCurrency <= 0) {
    return { awardedSoftCurrency: 0, duplicate: false };
  }

  const metadata = buildChallengeSoftCurrencyMetadata(
    params.matchId,
    params.challengeId,
    awardedSoftCurrency
  );

  if (hasChallengeSoftCurrencyLedgerEntry(nk, params.userId, metadata)) {
    return { awardedSoftCurrency, duplicate: true };
  }

  nk.walletUpdate(
    params.userId,
    {
      [SOFT_CURRENCY_KEY]: awardedSoftCurrency,
    },
    metadata,
    true
  );

  logger.info(
    "Awarded %d Coins to user %s for challenge %s on match %s.",
    awardedSoftCurrency,
    params.userId,
    params.challengeId,
    params.matchId
  );

  return { awardedSoftCurrency, duplicate: false };
};

export const rpcGetWallet = (
  ctx: RuntimeContext,
  _logger: RuntimeLogger,
  nk: RuntimeNakama,
  _payload: string
): string => {
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }

  return JSON.stringify(getWalletResponseForUser(nk, ctx.userId));
};
