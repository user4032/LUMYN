/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_WS_URL?: string
  readonly VITE_PUBLIC_API_URL?: string
  readonly VITE_PUBLIC_WS_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  electronAPI?: {
    minimize?: () => void
    maximize?: () => void
    close?: () => void
    [key: string]: any
  }
}
