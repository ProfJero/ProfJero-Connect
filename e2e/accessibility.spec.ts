import { test, expect, adminLogin, customerSignup, axeViolations, ADMIN_URL, CUSTOMER_URL } from './fixtures';

test.describe('accessibility (axe, WCAG 2.1 A/AA)', () => {
  test('admin screens', async ({ page }) => {
    const found: string[] = [];
    await page.goto(`${ADMIN_URL}/login`);
    found.push(...await axeViolations(page, 'admin /login'));
    await adminLogin(page);
    for (const path of ['/dashboard', '/projects', '/sender-ids', '/pricing', '/sms-logs', '/wallets', '/payments', '/providers', '/reports',
      '/settings?tab=general', '/settings?tab=notifications', '/settings?tab=security', '/settings?tab=team', '/settings?tab=audit', '/settings?tab=system', '/settings?tab=profile', '/monitoring']) {
      await page.goto(`${ADMIN_URL}${path}`);
      await page.waitForLoadState('networkidle');
      found.push(...await axeViolations(page, `admin ${path}`));
    }
    await page.getByRole('button', { name: /^Alerts/ }).click();
    found.push(...await axeViolations(page, 'admin alerts panel'));
    expect(found, found.join('\n')).toEqual([]);
  });

  test('customer screens', async ({ page }) => {
    const found: string[] = [];
    for (const path of ['/login', '/signup', '/forgot-password', '/developers']) {
      await page.goto(`${CUSTOMER_URL}${path}`);
      found.push(...await axeViolations(page, `customer ${path}`));
    }
    await customerSignup(page, 'A11y Org');
    for (const path of ['/dashboard', '/messaging/sms', '/messaging/history', '/messaging/sender-ids', '/messaging/sender-ids/request',
      '/contacts', '/contacts/groups', '/wallet', '/wallet/add-funds', '/transactions', '/api', '/notifications', '/settings', '/settings?tab=organisation', '/settings?tab=security', '/messaging/campaigns']) {
      await page.goto(`${CUSTOMER_URL}${path}`);
      await page.waitForLoadState('networkidle');
      found.push(...await axeViolations(page, `customer ${path}`));
    }
    expect(found, found.join('\n')).toEqual([]);
  });
});
