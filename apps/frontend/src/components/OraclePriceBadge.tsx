import {localizeChild as xaLocalize, renderChild as xaRender, usePhraseLocale as xaUsePhraseLocale} from '../i18n/phraseRuntime'
import { useOraclePrice } from '../hooks/useOraclePrice'

/** Compact EGLD/USD badge for Header or Portfolio */
export default function OraclePriceBadge() {
  xaUsePhraseLocale()

  const { price, ok, source, loading, error } = useOraclePrice()

  if (loading) {
    return (
      <span className="text-xs text-gray-500" title={xaLocalize("Oracle")}>
        {xaRender("EGLD… ")}</span>
    )
  }
  if (!ok || price <= 0) {
    return (
      <span className="text-xs text-orange-400/80" title={error ?? 'unavailable'}>
        {xaRender("EGLD n/a ")}</span>
    )
  }
  return (
    <span
      className="text-xs text-emerald-400/90 tabular-nums"
      title={`Source: ${source}`}
    >
      {xaRender("EGLD $")}{xaRender(price.toFixed(2))}
    </span>
  )
}
