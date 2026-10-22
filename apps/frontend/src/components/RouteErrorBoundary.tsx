import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
/**
 * Per-route boundary — recovers failed lazy chunks without blank app.
 * React #31 = "Objects are not valid as a React child" (objet affiché comme texte).
 */
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { asText } from '../lib/safeRender'

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
    const msg = this.state.error?.message || ''
    this.setState({ error: null })
    const chunk =
      /Failed to fetch dynamically imported module|Loading chunk|Importing a module script failed/i.test(
        msg,
      )
    if (chunk || /Minified React error #31/i.test(msg)) {
      // Cache après deploy Pages ou rendu objet — reload forcée
      window.location.reload()
      return
    }
  }

  render() {
    if (this.state.error) {
      const msg = asText(this.state.error.message, 'Erreur de page')
      const chunk =
        /Failed to fetch dynamically imported module|Loading chunk|Importing a module script failed/i.test(
          msg,
        )
      const react31 = /Minified React error #31/i.test(msg)
      return (
        <div className="animate-fade-in max-w-lg mx-auto py-16 px-4 text-center space-y-4">
          <p className="text-4xl" aria-hidden>
            ⚠️
          </p>
          <h1 className="text-xl font-semibold text-white">
            {xaRender("Page indisponible")}{xaRender(this.props.label ? ` · ${asText(this.props.label)}` : '')}
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed break-words">{xaRender(msg)}</p>
          {xaRender(react31 && (
            <p className="text-[12px] text-amber-200/90 text-left max-w-md mx-auto">
              <strong>{xaRender("React #31")}</strong> {xaRender(" : un ")}<em>{xaRender("objet")}</em> {xaRender(" a été affiché comme texte (souvent données API ou tooltip). Ce n’est pas une route manquante. Recharge forcée après deploy. ")}</p>
          ))}
          {xaRender(chunk && (
            <p className="text-[12px] text-amber-200/80">
              {xaRender("Souvent un cache après deploy GitHub Pages — recharge forcée recommandée. ")}</p>
          ))}
          <div className="flex flex-wrap gap-2 justify-center">
            <button type="button" className="btn-primary text-sm" onClick={this.retry}>
              {xaRender("Réessayer ")}</button>
            <a href="#/" className="btn-secondary text-sm">
              {xaRender("Accueil ")}</a>
            <a href="#/sitemap" className="btn-ghost text-sm">
              {xaRender("Plan du site ")}</a>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
