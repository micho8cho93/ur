import Constants from "expo-constants";

export type NakamaConfig = {
  host: string;
  port: string;
  useSSL: boolean;
  serverKey: string;
  timeoutMs: number;
};

type ExtraConfig = Record<string, string | number | boolean | undefined>;

const extra = (Constants.expoConfig?.extra ?? {}) as ExtraConfig;

const getEnvValue = (key: string): string | number | boolean | undefined => {
  return process.env[key] ?? extra[key];
};

const requireEnv = (key: string): string => {
  const value = getEnvValue(key);
  if (value === undefined || value === null || value === "") {
    throw new Error(`Missing required Nakama config value: ${key}`);
  }
  return String(value);
};

const parseBoolean = (value: string | number | boolean | undefined): boolean => {
  if (value === true || value === "true" || value === 1 || value === "1") {
    return true;
  }
  if (value === false || value === "false" || value === 0 || value === "0") {
    return false;
  }
  return false;
};

const parseNumber = (value: string | number | boolean | undefined, fallback: number): number => {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return fallback;
};

const requiredKeys = [
  "EXPO_PUBLIC_NAKAMA_HOST",
  "EXPO_PUBLIC_NAKAMA_PORT",
  "EXPO_PUBLIC_NAKAMA_SERVER_KEY",
] as const;

export const hasNakamaConfig = (): boolean =>
  requiredKeys.every((key) => {
    const value = getEnvValue(key);
    return value !== undefined && value !== null && value !== "";
  });

export const getNakamaConfig = (): NakamaConfig => {
  if (!hasNakamaConfig()) {
    const missing = requiredKeys.filter((key) => {
      const value = getEnvValue(key);
      return value === undefined || value === null || value === "";
    });
    throw new Error(`Missing required Nakama config value(s): ${missing.join(", ")}`);
  }

  return {
    host: requireEnv("EXPO_PUBLIC_NAKAMA_HOST"),
    port: requireEnv("EXPO_PUBLIC_NAKAMA_PORT"),
    useSSL: parseBoolean(getEnvValue("EXPO_PUBLIC_NAKAMA_USE_SSL")),
    serverKey: requireEnv("EXPO_PUBLIC_NAKAMA_SERVER_KEY"),
    timeoutMs: parseNumber(getEnvValue("EXPO_PUBLIC_NAKAMA_TIMEOUT_MS"), 7000),
  };
};
