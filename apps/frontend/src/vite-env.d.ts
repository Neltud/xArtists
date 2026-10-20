/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MOONPAY_PUBLIC_KEY?: string
  readonly VITE_APP_BUILD?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
