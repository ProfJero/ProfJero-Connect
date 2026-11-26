export type ProviderOutcome = 'submitted' | 'failed' | 'unknown';

export interface SendResult {
  recipient: string;
  status: ProviderOutcome;
  providerMessageId: string | null;
  error: string | null;
}

export interface SmsProvider {
  /**
   * Send one batch of messages. Must return exactly one SendResult per
   * recipient, in any order. Must not throw for provider-side failures —
   * those become `failed` results. Throwing is reserved for catastrophic
   * errors where we don't know which recipients were attempted; callers
   * should treat the whole batch as unknown in that case.
   */
  send(args: {
    recipients: string[];
    message: string;
    senderId: string | null;
  }): Promise<{ results: SendResult[] }>;
}