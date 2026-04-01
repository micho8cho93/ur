const DEFAULT_NAKAMA_BASE_URL = 'https://nakama.urgame.live'
const DEFAULT_NAKAMA_SERVER_KEY = 'defaultkey'
const LOCALHOST_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0'])

function readEnvValue(...keys: string[]) {
  for (const key of keys) {
    const value = import.meta.env[key]
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim()
    }
  }

  return null
}

function resolveBrowserBaseUrl() {
  if (typeof window === 'undefined' || !window.location) {
    return null
  }

  const { origin, hostname } = window.location
  if (!origin || LOCALHOST_HOSTS.has(hostname)) {
    return null
  }

  return origin
}

function parseNakamaEndpoint(baseUrl: string) {
  try {
    const url = new URL(baseUrl)
    const port =
      url.port.trim().length > 0 ? Number(url.port) : url.protocol === 'https:' ? 443 : 80

    return {
      host: url.hostname,
      port: Number.isFinite(port) ? port : 443,
      useSSL: url.protocol === 'https:',
    }
  } catch {
    return {
      host: 'nakama.urgame.live',
      port: 443,
      useSSL: true,
    }
  }
}

const nakamaBaseUrl =
  import.meta.env.VITE_NAKAMA_BASE_URL?.trim() || resolveBrowserBaseUrl() || DEFAULT_NAKAMA_BASE_URL
const requestTimeoutMs = Number(import.meta.env.VITE_API_TIMEOUT_MS ?? '10000')
const useMockData = import.meta.env.VITE_USE_MOCK_DATA === 'true'
const nakamaServerKey =
  readEnvValue(
    'VITE_NAKAMA_SERVER_KEY',
    'VITE_NAKAMA_SOCKET_SERVER_KEY',
    'EXPO_PUBLIC_NAKAMA_SOCKET_SERVER_KEY',
    'EXPO_PUBLIC_NAKAMA_SERVER_KEY',
  ) || DEFAULT_NAKAMA_SERVER_KEY
const endpoint = parseNakamaEndpoint(nakamaBaseUrl)

const env = {
  nakamaBaseUrl,
  nakamaHost: endpoint.host,
  nakamaPort: endpoint.port,
  nakamaUseSSL: endpoint.useSSL,
  nakamaServerKey,
  requestTimeoutMs: Number.isFinite(requestTimeoutMs) ? requestTimeoutMs : 10000,
  useMockData,
}

export default env
