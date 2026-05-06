import { test, expect } from '@playwright/test';
import { login, navigateTo } from './helpers';

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateTo(page, 'Settings');
    await expect(page).toHaveURL(/.*settings/);
  });

  test('displays theme settings form', async ({ page }) => {
    await expect(page.locator('h4')).toContainText('Settings');
    await expect(page.getByText(/theme & branding/i)).toBeVisible();
    await expect(page.getByLabel(/application name/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /save theme/i })).toBeVisible();
  });

  test('shows color preview', async ({ page }) => {
    await expect(page.getByText(/primary color preview/i)).toBeVisible();
    await expect(page.getByText(/secondary color preview/i)).toBeVisible();
  });

  test('can update application name', async ({ page }) => {
    const nameField = page.getByLabel(/application name/i);
    await nameField.clear();
    await nameField.fill('My WebDav');

    await page.getByRole('button', { name: /save theme/i }).click();

    await expect(page.getByText(/theme saved/i)).toBeVisible();
  });
});
