import { useMemo, useState } from 'react'

interface Props {
  warp: unknown
  filename: string
  disabled?: boolean
}

export default function WarpButton({ warp, filename, disabled }: Props) {
  const [copied, setCopied] = useState(false)

  const payload = useMemo(() => JSON.stringify(warp, null, 2), [warp])
  const deepLink = useMemo(
    () => `https://app.joai.ai/warp?payload=${encodeURIComponent(payload)}`,
    [payload],
  )

  const onCopy = async () => {
    if (disabled || !navigator?.clipboard) return
    await navigator.clipboard.writeText(payload)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        disabled={disabled}
        onClick={onCopy}
        className="btn-secondary text-sm disabled:opacity-50"
      >
        {copied ? 'Warp copié' : `Copier ${filename}`}
      </button>
      <a
        href={deepLink}
        target="_blank"
        rel="noreferrer"
        className={`text-[11px] ${disabled ? 'pointer-events-none text-gray-600' : 'text-purple-400 hover:underline'}`}
      >
        Deep-link placeholder ↗
      </a>
    </div>
  )
}
