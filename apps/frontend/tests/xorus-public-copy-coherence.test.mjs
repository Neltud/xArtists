import {readFileSync} from 'node:fs'
import {test} from 'node:test'
import assert from 'node:assert/strict'

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8')
const copy=read('../src/experience/locale.ts')
const home=read('../src/components/HomeQuickActions.tsx')
const signal=read('../../../services/access-api/src/signals.mjs')

test('xOrus replaces legacy LIA branding in all eight public languages',()=>{
  for(const key of ['roadmapLia','intelligenceDesc']){
    const row=copy.split('\n').find(line=>line.trimStart().startsWith(key+':'))
    assert.ok(row,key+' translation row missing')
    assert.equal((row.match(/xOrus/g)||[]).length,8,key+' must be translated for eight languages')
    assert.doesNotMatch(row,/\bLIA\b/)
  }
})

test('public home action reaches xOrus paper, never the trading screen',()=>{
  assert.match(home,/to: '\/xorus', label: 'xOrus · Intelligence'/)
  assert.match(home,/Signaux paper · aucun trading/)
  assert.doesNotMatch(home,/Board LIA|to: '\/trading'/)
})

test('API fallback keeps paper-only execution and xOrus name',()=>{
  assert.match(signal,/headline: 'xOrus signal-only — no live trading'/)
  assert.match(signal,/live_trading: 0/)
  assert.match(signal,/execution: 'disabled'/)
})
