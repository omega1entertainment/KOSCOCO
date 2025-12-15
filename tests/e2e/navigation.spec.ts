import { test, expect } from '@playwright/test';

test.describe('Public Navigation', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/');
    
    // Homepage should load successfully
    await expect(page).toHaveTitle(/KOSCOCO/i);
  });

  test('should navigate to categories', async ({ page }) => {
    await page.goto('/categories');
    
    // Should show categories page
    await expect(page).toHaveURL(/\/categories/);
  });

  test('should navigate to leaderboard', async ({ page }) => {
    await page.goto('/leaderboard');
    
    // Should show leaderboard page
    await expect(page).toHaveURL(/\/leaderboard/);
  });

  test('should navigate to rules', async ({ page }) => {
    await page.goto('/rules');
    
    // Should show rules page
    await expect(page).toHaveURL(/\/rules/);
  });

  test('should navigate to prizes', async ({ page }) => {
    await page.goto('/prizes');
    
    // Should show prizes page
    await expect(page).toHaveURL(/\/prizes/);
  });

  test('should navigate to FAQ', async ({ page }) => {
    await page.goto('/faq');
    
    // Should show FAQ page
    await expect(page).toHaveURL(/\/faq/);
  });

  test('should navigate to how it works', async ({ page }) => {
    await page.goto('/how-it-works');
    
    // Should show how it works page
    await expect(page).toHaveURL(/\/how-it-works/);
  });

  test('should navigate to terms', async ({ page }) => {
    await page.goto('/terms');
    
    // Should show terms page
    await expect(page).toHaveURL(/\/terms/);
  });

  test('should navigate to privacy policy', async ({ page }) => {
    await page.goto('/privacy');
    
    // Should show privacy page
    await expect(page).toHaveURL(/\/privacy/);
  });
});

test.describe('Video Navigation', () => {
  test('should navigate to search', async ({ page }) => {
    await page.goto('/search');
    
    // Should show search page
    await expect(page).toHaveURL(/\/search/);
  });
});

test.describe('Affiliate Navigation', () => {
  test('should navigate to affiliate program', async ({ page }) => {
    await page.goto('/affiliate');
    
    // Should show affiliate page
    await expect(page).toHaveURL(/\/affiliate/);
  });

  test('should navigate to affiliate login', async ({ page }) => {
    await page.goto('/affiliate/login');
    
    // Should show affiliate login
    await expect(page).toHaveURL(/\/affiliate\/login/);
  });
});

test.describe('Advertiser Navigation', () => {
  test('should navigate to advertise page', async ({ page }) => {
    await page.goto('/advertise');
    
    // Should show advertise page
    await expect(page).toHaveURL(/\/advertise/);
  });

  test('should navigate to advertiser login', async ({ page }) => {
    await page.goto('/advertiser/login');
    
    // Should show advertiser login
    await expect(page).toHaveURL(/\/advertiser\/login/);
  });
});

test.describe('Judge Navigation', () => {
  test('should navigate to judges page', async ({ page }) => {
    await page.goto('/judges');
    
    // Should show judges page
    await expect(page).toHaveURL(/\/judges/);
  });

  test('should navigate to judge login', async ({ page }) => {
    await page.goto('/judge/login');
    
    // Should show judge login
    await expect(page).toHaveURL(/\/judge\/login/);
  });
});
