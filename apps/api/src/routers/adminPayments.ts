import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import {
  InitiatePaymentInputSchema,
  InitiatePaymentResponseSchema,
  PaymentListResponseSchema,
  PaymentResponseSchema,
  PaymentStatusSchema,
  VerifyPaymentResponseSchema,
} from '@profjero/shared';
import { requireRole } from '../middleware/roles';
import { getPaymentByReference, listPayments } from '../repositories/payments';
import {
  initiatePayment,
  verifyAndSettlePayment,
} from '../services/payments';
import { DomainError } from '../lib/domainError';
import type { AuthVariables, Env } from '../types/env';

export const adminPaymentsRouter = new Hono<{
  Bindings: Env;
  Variables: AuthVariables;
}>();

function validationError(
  issues: { path: PropertyKey[]; message: string }[],
): never {
  const detail = issues
    .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('; ');
  throw new HTTPException(400, { message: `Validation failed — ${detail}` });
}

// --- GET /admin/payments ---
adminPaymentsRouter.get('/', async (c) => {
  const projectId = c.req.query('projectId');
  const statusParam = c.req.query('status');

  let status;
  if (statusParam) {
    const parsed = PaymentStatusSchema.safeParse(statusParam);
    if (!parsed.success) {
      throw new HTTPException(400, {
        message: `Invalid status: "${statusParam}"`,
      });
    }
    status = parsed.data;
  }

  const payments = await listPayments(c.env, { projectId, status });
  return c.json(
    PaymentListResponseSchema.parse({
      payments,
      count: payments.length,
    }),
  );
});

// --- GET /admin/payments/:reference ---
adminPaymentsRouter.get('/:reference', async (c) => {
  const reference = c.req.param('reference');
  const payment = await getPaymentByReference(c.env, reference);
  if (!payment) {
    throw new HTTPException(404, { message: 'Payment not found.' });
  }
  return c.json(PaymentResponseSchema.parse({ payment }));
});

// --- POST /admin/payments/initiate ---
adminPaymentsRouter.post(
  '/initiate',
  requireRole('super_admin', 'admin', 'finance'),
  async (c) => {
    const body = await c.req.json().catch(() => null);
    if (body === null) {
      throw new HTTPException(400, { message: 'Body must be valid JSON.' });
    }
    const parsed = InitiatePaymentInputSchema.safeParse(body);
    if (!parsed.success) validationError(parsed.error.issues);

    const admin = c.get('admin');

    try {
      const result = await initiatePayment(c.env, {
        projectId: parsed.data.projectId,
        customerEmail: parsed.data.customerEmail,
        packageId: parsed.data.packageId,
        units: parsed.data.units,
        amountPesewas: parsed.data.amountPesewas,
        callbackUrl: parsed.data.callbackUrl,
        createdBy: admin.uid,
      });

      return c.json(
        InitiatePaymentResponseSchema.parse({
          payment: result.payment,
          authorizationUrl: result.authorizationUrl,
        }),
        201,
      );
    } catch (err) {
      if (err instanceof DomainError) {
        throw new HTTPException(
          err.status as 400 | 401 | 402 | 403 | 404 | 409 | 500 | 502,
          { message: err.message },
        );
      }
      throw err;
    }
  },
);

// --- POST /admin/payments/:reference/verify ---
// Manually verify a payment against Paystack. Useful when a webhook was
// missed or the app is running locally without a public webhook URL.
adminPaymentsRouter.post(
  '/:reference/verify',
  requireRole('super_admin', 'admin', 'finance'),
  async (c) => {
    const reference = c.req.param('reference');
    try {
      const result = await verifyAndSettlePayment(c.env, reference);
      return c.json(
        VerifyPaymentResponseSchema.parse({
          payment: result.payment,
          walletCredited: result.walletCredited,
        }),
      );
    } catch (err) {
      if (err instanceof DomainError) {
        throw new HTTPException(
          err.status as 400 | 401 | 402 | 403 | 404 | 409 | 500 | 502,
          { message: err.message },
        );
      }
      throw err;
    }
  },
);