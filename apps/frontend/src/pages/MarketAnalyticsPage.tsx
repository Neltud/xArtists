/**
 * /market — analyse publique + matrice 10 colonnes (paper).
 * Alias historique vers MarketPage + board perception LIA.
 */
import MarketPage from './MarketPage'
import MatrixBoard from '../components/lia/MatrixBoard'

export default function MarketAnalyticsPage() {
  return (
    <div className="space-y-6 pb-16">
      <MarketPage />
      <div className="max-w-4xl mx-auto px-0 sm:px-0">
        <MatrixBoard />
      </div>
    </div>
  )
}
