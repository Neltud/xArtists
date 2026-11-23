import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8')
const pages=readFileSync(new URL('../src/experience/Pages.tsx',import.meta.url),'utf8')

test('public lazy routes show an accessible loading state rather than a blank page',()=>{
  assert.match(app,/ArtworkDetail,Loader/)
  assert.doesNotMatch(app,/<Suspense fallback=\{null\}>/)
  const matches=[...app.matchAll(/<Suspense fallback=\{<Loader\/>\}>/g)]
  assert.ok(matches.length>=3,'all three public lazy route wrappers must show Loader')
  assert.match(pages,/function Loader\(\)/)
  assert.match(pages,/className="xa-loading" role="status"/)
})
test('homepage creator section has a unique heading and matching aria-labelledby',()=>{
  assert.match(pages,/aria-labelledby="xa-home-workflow-title"/)
  assert.match(pages,/<h2 id="xa-home-workflow-title">/)
  assert.equal([...pages.matchAll(/id="xa-home-workflow-title"/g)].length,1)
  assert.doesNotMatch(pages,/id="xa-first-tools"/)
})
