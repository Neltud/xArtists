import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { prepareArtCollection } from '../src/lib/artCollectionPaper.mjs'
import { prepareLocalCreatorEvidence } from '../src/lib/creatorEvidencePaper.mjs'

const bytes = Uint8Array.from([137,80,78,71,13,10,26,10,1,2,3,4,5,6,7,8])
const media = (data=bytes,type='image/png',name='art.png')=>({
  name,type,size:data.length,arrayBuffer:async()=>data.slice().buffer,
})
const plan = (rightsConfirmed=true,creatorType='human_artist')=>prepareArtCollection({
  title:'Expositions originales',description:'Collection de compositions originales.',
  quantity:2,seed:'xartists-creator-evidence-tests-2026',
  mode:'template',template:'chromatic',rightsConfirmed,creatorType,
  ...(creatorType==='ai_agent'?{agentId:'agent:creator-reviewer'}:{}),
})
const prepare = (art,file=media(),opts={})=>prepareLocalCreatorEvidence({
  file,art,edition:1,creativeBrief:'Créer une composition originale pour la galerie.',
  rightsDeclared:true,promotionPermissionDeclared:false,...opts,
})

test('hashes real source bytes, binds plan & edition, never invents IPFS/mint/payments',async()=>{
  const art=await plan()
  const record=await prepare(art)
  assert.equal(record.fileSha256,createHash('sha256').update(bytes).digest('hex'))
  assert.match(record.dossierDigest,/^[a-f0-9]{64}$/)
  assert.equal(record.planDigest,art.planDigest)
  assert.equal(record.edition,1)
  assert.equal(record.mime,'image/png')
  assert.equal(record.sizeBytes,bytes.length)
  assert.equal(record.status,'LOCAL_BYTES_HASHED_PAPER_ONLY')
  for(const key of ['ipfsPinned','mintEnabled','paymentExecuted','contractDeployed','trailerPublished'])
    assert.equal(record[key],false)
  assert.equal(record.mediaUri,null)
  assert.equal(record.metadataUri,null)
  assert.equal(record.creatorHandoff.schema,'xa-handoff/1')
  assert.equal(record.creatorHandoff.assetDigest,record.fileSha256)
  assert.equal(record.trailerHandoff.assetDigest,record.fileSha256)
  assert.equal(record.creatorHandoff.destination,'creation')
  assert.equal(record.trailerHandoff.destination,'trailer')
  assert.equal(record.creatorHandoff.evidence.length,2)
  assert.ok(record.creatorHandoff.blockers.includes('real_media_ipfs_cid_and_gateway_bytes_unverified'))
  assert.ok(record.creatorHandoff.blockers.includes('independent_rights_and_provenance_review_required'))
  assert.ok(record.trailerHandoff.blockers.includes('promotion_permission_declaration_missing'))
  assert.ok(record.trailerHandoff.evidence.every(x=>x.verification==='unverified'))
  assert.ok(record.creatorHandoff.evidence.every(x=>x.assetDigest===record.fileSha256&&x.verification==='unverified'))
  assert.ok(!JSON.stringify(record).includes('data:image/'))
  assert.equal(record.observedAt.endsWith('Z'),true)
})

test('self-declared rights and trailer promotion never count as authenticated evidence',async()=>{
  const art=await plan()
  const r=await prepare(art,media(),{promotionPermissionDeclared:true})
  assert.deepEqual(r.trailerHandoff.evidence.map(x=>x.kind),['source','promotion_permission'])
  assert.ok(r.trailerHandoff.blockers.includes('independent_promotion_rights_and_source_review_required'))
  assert.ok(r.trailerHandoff.blockers.includes('final_trailer_and_publication_approval_missing'))
  assert.ok(r.trailerHandoff.evidence.every(x=>x.verification==='unverified'))
  assert.ok(!r.trailerHandoff.executionAuthorized)
  const unclaimed=await plan(false)
  const noRights=await prepare(unclaimed,media(),{rightsDeclared:false})
  assert.deepEqual(noRights.creatorHandoff.evidence.map(x=>x.kind),['creative_brief'])
  assert.ok(noRights.creatorHandoff.blockers.includes('creator_rights_declaration_missing'))
  assert.equal(noRights.rightsDeclared,false)
})

