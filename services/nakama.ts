import AsyncStorage from "@react-native-async-storage/async-storage";
import { Client, Session, Socket } from "@heroiclabs/nakama-js";

import { nakamaConfig } from "../config/nakama";

const SESSION_STORAGE_KEY = "nakama.session";

export type StoredSession = {
  token: string;
  refreshToken: string;
};

export const client = new Client(
  nakamaConfig.serverKey,
  nakamaConfig.host,
  nakamaConfig.port,
  nakamaConfig.useSSL,
  nakamaConfig.timeoutMs
);

export class NakamaService {
  private session: Session | null = null;
  private socket: Socket | null = null;

  async authenticateEmail(email: string, password: string, create = false, username?: string): Promise<Session> {
    const session = await client.authenticateEmail(email, password, create, username);
    this.session = session;
    await this.persistSession(session);
    return session;
  }

  async authenticateDevice(deviceId: string, create = true, username?: string): Promise<Session> {
    const session = await client.authenticateDevice(deviceId, create, username);
    this.session = session;
    await this.persistSession(session);
    return session;
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
        const refreshed = await client.sessionRefresh(restored, restored.refresh_token);
        this.session = refreshed;
        await this.persistSession(refreshed);
        return refreshed;
      }

      this.session = restored;
      return restored;
    } catch (error) {
      await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
  }

  async connectSocket(createStatus = true): Promise<Socket> {
    const session = await this.loadSession();
    if (!session) {
      throw new Error("No Nakama session available. Authenticate first.");
    }

    const socket = client.createSocket(nakamaConfig.useSSL);
    await socket.connect(session, createStatus);
    this.socket = socket;
    return socket;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  getSession(): Session | null {
    return this.session;
  }

  async clearSession(): Promise<void> {
    this.socket?.disconnect(true);
    this.socket = null;
    this.session = null;
    await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
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
