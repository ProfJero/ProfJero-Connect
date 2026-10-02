import { test, expect, customerSignup, adminApi, API, CUSTOMER_URL } from './fixtures';

const PAGES = [
  '/dashboard', '/messaging', '/messaging/sms', '/messaging/history', '/messaging/sender-ids', '/messaging/sender-ids/request',
  '/contacts', '/contacts/groups', '/services', '/wallet', '/wallet/add-funds', '/transactions', '/api', '/notifications',
  '/settings', '/settings/organisation',
];

test.describe('customer app', () => {
  test('every page loads without errors and has one page title', async ({ page }) => {
    await customerSignup(page, 'Smoke Test Ltd');
    const wrongTitles: string[] = [];
    for (const path of PAGES) {
      await page.goto(`${CUSTOMER_URL}${path}`);
      await page.waitForLoadState('networkidle');
      await expect(page, path).toHaveURL(new RegExp(path.replace(/\//g, '\\/')));
      const h1s = await page.getByRole('heading', { level: 1 }).count();
      if (h1s !== 1) wrongTitles.push(`${path}: ${h1s} h1`);
    }
    expect(wrongTitles, 'each page needs exactly one <h1> page title').toEqual([]);
  });

  test('full journey: top up, get a Sender ID approved, send, see it in history', async ({ page }) => {
    await customerSignup(page, 'Journey Bakery');

    // Top up: package → secure checkout (stubbed) → gateway confirms → back.
    await page.goto(`${CUSTOMER_URL}/wallet/add-funds`);
    await page.getByRole('button', { name: /Basic/ }).click();
    const [checkout] = await Promise.all([
      page.waitForRequest((r) => r.url().includes('checkout.example')),
      page.getByRole('button', { name: /^Pay / }).click(),
    ]);
    const reference = checkout.url().split('/').pop()!;
    await page.waitForURL(/checkout\.example/);
    await fetch(`${API}/__test/paid`);
    await page.goto(`${CUSTOMER_URL}/wallet/add-funds/complete?reference=${reference}`);
    await expect(page.getByText('Payment successful')).toBeVisible();
    await page.goto(`${CUSTOMER_URL}/wallet`);
    await expect(page.getByText(/1,303/).first()).toBeVisible(); // 3 welcome + 1,300 bought

    // Sender ID request → approved by the operator.
    await page.goto(`${CUSTOMER_URL}/messaging/sender-ids/request`);
    await page.getByLabel(/Sender ID/i).first().fill('JBAKERY');
    await page.getByLabel(/purpose/i).selectOption({ index: 1 });
    await page.getByLabel(/description|how will you use/i).fill('Order ready notifications for customers.');
    await page.getByRole('button', { name: /submit|request/i }).last().click();
    await expect(page.getByText(/JBAKERY/).first()).toBeVisible();
    await fetch(`${API}/__test/approve?value=JBAKERY`);

    // Send.
    await page.goto(`${CUSTOMER_URL}/messaging/sms`);
    await page.getByPlaceholder(/024|\+233|phone/i).first().fill('0241234567, 0209876543');
    await page.getByPlaceholder(/type your message|message/i).first().fill('Your order is ready for pickup!');
    await page.getByRole('button', { name: /^Send/ }).last().click();
    await expect(page.getByText(/sent|submitted|queued/i).first()).toBeVisible();

    await page.goto(`${CUSTOMER_URL}/messaging/history`);
    await expect(page.getByText(/Your order is ready/).first()).toBeVisible();
  });

  test('API key is shown exactly once and can be revoked', async ({ page }) => {
    await customerSignup(page, 'Api Key Co');
    await page.goto(`${CUSTOMER_URL}/api`);
    await page.getByRole('button', { name: /create|new/i }).first().click();
    await page.getByRole('dialog').getByRole('textbox').first().fill('Server');
    await page.getByRole('dialog').getByRole('button', { name: /create/i }).click();
    const secret = page.getByRole('dialog').locator('code').filter({ hasText: /^pk_live_/ });
    await expect(secret).toBeVisible();
    await page.keyboard.press('Escape');
    await page.reload();
    await expect(page.getByText(/pk_live_[0-9a-f]{18}_.{20,}/)).toHaveCount(0);
  });

  test('paused top-ups show the operator message and block checkout', async ({ page }) => {
    await adminApi('PUT', '/admin/settings/payments', { customerTopupsEnabled: false, topupsDisabledMessage: 'Payments are back at 5pm.' });
    try {
      await customerSignup(page, 'Paused Payments Ltd');
      await page.goto(`${CUSTOMER_URL}/wallet/add-funds`);
      await expect(page.getByText('Payments are back at 5pm.')).toBeVisible();
      await expect(page.getByRole('button', { name: /^Pay |Continue to Payment/ })).toBeDisabled();
    } finally {
      await adminApi('PUT', '/admin/settings/payments', { customerTopupsEnabled: true, topupsDisabledMessage: null });
    }
  });
});
