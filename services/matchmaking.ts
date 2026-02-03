import AsyncStorage from "@react-native-async-storage/async-storage";
import { MatchmakerMatched, Session, Socket } from "@heroiclabs/nakama-js";

import { nakamaService } from "./nakama";

const DEVICE_ID_STORAGE_KEY = "nakama.deviceId";

const getOrCreateDeviceId = async (): Promise<string> => {
  const existing = await AsyncStorage.getItem(DEVICE_ID_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const deviceId = `device-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  await AsyncStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
  return deviceId;
};

const ensureAuthenticated = async (): Promise<Session> => {
  const session = await nakamaService.loadSession();
  if (session) {
    return session;
  }

  const deviceId = await getOrCreateDeviceId();
  return nakamaService.authenticateDevice(deviceId, true);
};

const ensureSocket = async (): Promise<Socket> => {
  const existing = nakamaService.getSocket();
  if (existing) {
    return existing;
  }

  return nakamaService.connectSocket();
};

const waitForMatchmaker = (socket: Socket, timeoutMs: number): Promise<MatchmakerMatched> =>
  new Promise((resolve, reject) => {
    const previousHandler = socket.onmatchmakermatched;
    const timeout = setTimeout(() => {
      socket.onmatchmakermatched = previousHandler;
      reject(new Error("Matchmaking timed out. Please try again."));
    }, timeoutMs);

    socket.onmatchmakermatched = (matched) => {
      clearTimeout(timeout);
      socket.onmatchmakermatched = previousHandler;
      resolve(matched);
    };
  });

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

export type MatchResult = {
  matchId: string;
  session: Session;
  userId: string;
};

export type MatchmakingHandlers = {
  onSearching?: () => void;
};

export const findMatch = async (handlers?: MatchmakingHandlers): Promise<MatchResult> => {
  const session = await ensureAuthenticated();
  const socket = await withTimeout(
    ensureSocket(),
    10_000,
    "Connecting to the game server timed out. Please retry."
  );

  const matchmakerPromise = waitForMatchmaker(socket, 20_000);
  await withTimeout(
    socket.addMatchmaker("*", 2, 2),
    10_000,
    "Unable to start matchmaking. Please retry."
  );
  handlers?.onSearching?.();

  const matched = await matchmakerPromise;
  const match = await withTimeout(
    socket.joinMatch(matched.match_id || undefined, matched.token || undefined),
    10_000,
    "Joining the match timed out. Please retry."
  );
  return { matchId: match.match_id, session, userId: session.user_id };
};
