import AsyncStorage from "@react-native-async-storage/async-storage";
import { Channel, Client, Session, Socket } from "@heroiclabs/nakama-js";

import { getNakamaConfig } from "../config/nakama";

const SESSION_STORAGE_KEY = "nakama.session";
const DEVICE_ID_STORAGE_KEY = "nakama.deviceId";

const GLOBAL_LOBBY_CHANNEL = "global_lobby";
const ONLINE_COUNT_RPC = "global_lobby_count";
const ONLINE_COUNT_POLL_INTERVAL_MS = 5_000;

export type GlobalLobbyCount = {
  count: number;
  stream: string;
};

type ConnectRetryOptions = {
  attempts?: number;
  retryDelayMs?: number;
  createStatus?: boolean;
};

export type StoredSession = {
  token: string;
  refreshToken: string;
};

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export class NakamaService {
  private client: Client | null = null;
  private session: Session | null = null;
  private socket: Socket | null = null;
  private globalLobbyChannel: Channel | null = null;
  private globalLobbyJoinPromise: Promise<Channel> | null = null;

  getClient(): Client {
    if (!this.client) {
      const config = getNakamaConfig();
      const host = config.host;
      const port = config.port;
      const useSSL = config.useSSL;
      this.client = new Client(
        config.serverKey,
        host,
        port,
        useSSL,
        config.timeoutMs
      );
    }
    return this.client;
  }

  async authenticateEmail(email: string, password: string, create = false, username?: string): Promise<Session> {
    const session = await this.getClient().authenticateEmail(email, password, create, username);
    this.session = session;
    await this.persistSession(session);
    return session;
  }

  async authenticateDevice(deviceId: string, create = true, username?: string): Promise<Session> {
    const session = await this.getClient().authenticateDevice(deviceId, create, username);
    this.session = session;
    await this.persistSession(session);
    return session;
  }

  async ensureAuthenticatedDevice(username?: string): Promise<Session> {
    const existing = await this.loadSession();
    if (existing) {
      return existing;
    }

    const deviceId = await this.getOrCreateDeviceId();
    return this.authenticateDevice(deviceId, true, username);
  }

  async loadSession(): Promise<Session | null> {
    if (this.session) {
      return this.session;
    }

    const rawSession = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
    if (!rawSession) {
      return null;
    }

    try {
      const stored = JSON.parse(rawSession) as StoredSession;
      if (!stored.token || !stored.refreshToken) {
        return null;
      }

      const restored = Session.restore(stored.token, stored.refreshToken);
      if (restored.isexpired(Date.now() / 1000) && restored.refresh_token) {
        const refreshed = await this.getClient().sessionRefresh(restored);
        this.session = refreshed;
        await this.persistSession(refreshed);
        return refreshed;
      }

      this.session = restored;
      return restored;
    } catch {
      await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
  }

  async connectSocket(createStatus = true): Promise<Socket> {
    const session = await this.loadSession();
    if (!session) {
      throw new Error("No Nakama session available. Authenticate first.");
    }

    if (this.socket) {
      if (!this.globalLobbyChannel) {
        await this.joinGlobalLobby();
      }
      return this.socket;
    }

    const config = getNakamaConfig();
    const socket = this.getClient().createSocket(config.useSSL, false);
    await socket.connect(session, createStatus);

    socket.ondisconnect = (event) => {
      this.globalLobbyChannel = null;
      console.info("[nakama] socket disconnected", event);
    };

    this.socket = socket;
    console.info("[nakama] socket connected");
    await this.joinGlobalLobby();
    return socket;
  }

  async connectSocketWithRetry(options?: ConnectRetryOptions): Promise<Socket> {
    const attempts = options?.attempts ?? 3;
    const retryDelayMs = options?.retryDelayMs ?? 1_200;
    const createStatus = options?.createStatus ?? true;

    let lastError: unknown = null;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        if (attempt > 1) {
          console.info("[nakama] reconnect attempt", { attempt, attempts });
        }
        return await this.connectSocket(createStatus);
      } catch (error) {
        lastError = error;
        this.disconnectSocket(false);
        if (attempt < attempts) {
          await delay(retryDelayMs);
        }
      }
    }

    if (lastError instanceof Error) {
      throw lastError;
    }

    throw new Error("Unable to connect to Nakama socket.");
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  getSession(): Session | null {
    return this.session;
  }

  async joinGlobalLobby(): Promise<Channel> {
    if (!this.socket) {
      throw new Error("Socket is not connected.");
    }

    if (this.globalLobbyChannel) {
      return this.globalLobbyChannel;
    }

    if (this.globalLobbyJoinPromise) {
      return this.globalLobbyJoinPromise;
    }

    this.globalLobbyJoinPromise = this.socket
      .joinChat(GLOBAL_LOBBY_CHANNEL, 2, true, false)
      .then((channel) => {
        this.globalLobbyChannel = channel;
        this.globalLobbyJoinPromise = null;
        console.info("[nakama] joined global lobby", { channelId: channel.id, room: GLOBAL_LOBBY_CHANNEL });
        return channel;
      })
      .catch((error) => {
        this.globalLobbyJoinPromise = null;
        console.warn("[nakama] failed to join global lobby", error);
        throw error;
      });

    return this.globalLobbyJoinPromise;
  }

  async fetchGlobalLobbyCount(): Promise<GlobalLobbyCount> {
    const session = await this.loadSession();
    if (!session) {
      throw new Error("No Nakama session available.");
    }

    const response = await this.getClient().rpc(session, ONLINE_COUNT_RPC, "{}");
    const parsed = response.payload ? JSON.parse(response.payload) as Partial<GlobalLobbyCount> : {};
    const count = typeof parsed.count === "number" && Number.isFinite(parsed.count) ? parsed.count : 0;
    const stream = typeof parsed.stream === "string" ? parsed.stream : GLOBAL_LOBBY_CHANNEL;
    return { count, stream };
  }

  getOnlineCountPollIntervalMs(): number {
    return ONLINE_COUNT_POLL_INTERVAL_MS;
  }

  disconnectSocket(fireDisconnectEvent = true): void {
    this.socket?.disconnect(fireDisconnectEvent);
    this.socket = null;
    this.globalLobbyChannel = null;
    this.globalLobbyJoinPromise = null;
  }

  async clearSession(): Promise<void> {
    this.disconnectSocket(true);
    this.session = null;
    this.client = null;
    await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
  }

  private async getOrCreateDeviceId(): Promise<string> {
    const existing = await AsyncStorage.getItem(DEVICE_ID_STORAGE_KEY);
    if (existing) {
      return existing;
    }

    const deviceId = `device-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    await AsyncStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
    return deviceId;
  }

  private async persistSession(session: Session): Promise<void> {
    const stored: StoredSession = {
      token: session.token,
      refreshToken: session.refresh_token,
    };
    await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(stored));
  }
}

export const nakamaService = new NakamaService();
