/// <reference types="vite/client" />

interface Window {
  fbq?: (
    action: string,
    eventName?: string,
    params?: Record<string, unknown>,
  ) => void;
}
