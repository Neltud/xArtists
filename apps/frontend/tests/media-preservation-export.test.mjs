import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8')
const ui=read('../src/components/CreatorMediaUpload.tsx')
const manifest=read('../src/lib/mediaArchiveManifest.ts')
const studio=read('../src/pages/StudioPage.tsx')
const backend=read('../../../services/access-api/src/creatorMedia.mjs')

test('Studio exports an honest provenance receipt only after real Pinata HTTP response',()=>{
 assert.match(studio,/CreatorMediaUpload/)
 assert.match(ui,/makePreservationManifest/)
 assert.match(ui,/exportPreservationReceipt\(pinned\)/)
 assert.match(ui,/mediaUri:meta.mediaUri/)
 assert.match(ui,/metadataUri:meta.metadataUri/)
 assert.match(ui,/data\.bytes!==file\.size/)
 assert.match(ui,/data\.mime!==file\.type/)
 assert.match(ui,/Télécharger la fiche de conservation/)
 assert.match(ui,/n'est ni une sauvegarde, ni une preuve de conservation permanente/)
 assert.match(manifest,/schema_version:1/)
 assert.match(manifest,/status:'provider_reported'/)
 assert.match(manifest,/status:'planned'/)
 assert.match(manifest,/permanence:'NOT_GUARANTEED'/)
 assert.match(manifest,/on_chain_mint:'NOT_VERIFIED'/)
 assert.doesNotMatch(manifest,/status:'permanent'|minted:true|payment_complete:true/)
})

test('media secrets, signed publishing and wallet mint stay on their existing rails',()=>{
 assert.match(backend,/CREATOR_MEDIA_UPLOAD_ENABLED==='1'/)
 assert.match(backend,/process\.env\.PINATA_JWT/)
 assert.match(backend,/DATABASE_URL/)
 assert.match(backend,/media_rights_confirmation_required/)
 assert.match(backend,/wrapWithDirectory:true/)
 assert.match(ui,/method!=='xportal'/)
 assert.match(ui,/PINATA/i)
 assert.doesNotMatch(ui,/VITE_PINATA_JWT|api\.pinata\.cloud/)
 assert.doesNotMatch(manifest,/localStorage|PINATA_JWT|sendTransaction|checkout|privateKey/)
})
