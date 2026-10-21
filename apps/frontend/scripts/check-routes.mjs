import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const appPath = path.join(root, 'src/App.tsx')
const modulesPath = path.join(root, 'src/experience/modules.ts')

if (!fs.existsSync(appPath)) {
  console.error('check-routes: App.tsx missing')
  process.exit(1)
}
if (!fs.existsSync(modulesPath)) {
  console.error('check-routes: experience/modules.ts missing')
  process.exit(1)
}

const app = fs.readFileSync(appPath, 'utf8')
const modules = fs.readFileSync(modulesPath, 'utf8')

if (!app.includes('Route') && !app.includes('Routes')) {
  console.error('check-routes: no Route/Routes in App.tsx')
  process.exit(1)
}
if (!modules.includes('MODULES')) {
  console.error('check-routes: MODULES export missing')
  process.exit(1)
}

const pathMatches = [...modules.matchAll(/path:\s*'([^']+)'/g)].map(m => m[1])
if (pathMatches.length < 10) {
  console.error(`check-routes: too few module paths (${pathMatches.length})`)
  process.exit(1)
}

console.log(`check-routes: ok (${pathMatches.length} module paths)`)
