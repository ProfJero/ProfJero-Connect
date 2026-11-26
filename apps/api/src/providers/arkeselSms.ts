import type { Env } from '../types/env';
import type { SendResult, SmsProvider } from './sms';
import { normalizePhone } from '../lib/phone';
import { logProviderRequest } from '../services/providerRequests';

const ARKESEL_SEND_URL = 'https://sms.arkesel.com/api/v2/sms/send';

interface ArkeselResponseBody {
  status?: string;
  message?: string;
  data?: Array<{ id?: string } | string>;
}

export function createArkeselSmsProvider(
  env: Env,
  providerId: string,
): SmsProvider {
  return {
    async send({ recipients, message, senderId }) {
      const started = Date.now();
      const summary = `${recipients.length} recipient${recipients.length === 1 ? '' : 's'}`;

      if (!senderId) {
        await logProviderRequest(env, {
          providerId,
          operation: 'send_sms',
          status: 'error',
          httpStatus: null,
          durationMs: 0,
          summary,
          error: 'Missing sender ID',
        });
        return {
          results: recipients.map<SendResult>((r) => ({
            recipient: r,
            status: 'failed',
            providerMessageId: null,
            error: 'Sender ID is required by Arkesel',
          })),
        };
      }

      const normalized = recipients.map(normalizePhone);
      const payload: Record<string, unknown> = {
        sender: senderId,
        message,
        recipients: normalized,
      };
      if (env.ARKESEL_SANDBOX === 'true') payload.sandbox = true;
      if (env.ARKESEL_WEBHOOK_URL) payload.callback_url = deliveryCallbackUrl(env);

      let res: Response;
      try {
        res = await fetch(ARKESEL_SEND_URL, {
          method: 'POST',
          headers: {
            'api-key': env.ARKESEL_API_KEY!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Network error';
        await logProviderRequest(env, {
          providerId,
          operation: 'send_sms',
          status: 'error',
          httpStatus: null,
          durationMs: Date.now() - started,
          summary,
          error: msg,
        });
        return {
          results: recipients.map<SendResult>((r) => ({
            recipient: r,
            status: 'unknown',
            providerMessageId: null,
            error: `Arkesel network error: ${msg}`,
          })),
        };
      }

      const text = await res.text();
      let body: ArkeselResponseBody | null = null;
      try {
        body = text ? (JSON.parse(text) as ArkeselResponseBody) : null;
      } catch {
        body = null;
      }

      if (!res.ok) {
        const apiMessage =
          body?.message ?? body?.status ?? `HTTP ${res.status}`;
        const err = `Arkesel ${res.status}: ${apiMessage}`;
        await logProviderRequest(env, {
          providerId,
          operation: 'send_sms',
          status: 'error',
          httpStatus: res.status,
          durationMs: Date.now() - started,
          summary,
          error: err,
        });
        // 4xx = the provider rejected the request (bad sender, auth,
        // validation): nothing was sent, so units can be returned.
        // 5xx = the provider failed somewhere in its stack, possibly after
        // accepting the messages (gateway timeouts are the classic case).
        // Treat as unknown so units stay reserved until reconciliation
        // confirms one way or the other (state.md §7: timeouts → unknown).
        const ambiguous = res.status >= 500;
        return {
          results: recipients.map<SendResult>((r) => ({
            recipient: r,
            status: ambiguous ? 'unknown' : 'failed',
            providerMessageId: null,
            error: err,
          })),
        };
      }

      const data = Array.isArray(body?.data) ? body.data : [];
      await logProviderRequest(env, {
        providerId,
        operation: 'send_sms',
        status: 'success',
        httpStatus: res.status,
        durationMs: Date.now() - started,
        summary,
        error: null,
      });

      return {
        results: recipients.map<SendResult>((original, i) => {
          const entry = data[i];
          let id: string | null = null;
          if (typeof entry === 'string') id = entry;
          else if (entry && typeof entry === 'object' && 'id' in entry) {
            id = (entry.id as string | undefined) ?? null;
          }
          return {
            recipient: original,
            status: 'submitted',
            providerMessageId: id,
            error: null,
          };
        }),
      };
    },
  };
}
/** The callback URL, carrying the shared webhook token when configured. */
export function deliveryCallbackUrl(env: Env): string {
  const url = new URL(env.ARKESEL_WEBHOOK_URL!);
  if (env.ARKESEL_WEBHOOK_SECRET) url.searchParams.set('token', env.ARKESEL_WEBHOOK_SECRET);
  return url.toString();
}
