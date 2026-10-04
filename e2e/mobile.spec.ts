import { test, expect, adminLogin, customerSignup, expectNoHorizontalOverflow, ADMIN_URL, CUSTOMER_URL } from './fixtures';

test.describe('mobile @mobile', () => {
  test('admin: no sideways scrolling and the menu drawer works @mobile', async ({ page }) => {
    await adminLogin(page);
    for (const path of ['/dashboard', '/projects', '/sender-ids', '/sms-logs', '/wallets', '/payments', '/settings?tab=general', '/settings?tab=team', '/settings?tab=system', '/monitoring']) {
      await page.goto(`${ADMIN_URL}${path}`);
      await page.waitForLoadState('networkidle');
      await expectNoHorizontalOverflow(page, `admin ${path}`);
    }
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.getByRole('navigation', { name: 'Sidebar Navigation' }).getByRole('link', { name: 'Payments' }).click();
    await expect(page).toHaveURL(/\/payments/);
    await expect(page.getByRole('navigation', { name: 'Sidebar Navigation' })).not.toBeInViewport();
    await page.getByRole('button', { name: /^Alerts/ }).click();
    await expect(page.getByRole('dialog', { name: 'Alerts' })).toBeInViewport();
  });

  test('customer: no sideways scrolling and the menu drawer works @mobile', async ({ page }) => {
    await page.goto(`${CUSTOMER_URL}/signup`);
    await expectNoHorizontalOverflow(page, 'customer /signup');
    await customerSignup(page, 'Mobile Org');
    for (const path of ['/dashboard', '/messaging/sms', '/messaging/history', '/contacts', '/wallet', '/wallet/add-funds', '/transactions', '/api', '/notifications', '/developers', '/settings', '/messaging/campaigns']) {
      await page.goto(`${CUSTOMER_URL}${path}`);
      await page.waitForLoadState('networkidle');
      await expectNoHorizontalOverflow(page, `customer ${path}`);
    }
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.getByRole('navigation', { name: 'Main Sidebar Navigation' }).getByRole('link', { name: 'Wallet', exact: true }).click();
    await expect(page).toHaveURL(/\/wallet/);
  });
});