test('file version, selected edition, metadata or brief changes the dossier commitment',async()=>{
  const art=await plan()
  const first=await prepare(art)
  const changedBrief=await prepare(art,media(),{creativeBrief:'Créer une série différente, original et vérifiable.'})
  const secondEdition=await prepare(art,media(),{edition:2})
  const modifiedFile=media(Uint8Array.from([...bytes.slice(0,-1),99]))
  const changedSource=await prepare(art,modifiedFile)
  const withPromo=await prepare(art,media(),{promotionPermissionDeclared:true})
  assert.equal(first.fileSha256,changedBrief.fileSha256)
  assert.notEqual(first.dossierDigest,changedBrief.dossierDigest)
  assert.notEqual(first.dossierDigest,secondEdition.dossierDigest)
  assert.notEqual(first.dossierDigest,changedSource.dossierDigest)
  assert.notEqual(first.fileSha256,changedSource.fileSha256)
  assert.notEqual(first.dossierDigest,withPromo.dossierDigest)
  assert.notEqual(first.creatorHandoff.taskId,secondEdition.creatorHandoff.taskId)
})

test('rejects fake MIME headers, oversized files, incomplete bytes and altered metadata',async()=>{
  const art=await plan()
  await assert.rejects(prepare(art,media(Uint8Array.from([0,1,2,3,4,5,6,7,8,9,10,11]))),/media_bytes_or_signature_invalid/)
  await assert.rejects(prepare(art,media(bytes,'application/pdf','art.pdf')),/unsupported_media_type_or_size/)
  await assert.rejects(prepare(art,{name:'huge.mp4',type:'video/mp4',size:49*1024*1024,arrayBuffer:()=>{throw Error('must_not_read')}}),/unsupported_media_type_or_size/)
  await assert.rejects(prepare(art,{name:'wrong.png',type:'image/png',size:50,arrayBuffer:async()=>bytes.buffer}),/media_bytes_or_signature_invalid/)
  await assert.rejects(prepare(art,media(),{edition:0}),/invalid_paper_edition/)
  await assert.rejects(prepare(art,media(),{edition:3}),/invalid_paper_edition/)
  await assert.rejects(prepare(art,media(),{rightsDeclared:false}),/rights_declaration_out_of_sync/)
  await assert.rejects(prepare(art,media(),{creativeBrief:'trop court'}),/invalid_creative_brief/)
  await assert.rejects(prepare({...art,editions:[{...art.editions[0],image:'ipfs://unproven'},art.editions[1]]}),/edition_must_be_unminted_paper_metadata/)
  await assert.rejects(prepare({...art,planDigest:'x'.repeat(64)}),/invalid_paper_edition|edition_must_be_unminted_paper_metadata/)
})

test('3D GLB is treated as header-only and never promises cover upload or on-chain mint',async()=>{
  const art=await plan()
  const glb=Uint8Array.from([103,108,84,70,2,0,0,0,12,0,0,0])
  const r=await prepare(art,media(glb,'application/octet-stream','sculpture.glb'))
  assert.equal(r.mime,'model/gltf-binary')
  assert.ok(r.creatorHandoff.blockers.includes('3d_cover_and_operator_upload_gate_unverified'))
  assert.equal(r.ipfsPinned,false)
  const invalid=Uint8Array.from([103,108,84,70,1,0,0,0,12,0,0,0])
  await assert.rejects(prepare(art,media(invalid,'model/gltf-binary','invalid.glb')),/media_bytes_or_signature_invalid/)
})

test('agent identity is never interpreted as financial or mint authority',async()=>{
  const art=await plan(true,'ai_agent')
  const r=await prepare(art)
  assert.ok(r.creatorHandoff.blockers.includes('scoped_signed_agent_mandate_required'))
  assert.equal(r.mintEnabled,false)
  assert.equal(r.paymentExecuted,false)
})

test('factory UI consumes evidence component without automatic network or mainnet activation',()=>{
  const page=readFileSync(new URL('../src/pages/NftDistributorPage.tsx',import.meta.url),'utf8')
  const ui=readFileSync(new URL('../src/components/CreatorEvidenceHandoff.tsx',import.meta.url),'utf8')
  const status=readFileSync(new URL('../src/config/scStatus.ts',import.meta.url),'utf8')
  assert.match(page,/import CreatorEvidenceHandoff/)
  assert.match(page,/<CreatorEvidenceHandoff art=\{art\}/)
  assert.match(ui,/onClick=\{\(\) => \{ void prepare\(\) \}\}/)
  assert.match(ui,/revision.current === ticket/)
  assert.match(ui,/Dossier Trailer \(non vérifié\)/)
  assert.doesNotMatch(ui,/\bfetch\s*\(|\bsendTransaction\s*\(|\brequestOpenConnect\s*\(/)
  assert.match(status,/AGENT_PACK_PUBLIC_MINT_RELEASED = false/)
  assert.match(status,/AGENT_PACK_PUBLIC_COMMERCE_RELEASED = false/)
})
