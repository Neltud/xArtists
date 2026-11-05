import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const read = path => readFileSync(new URL(path, import.meta.url), 'utf8')

const modules=read('../src/experience/modules.ts')
const registry=read('../src/experience/publicReadiness.ts')
const pages=read('../src/experience/Pages.tsx')
const road=read('../src/experience/PublicRoadmap.tsx')
const app=read('../src/App.tsx')
const shell=read('../src/experience/Shell.tsx')
const styles=read('../src/experience/experience.css')
const orbital=read('../src/experience/OrbitalArt.tsx')
const locales=read('../src/experience/locale.ts')

test('every module has exactly one conservative editorial stage and no stage means live funds',()=>{
 const ids=[...modules.matchAll(/^\s*module\('([^']+)'/gm)].map(m=>m[1])
 const rows=[...registry.matchAll(/^\s*(?:'([^']+)'|([a-z-]+)): '(browse|preview|roadmap)',/gm)]
 const stages=new Map(rows.map(m=>[m[1]||m[2],m[3]]))
 assert.equal(ids.length,40)
 assert.equal(stages.size,ids.length)
 assert.deepEqual([...stages.keys()].sort(),[...ids].sort())
 for(const id of ['market','museum','legal','guide'])assert.equal(stages.get(id),'browse')
 for(const id of ['auction','studio','nft-factory','dao','lia'])assert.equal(stages.get(id),'preview')
 for(const id of ['trading','staking','liquidity','burnify'])assert.equal(stages.get(id),'roadmap')
 assert.match(registry,/Unknown modules fail towards "roadmap"/)
 assert.doesNotMatch(registry,/checkout_enabled\s*=\s*true|mint_live_enabled\s*=\s*true/)
})

test('public roadmap is routed, discoverable, translated and linked to verifiable release issues',()=>{
 assert.match(app,/path="\/roadmap" element=\{<PublicRoadmap\/>\}/)
 assert.match(app,/path="\/feuille-de-route"/)
 assert.match(shell,/\['roadmap','\/roadmap',c\('roadmapLabel'\)\]/)
 assert.match(shell,/to="\/roadmap" onClick=\{closeMobile\}/)
 assert.match(road,/publicMilestones\.map/)
 assert.match(road,/github\.com\/Neltud\/xArtists\/issues/)
 assert.match(road,/roadmapNoDate/)
 for(const key of ['stageBrowse','stagePreview','stageRoadmap','roadmapLabel','roadmapTitle','roadmapIntro','roadmapNoDate','roadmapMint','roadmapPayments','roadmapDao','roadmapBridge']){
   const match=locales.match(new RegExp('  '+key+': (\\[[^\\n]*\\]),'))
   assert.ok(match,'missing public translation: '+key)
   const row=JSON.parse(match[1])
   assert.equal(row.length,8,'incomplete translation: '+key)
 }
})

test('module pages, directory and home show readiness without claiming financial LIVE',()=>{
 assert.match(pages,/StageBadge/)
 assert.match(pages,/PUBLIC_STAGE_ORDER\.map/)
 assert.match(pages,/xa-directory-stage-controls/)
 assert.match(pages,/readinessBrowseHint/)
 assert.match(pages,/xa-home-roadmap/)
 assert.match(pages,/to="\/roadmap"/)
 const home=pages.slice(pages.indexOf('export function Home()'),pages.indexOf('export function GroupPage'))
 assert.doesNotMatch(home,/sendTransaction|signTransaction|checkout_enabled|mint_live_enabled/)
})

test('CSS-3D decorative sculpture retains responsive, static and reduced-motion defaults',()=>{
 assert.match(pages,/<OrbitalArt\/>/)
 assert.match(orbital,/xa-orbital-panel-one/)
 assert.match(orbital,/aria-hidden="true"/)
 assert.doesNotMatch(orbital,/WebGLRenderer|Canvas|requestAnimationFrame|Math\.random|fetch\(/)
 assert.match(styles,/@keyframes xa-orbital-rotate/)
 assert.match(styles,/html\[data-motion="off"\] \.xa-orbital-axis\{animation:none\}/)
 assert.match(styles,/@media\(prefers-reduced-motion:reduce\)\{\.xa-orbital-axis\{animation:none!important\}\}/)
 assert.match(styles,/\.xa-first-art\.xa-orbital-art\{display:none\}/)
 assert.match(shell,/const MOBILE_DESTINATIONS = \[/)
})
