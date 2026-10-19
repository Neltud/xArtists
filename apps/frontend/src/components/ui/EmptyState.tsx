type Props = {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export default function EmptyState({ title, description, action, className = '' }: Props) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border px-6 py-12 text-center ${className}`}
      style={{
        borderColor: 'var(--xa-border)',
        background: 'rgba(255,255,255,0.02)',
      }}
      role="status"
    >
      <p className="text-sm font-semibold" style={{ color: 'var(--xa-text)' }}>
        {title}
      </p>
      {description ? (
        <p className="mt-2 max-w-sm text-[12px] leading-relaxed" style={{ color: 'var(--xa-text-muted)' }}>
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
