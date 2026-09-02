import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[xArtists] Unhandled error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      const msg = this.state.error?.message ?? 'Erreur inattendue'
      const chunkFail =
        /Failed to fetch dynamically imported module|Loading chunk|Importing a module script failed/i.test(
          msg
        )
      return (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 p-8 text-center">
          <span className="text-5xl">⚠️</span>
          <h2 className="text-xl font-bold text-white">Chargement interrompu</h2>
          <p className="text-sm text-gray-400 max-w-md">{msg}</p>
          {chunkFail && (
            <p className="text-xs text-amber-300/90 max-w-sm">
              Nouveau déploiement détecté — rechargez pour récupérer les bons fichiers JS.
            </p>
          )}
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, error: null })}
              className="btn-secondary text-sm"
            >
              Réessayer
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn-primary text-sm"
            >
              Recharger la page
            </button>
            <a href="/xArtists/#/" className="btn-secondary text-sm inline-flex items-center">
              Accueil
            </a>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
