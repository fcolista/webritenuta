/**
 * Application Versioning Configuration (SemVer)
 * Automatically reads version from package.json via Vite define
 */
declare const __APP_VERSION__: string;

export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.1.0';
export const APP_EDITION = 'Local-First PWA';

export function getFullVersionString(): string {
  return `v${APP_VERSION} ${APP_EDITION}`;
}
