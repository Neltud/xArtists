import { describe, expect, it } from 'vitest'
import { decodeBid, decodeListing } from './marketChain'

const LISTING_1 =
  '3u6pUIfMGKXvZM95G46m6ril5iLEZFdzc4sozZ+MhgQAAAALQVNGVC1hNjI3M2EAAAAAAAAAAQAAAAgDeC2s6dkAAAH03u6pUIfMGKXvZM95G46m6ril5iLEZFdzc4sozZ+MhgQA'
const LISTING_2 =
  '3u6pUIfMGKXvZM95G46m6ril5iLEZFdzc4sozZ+MhgQAAAALQVNGVC1hNjI3M2EAAAAAAAAAAQAAAAgDeC2s6dkAAAH03u6pUIfMGKXvZM95G46m6ril5iLEZFdzc4sozZ+MhgQB'
const BID_2 = 'tkzwsCVs0Hl7UEQzKxDH1O5uAsquyadO/TtR0uybZcwAAAAHI4byb8EAAA=='
const BID_1_EMPTY = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'

describe('decodeListing 11 oct fixtures', () => {
  it('listing 1 is inactive at 0.25 EGLD', () => {
    const row = decodeListing(1, LISTING_1)
    expect(row).not.toBeNull()
    expect(row?.token).toBe('ASFT-a6273a')
    expect(row?.nonce).toBe(1)
    expect(row?.priceEgld).toBe('0.25')
    expect(row?.active).toBe(false)
    expect(row?.royaltyBps).toBe(500)
  })

  it('listing 2 is the only active row', () => {
    const row = decodeListing(2, LISTING_2)
    expect(row?.active).toBe(true)
    expect(row?.priceEgld).toBe('0.25')
    expect(row?.id).toBe(2)
  })
})

describe('decodeBid', () => {
  it('listing 2 bid is 0.01 EGLD', () => {
    expect(decodeBid(BID_2)).toEqual({
      bidAtomic: '10000000000000000',
      bidEgld: '0.01',
    })
  })

  it('empty bid is not a lock', () => {
    expect(decodeBid(BID_1_EMPTY)).toBeNull()
    expect(decodeBid('')).toBeNull()
  })
})
