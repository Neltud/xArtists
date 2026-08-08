import { Link } from 'react-router-dom'

/**
 * Honest P0 banner — marketplace / agents not live until codeHash non-null.
 */
export default function ScStatusBanner() {
  return (
    <div
      className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-100/95 leading-relaxed"
      role="status"
    >
      <strong className="text-amber-200">On-chain market :</strong> nft-marketplace + agents-marketplace{' '}
      <span className="text-amber-300/90">pas encore live</span> (codeHash null / agents null). List / Buy /
      Bid restent bloqués — posture volontaire. Deploy :{' '}
      <code className="text-[10px]">docs/DEPLOYMENT_STEPS.md</code>.{' '}
      <Link to="/studio" className="underline text-purple-300">
        Studio
      </Link>{' '}
      ·{' '}
      <Link to="/gallery" className="underline text-purple-300">
        Galerie
      </Link>{' '}
      restent consultables.
    </div>
  )
}
