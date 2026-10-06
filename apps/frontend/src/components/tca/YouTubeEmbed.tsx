/** Sample-mode lesson player — no RAG, no hologram. */

export function YouTubeEmbed({
  videoId,
  title,
}: {
  videoId: string
  title?: string
}) {
  if (!videoId) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-2xl border border-white/10 bg-zinc-900 text-sm text-zinc-500">
        Sample video not configured
      </div>
    )
  }
  const src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?rel=0`
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
      {title ? (
        <p className="border-b border-white/5 px-4 py-2 text-[12px] text-zinc-400">{title}</p>
      ) : null}
      <div className="relative aspect-video w-full">
        <iframe
          className="absolute inset-0 h-full w-full"
          src={src}
          title={title || 'TCA sample lesson'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  )
}
