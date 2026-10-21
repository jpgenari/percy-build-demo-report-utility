const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30 * 60 * 1000,
  reporter: 'list',
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
  },
});
