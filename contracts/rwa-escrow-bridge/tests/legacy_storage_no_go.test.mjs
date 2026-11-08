import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'

// Snapshot of the deployed-contract *source* layout, not a verified chain dump.
// A new TopDecode layout with extra fields is not legacy byte-compatible.
const LEGACY=[
 'trade_id','payer','seller','amount','meta_hash','deadline','status',
 'dispute_opened_at','proof_hash',
]
const APPENDED=[
 'receipt_confirmed','verification_confirmed','quality_confirmed',
 'quality_proof_hash','ownership_confirmed','ownership_proof_hash',
]
const contract=readFileSync(new URL('../src/lib.rs', import.meta.url),'utf8')
function fields(src) {
 const match=src.match(/pub struct Escrow<[^>]+>\s*\{([\s\S]*?)\n\}/)
 assert.ok(match,'Escrow TopEncode/TopDecode storage layout missing')
 return [...match[1].matchAll(/pub\s+([a-zA-Z_][\w]*)\s*:/g)].map(m=>m[1])
}

test('legacy encoded Escrow fields must stay in exactly their original order',()=>{
 assert.deepEqual(fields(contract).slice(0,LEGACY.length),LEGACY)
})

test('new receipt/quality/ownership fields make live in-place storage upgrade unsafe',()=>{
 const current=fields(contract)
 assert.deepEqual(current.slice(LEGACY.length),APPENDED)
 assert.notDeepEqual(current,LEGACY,'a migration plan is required for historic rows')
 // This is intentional negative evidence. A passing test does NOT certify a
 // migration: on-chain legacy SingleValueMapper<Escrow> decoding is unresolved.
 assert.match(contract,/#\[storage_mapper\("escrows"\)\]/)
 assert.match(contract,/#\[endpoint\(upgrade\)\]/)
})

test('release gating must not be confused with an approved storage migration',()=>{
 const docs=readFileSync(new URL('../../../docs/RWA_ESCROW_RELEASE_GATES_DRAFT_2026-11-08.md', import.meta.url),'utf8')
 assert.match(docs,/migration|storage/i)
 assert.match(docs,/NO-GO|no.go|draft|not deploy/i)
})
