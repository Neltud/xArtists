import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

/** PolyLIA retiré — redirection packs agents. */
export default function AgentsPolyliaPage() {
  const navigate = useNavigate()
  useEffect(() => {
    navigate('/intelligence/agents', { replace: true })
  }, [navigate])
  return (
    <div className="xa-page p-6 text-sm text-zinc-400">
      Module PolyLIA retiré. Redirection…
    </div>
  )
}
