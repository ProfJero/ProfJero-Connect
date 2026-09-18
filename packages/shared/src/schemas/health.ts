import { z } from 'zod';

export const HealthResponseSchema = z.object({
  ok: z.literal(true),
  service: z.literal('profjero-sms-api'),
  environment: z.enum(['development', 'staging', 'production']),
  version: z.string(),
  time: z.string().datetime(),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;