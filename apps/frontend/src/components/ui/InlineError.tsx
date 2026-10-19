type Props = {
  message: string
  onRetry?: () => void
  className?: string
}

export default function InlineError({ message, onRetry, className = '' }: Props) {
  return (
    <div
      className={`rounded-xl border px-3 py-2 text-[12px] ${className}`}
      style={{
        borderColor: 'rgba(248, 113, 113, 0.35)',
        background: 'rgba(248, 113, 113, 0.08)',
        color: '#fecaca',
      }}
      role="alert"
    >
      <p>{message}</p>
      {onRetry ? (
        <button
          type="button"
          className="mt-2 text-[11px] underline opacity-90 hover:opacity-100"
          onClick={onRetry}
        >
          Réessayer
        </button>
      ) : null}
    </div>
  )
}
