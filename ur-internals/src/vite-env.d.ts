/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NAKAMA_BASE_URL?: string
  readonly VITE_NAKAMA_SERVER_KEY?: string
  readonly VITE_API_TIMEOUT_MS?: string
  readonly VITE_GOOGLE_WEB_CLIENT_ID?: string
  readonly VITE_USE_MOCK_DATA?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
