import { Hono } from 'hono';
import type { AuthVariables, Env } from '../../types/env';
import { customerRegisterRouter } from './register';
import { customerMeRouter } from './me';
import { customerWalletRouter } from './wallet';

const router = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

// /register bypasses customerAuth (it verifies the raw ID token itself).
router.route('/', customerRegisterRouter);

// /me and /wallet apply customerAuth inside their own routers.
router.route('/', customerMeRouter);
router.route('/', customerWalletRouter);

export { router as customerRouter };