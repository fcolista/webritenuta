/**
 * Application Versioning & Author Configuration
 * Automatically reads version from package.json via Vite define
 */
declare const __APP_VERSION__: string;

export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.1.0';
export const APP_EDITION = 'Local-First PWA';
export const APP_AUTHOR = '(c) 2026 - Francesco Colista';

export function getFullVersionString(): string {
  return `v${APP_VERSION} ${APP_EDITION}`;
}
