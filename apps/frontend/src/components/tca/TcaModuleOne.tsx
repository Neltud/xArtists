/**
 * Module 1 Sfumato — cours vidéo ATC (SAMPLE) + pont contexte FULL.
 * Textes FR prioritaires ; EN si lang === 'en'.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { YouTubeEmbed } from './YouTubeEmbed'
import { ImmersiveErrorBoundary } from '../ImmersiveErrorBoundary'
import { saveTcaContext } from '../../lib/tcaVideoContext'
import { askMentor } from '../../lib/tcaRag'
import { useI18n } from '../../i18n/I18nContext'

type ModuleSection = {
  id: string
  title: string
  title_en?: string
  type: string
  body: string
  body_en?: string
}

type ModuleData = {
  id: string
  title: string
  title_en?: string
  subtitle?: string
  subtitle_en?: string
  professor_id?: string
  youtubeId?: string
  lesson_id?: string
  estimated_minutes?: number
  learning_objectives?: string[]
  learning_objectives_en?: string[]
  sections?: ModuleSection[]
  key_terms?: { term: string; def: string; def_en?: string }[]
  unlock_next?: string
  unlock_next_en?: string
  cta_full?: string
  cta_full_en?: string
}

const DATA = `${import.meta.env.BASE_URL || '/'}data/tca/`

const FALLBACK: ModuleData = {
  id: 'module_01_sfumato',
  title: 'Module 1 — La science du sfumato',
  title_en: 'Module 1 — The science of sfumato',
  subtitle: 'La fumée entre lumière et ombre',
  subtitle_en: 'Smoke between light and dark',
  professor_id: 'leonardo',
  youtubeId: 'BqQhD2qH8vE',
  lesson_id: 'sample_01',
  estimated_minutes: 25,
  learning_objectives: [
    'Définir le sfumato sans le confondre avec un simple flou',
    'Identifier au moins trois valeurs sur un bord doux',
    'Pratiquer une silhouette sans contour dur',
  ],
  sections: [
    {
      id: 'watch',
      title: 'Regarder',
      title_en: 'Watch',
      type: 'video',
      body: 'Regardez la leçon. Notez où le bord se dissout dans l’atmosphère.',
      body_en: 'Watch the lesson. Note where the edge dissolves into atmosphere.',
    },
  ],
}

type Props = {
  mode?: 'SAMPLE' | 'FULL'
  onEnterClassroom?: () => void
}

function pick(lang: string, fr: string, en?: string) {
  return lang === 'en' && en ? en : fr
}

export function TcaModuleOne({ mode = 'SAMPLE', onEnterClassroom }: Props) {
  const { t, lang } = useI18n()
  const [mod, setMod] = useState<ModuleData>(FALLBACK)
  const [section, setSection] = useState(0)
  const [q, setQ] = useState('')
  const [answer, setAnswer] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const r = await fetch(`${DATA}module_01_sfumato.json`, { cache: 'no-store' })
        if (r.ok) {
          const j = (await r.json()) as ModuleData
          if (!cancelled) setMod({ ...FALLBACK, ...j })
        }
      } catch {
        /* fallback */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (mod.youtubeId && mod.lesson_id) {
      saveTcaContext({
        video_id: mod.youtubeId,
        lesson_id: mod.lesson_id,
        topic: pick(lang, mod.title, mod.title_en),
      })
    }
  }, [mod.youtubeId, mod.lesson_id, mod.title, mod.title_en, lang])

  const title = pick(lang, mod.title, mod.title_en)
  const subtitle = pick(lang, mod.subtitle || '', mod.subtitle_en)
  const objectives =
    lang === 'en' && mod.learning_objectives_en?.length
      ? mod.learning_objectives_en
      : mod.learning_objectives || []
  const sections = mod.sections || []
  const current = sections[section] || sections[0]
  const currentTitle = current
    ? pick(lang, current.title, current.title_en)
    : ''
  const currentBody = current ? pick(lang, current.body, current.body_en) : ''
  const unlock = pick(lang, mod.unlock_next || t('tca.unlock'), mod.unlock_next_en)

  const ask = () => {
    const query = q.trim()
    if (!query || busy) return
    setBusy(true)
    window.setTimeout(() => {
      const res = askMentor(query, mod.professor_id || 'leonardo', undefined, {
        video_id: mod.youtubeId,
        lesson_id: mod.lesson_id,
      })
      setAnswer(res.answer)
      setBusy(false)
    }, 800)
  }

  const sectionLabel = useMemo(
    () =>
      ({
        watch: t('tca.section.watch'),
        theory: t('tca.section.theory'),
        practice: t('tca.section.practice'),
        reflect: t('tca.section.reflect'),
      }) as Record<string, string>,
    [t],
  )

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-8 text-white">
      <div className="inline-flex w-fit rounded-full border border-amber-500/30 bg-amber-950/40 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-200/90">
        {t('tca.module1.badge')}
      </div>
      <header className="space-y-1">
        <h1 className="text-xl font-semibold text-amber-50 md:text-2xl">{title}</h1>
        {subtitle ? <p className="text-sm text-zinc-400">{subtitle}</p> : null}
        <p className="text-[11px] text-zinc-500">
          Leonardo · ~{mod.estimated_minutes || 25} min
        </p>
      </header>

      {objectives.length > 0 ? (
        <ul className="list-inside list-disc space-y-1 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-[13px] text-zinc-300">
          {objectives.map(o => (
            <li key={o}>{o}</li>
          ))}
        </ul>
      ) : null}

      <ImmersiveErrorBoundary area="rag">
        <div className="space-y-3">
          <YouTubeEmbed videoId={mod.youtubeId || ''} title={title} />
          <p className="text-[12px] text-zinc-500">{t('tca.contextSaved')}</p>
        </div>
      </ImmersiveErrorBoundary>

      {sections.length > 0 ? (
        <nav className="flex flex-wrap gap-2">
          {sections.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSection(i)}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-medium ${
                i === section
                  ? 'border-amber-400/50 bg-amber-950/50 text-amber-100'
                  : 'border-white/10 bg-white/5 text-zinc-400'
              }`}
            >
              {i + 1}. {sectionLabel[s.id] || pick(lang, s.title, s.title_en)}
            </button>
          ))}
        </nav>
      ) : null}

      {current ? (
        <section className="rounded-2xl border border-white/10 bg-black/50 p-5 space-y-2">
          <h2 className="text-sm font-semibold text-amber-100">{currentTitle}</h2>
          <p className="text-[13px] leading-relaxed text-zinc-300">{currentBody}</p>
        </section>
      ) : null}

      {mod.key_terms && mod.key_terms.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-3">
          {mod.key_terms.map(k => (
            <div key={k.term} className="rounded-xl border border-white/10 bg-zinc-950/80 px-3 py-2">
              <p className="text-[11px] font-bold uppercase tracking-wide text-cyan-200/90">{k.term}</p>
              <p className="text-[12px] text-zinc-400">{pick(lang, k.def, k.def_en)}</p>
            </div>
          ))}
        </div>
      ) : null}

      <ImmersiveErrorBoundary area="rag">
        <div className="rounded-2xl border border-white/10 bg-black/45 p-4 space-y-3">
          <h3 className="text-[12px] font-semibold uppercase tracking-wide text-zinc-400">
            {t('tca.ask')}
          </h3>
          <div className="flex gap-2">
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && ask()}
              placeholder={lang === 'en' ? 'e.g. What is sfumato?' : 'ex. : Qu’est-ce que le sfumato\u00a0?'}
              className="flex-1 rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-[13px] text-zinc-100 outline-none placeholder:text-zinc-600"
            />
            <button
              type="button"
              disabled={busy || !q.trim()}
              onClick={ask}
              className="rounded-xl border border-amber-500/40 bg-amber-950/40 px-4 py-2 text-[12px] font-semibold text-amber-100 disabled:opacity-40 min-h-[44px]"
            >
              {busy ? '…' : lang === 'en' ? 'Ask' : 'Demander'}
            </button>
          </div>
          {answer ? <p className="text-[13px] leading-relaxed text-zinc-300">{answer}</p> : null}
        </div>
      </ImmersiveErrorBoundary>

      <div className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-3">
        <p className="text-[13px] text-zinc-400">{unlock}</p>
        <div className="flex flex-wrap gap-2">
          {mode === 'FULL' && onEnterClassroom ? (
            <button
              type="button"
              onClick={onEnterClassroom}
              className="rounded-full border border-cyan-500/40 bg-cyan-950/40 px-5 py-2.5 text-[13px] font-semibold text-cyan-100 min-h-[44px]"
            >
              {pick(lang, mod.cta_full || t('tca.cta.pulse'), mod.cta_full_en)}
            </button>
          ) : (
            <Link
              to="/agents"
              className="inline-flex rounded-full border border-amber-500/40 bg-amber-950/50 px-5 py-2.5 text-[13px] font-semibold text-amber-100 min-h-[44px] items-center"
            >
              {t('tca.cta.pulse')}
            </Link>
          )}
          <Link
            to="/"
            className="inline-flex rounded-full border border-white/15 px-5 py-2.5 text-[13px] text-zinc-300 min-h-[44px] items-center"
          >
            {lang === 'en' ? 'Home' : 'Accueil'}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default TcaModuleOne
