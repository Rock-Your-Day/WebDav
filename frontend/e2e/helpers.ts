import { Page, expect } from '@playwright/test';

/**
 * Login helper — performs login and waits for dashboard.
 */
export async function login(page: Page, username = 'admin', password = 'admin123') {
  await page.goto('/login');
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');

  // Wait for the login form to be ready
  const usernameField = page.getByLabel(/username/i);
  await usernameField.waitFor({ state: 'visible', timeout: 10000 });

  await usernameField.fill(username);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /^sign in$/i }).click();

  await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });
}

/**
 * Navigate to a page using the sidebar.
 * Uses getByRole('button') to target the ListItemButton specifically.
 */
export async function navigateTo(page: Page, name: string) {
  // The sidebar uses ListItemButton which renders as role="button"
  await page.locator('nav').getByRole('button', { name }).click();
}
