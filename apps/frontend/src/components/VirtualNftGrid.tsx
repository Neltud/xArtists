import { useRef, useMemo, useState, useEffect, type ReactNode } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'

/**
 * Multi-column virtual grid for large NFT catalogues.
 * Activates windowing when itemCount >= threshold (default 48).
 * Below threshold: plain CSS grid (cheaper, no virtual overhead).
 */
export function useGridColumns(breakpoints?: { sm?: number; md?: number; lg?: number; xl?: number }) {
  const bp = { sm: 2, md: 3, lg: 4, xl: 5, ...(breakpoints || {}) }
  const [cols, setCols] = useState(2)
  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth
      if (w >= 1280) setCols(bp.xl)
      else if (w >= 1024) setCols(bp.lg)
      else if (w >= 640) setCols(bp.md)
      else setCols(bp.sm)
    }
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [bp.sm, bp.md, bp.lg, bp.xl])
  return cols
}

type Props<T> = {
  items: T[]
  /** row height estimate including gap (px) */
  estimateRowHeight?: number
  threshold?: number
  className?: string
  renderItem: (item: T, index: number) => ReactNode
  getKey: (item: T, index: number) => string
}

export default function VirtualNftGrid<T>({
  items,
  estimateRowHeight = 240,
  threshold = 48,
  className = 'grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
  renderItem,
  getKey,
}: Props<T>) {
  const cols = useGridColumns()
  const parentRef = useRef<HTMLDivElement>(null)

  const rows = useMemo(() => {
    const out: T[][] = []
    for (let i = 0; i < items.length; i += cols) {
      out.push(items.slice(i, i + cols))
    }
    return out
  }, [items, cols])

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateRowHeight,
    overscan: 3,
  })

  if (items.length < threshold) {
    return (
      <div className={className}>
        {items.map((item, i) => (
          <div key={getKey(item, i)} className="nft-grid-item">
            {renderItem(item, i)}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div
      ref={parentRef}
      className="w-full overflow-auto"
      style={{ maxHeight: 'min(70vh, 900px)' }}
      role="list"
    >
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map(vRow => {
          const row = rows[vRow.index] || []
          return (
            <div
              key={vRow.key}
              role="listitem"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: vRow.size,
                transform: `translateY(${vRow.start}px)`,
              }}
            >
              <div
                className={className}
                style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
              >
                {row.map((item, j) => {
                  const idx = vRow.index * cols + j
                  return (
                    <div key={getKey(item, idx)} className="nft-grid-item">
                      {renderItem(item, idx)}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
