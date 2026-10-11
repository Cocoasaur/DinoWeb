import { defineConfig, devices } from '@playwright/test'
import { existsSync } from 'node:fs'
import process from 'node:process'

const systemChromePath = '/usr/bin/google-chrome-stable'
const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH
  || (existsSync(systemChromePath) ? systemChromePath : undefined)

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4173/DinoWeb/',
    launchOptions: {
      ...(executablePath ? { executablePath } : {}),
      // Headless Linux otherwise uses SwiftShader even on a GPU-equipped host.
      // The playback suite asserts actual hardware compositing/rasterization.
      ...(process.env.PLAYWRIGHT_REQUIRE_HARDWARE_GPU === '1' ? { args: ['--enable-gpu'] } : {}),
    },
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
