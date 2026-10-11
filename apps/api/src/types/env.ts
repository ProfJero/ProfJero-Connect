import type { Admin, Customer } from '@profjero/shared';

export interface Env {
  ENVIRONMENT: 'development' | 'staging' | 'production';
  FIREBASE_PROJECT_ID: string;
  FIREBASE_CLIENT_EMAIL: string;
  FIREBASE_PRIVATE_KEY: string;

  /**
   * Which SMS provider to use. Defaults to "mock" when unset, so a
   * misconfigured environment can never accidentally spend real credits.
   */
  SMS_PROVIDER?: 'mock' | 'arkesel';

  /** Arkesel v2 API key. Required when SMS_PROVIDER=arkesel. */
  ARKESEL_API_KEY?: string;

  /**
   * When "true", Arkesel messages are sent in sandbox mode:
   * validated by Arkesel but not delivered and not billed. Only matters
   * when SMS_PROVIDER=arkesel.
   */
  ARKESEL_SANDBOX?: string;

  /**
   * Public URL that Arkesel should POST delivery status to.
   * Example: "https://api.profjero.com/webhooks/arkesel"
   * Leave unset in local dev — Arkesel can't reach localhost anyway.
   */
  ARKESEL_WEBHOOK_URL?: string;

  /**
   * Shared secret for the delivery-status webhook. The provider doesn't
   * sign callbacks, so when this is set we append `token=<secret>` to the
   * callback URL and reject callbacks that don't carry it. Strongly
   * recommended in production (see System → Configuration).
   */
  ARKESEL_WEBHOOK_SECRET?: string;

  /**
   * Paystack secret key. Required for payment initiation and webhook
   * signature verification. Use sk_test_* in development, sk_live_* in
   * production. Never expose to a browser.
   */
  PAYSTACK_SECRET_KEY?: string;

  /**
   * Which provider record to log sends against. Defaults to sms_gw_01.
   * This is an internal ID; the admin UI never sees the driver behind it.
   */
  DEFAULT_SMS_PROVIDER_ID?: string;

  /**
   * Resend API key for transactional customer email (payment receipts,
   * Sender ID decisions, low balance). When unset, email is skipped and
   * only in-app notifications are created — safe to deploy unconfigured.
   */
  RESEND_API_KEY?: string;

  /** From header for customer email, e.g. "ProfJero Connect <hello@profjeroconnect.com>". */
  EMAIL_FROM?: string;

  /**
   * Public URL of the customer platform, e.g. "https://profjeroconnect-customer.pages.dev".
   * Used for payment return URLs (when the request has no allowed Origin)
   * and for links in notification emails.
   */
  CUSTOMER_APP_URL?: string;

  // ─────────────────────────────────────────────────────────────────
  // Data bundles (EliteData)
  // ─────────────────────────────────────────────────────────────────

  /**
   * EliteData API token. Sent as `Authorization: Bearer <token>` on
   * every request. Required for any data-bundle operation (balance,
   * bundle list, purchase, verify number, order status).
   */
  ELITEDATA_API_KEY?: string;

  /**
   * EliteData base URL. Defaults to https://elitedatagh.com when unset.
   * Only override this if they issue you a different host (staging,
   * alternate region) or you're pointing at a mock during development.
   */
  ELITEDATA_BASE_URL?: string;

  /**
   * Shared secret appended to the EliteData webhook URL as ?token=...
   * so we can reject forged webhook requests. EliteData does not sign
   * payloads (same gap as Arkesel). Without this, anyone who knows the
   * webhook path can POST a fake "DELIVERED" event.
   *
   * Not used in DB1 (no webhook handler yet). Set it now so the secret
   * is in place when DB3 wires the endpoint.
   */
  ELITEDATA_WEBHOOK_SECRET?: string;

  /**
   * Provider record ID for logging data bundle calls. Defaults to
   * data_gw_01. Internal — never exposed in customer API responses.
   */
  DEFAULT_DATA_PROVIDER_ID?: string;
}

/**
 * Variables attached to the Hono context by middleware.
 *
 * Both admin and customer middlewares write into this same shape. A given
 * request is one or the other:
 *   - admin routes    → requireAuth  sets `admin`
 *   - customer routes → customerAuth sets `customer` + `projectId`
 *
 * `admin` is typed as required for backward compatibility with existing
 * admin handlers (making it optional would force non-null assertions in
 * ~20 places). It is only actually set on admin routes; customer routes
 * never read it.
 *
 * `customer` and `projectId` are optional from the other side, for the
 * same reason.
 */
export interface AuthVariables {
  requestId: string;
  admin: Admin;
  customer?: Customer;
  projectId?: string;
}