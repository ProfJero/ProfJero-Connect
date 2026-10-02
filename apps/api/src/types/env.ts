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
 *
 * ── NEW: customer + projectId added ──
 */
export interface AuthVariables {
  requestId: string;
  admin: Admin;
  customer?: Customer;
  projectId?: string;
}