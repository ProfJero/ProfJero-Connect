import { test, expect, adminLogin, adminApi, customerSignup, API, ADMIN_URL, CUSTOMER_URL, VIEWER } from './fixtures';

const NAV = ['Dashboard', 'Projects / Clients', 'Sender IDs', 'Pricing', 'SMS Logs', 'Wallets & Units', 'Payments', 'Providers', 'Reports', 'Settings'];

test.describe('admin dashboard', () => {
  test('every nav page loads without errors', async ({ page }) => {
    await adminLogin(page);
    const nav = page.getByRole('navigation', { name: 'Sidebar Navigation' });
    for (const label of NAV) {
      await nav.getByRole('link', { name: label, exact: true }).click();
      // Exactly one page title per screen (screen-reader landmark).
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      await page.waitForLoadState('networkidle');
    }
  });

  test('notification bell shows live alerts and clears the unread badge', async ({ page }) => {
    await adminLogin(page);
    const bell = page.getByRole('button', { name: /^Alerts/ });
    await expect(bell).toHaveAccessibleName(/Alerts \(\d+ new\)/);
    await bell.click();
    const panel = page.getByRole('dialog', { name: 'Alerts' });
    await expect(panel.getByText(/Sender ID request/)).toBeVisible();
    // Opening marks everything read.
    await expect(bell).toHaveAccessibleName('Alerts');
    await panel.getByRole('button', { name: /Sender ID request/ }).click();
    await expect(page).toHaveURL(/\/sender-ids/);
    // Read state is remembered by the server, not just this tab.
    await page.reload();
    await expect(page.getByRole('button', { name: /^Alerts/ })).toHaveAccessibleName('Alerts');
  });

  test('sidebar SMS balance links to the provider and quick actions open dialogs', async ({ page }) => {
    await adminLogin(page);
    const balance = page.getByRole('link', { name: /SMS Provider Balance/ });
    await expect(balance).toHaveAttribute('href', /\/providers\/sms_gw_01/);
    await balance.click();
    await expect(page).toHaveURL(/\/providers\/sms_gw_01/);
    await page.getByRole('link', { name: /Add Project/ }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page).toHaveURL(/\/projects/);
    await page.keyboard.press('Escape');
    await page.getByRole('link', { name: /Create Payment Link/ }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('settings save, persist, and take effect in the customer app', async ({ page, context }) => {
    await adminLogin(page);
    await page.goto(`${ADMIN_URL}/settings?tab=general`);
    await page.fill('#g-email', 'help@profjero.example');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText(/saved/i)).toBeVisible();
    await page.reload();
    await expect(page.locator('#g-email')).toHaveValue('help@profjero.example');

    // SMS review time + Security: close sign-ups.
    await page.getByRole('button', { name: 'SMS', exact: true }).click();
    await page.fill('#s-sla', 'about 2 hours');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText(/saved/i)).toBeVisible();

    // A new customer sees the support email and review time.
    const customer = await context.newPage();
    await customerSignup(customer, 'Settings Check Ltd');
    await expect(customer.getByText('help@profjero.example')).toBeVisible();
    await customer.goto(`${CUSTOMER_URL}/messaging/sender-ids/request`);
    await expect(customer.getByText(/about 2 hours/).first()).toBeVisible();

    await page.getByRole('button', { name: 'Security', exact: true }).click();
    await page.getByRole('switch', { name: /sign-ups open/i }).click();
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText(/saved/i)).toBeVisible();
    const visitor = await context.browser()!.newPage();
    await visitor.goto(`${CUSTOMER_URL}/signup`);
    await expect(visitor.getByText(/New sign-ups are paused/)).toBeVisible();
    await expect(visitor.getByRole('button', { name: /create account|sign up/i })).toBeDisabled();
    await visitor.close();
    // Re-open sign-ups for the other tests.
    await adminApi('PUT', '/admin/settings/security', { customerSignupsEnabled: true, customerSendsPerMinute: 30, customerRequestsPerMinute: 300 });
  });

  test('audit log records the settings change', async ({ page }) => {
    await adminLogin(page);
    await page.goto(`${ADMIN_URL}/settings?tab=audit`);
    await expect(page.getByText(/Updated settings/i).first()).toBeVisible();
  });

  test('team: invite an admin and get a setup link', async ({ page }) => {
    await adminLogin(page);
    await page.goto(`${ADMIN_URL}/settings?tab=team`);
    await page.getByRole('button', { name: 'Invite admin' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Email').fill(`ops${Date.now()}@ops.example`);
    await dialog.getByLabel('Name').fill('New Operator');
    await dialog.getByLabel('Role').selectOption('support');
    await dialog.getByRole('button', { name: 'Send invite' }).click();
    await expect(page.getByRole('dialog', { name: 'Password setup link' })).toBeVisible();
    await expect(page.getByRole('dialog').locator('code')).toContainText('https://');
  });

  test('system tab shows configuration and job health', async ({ page }) => {
    await adminLogin(page);
    await page.goto(`${ADMIN_URL}/settings?tab=system`);
    await expect(page.getByText('Delivery receipts webhook')).toBeVisible();
    await expect(page.getByText(/reconciliation/i).first()).toBeVisible();
  });

  test('a viewer sees settings read-only and no team controls', async ({ page }) => {
    await adminLogin(page, VIEWER);
    await page.goto(`${ADMIN_URL}/settings?tab=general`);
    await expect(page.locator('#g-name')).toBeDisabled();
    await page.goto(`${ADMIN_URL}/settings?tab=team`);
    await expect(page.getByRole('button', { name: 'Invite admin' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Audit Log' })).toHaveCount(0);
  });

  test('profile menu: edit my name, change password, sign out', async ({ page }) => {
    await adminLogin(page);
    const menu = () => page.getByRole('button', { name: /Root Admin|Ops Lead|account menu|profile/i }).first();
    await menu().click();
    await page.getByRole('menuitem', { name: /profile/i }).click();
    await expect(page).toHaveURL(/tab=profile/);

    await page.fill('#me-name', 'Ops Lead');
    await page.getByRole('button', { name: 'Save name' }).click();
    // The topbar picks up the new name without a reload.
    await expect(page.getByRole('banner').getByText('Ops Lead')).toBeVisible();

    await page.fill('#pw-cur', 'correct horse battery');
    await page.fill('#pw-new', 'a-much-longer-passphrase');
    await page.fill('#pw-conf', 'a-much-longer-passphrase');
    await page.getByRole('button', { name: /change password|update password/i }).click();
    await expect(page.getByText(/password (changed|updated)/i)).toBeVisible();

    await adminApi('PATCH', '/admin/me', { displayName: 'Root Admin' });
    await menu().click();
    await page.getByRole('menuitem', { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('monitoring shows live health, traffic and security events', async ({ page }) => {
    // Some traffic, including a blocked request.
    await fetch(`${API}/v1/balance`, { headers: { Authorization: 'Bearer pk_live_000000000000000000_bad' } });
    await adminLogin(page);
    await page.getByRole('navigation', { name: 'Sidebar Navigation' }).getByRole('link', { name: 'Monitoring' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Monitoring' })).toBeVisible();
    await expect(page.getByText('Requests', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Server error rate')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'System health' })).toBeVisible();
    await page.getByRole('tab', { name: /Security events/ }).click();
    await expect(page.getByText('Invalid API keys').first()).toBeVisible();
    await page.getByRole('button', { name: '24 hours' }).click();
    await expect(page.getByRole('button', { name: '24 hours' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('monitoring is hidden from viewers', async ({ page }) => {
    await adminLogin(page, VIEWER);
    await expect(page.getByRole('navigation', { name: 'Sidebar Navigation' }).getByRole('link', { name: 'Monitoring' })).toHaveCount(0);
  });

  test('the real logo and favicon are used', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/login`);
    await expect(page.locator('img[src="/logo-tile.webp"]').first()).toBeVisible();
    await expect(page.locator('link[rel="icon"][href="/favicon.ico"]')).toHaveCount(1);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });
});

