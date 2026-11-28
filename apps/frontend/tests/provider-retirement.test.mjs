import test from 'node:test'
import assert from 'node:assert/strict'
import {existsSync,readFileSync} from 'node:fs'
const root=new URL('../../../',import.meta.url)
const read=path=>readFileSync(new URL(path,root),'utf8')
test('retired workflow provider cannot be reached by the browser or CI',()=>{
 for(const path of ['apps/frontend/public/vellum/index.html','apps/frontend/public/data/vellum_last_run.json','packages/vellum-command/engine.mjs','services/vellum-8008-proxy/main.py','deploy/vellum/worker.js','lia/vellum/__init__.py'])assert.equal(existsSync(new URL(path,root)),false,path)
 for(const path of ['apps/frontend/src/components/LIALaunchButton.tsx','apps/frontend/src/lib/agent8008Bridge.ts','apps/frontend/src/hooks/useLiaSlowPath.ts','apps/frontend/src/components/DeskPanel.tsx','.github/workflows/static.yml','.github/workflows/rag-ingestion.yml','.github/workflows/shadow-sprint.yml'])assert.doesNotMatch(read(path),/vellum/i,path)
 assert.doesNotMatch(read('apps/frontend/src/lib/agent8008Bridge.ts'),/\bfetch\s*\(/)
 assert.doesNotMatch(read('.github/workflows/rag-ingestion.yml'),/\bcurl\b/)
 assert.match(read('.github/workflows/deploy-scs.yml'),/scripts\/deploy_contracts_legacy\.py/)
})
