import {defineConfig,devices} from '@playwright/test'
import {fileURLToPath} from 'node:url'

export default defineConfig({
  testDir:'./world-rights',testMatch:'*.browser.ts',timeout:30000,workers:2,retries:1,
  use:{baseURL:'http://127.0.0.1:4173',trace:'retain-on-failure'},
  projects:[
    {name:'chromium-desktop',use:{browserName:'chromium',viewport:{width:1440,height:1000}}},
    {name:'firefox-desktop',use:{browserName:'firefox',viewport:{width:1440,height:1000}}},
    {name:'webkit-desktop',use:{browserName:'webkit',viewport:{width:1440,height:1000}}},
    {name:'chromium-mobile',use:{browserName:'chromium',viewport:{width:390,height:844}}},
    {name:'firefox-mobile-layout',use:{browserName:'firefox',viewport:{width:390,height:844}}},
    {name:'webkit-mobile',use:{...devices['iPhone 13'],browserName:'webkit'}},
  ],
  webServer:{
    // Playwright defaults to the config directory (e2e/), not the repository root.
    cwd:fileURLToPath(new URL('../',import.meta.url)),
    command:'npm run preview --prefix apps/frontend -- --host 127.0.0.1 --port 4173',
    url:'http://127.0.0.1:4173/xArtists/',
    reuseExistingServer:false,
    timeout:60000
  }
})
