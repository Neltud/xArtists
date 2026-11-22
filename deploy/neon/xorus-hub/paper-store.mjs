import { createPaperState, applyPaperCommand, paperLedgerView } from './shared/paper-ledger.mjs'

/** One operator paper pilot. PostgreSQL serializes all isolates; no client ledger is trusted. */
export function createPaperStore(pool, { clock = Date.now, pilotId = 'xartists-operator-paper-v1' } = {}) {
  return {
    async read() {
      const result = await pool.query('SELECT state FROM public.xorus_paper_pilots WHERE pilot_id = $1', [pilotId])
      return { initialized: result.rows.length === 1,
        view: paperLedgerView(result.rows[0]?.state ?? createPaperState({ now: clock() }), clock()) }
    },
    async command(input) {
      const client = await pool.connect()
      try {
        await client.query('BEGIN')
        await client.query(`INSERT INTO public.xorus_paper_pilots (pilot_id, revision, state)
          VALUES ($1, 0, $2::jsonb) ON CONFLICT (pilot_id) DO NOTHING`,
        [pilotId, JSON.stringify(createPaperState({ now: clock() }))])
        const locked = await client.query('SELECT revision, state FROM public.xorus_paper_pilots WHERE pilot_id = $1 FOR UPDATE', [pilotId])
        const row = locked.rows[0]
        if (!row || Number(row.revision) !== row.state?.revision) throw new Error('paper_revision_mismatch')
        const outcome = applyPaperCommand(row.state, input, clock())
        if (!outcome.ok) {
          await client.query('ROLLBACK')
          return outcome
        }
        if (!outcome.replayed) {
          const changed = await client.query(`UPDATE public.xorus_paper_pilots
            SET revision = $2, state = $3::jsonb, updated_at = now()
            WHERE pilot_id = $1 AND revision = $4`,
          [pilotId, outcome.state.revision, JSON.stringify(outcome.state), row.revision])
          if (changed.rowCount !== 1) throw new Error('paper_revision_lost')
        }
        await client.query('COMMIT')
        return { ok: true, replayed: outcome.replayed, view: outcome.view }
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {})
        throw error
      } finally { client.release() }
    },
  }
}
