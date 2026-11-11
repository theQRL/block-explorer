const { defineConfig } = require('@playwright/test');
const path = require('node:path');

module.exports = defineConfig({
  testDir: '.',
  timeout: 180_000,
  expect: { timeout: 120_000 },
  workers: 1,
  retries: 0,
  reporter: 'list',
  outputDir: '../../smoke-results',
  use: {
    baseURL: 'http://localhost:3100',
    browserName: 'chromium',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'node main.js',
    cwd: path.resolve(process.env.SMOKE_BUNDLE || '../../../block-explorer-build/bundle'),
    url: 'http://localhost:3100',
    timeout: 120_000,
    reuseExistingServer: false,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      PORT: '3100',
      ROOT_URL: 'http://localhost:3100',
      MONGO_URL: process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/explorer-smoke',
      // No settings: exercise the app's default public testnet nodes.
      METEOR_SETTINGS: '{}',
    },
  },
});
