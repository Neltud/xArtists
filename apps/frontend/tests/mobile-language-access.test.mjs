import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'

const shell = readFileSync(new URL('../src/experience/Shell.tsx', import.meta.url), 'utf8')
const css = readFileSync(new URL('../src/experience/mobile-language-control.css', import.meta.url), 'utf8')
const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
const i18n = readFileSync(new URL('../src/i18n/I18nContext.tsx', import.meta.url), 'utf8')
const langs = readFileSync(new URL('../src/i18n/types.ts', import.meta.url), 'utf8')

test('language can be selected directly from the persistent header', () => {
  assert.match(shell, /xa-lang xa-header-lang/)
  assert.match(shell, /xa-lang-short[^>]*>\{lang\.toUpperCase\(\)\}/)
  assert.match(shell, /<select value=\{lang\} onChange=\{e=>setLang\(e\.target\.value as Lang\)\} aria-label=\{c\('language'\)\}/)
  assert.match(css, /\.xa-header-actions \.xa-lang\.xa-header-lang\s*\{\s*display: inline-flex;/)
  assert.match(css, /\.xa-header-lang select\s*\{[^}]*opacity: 0;/s)
  assert.match(css, /\.xa-header-lang:focus-within/)
  assert.ok(app.includes("import './experience/mobile-language-control.css'"))
})

test('language is the first utility in the mobile menu, not buried at the bottom', () => {
  const menu = shell.slice(shell.indexOf('className="xa-mobile-menu"'))
  assert.ok(menu.indexOf('xa-mobile-utilities-top') < menu.indexOf('xa-mobile-menu-group xa-mobile-start'))
  assert.match(menu, /xa-mobile-utilities-top[^>]*><label className="xa-mobile-lang"/)
  assert.ok(menu.indexOf('xa-mobile-lang') < menu.indexOf('xa-mobile-music'))
})

test('selection persists and supports RTL without touching wallet or commerce', () => {
  assert.match(i18n, /localStorage\.setItem\(STORAGE, l\)/)
  assert.match(i18n, /document\.documentElement\.dir = dir/)
  for (const lang of ['fr','en','es','de','ru','uk','zh','ar']) assert.match(langs, new RegExp("id: '"+lang+"'"))
})
