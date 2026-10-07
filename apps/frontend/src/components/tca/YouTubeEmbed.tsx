/**
 * DEPRECATED — YouTube removed from ATC/TCA (No-DVR / no third-party embed).
 * Kept as thin re-export so old imports compile; renders EphemeralStage.
 */
import EphemeralStage from './EphemeralStage'

/** @deprecated Use EphemeralStage */
export function YouTubeEmbed({ title }: { videoId?: string; title?: string }) {
  return (
    <EphemeralStage
      title={title || 'Scène éphémère'}
      subtitle="YouTube désactivé · canvas local uniquement"
    />
  )
}

export default YouTubeEmbed
