import { test, expect, customerSignup, adminApi, API, CUSTOMER_URL } from './fixtures';

const PAGES = [
  '/dashboard', '/messaging', '/messaging/sms', '/messaging/history', '/messaging/sender-ids', '/messaging/sender-ids/request',
  '/contacts', '/contacts/groups', '/services', '/wallet', '/wallet/add-funds', '/transactions', '/api', '/notifications',
  '/settings', '/settings?tab=organisation', '/messaging/campaigns', '/developers',
];

test.describe('customer app', () => {
  test('every page loads without errors and has one page title', async ({ page }) => {
    await customerSignup(page, 'Smoke Test Ltd');
    const wrongTitles: string[] = [];
    for (const path of PAGES) {
      await page.goto(`${CUSTOMER_URL}${path}`);
      await page.waitForLoadState('networkidle');
      await expect(page, path).toHaveURL(new RegExp(path.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')));
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

  test('settings show one tab at a time, and the organisation from sign-up', async ({ page }) => {
    await customerSignup(page, 'Tabs & Co Ltd');
    await page.goto(`${CUSTOMER_URL}/settings`);
    const nav = page.getByRole('navigation', { name: 'Settings sections' });
    await expect(page.locator('#p-name')).toBeVisible();
    await expect(page.locator('#pw-current')).toHaveCount(0);
    await nav.getByRole('button', { name: 'Security' }).click();
    await expect(page).toHaveURL(/tab=security/);
    await page.getByRole('button', { name: 'Change' }).click();
    await expect(page.locator('#pw-current')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#p-name')).toHaveCount(0);
    await nav.getByRole('button', { name: 'Organisation' }).click();
    // Sign-up details show straight away — no need to click Edit.
    await expect(page.getByText('Tabs & Co Ltd').first()).toBeVisible();
    await expect(page.getByText('Ama Mensah').first()).toBeVisible();
    await page.goto(`${CUSTOMER_URL}/settings/organisation`);
    await expect(page).toHaveURL(/tab=organisation/);
  });

  test('import contacts with column mapping, then send a personalised message with preview', async ({ page }) => {
    await customerSignup(page, 'Personal Touch');
    // Sender ID + units so the send can go out.
    await page.goto(`${CUSTOMER_URL}/messaging/sender-ids/request`);
    await page.getByLabel(/Sender ID/i).first().fill('PTOUCH');
    await page.getByLabel(/purpose/i).selectOption({ index: 1 });
    await page.getByLabel(/description|how will you use/i).fill('Customer updates and reminders.');
    await page.getByRole('button', { name: /submit|request/i }).last().click();
    await expect(page.getByText(/PTOUCH/).first()).toBeVisible();
    await fetch(`${API}/__test/approve?value=PTOUCH`);

    await page.goto(`${CUSTOMER_URL}/contacts`);
    await page.getByRole('button', { name: /import/i }).first().click();
    const csv = 'First Name,Surname,Mobile,Birthday,Balance\nEsi,Owusu,0245550111,02/03/1990,GH₵ 50\nYaw,Boateng,0245550222,,GH₵ 10\n';
    await page.locator('input[type=file]').setInputFiles({ name: 'members.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByLabel('Import “Mobile” as')).toHaveValue('phone');
    await expect(dialog.getByLabel('Import “First Name” as')).toHaveValue('firstName');
    await expect(dialog.getByLabel('Import “Birthday” as')).toHaveValue('dateOfBirth');
    await expect(dialog.getByLabel('Import “Balance” as')).toHaveValue('custom');
    await dialog.getByRole('button', { name: /Import 2 contacts/ }).click();
    await expect(dialog.getByText(/2 added/)).toBeVisible();
    await dialog.getByRole('button', { name: 'Done' }).click();
    await expect(page.getByText('balance: GH₵ 50')).toBeVisible();

    await page.goto(`${CUSTOMER_URL}/messaging/sms`);
    // Type the numbers; they're saved contacts, so their fields apply.
    await page.getByLabel('Phone numbers').fill('0245550111, 0245550222');
    await page.locator('#message').fill('Hi ');
    await page.getByRole('button', { name: /Insert field/ }).click();
    await page.getByRole('menuitem', { name: /First name/ }).click();
    await page.locator('#message').press('End');
    await page.locator('#message').pressSequentially(', your balance is {balance}.');
    await expect(page.getByText('Hi Esi, your balance is GH₵ 50.')).toBeVisible();
    await expect(page.getByText('Hi Yaw, your balance is GH₵ 10.')).toBeVisible();
    await page.getByRole('button', { name: /^Send to 2 recipients/ }).click();
    await expect(page.getByRole('heading', { name: /Message sent|Sending your message/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Message sent' })).toBeVisible({ timeout: 15_000 });

    // Schedule the next one instead.
    await page.getByRole('button', { name: 'Send another message' }).click();
    await page.getByLabel('Phone numbers').fill('0245550111');
    await page.locator('#message').fill('Reminder: meeting tomorrow at 9am.');
    await page.getByRole('radio', { name: 'Schedule' }).click();
    const later = new Date(Date.now() + 2 * 3_600_000);
    const local = new Date(later.getTime() - later.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
    await page.locator('#schedule-at').fill(local);
    await page.getByRole('button', { name: 'Schedule message' }).click();
    await expect(page.getByRole('heading', { name: 'Scheduled' })).toBeVisible();
    await page.getByRole('link', { name: 'View campaigns' }).click();
    await expect(page.getByText('Reminder: meeting tomorrow at 9am.').first()).toBeVisible();
  });

  test('campaigns: turn on birthday wishes, cancel a scheduled send', async ({ page }) => {
    await customerSignup(page, 'Birthday Bakery');
    await page.goto(`${CUSTOMER_URL}/messaging/sender-ids/request`);
    await page.getByLabel(/Sender ID/i).first().fill('BBAKERY');
    await page.getByLabel(/purpose/i).selectOption({ index: 1 });
    await page.getByLabel(/description|how will you use/i).fill('Birthday wishes for customers.');
    await page.getByRole('button', { name: /submit|request/i }).last().click();
    await expect(page.getByText(/BBAKERY/).first()).toBeVisible();
    await fetch(`${API}/__test/approve?value=BBAKERY`);

    await page.goto(`${CUSTOMER_URL}/messaging/campaigns`);
    await page.getByRole('button', { name: /Birthday wishes/ }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.locator('#cm-message')).toHaveValue(/Happy birthday \{first_name\|friend\}/);
    await dialog.getByRole('button', { name: 'Turn on birthday wishes' }).click();
    await expect(page.getByRole('heading', { name: 'Birthday wishes' })).toBeVisible();
    await expect(page.getByText(/every day at 08:00/)).toBeVisible();

    await page.getByRole('button', { name: 'New campaign' }).click();
    await dialog.locator('#cm-name').fill('Weekend promo');
    await dialog.locator('#cm-message').fill('Weekend promo: 10% off everything!');
    await dialog.getByPlaceholder(/024|\+233|phone/i).first().fill('0241112223');
    await dialog.getByRole('button', { name: 'Schedule campaign' }).click();
    const card = page.getByRole('listitem').filter({ hasText: 'Weekend promo' });
    await expect(card.getByText('Scheduled')).toBeVisible();
    await card.getByRole('button', { name: 'Cancel' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel campaign' }).click();
    await expect(page.getByRole('listitem').filter({ hasText: 'Weekend promo' }).getByText('Cancelled')).toBeVisible();
  });

  test('API docs are public and linked from the API page', async ({ page }) => {
    await page.goto(`${CUSTOMER_URL}/developers`);
    await expect(page.getByRole('heading', { level: 1, name: 'ProfJero Connect SMS API' })).toBeVisible();
    for (const p of ['/v1/balance', '/v1/sms/send', '/v1/payments', '/v1/sms/estimate', '/v1/campaigns']) {
      await expect(page.getByRole('heading', { name: new RegExp(p.replace(/\//g, '\\/')) }).first()).toBeVisible();
    }
    await page.getByRole('tab', { name: 'Python' }).first().click();
    await expect(page.getByText(/requests\.post/).first()).toBeVisible();
    await customerSignup(page, 'Docs Reader');
    await page.goto(`${CUSTOMER_URL}/api`);
    await expect(page.getByRole('link', { name: 'Read the API docs' })).toHaveAttribute('href', '/developers');
  });

  test('share previews and search tags are present', async ({ page }) => {
    await page.goto(`${CUSTOMER_URL}/signup`);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /^https:\/\/.+\/og-image\.jpg$/);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /SMS/);
    await expect(page).toHaveTitle(/ProfJero Connect/);
    const og = await page.request.get(`${CUSTOMER_URL}/og-image.jpg`);
    expect(og.headers()['content-type']).toContain('image/jpeg');
    const robots = await (await page.request.get(`${CUSTOMER_URL}/robots.txt`)).text();
    expect(robots).toContain('Sitemap:');
    await expect(page.locator('img[src="/logo-tile.webp"]').first()).toBeVisible();
  });
});

