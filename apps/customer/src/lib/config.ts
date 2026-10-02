/**
 * Public runtime config for the customer app (all optional).
 * Set in apps/customer/.env — see .env.example.
 */

/** Where "Contact support" goes. Unset → the support card links to Settings. */
export const SUPPORT_EMAIL: string | null = import.meta.env.VITE_SUPPORT_EMAIL || null;

/** Base URL customers use for the HTTP API (shown on the API page). */
export const PUBLIC_API_URL: string = import.meta.env.VITE_API_URL ?? '';
