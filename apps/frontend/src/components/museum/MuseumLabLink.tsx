/** Lien discret vers le lab multiplayer */
import { Link } from 'react-router-dom'

export default function MuseumLabLink({ museumId }: { museumId?: string }) {
  const q = museumId ? `?museum=${encodeURIComponent(museumId)}` : ''
  return (
    <p className="text-[11px] text-zinc-600">
      <Link to={`/museum/lab${q}`} className="text-amber-400/80 hover:text-amber-300 underline-offset-2 hover:underline">
        Lab multiplayer
      </Link>
      {' · '}
      opt-in VITE_MULTIPLAYER_URL
    </p>
  )
}
