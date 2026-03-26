const DEFAULT_NAKAMA_BASE_URL = 'https://nakama.urgame.live'
const DEFAULT_NAKAMA_SERVER_KEY = 'defaultkey'

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

const nakamaBaseUrl = import.meta.env.VITE_NAKAMA_BASE_URL?.trim() || DEFAULT_NAKAMA_BASE_URL
const requestTimeoutMs = Number(import.meta.env.VITE_API_TIMEOUT_MS ?? '10000')
const useMockData = import.meta.env.VITE_USE_MOCK_DATA === 'true'
const nakamaServerKey =
  import.meta.env.VITE_NAKAMA_SERVER_KEY?.trim() || DEFAULT_NAKAMA_SERVER_KEY
const googleWebClientId = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID?.trim() || ''
const endpoint = parseNakamaEndpoint(nakamaBaseUrl)

const env = {
  nakamaBaseUrl,
  nakamaHost: endpoint.host,
  nakamaPort: endpoint.port,
  nakamaUseSSL: endpoint.useSSL,
  nakamaServerKey,
  googleWebClientId,
  requestTimeoutMs: Number.isFinite(requestTimeoutMs) ? requestTimeoutMs : 10000,
  useMockData,
}

export default env
