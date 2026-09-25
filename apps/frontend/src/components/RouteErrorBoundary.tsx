/**
 * Per-route boundary — recovers failed lazy chunks without blank app.
 */
import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode; label?: string }
type State = { error: Error | null }

export default class RouteErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[xArtists] route error', this.props.label, error, info.componentStack)
  }

  private retry = () => {
    this.setState({ error: null })
    // Hard reload recovers stale hashed chunks after deploy
    const chunk =
      this.state.error &&
      /Failed to fetch dynamically imported module|Loading chunk|Importing a module script failed/i.test(
        this.state.error.message,
      )
    if (chunk) {
      window.location.reload()
      return
    }
  }

  render() {
    if (this.state.error) {
      const msg = this.state.error.message || 'Erreur de page'
      const chunk =
        /Failed to fetch dynamically imported module|Loading chunk|Importing a module script failed/i.test(
          msg,
        )
      return (
        <div className="animate-fade-in max-w-lg mx-auto py-16 px-4 text-center space-y-4">
          <p className="text-4xl">⚠️</p>
          <h1 className="text-xl font-semibold text-white">
            Page indisponible{this.props.label ? ` · ${this.props.label}` : ''}
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed">{msg}</p>
          {chunk && (
            <p className="text-[12px] text-amber-200/80">
              Souvent un cache après deploy — recharge forcée recommandée.
            </p>
          )}
          <div className="flex flex-wrap gap-2 justify-center">
            <button type="button" className="btn-primary text-sm" onClick={this.retry}>
              Réessayer
            </button>
            <a href="#/" className="btn-secondary text-sm">
              Accueil
            </a>
            <a href="#/sitemap" className="btn-ghost text-sm">
              Plan du site
            </a>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
