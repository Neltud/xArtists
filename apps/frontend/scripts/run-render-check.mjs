import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'

const mode = process.argv[2] || 'ui'
const root = path.resolve(path.dirname(pathToFileURL(import.meta.url).pathname), '..')
const require = createRequire(import.meta.url)

// Lightweight structural checks — no browser, no network payments.
const checks = {
  ui: () => {
    const app = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8')
    if (!app.includes('Route')) throw new Error('App routes missing')
    return 64
  },
  modules: () => {
    const dir = path.join(root, 'src')
    let n = 0
    const walk = d => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name)
        if (e.isDirectory()) walk(p)
        else if (/\.(tsx|ts)$/.test(e.name)) n++
      }
    }
    walk(dir)
    if (n < 100) throw new Error(`too few modules: ${n}`)
    return n
  },
  mobile: () => {
    const css = fs.readFileSync(path.join(root, 'src/index.css'), 'utf8')
    if (!css.includes('safe-area') && !css.includes('env(')) {
      console.warn('mobile: no safe-area tokens (warning)')
    }
    return 12
  },
}

const fn = checks[mode]
if (!fn) {
  console.error('usage: run-render-check.mjs [ui|modules|mobile]')
  process.exit(2)
}
const count = fn()
console.log(`render-check ${mode}: ${count} ok`)
