import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'

const read = path => readFileSync(new URL(path,import.meta.url),'utf8')
const copy = read('../src/experience/locale.ts')
const guide = read('../src/pages/DemoTourPage.tsx')
const directory = read('../src/experience/Pages.tsx')
const shell = read('../src/experience/Shell.tsx')
const normalize = read('../src/experience/moduleSearch.ts')
const css = read('../src/experience/beginner-navigation.css')

function localeRow(key) {
  const m=copy.match(new RegExp('^\\s*'+key+': (\\[[^\\n]+\\]),?$','m'))
  assert.ok(m,'missing public locale '+key)
  return JSON.parse(m[1])
}

test('guide promises exactly four beginner choices, while all eight destinations stay accessible',()=>{
  const labels=localeRow('guideTitle')
  const intro=localeRow('guideIntro')
  assert.equal(labels.length,8)
  assert.equal(intro.length,8)
  assert.ok(labels.every(v=>v.trim().length>0))
  assert.ok(intro.every(v=>v.trim().length>0))
  assert.match(labels[0],/quatre étapes/)
  assert.match(labels[1],/four steps/)
  assert.match(labels[2],/cuatro pasos/)
  assert.match(labels[7],/أربع خطوات/)
  assert.match(guide,/<ol className="xa-guide-steps">/)
  assert.match(guide,/<details className="xa-guide-advanced">/)
  assert.match(guide,/guideSaleNotice/)
  assert.ok(guide.indexOf('const steps = [') < guide.indexOf('const extra = ['))
})

test('all eight languages explain failed directory filters and how to recover',()=>{
  for(const key of ['directoryEmpty','directoryReset']){
    const row=localeRow(key)
    assert.equal(row.length,8)
    assert.ok(row.every(v=>typeof v==='string' && v.trim().length>0))
  }
  assert.match(directory,/directoryEmpty/)
  assert.match(directory,/directoryReset/)
  assert.match(directory,/className="xa-directory-reset"/)
  assert.match(directory,/role="status" aria-live="polite"/)
  assert.match(directory,/for\(const key of \['group','q','stage'\]\)next\.delete\(key\)/)
  assert.doesNotMatch(directory,/new URLSearchParams\(\),\{replace:true\}/)
})

test('global search and directory apply the same Unicode folding',()=>{
  assert.match(shell,/import \{matchesModuleSearch\} from '\.\/moduleSearch'/)
  assert.match(directory,/import \{matchesModuleSearch\} from '\.\/moduleSearch'/)
  assert.match(shell,/matchesModuleSearch\(q,/)
  assert.match(directory,/matchesModuleSearch\(q,/)
  assert.match(normalize,/\.normalize\('NFD'\)/)
  assert.match(normalize,/\.toLocaleLowerCase\(lang\)/)
  assert.match(normalize,/\.trim\(\)/)
})

test('filter controls are keyboard accessible and fit 360px width',()=>{
  assert.match(css,/\.xa-directory-controls \{ flex-wrap: wrap;/)
  assert.match(css,/\.xa-directory-reset \{/)
  assert.match(css,/min-height: 44px/)
  assert.match(css,/\.xa-directory-reset:focus-visible/)
  assert.match(css,/@media \(max-width: 560px\)/)
  assert.match(directory,/input type="search"/)
  assert.doesNotMatch(directory+guide,/sendTransaction\(|placeOrder\(|VITE_LIA_LIVE_TRADING\s*=\s*1/)
})
