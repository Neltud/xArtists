import {defineConfig} from '@playwright/test'
import preview from './public-ux-preview.config'

export default defineConfig({...preview,testMatch:/xorus-server-analysis\.spec\.ts$/})
