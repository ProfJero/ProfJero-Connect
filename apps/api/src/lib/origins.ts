/**
 * Browser origins allowed to call the API. Shared by the CORS middleware
 * and by the customer payment flow, which only redirects back to an
 * allowed origin (never to an arbitrary client-supplied URL).
 *
 * URL mapping (updated 2026-10-02):
 *   - profjeroconnect.pages.dev        → customer platform
 *   - manage-profjeroconnect.pages.dev → admin dashboard
 */
export const allowedOrigins = [
  // Admin dashboard
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://manage-profjeroconnect.pages.dev',
  // Customer platform
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'https://profjeroconnect.pages.dev',
];

/**
 * CORS check. Local dev origins are refused in production: a deployed API
 * has no reason to trust whatever happens to run on a visitor's localhost.
 */
export function isAllowedOrigin(origin: string, environment: string | undefined): boolean {
  if (!allowedOrigins.includes(origin)) return false;
  if (environment === 'production' && /^http:\/\/(localhost|127\.0\.0\.1)(:|$)/.test(origin)) return false;
  return true;
}

const customerOrigins = new Set([
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'https://profjeroconnect.pages.dev',
]);

/**
 * Base URL of the customer app for this request: the request's Origin when
 * it is a known customer origin, else the configured CUSTOMER_APP_URL.
 */
export function customerAppBaseUrl(
  origin: string | undefined,
  configured: string | undefined,
): string | null {
  if (origin && customerOrigins.has(origin)) return origin;
  return configured ? configured.replace(/\/+$/, '') : null;
}