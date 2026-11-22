import { Pool } from 'pg'
import { attachDatabasePool } from '@neon/functions'
import { parseTriggerDelivery } from '@neon/functions/triggers'
import { createHub } from './hub.mjs'
import { createPostgresStore } from './postgres.mjs'
import { PACKAGED_SOURCE_SHA } from './build-meta.mjs'
import { createPaperStore } from './paper-store.mjs'

let store = null
let paperStore = null
if (process.env.DATABASE_URL && process.env.NEON_BRANCH_ID === 'br-steep-sun-bab7l93p' &&
    process.env.XORUS_HUB_TARGET_CONFIRMED === 'orange-dust-23862418') {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2,
    connectionTimeoutMillis: 4000, idleTimeoutMillis: 1000,
    query_timeout: 4000, statement_timeout: 4000 })
  attachDatabasePool(pool)
  store = createPostgresStore(pool)
  paperStore = createPaperStore(pool)
}
export default createHub({ store, paperStore, parseTrigger: parseTriggerDelivery, sourceSha: PACKAGED_SOURCE_SHA })
