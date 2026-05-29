'use strict';

// @ts-check
const { test, expect } = require('@playwright/test');

const API = 'http://localhost:8000/api';

// Make every page self-contained: no real backend needed.
async function stubApi(page) {
  await page.route(`${API}/**`, route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ success: true, data: [], total: 0 }),
  }).catch(() => {}));
}

// ---------------------------------------------------------------------------
// #1 — App should not zoom in/out (viewport meta has user-scalable=no)
// ---------------------------------------------------------------------------
test('#1 viewport disables pinch-zoom (user-scalable=no, maximum-scale=1)', async ({ page }) => {
  await stubApi(page);
  await page.goto('/');
  const content = await page.locator('meta[name="viewport"]').getAttribute('content');
  expect(content).toContain('user-scalable=no');
  expect(content).toContain('maximum-scale=1');
});

// ---------------------------------------------------------------------------
// Numeric keypad on digit-only phone fields (validation/keypad cluster)
// ---------------------------------------------------------------------------
test('Signup phone field uses the numeric keypad (inputmode=numeric, maxlength=10)', async ({ page }) => {
  await stubApi(page);
  await page.goto('/signup');
  const phone = page.getByPlaceholder(/phone number/i).first();
  await expect(phone).toBeVisible({ timeout: 10_000 });
  await expect(phone).toHaveAttribute('inputmode', 'numeric');
  await expect(phone).toHaveAttribute('maxlength', '10');
});

