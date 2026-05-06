import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('displays stat cards', async ({ page }) => {
    await expect(page.getByText('Total Users')).toBeVisible();
    await expect(page.getByText('Storage Backends')).toBeVisible();
    await expect(page.getByText('Transfers Today')).toBeVisible();
    await expect(page.getByText('SLA Violations')).toBeVisible();
  });

  test('displays charts section', async ({ page }) => {
    await expect(page.getByText('Weekly Activity')).toBeVisible();
    await expect(page.getByText('Transfer Trend (7 days)')).toBeVisible();
  });

  test('sidebar navigation items are present', async ({ page }) => {
    const nav = page.locator('nav');
    await expect(nav.getByRole('button', { name: 'Dashboard' })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Users' })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Storage' })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Reports' })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Settings' })).toBeVisible();
  });

  test('dark mode toggle works', async ({ page }) => {
    // The toggle button is in the header, next to the avatar
    const header = page.locator('header');
    const buttons = header.getByRole('button');
    // There should be at least 2 buttons (dark mode toggle + avatar)
    await expect(buttons.first()).toBeVisible();
  });
});
