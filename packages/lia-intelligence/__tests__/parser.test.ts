import { parseToLip } from '../parser'
import { resolveIntent } from '../intent-engine'

describe('LIP parser', () => {
  it('parses balance',
    () => {
      const i = parseToLip('Quel est mon solde TRO')
      expect(i.intent_type).toBe('BALANCE')
      expect(i.protocol).toBe('LIP-1')
    })

  it('flags ambiguous transfer', () => {
    const r = resolveIntent('Envoie 10 sur Ethereum')
    expect(r.ok).toBe(false)
  })

  it('uses 6 decimals on multiversx', () => {
    const i = parseToLip('envoie 5 TRO à erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqylllfsd7y4m5 sur multiversx')
    expect(i.decimals).toBe(6)
  })
})
