/** Open printable A4 certificate (browser print → PDF). */
export function openPrintableCertificate(opts: {
  kind: string
  id: string
  title: string
  sha: string
  mp?: number
  sigma?: number
  preview?: string | null
}) {
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
    `xartists:cert:${opts.id}:${opts.sha.slice(0, 16)}`,
  )}`
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${opts.kind} ${opts.id}</title>
  <style>
    @page { size: A4; margin: 18mm; }
    body { font-family: system-ui, sans-serif; color: #111; }
    .sheet { max-width: 180mm; margin: 0 auto; }
    h1 { font-size: 18pt; margin: 0 0 4mm; }
    .meta { font-size: 10pt; color: #444; }
    .sha { font-family: ui-monospace, monospace; font-size: 9pt; word-break: break-all; background: #f4f4f5; padding: 3mm; }
    .badge { display: inline-block; border: 1px solid #16a34a; color: #166534; padding: 1mm 3mm; border-radius: 4px; font-size: 9pt; }
    img.preview { max-width: 70mm; max-height: 70mm; object-fit: contain; border: 1px solid #ddd; }
    .row { display: flex; gap: 8mm; align-items: flex-start; margin-top: 6mm; }
  </style></head><body>
  <div class="sheet">
    <h1>xArtists · ${opts.kind}</h1>
    <p class="meta">${opts.title} · ${opts.id}</p>
    <p><span class="badge">Conformité HD ≥ 8 MP · σ ≥ 18</span>
      ${opts.mp != null ? ` · ${opts.mp.toFixed(1)} MP` : ''}
      ${opts.sigma != null ? ` · σ ${opts.sigma.toFixed(0)}` : ''}
    </p>
    <div class="row">
      ${opts.preview ? `<img class="preview" src="${opts.preview}" />` : ''}
      <div>
        <p class="meta">SHA-256 (JPEG compressé)</p>
        <p class="sha">${opts.sha || '—'}</p>
        <p class="meta">QR évaluation</p>
        <img src="${qr}" width="120" height="120" alt="QR" />
      </div>
    </div>
    <p class="meta" style="margin-top:8mm">Paper certificate — not automatic on-chain mint. xArtists MultiversX.</p>
  </div>
  <script>window.onload=function(){setTimeout(function(){window.print()},400)}</script>
  </body></html>`
  const w = window.open('', '_blank', 'noopener,noreferrer,width=800,height=1000')
  if (!w) return
  w.document.write(html)
  w.document.close()
}
