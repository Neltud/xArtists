import { useEffect, useState } from 'react'

const RAW = 'https://raw.githubusercontent.com/Neltud/xArtists/main/data/mvx_gas.json'

type Op = { op: string; gas_limit: number; fee_egld: number; fee_usd: number | null }

export default function GasCostPanel() {
  const [ops, setOps] = useState<Op[]>([])
  const [note, setNote] = useState('')

  useEffect(() => {
    fetch(RAW + '?t=' + Date.now())
      .then(r => (r.ok ? r.json() : null))
      .then(j => {
        if (!j) return
        setOps(j.operations || [])
        setNote(j.note || '')
      })
      .catch(() => {})
  }, [])

  if (!ops.length) {
    return (
      <div className="card mb-6 text-xs text-gray-500">
        Frais gaz MVX : publier via <code className="text-purple-400">python -m lia.gas.publish</code>
      </div>
    )
  }

  return (
    <div className="card mb-6">
      <h2 className="text-lg font-bold mb-2">⛽ Frais gaz MultiversX (estim.)</h2>
      <p className="text-xs text-gray-500 mb-3">{note}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 uppercase border-b border-[#2a2a3a]">
              <th className="text-left py-2">Opération</th>
              <th className="text-right py-2">Gas limit</th>
              <th className="text-right py-2">≈ EGLD</th>
              <th className="text-right py-2">≈ USD</th>
            </tr>
          </thead>
          <tbody>
            {ops.map(o => (
              <tr key={o.op} className="border-b border-[#2a2a3a]/40">
                <td className="py-1.5 mono text-xs text-teal-200">{o.op}</td>
                <td className="py-1.5 text-right mono text-xs">{o.gas_limit.toLocaleString()}</td>
                <td className="py-1.5 text-right">{o.fee_egld.toFixed(6)}</td>
                <td className="py-1.5 text-right text-gray-400">
                  {o.fee_usd != null ? `$${o.fee_usd.toFixed(4)}` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
