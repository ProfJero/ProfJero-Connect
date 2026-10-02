import { Hono } from 'hono';
import { customerAuth } from '../../middleware/customerAuth';
import type { AuthVariables, Env } from '../../types/env';
import { customerRegisterRouter } from './register';
import { customerMeRouter } from './me';
import { customerWalletRouter } from './wallet';
import { customerPaymentsRouter } from './payments';
import { customerSmsRouter } from './sms';
import { customerSenderIdsRouter } from './senderIds';
import { customerContactsRouter } from './contacts';
import { customerApiKeysRouter } from './apiKeys';
import { customerNotificationsRouter } from './notifications';

const router = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

// /register bypasses customerAuth (it verifies the raw ID token itself,
// because the customer doc doesn't exist yet).
router.route('/', customerRegisterRouter);

// Everything else requires a verified, active customer. Applied once here
// rather than per sub-router: Hono merges sub-router middleware into this
// router, so per-router `use('*')` would re-verify the token on every
// request for each router mounted.
router.use('*', async (c, next) => {
  if (c.req.method === 'POST' && c.req.path.endsWith('/customer/register')) {
    return next();
  }
  return customerAuth(c, next);
});

router.route('/', customerMeRouter);
router.route('/', customerWalletRouter);
router.route('/', customerPaymentsRouter);
router.route('/', customerSmsRouter);
router.route('/', customerSenderIdsRouter);
router.route('/', customerContactsRouter);
router.route('/', customerApiKeysRouter);
router.route('/', customerNotificationsRouter);

export { router as customerRouter };
