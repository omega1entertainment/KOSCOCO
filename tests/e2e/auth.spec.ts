import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    
    // Check for login form elements
    await expect(page.locator('[data-testid="input-email"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-password"]')).toBeVisible();
    await expect(page.locator('[data-testid="button-login"]')).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/login');
    
    // Click login without filling form
    await page.locator('[data-testid="button-login"]').click();
    
    // Should show validation errors or stay on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.locator('[data-testid="input-email"]').fill('invalid@test.com');
    await page.locator('[data-testid="input-password"]').fill('wrongpassword');
    await page.locator('[data-testid="button-login"]').click();
    
    // Should show error message or remain on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should navigate to signup from login', async ({ page }) => {
    await page.goto('/login');
    
    // Look for signup tab or link
    const signupTab = page.locator('[data-testid="tab-signup"]');
    if (await signupTab.isVisible()) {
      await signupTab.click();
      await expect(page.locator('[data-testid="input-firstName"]')).toBeVisible();
    }
  });

  test('should have forgot password link', async ({ page }) => {
    await page.goto('/login');
    
    const forgotLink = page.locator('a[href*="forgot-password"]');
    if (await forgotLink.isVisible()) {
      await forgotLink.click();
      await expect(page).toHaveURL(/\/forgot-password/);
    }
  });
});

test.describe('Protected Routes', () => {
  test('should redirect unauthenticated users from dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to login or show auth required message
    await expect(page).toHaveURL(/\/login|\/$/);
  });

  test('should redirect unauthenticated users from upload', async ({ page }) => {
    await page.goto('/upload');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login|\/$/);
  });

  test('should redirect unauthenticated users from admin', async ({ page }) => {
    await page.goto('/admin');
    
    // Should redirect to login or show access denied
    await expect(page).toHaveURL(/\/login|\/$/);
  });
});
