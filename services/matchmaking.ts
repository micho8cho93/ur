import AsyncStorage from "@react-native-async-storage/async-storage";
import { MatchmakerMatched, Socket } from "@heroiclabs/nakama-js";

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

const ensureAuthenticated = async () => {
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

const waitForMatchmaker = (socket: Socket): Promise<MatchmakerMatched> =>
  new Promise((resolve) => {
    const previousHandler = socket.onmatchmakermatched;
    socket.onmatchmakermatched = (matched) => {
      socket.onmatchmakermatched = previousHandler;
      resolve(matched);
    };
  });

export const findMatch = async (): Promise<string> => {
  await ensureAuthenticated();
  const socket = await ensureSocket();

  const matchmakerPromise = waitForMatchmaker(socket);
  await socket.addMatchmaker("*", 2, 2);

  const matched = await matchmakerPromise;
  const match = await socket.joinMatch(matched.match_id || undefined, matched.token || undefined);
  return match.match_id;
};
