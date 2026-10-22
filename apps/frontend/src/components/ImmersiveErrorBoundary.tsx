import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
/**
 * Error boundaries for WebGL / RAG — graceful 2D/text fallback (Sprint 1 Module C).
 */
import { Component, type ErrorInfo, type ReactNode } from 'react'

type Area = 'webgl' | 'rag' | 'classroom'

type Props = {
  area: Area
  children: ReactNode
  fallbackTitle?: string
  fallbackHint?: string
}

type State = { hasError: boolean; message: string }

const COPY: Record<Area, { title: string; hint: string }> = {
  webgl: {
    title: '3D unavailable',
    hint: 'WebGL failed or was blocked. Continue in text mode — lessons and mentor notes still work.',
  },
  rag: {
    title: 'Mentor offline',
    hint: 'The assistant could not load. Re-watch the sample video or retry in a moment.',
  },
  classroom: {
    title: 'Classroom interrupted',
    hint: 'Something broke in the immersive room. Use the 2D lesson path below.',
  },
}

export class ImmersiveErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message || 'Unknown error' }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('[ImmersiveErrorBoundary]', this.props.area, error, info.componentStack)
  }

  retry = () => this.setState({ hasError: false, message: '' })

  render() {
    if (!this.state.hasError) return this.props.children
    const copy = COPY[this.props.area]
    const title = this.props.fallbackTitle || copy.title
    const hint = this.props.fallbackHint || copy.hint
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-black/80 px-6 py-10 text-center backdrop-blur-md"
        role="alert"
      >
        <p className="text-[11px] uppercase tracking-widest text-zinc-500">{xaRender(this.props.area)}</p>
        <h3 className="text-lg font-semibold text-white">{xaRender(title)}</h3>
        <p className="max-w-md text-sm text-zinc-400">{xaRender(hint)}</p>
        {xaRender(this.state.message ? (
          <p className="max-w-lg truncate text-[11px] text-zinc-600">{xaRender(this.state.message)}</p>
        ) : null)}
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={this.retry}
            className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100"
          >
            {xaRender("Retry ")}</button>
          <a
            href="#/tca"
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-zinc-200"
          >
            {xaRender("2D classroom ")}</a>
        </div>
      </div>
    )
  }
}

export default ImmersiveErrorBoundary
