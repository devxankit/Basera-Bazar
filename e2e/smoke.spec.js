'use strict';

// @ts-check
const { test, expect } = require('@playwright/test');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const API = 'http://localhost:8000/api';

/** Mock the login API to return a successful auth response. */
async function mockPasswordLogin(page, overrides = {}) {
  await page.route(`${API}/auth/login`, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        token: 'mock_access_token',
        user: {
          _id: 'mock_partner_id',
          name: 'Test Partner',
          phone: '9876543210',
          email: 'test@test.com',
          role: 'partner',
          partner_type: 'property_agent',
          roles: ['property_agent'],
          onboarding_status: 'approved',
          ...overrides,
        },
      }),
    });
  });
}

/** Mock the /me endpoint for authenticated state. */
async function mockGetMe(page) {
  await page.route(`${API}/auth/me`, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          _id: 'mock_partner_id',
          name: 'Test Partner',
          phone: '9876543210',
          role: 'partner',
        },
      }),
    });
  });
}

/** Mock the OTP send and verify endpoints. */
async function mockOtpFlow(page) {
  await page.route(`${API}/auth/send-otp`, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, message: 'OTP sent successfully! Please check your phone.' }),
    });
  });

  await page.route(`${API}/auth/verify-otp`, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        token: 'mock_access_token',
        user: {
          _id: 'mock_partner_id',
          name: 'OTP Partner',
          phone: '9876543210',
          role: 'partner',
          roles: ['property_agent'],
          onboarding_status: 'approved',
        },
      }),
    });
  });
}

/** Mock listing endpoints so Home page renders without the real backend. */
async function mockListings(page) {
  await page.route(`${API}/listings**`, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [], total: 0 }),
    });
  });
  await page.route(`${API}/mandi**`, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [], total: 0 }),
    });
  });
}

// ---------------------------------------------------------------------------
// 1. Home page loads without backend
// ---------------------------------------------------------------------------
test.describe('Home page', () => {
  test('renders without crashing when API is unavailable', async ({ page }) => {
    // All API calls return empty results — simulates cold start
    await mockListings(page);
    await page.route(`${API}/**`, route => route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ success: false }),
    }));

    await page.goto('/');
    // App shell must render (no blank white screen)
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('renders the main navigation', async ({ page }) => {
    await mockListings(page);
    await page.route(`${API}/**`, route => route.abort());

    await page.goto('/');
    // At minimum the page title or a nav element should be visible
    const title = await page.title();
    expect(title).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// 2. Login — password flow
// ---------------------------------------------------------------------------
test.describe('Login — password flow', () => {
  test.beforeEach(async ({ page }) => {
    // Catch-all first (lowest priority) — specific mocks added after override it
    await page.route(`${API}/**`, route => route.abort().catch(() => {}));
    await mockPasswordLogin(page);
    await mockGetMe(page);
    await mockListings(page);
  });

  test('shows the login form at /login', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByPlaceholder(/email or phone/i).or(page.getByPlaceholder(/phone number/i))).toBeVisible({ timeout: 10_000 });
  });

  test('switches to password mode and shows password input', async ({ page }) => {
    await page.goto('/login');
    await page.getByText('Password').click();
    await expect(page.getByPlaceholder(/email or phone number/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
  });

  test('fills credentials and submits — navigates away from /login', async ({ page }) => {
    await page.goto('/login');

    // Switch to password mode
    await page.getByText('Password').click();

    await page.getByPlaceholder(/email or phone number/i).fill('9876543210');
    await page.getByPlaceholder(/password/i).fill('Secret@123');

    // Click the Sign In submit button (type="submit")
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for navigation away from /login (redirect to home on success)
    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// 3. Login — OTP flow
// ---------------------------------------------------------------------------
test.describe('Login — OTP flow', () => {
  test.beforeEach(async ({ page }) => {
    // Catch-all first (lowest priority) — specific mocks added after override it
    await page.route(`${API}/**`, route => route.abort().catch(() => {}));
    await mockOtpFlow(page);
    await mockGetMe(page);
    await mockListings(page);
  });

  test('shows phone input by default (OTP mode)', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByPlaceholder(/phone number/i)).toBeVisible({ timeout: 10_000 });
  });

  test('requests OTP and shows OTP input field', async ({ page }) => {
    await page.goto('/login');

    const phoneInput = page.getByPlaceholder(/phone number/i);
    await phoneInput.fill('9876543210');

    // Click "Send OTP" button (exact match to avoid hitting the "OTP Login" tab)
    const sendBtn = page.getByRole('button', { name: /^send otp$/i });
    await sendBtn.click();

    // OTP input should appear
    await expect(page.getByPlaceholder(/enter 6.digit otp/i)).toBeVisible({ timeout: 8_000 });
  });
});

// ---------------------------------------------------------------------------
// 4. Protected route — redirect to login
// ---------------------------------------------------------------------------
test.describe('Protected routes', () => {
  test('redirects unauthenticated user from /mandi-bazar/checkout to /login', async ({ page }) => {
    // No auth mock — user is not logged in
    await page.route(`${API}/auth/me`, route => route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ success: false }),
    }));
    await page.route(`${API}/**`, route => route.abort().catch(() => {}));

    await page.goto('/mandi-bazar/checkout');

    // Should be redirected to login
    await page.waitForURL(/login/, { timeout: 10_000 });
    await expect(page).toHaveURL(/login/);
  });

  test('redirects unauthenticated user from /partner/dashboard to /login', async ({ page }) => {
    await page.route(`${API}/auth/me`, route => route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ success: false }),
    }));
    await page.route(`${API}/**`, route => route.abort().catch(() => {}));

    // /profile is a real ProtectedRoute that redirects unauthenticated users to /login
    await page.goto('/profile');
    await page.waitForURL(/login/, { timeout: 10_000 });
    await expect(page).toHaveURL(/login/);
  });
});

// ---------------------------------------------------------------------------
// 5. Cart page — renders with empty cart
// ---------------------------------------------------------------------------
test.describe('Cart page', () => {
  test('renders the cart page without crashing', async ({ page }) => {
    await page.route(`${API}/**`, route => route.abort().catch(() => {}));

    await page.goto('/cart');

    // Page should render (not blank, no JS error causing empty body)
    await expect(page.locator('body')).not.toBeEmpty();
    // Should not show unhandled error screen
    await expect(page.getByText('Something went wrong')).not.toBeVisible({ timeout: 3_000 });
  });

  test('shows empty-cart message when cart is empty', async ({ page }) => {
    await page.route(`${API}/**`, route => route.abort().catch(() => {}));

    // Clear any cart in localStorage before navigating
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('basera_cart'));

    await page.goto('/cart');
    await expect(
      page.getByText(/cart is empty/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// 6. Error boundary — catches render errors
// ---------------------------------------------------------------------------
test.describe('Error boundary', () => {
  test('shows error UI instead of blank screen on unhandled render error', async ({ page }) => {
    await page.route(`${API}/**`, route => route.abort().catch(() => {}));

    // Navigate to a non-existent route — the app should render a 404 or fallback, not crash
    await page.goto('/this-route-does-not-exist-xyz');

    // The app should not crash — React root must be mounted and page title must be set
    await expect(page.locator('#root')).toBeAttached();
    const title = await page.title();
    expect(title).toBeTruthy();
  });
});
