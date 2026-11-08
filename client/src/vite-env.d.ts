/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Canonical public origin, e.g. https://pratorapido.com.br */
  readonly VITE_SITE_URL?: string;
  /** URL that opens the Prato Rápido app after access is confirmed. */
  readonly VITE_APP_URL?: string;
  /** Base path of the integration API (defaults to same-origin /api). */
  readonly VITE_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
