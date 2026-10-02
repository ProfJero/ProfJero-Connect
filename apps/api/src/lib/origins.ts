/**
 * Browser origins allowed to call the API. Shared by the CORS middleware
 * and by the customer payment flow, which only redirects back to an
 * allowed origin (never to an arbitrary client-supplied URL).
 */
export const allowedOrigins = [
  // Admin dashboard
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://profjeroconnect.pages.dev',
  // Customer platform
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'https://profjeroconnect-customer.pages.dev', // ← confirm/adjust
];

const customerOrigins = new Set([
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'https://profjeroconnect-customer.pages.dev',
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
