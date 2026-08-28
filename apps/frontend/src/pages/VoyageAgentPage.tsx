/**
 * Legacy route — travel is NOT an AI agent pack.
 * Redirect to cultural Tours service.
 */
import { Navigate } from 'react-router-dom'

export default function VoyageAgentPage() {
  return <Navigate to="/tours" replace />
}
