import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'

const shell = readFileSync(new URL('../src/experience/Shell.tsx', import.meta.url), 'utf8')
const mobileCss = readFileSync(new URL('../src/experience/mobile-contrast-fixes.css', import.meta.url), 'utf8')
const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
const i18n = readFileSync(new URL('../src/i18n/I18nContext.tsx', import.meta.url), 'utf8')
const langs = readFileSync(new URL('../src/i18n/types.ts', import.meta.url), 'utf8')

test('mobile header has no locale badge and keeps logo, search, wallet and menu', () => {
  const header = shell.slice(shell.indexOf('<header className="xa-header">'), shell.indexOf('</header>'))
  assert.match(header, /<Logo\/>/)
  assert.match(header, /xa-search-trigger/)
  assert.match(header, /className="xa-connect"/)
  assert.match(header, /xa-mobile-trigger/)
  assert.match(header, /<label className="xa-lang">/)
  assert.doesNotMatch(header, /xa-header-lang|xa-lang-short|lang\.toUpperCase/)
  assert.match(mobileCss, /@media\s*\(max-width:\s*840px\)\s*\{[\s\S]*?\.xa-header-actions \.xa-lang\s*\{\s*display:\s*none;/)
  assert.match(mobileCss, /\.xa-header-actions \.xa-theme-toggle\s*\{\s*display:\s*none;/)
  assert.doesNotMatch(app, /mobile-language-control\.css/)
})

test('language is the first accessible utility in the mobile menu', () => {
  const menu = shell.slice(shell.indexOf('className="xa-mobile-menu"'))
  assert.ok(menu.indexOf('xa-mobile-utilities-top') > -1)
  assert.ok(menu.indexOf('xa-mobile-utilities-top') < menu.indexOf('xa-mobile-menu-group xa-mobile-start'))
  assert.match(menu, /xa-mobile-utilities-top[^>]*><label className="xa-mobile-lang"/)
  assert.match(shell, /<select value=\{lang\} onChange=\{e=>setLang\(e\.target\.value as Lang\)\} aria-label=\{c\('language'\)\}/)
  assert.match(menu, /\{languages\}/)
  assert.match(mobileCss, /\.xa-mobile-utilities-top \.xa-mobile-lang/)
})

test('language persistence, URL query, browser detection and RTL remain available', () => {
  assert.match(i18n, /localStorage\.setItem\(STORAGE, l\)/)
  assert.match(i18n, /new URLSearchParams\(window\.location\.search\)\.get\('lang'\)/)
  assert.match(i18n, /navigator\.language/)
  assert.match(i18n, /document\.documentElement\.dir = dir/)
  for (const lang of ['fr','en','es','de','ru','uk','zh','ar']) {
    assert.match(langs, new RegExp("id: '"+lang+"'"))
  }
})
