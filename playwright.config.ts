import { defineConfig, devices } from '@playwright/test';

/**
 * Browser tests for both front ends against the real API code running on
 * an in-memory fake cloud (apps/api/test/devServer.ts). No Firebase or
 * Paystack account needed: Firebase Auth calls are answered inside the
 * browser by e2e/fixtures.ts.
 *
 *   npm run test:e2e
 *
 * First run on a new machine: npx playwright install chromium
 * (or set PW_CHROMIUM_PATH to an existing Chromium binary).
 */
const firebaseEnv = {
  VITE_API_URL: 'http://localhost:8787',
  VITE_FIREBASE_API_KEY: 'test-api-key',
  VITE_FIREBASE_AUTH_DOMAIN: 'test-project.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'test-project',
  VITE_FIREBASE_APP_ID: '1:000000000000:web:test',
};
const launchOptions = process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {};

export default defineConfig({
  testDir: './e2e',
  // One shared in-memory backend: run serially so tests see each other's
  // writes in a predictable order.
  workers: 1,
  fullyParallel: false,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 900 }, launchOptions }, grepInvert: /@mobile/ },
    { name: 'mobile', use: { ...devices['Pixel 7'], launchOptions }, grep: /@mobile/ },
  ],
  webServer: [
    {
      command: 'npm run dev:fake --workspace=@profjero/api',
      url: 'http://localhost:8787/health',
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: 'npm run dev --workspace=web -- --port 5173 --strictPort',
      url: 'http://localhost:5173',
      env: firebaseEnv,
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: 'npm run dev --workspace=customer -- --port 5174 --strictPort',
      url: 'http://localhost:5174',
      env: firebaseEnv,
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
