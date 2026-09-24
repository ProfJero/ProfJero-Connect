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
}

export interface AuthVariables {
  admin: import('@profjero/shared').Admin;
  requestId: string;
}