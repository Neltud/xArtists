/**
 * Legacy sale route — deprecated.
 * Paid reservations and the old TRO promo figures were not executable.
 * Never capture email or buyer wallet to a non-deliverable mailbox.
 */
import { Navigate } from 'react-router-dom'

export default function SalePage() {
  return <Navigate to="/offres" replace />
}
