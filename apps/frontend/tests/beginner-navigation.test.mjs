import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {architecture as a} from './architecture-catalogue.mjs'
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8')
const shell=read('../src/experience/Shell.tsx'),pages=read('../src/experience/Pages.tsx'),css=read('../src/experience/workspaces.css')
test('global menus, search, directory and contextual navigation consume the shared architecture',()=>{
 for(const token of ['PRIMARY_AREAS.map','MOBILE_AREAS.map','navigationRank(a.id)','contextualModules(modules'])assert.ok(shell.includes(token),token)
 for(const token of ['PRIMARY_AREAS.map','MOBILE_AREAS.map','areaFor(m.id)','contextualModules(modules'])assert.ok(pages.includes(token),token)
 assert.doesNotMatch(shell,/const MOBILE_DESTINATIONS/)
})
test('wallet navigation is a real personal destination and never opens a signing dialog',()=>{
 assert.match(shell,/className="xa-connect" to="\/wallet"/)
 assert.doesNotMatch(shell,/requestOpenAssets|requestOpenConnect/)
 assert.equal(a.MOBILE_AREAS.at(-1).to,'/wallet')
})
test('contextual navigation has optional detail while search retains keyboard support',()=>{
 assert.match(pages,/xa-context-more/)
 assert.match(shell,/role="combobox"/)
 assert.match(shell,/role="listbox"/)
 assert.match(shell,/ArrowDown/)
 assert.match(shell,/aria-activedescendant/)
 assert.match(css,/min-height:44px/)
 assert.match(css,/prefers-reduced-motion/)
})
test('readiness remains visible on module cards and advanced directory filters',()=>{
 assert.match(pages,/StageBadge stage=\{publicStage\(m.id\)\}/)
 assert.match(pages,/xa-directory-stage-controls/)
 assert.match(pages,/PUBLIC_STAGE_ORDER/)
 assert.doesNotMatch(shell+pages,/mint_live_enabled\s*=\s*true|paybox_checkout_enabled\s*=\s*true|LIA_LIVE_TRADING\s*=\s*1/)
})
