import type { SendResult, SmsProvider } from './sms';

/**
 * Deterministic mock provider for development. Given the same inputs,
 * always produces the same outcomes, so tests are reproducible.
 *
 * Outcome rules:
 *   - message contains "@@fail"    → all fail
 *   - message contains "@@unknown" → all unknown
 *   - recipient ends with "00"     → fails
 *   - recipient ends with "01"     → unknown
 *   - otherwise                    → submitted
 */
export const mockSmsProvider: SmsProvider = {
  async send({ recipients, message }) {
    const results: SendResult[] = recipients.map((recipient) => {
      if (message.includes('@@fail')) {
        return {
          recipient,
          status: 'failed',
          providerMessageId: null,
          error: 'Mock provider: simulated failure',
        };
      }

      if (message.includes('@@unknown')) {
        return {
          recipient,
          status: 'unknown',
          providerMessageId: null,
          error: 'Mock provider: simulated timeout',
        };
      }

      const lastTwo = recipient.slice(-2);
      if (lastTwo === '00') {
        return {
          recipient,
          status: 'failed',
          providerMessageId: null,
          error: 'Mock provider: recipient unreachable',
        };
      }
      if (lastTwo === '01') {
        return {
          recipient,
          status: 'unknown',
          providerMessageId: null,
          error: 'Mock provider: timeout',
        };
      }

      return {
        recipient,
        status: 'submitted',
        providerMessageId: `mock_${crypto.randomUUID().slice(0, 12)}`,
        error: null,
      };
    });

    return { results };
  },
};