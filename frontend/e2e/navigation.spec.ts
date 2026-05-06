import { test, expect } from '@playwright/test';
import { login, navigateTo } from './helpers';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('navigates to all pages via sidebar', async ({ page }) => {
    // Users
    await navigateTo(page, 'Users');
    await expect(page).toHaveURL(/.*users/);
    await expect(page.locator('h4')).toContainText('User Management');

    // Storage
    await navigateTo(page, 'Storage');
    await expect(page).toHaveURL(/.*storage/);
    await expect(page.locator('h4')).toContainText('Storage Destinations');

    // Activity Log
    await navigateTo(page, 'Activity Log');
    await expect(page).toHaveURL(/.*activity/);
    await expect(page.locator('h4')).toContainText('Activity Log');

    // Reports
    await navigateTo(page, 'Reports');
    await expect(page).toHaveURL(/.*reports/);
    await expect(page.locator('h4')).toContainText('Reports');

    // Settings
    await navigateTo(page, 'Settings');
    await expect(page).toHaveURL(/.*settings/);
    await expect(page.locator('h4')).toContainText('Settings');

    // Back to Dashboard
    await navigateTo(page, 'Dashboard');
    await expect(page).toHaveURL(/.*dashboard/);
  });
});
