export type TournamentFeeCurrency = "soft" | "premium";

export type ParsedTournamentEntryFee = {
  amount: number;
  currency: TournamentFeeCurrency;
};

const FREE_FEE_LABELS = new Set(["free", "none", "no fee", "free entry"]);

const normalizeFeeText = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase().replace(/,/g, "");
  return normalized.length > 0 ? normalized : null;
};

const parseFeeAmount = (value: string): number | null => {
  const match = value.match(/(\d+(?:\.\d+)?)/);
  if (!match) {
    return null;
  }

  const parsed = Number(match[1]);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Math.floor(parsed);
};

export const parseTournamentEntryFee = (value: unknown): ParsedTournamentEntryFee | null => {
  const normalized = normalizeFeeText(value);
  if (!normalized || FREE_FEE_LABELS.has(normalized)) {
    return null;
  }

  const amount = parseFeeAmount(normalized);
  if (!amount) {
    return null;
  }

  if (
    normalized.includes("gem") ||
    normalized.includes("premium") ||
    normalized.startsWith("$") ||
    normalized.startsWith("usd ")
  ) {
    return { amount, currency: "premium" };
  }

  if (normalized.includes("coin") || normalized.includes("soft")) {
    return { amount, currency: "soft" };
  }

  return { amount, currency: "soft" };
};

export const formatTournamentEntryFee = (value: unknown): string => {
  const parsed = parseTournamentEntryFee(value);
  if (!parsed) {
    return "Free";
  }

  return `${parsed.amount} ${parsed.currency === "soft" ? "coins" : "gems"}`;
};
