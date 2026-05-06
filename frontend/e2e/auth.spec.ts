import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('shows login page with form fields', async ({ page }) => {
    await expect(page.getByLabel(/username/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /^sign in$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in with sso/i })).toBeVisible();
  });

  test('shows app name on login page', async ({ page }) => {
    await expect(page.getByText('OpenWebDav')).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.getByLabel(/username/i).fill('wronguser');
    await page.getByLabel(/password/i).fill('wrongpass');
    await page.getByRole('button', { name: /^sign in$/i }).click();

    await expect(page.getByText(/invalid username or password/i)).toBeVisible();
  });

  test('successful login redirects to dashboard', async ({ page }) => {
    await login(page);
    await expect(page.locator('h4')).toContainText('Dashboard');
  });

  test('redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/);
  });

  test('logout returns to login page', async ({ page }) => {
    await login(page);

    // Click the avatar button (last button in the toolbar area)
    await page.locator('header').getByRole('button').last().click();
    // Click Sign Out in the menu
    await page.getByRole('menuitem', { name: /sign out/i }).click();

    await expect(page).toHaveURL(/.*login/);
  });
});
