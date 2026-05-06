import { test, expect } from '@playwright/test';
import { login, navigateTo } from './helpers';

test.describe('User Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateTo(page, 'Users');
    await expect(page).toHaveURL(/.*users/);
  });

  test('displays user management page', async ({ page }) => {
    await expect(page.locator('h4')).toContainText('User Management');
    await expect(page.getByRole('button', { name: /add user/i })).toBeVisible();
  });

  test('shows users table with admin user', async ({ page }) => {
    await page.waitForTimeout(500); // Allow table data to load
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('cell', { name: 'admin' }).first()).toBeVisible({ timeout: 10000 });
  });

  test('opens create user dialog', async ({ page }) => {
    await page.getByRole('button', { name: /add user/i }).click();
    await expect(page.getByRole('heading', { name: /create new user/i })).toBeVisible();
  });

  test('creates a new user', async ({ page }) => {
    await page.getByRole('button', { name: /add user/i }).click();

    const timestamp = Date.now();
    await page.locator('form').getByLabel(/username/i).fill(`e2euser${timestamp}`);
    await page.locator('form').getByLabel(/email/i).fill(`e2e${timestamp}@test.com`);
    await page.locator('form').getByLabel(/password/i).fill('securepass123');

    await page.getByRole('button', { name: /^create$/i }).click();

    await expect(page.getByText(/user created successfully/i)).toBeVisible();
  });

  test('shows validation error for duplicate user', async ({ page }) => {
    await page.getByRole('button', { name: /add user/i }).click();

    await page.locator('form').getByLabel(/username/i).fill('admin');
    await page.locator('form').getByLabel(/email/i).fill('dup@test.com');
    await page.locator('form').getByLabel(/password/i).fill('securepass123');

    await page.getByRole('button', { name: /^create$/i }).click();

    await expect(page.getByText(/already exists/i)).toBeVisible();
  });
});
