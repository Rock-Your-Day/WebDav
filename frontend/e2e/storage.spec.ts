import { test, expect } from '@playwright/test';
import { login, navigateTo } from './helpers';

test.describe('Storage Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateTo(page, 'Storage');
    await expect(page).toHaveURL(/.*storage/);
  });

  test('displays storage page', async ({ page }) => {
    await expect(page.locator('h4')).toContainText('Storage Destinations');
    await expect(page.getByRole('button', { name: /add storage/i })).toBeVisible();
  });

  test('opens create storage dialog', async ({ page }) => {
    await page.getByRole('button', { name: /add storage/i }).click();
    await expect(page.getByRole('heading', { name: /add storage destination/i })).toBeVisible();
  });

  test('creates a new storage destination', async ({ page }) => {
    await page.getByRole('button', { name: /add storage/i }).click();

    const timestamp = Date.now();
    await page.getByLabel(/name/i).fill(`E2E Storage ${timestamp}`);

    await page.getByRole('button', { name: /^create$/i }).click();

    await expect(page.getByText(/storage destination created/i)).toBeVisible();
  });
});
