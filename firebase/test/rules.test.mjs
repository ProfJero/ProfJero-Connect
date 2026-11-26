/**
 * Firestore rules tests. Run from firebase/: `npm install && npm test`
 * (needs Java for the emulator).
 *
 * Every collection the platform uses must be unreadable and unwritable
 * from any browser identity: anonymous, a signed-in customer (with the
 * customer claim), an admin, even reading your own customer doc. Only the
 * Worker's service account (which bypasses rules) touches data.
 */
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, it } from 'node:test';
import {
  assertFails,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, getDocs, collection, deleteDoc, updateDoc } from 'firebase/firestore';

const COLLECTIONS = [
  'admins', 'customers', 'projects', 'wallets', 'walletTransactions', 'smsBatches', 'smsRecords',
  'senderIds', 'senderIdAssignments', 'payments', 'packages', 'pricingSettings', 'providers',
  'providerRequests', 'apiKeys', 'notifications', 'contacts', 'contactGroups', 'settings',
  'auditLogs', 'rateLimits', 'systemStatus',
];

let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-profjero',
    firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') },
  });
});

after(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  // Seed one doc per collection the way the Worker would (rules bypassed).
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const c of COLLECTIONS) await setDoc(doc(db, c, 'seed'), { projectId: 'p1', ok: true });
    await setDoc(doc(db, 'customers', 'cust1'), { projectId: 'p1', email: 'c@x.com' });
    await setDoc(doc(db, 'wallets', 'p1'), { availableUnits: 100 });
  });
});

const identities = () => ({
  anonymous: env.unauthenticatedContext().firestore(),
  customer: env.authenticatedContext('cust1', { customer: true, email: 'c@x.com' }).firestore(),
  admin: env.authenticatedContext('admin1', { email: 'a@x.com' }).firestore(),
});

describe('deny-all client access', () => {
  for (const name of ['anonymous', 'customer', 'admin']) {
    it(`${name}: cannot read, list, create, update or delete any collection`, async () => {
      const db = identities()[name];
      for (const c of COLLECTIONS) {
        await assertFails(getDoc(doc(db, c, 'seed')));
        await assertFails(getDocs(collection(db, c)));
        await assertFails(setDoc(doc(db, c, 'new'), { x: 1 }));
        await assertFails(updateDoc(doc(db, c, 'seed'), { ok: false }));
        await assertFails(deleteDoc(doc(db, c, 'seed')));
      }
    });
  }

  it('a customer cannot read even their own customer doc or wallet', async () => {
    const db = identities().customer;
    await assertFails(getDoc(doc(db, 'customers', 'cust1')));
    await assertFails(getDoc(doc(db, 'wallets', 'p1')));
  });

  it('a customer cannot credit their own wallet', async () => {
    const db = identities().customer;
    await assertFails(updateDoc(doc(db, 'wallets', 'p1'), { availableUnits: 1_000_000 }));
    await assertFails(setDoc(doc(db, 'walletTransactions', 'fake'), { projectId: 'p1', availableDelta: 1_000_000 }));
  });

  it('nobody can grant themselves admin', async () => {
    const db = identities().customer;
    await assertFails(setDoc(doc(db, 'admins', 'cust1'), { role: 'super_admin', status: 'active' }));
  });
});
