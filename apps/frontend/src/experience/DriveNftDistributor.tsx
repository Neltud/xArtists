import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'
import type { Lang } from '../i18n/types'

/**
 * Publicly published previews selected from the owner's historical Drive collection.
 * Drive files are NOT proof of minted NFTs, licensed sales, or distributor inventory.
 * Private Drive links must never be exposed to visitors.
 */
export const PUBLIC_DRIVE_PREVIEWS = [
  { id: 'xArtists0279', file: 'xArtists0279.png' },
  { id: 'xArtists0269', file: 'xArtists0269.png' },
  { id: 'xArtists0291', file: 'xArtists0291.png' },
  { id: 'xArtists0286', file: 'xArtists0286.png' },
] as const

type Preview = (typeof PUBLIC_DRIVE_PREVIEWS)[number]
type Labels = {
  kicker: string
  title: string
  lead: string
  mystery: string
  reveal: string
  again: string
  revealed: string
  studio: string
  notice: string
  error: string
}

const LABELS: Record<Lang, Labels> = {
  fr: {
    kicker: 'Sous le musée · xArtists',
    title: 'Distributeur NFT aléatoire',
    lead: 'Découvrez une œuvre au hasard parmi les visuels xArtists déjà publiés depuis Drive.',
    mystery: 'Œuvre mystère',
    reveal: 'Découvrir une œuvre',
    again: 'Nouveau tirage',
    revealed: 'Œuvre révélée',
    studio: 'Préparer un NFT dans Studio',
    notice: 'Aperçu gratuit, sans wallet. Ce tirage ne crée, ne réserve, ne vend et ne transfère aucun NFT. Mint, stock et droits restent à vérifier.',
    error: 'Le tirage sécurisé est indisponible sur cet appareil.',
  },
  en: {
    kicker: 'Below the museum · xArtists',
    title: 'Random NFT distributor',
    lead: 'Reveal a random artwork from xArtists Drive visuals already published on this site.',
    mystery: 'Mystery artwork',
    reveal: 'Reveal an artwork',
    again: 'Draw again',
    revealed: 'Artwork revealed',
    studio: 'Prepare an NFT in Studio',
    notice: 'Free preview, no wallet. This draw does not mint, reserve, sell or transfer an NFT. Rights, minted stock and delivery still need verification.',
    error: 'Secure random selection is unavailable on this device.',
  },
  es: {
    kicker: 'Debajo del museo · xArtists',
    title: 'Distribuidor NFT aleatorio',
    lead: 'Descubre al azar una obra de Drive ya publicada en xArtists.',
    mystery: 'Obra misteriosa',
    reveal: 'Descubrir una obra',
    again: 'Nuevo sorteo',
    revealed: 'Obra revelada',
    studio: 'Preparar NFT en Studio',
    notice: 'Vista previa gratuita, sin wallet. No se crea, reserva, vende ni transfiere ningún NFT. Derechos e inventario pendientes de verificar.',
    error: 'Selección aleatoria segura no disponible.',
  },
  de: {
    kicker: 'Unter dem Museum · xArtists',
    title: 'Zufälliger NFT-Verteiler',
    lead: 'Entdecke zufällig ein bereits veröffentlichtes xArtists-Werk aus Drive.',
    mystery: 'Überraschungskunstwerk',
    reveal: 'Kunstwerk aufdecken',
    again: 'Erneut ziehen',
    revealed: 'Kunstwerk aufgedeckt',
    studio: 'NFT im Studio vorbereiten',
    notice: 'Kostenlose Vorschau ohne Wallet. Kein NFT wird geprägt, reserviert, verkauft oder übertragen. Rechte und Bestand sind ungeprüft.',
    error: 'Sichere Zufallsauswahl ist nicht verfügbar.',
  },
  ru: {
    kicker: 'Под музеем · xArtists',
    title: 'Случайный NFT-дистрибьютор',
    lead: 'Откройте случайную работу xArtists из уже опубликованных материалов Drive.',
    mystery: 'Загадочная работа',
    reveal: 'Открыть работу',
    again: 'Повторить выбор',
    revealed: 'Работа открыта',
    studio: 'Подготовить NFT в Studio',
    notice: 'Бесплатный просмотр без кошелька. NFT не создаётся, не бронируется, не продаётся и не переводится. Права и наличие не проверены.',
    error: 'Безопасный случайный выбор недоступен.',
  },
  uk: {
    kicker: 'Під музеєм · xArtists',
    title: 'Випадковий NFT-дистрибʼютор',
    lead: 'Відкрийте випадковий твір xArtists із вже опублікованих матеріалів Drive.',
    mystery: 'Таємничий твір',
    reveal: 'Відкрити твір',
    again: 'Спробувати ще',
    revealed: 'Твір відкрито',
    studio: 'Підготувати NFT у Studio',
    notice: 'Безкоштовний перегляд без гаманця. NFT не створюється, не резервується, не продається і не передається. Права й наявність не перевірені.',
    error: 'Безпечний випадковий вибір недоступний.',
  },
  zh: {
    kicker: '博物馆下方 · xArtists',
    title: '随机 NFT 分发器',
    lead: '随机探索已在本站公开的 xArtists Drive 艺术作品。',
    mystery: '神秘作品',
    reveal: '揭晓作品',
    again: '再抽一次',
    revealed: '已揭晓作品',
    studio: '在 Studio 准备 NFT',
    notice: '免费预览，无需钱包。抽取不会铸造、预留、出售或转移 NFT。版权及库存仍待核验。',
    error: '此设备无法安全随机抽取。',
  },
  ar: {
    kicker: 'أسفل المتحف · xArtists',
    title: 'موزّع NFT عشوائي',
    lead: 'اكتشف عملاً عشوائياً من صور xArtists المنشورة مسبقاً من Drive.',
    mystery: 'عمل فني غامض',
    reveal: 'اكشف عن عمل فني',
    again: 'سحب جديد',
    revealed: 'العمل المكتشف',
    studio: 'تحضير NFT في Studio',
    notice: 'معاينة مجانية بلا محفظة. لا ينشئ السحب NFT ولا يحجزه أو يبيعه أو ينقله. الحقوق والمخزون لم يُتحقق منهما بعد.',
    error: 'الاختيار العشوائي الآمن غير متاح على هذا الجهاز.',
  },
}

function unbiasedIndex(size: number): number {
  if (!Number.isSafeInteger(size) || size < 1) throw new Error('invalid_preview_pool')
  if (!globalThis.crypto?.getRandomValues) throw new Error('secure_random_unavailable')
  const range = 0x100000000
  const limit = range - (range % size)
  const sample = new Uint32Array(1)
  let value: number
  do {
    globalThis.crypto.getRandomValues(sample)
    value = sample[0]
  } while (value >= limit)
  return value % size
}

const srcFor = (file: string) => `${import.meta.env.BASE_URL}art/drive/${file}`

export default function DriveNftDistributor() {
  const { lang } = useI18n()
  const words = LABELS[lang] || LABELS.en
  const [selected, setSelected] = useState<Preview | null>(null)
  const [error, setError] = useState(false)

  const draw = () => {
    try {
      // Do not repeat the immediately preceding preview when several exist.
      // Not a financial randomization or a verified on-chain fairness proof.
      const pool = PUBLIC_DRIVE_PREVIEWS.filter(work =>
        PUBLIC_DRIVE_PREVIEWS.length < 2 || work.id !== selected?.id,
      )
      setSelected(pool[unbiasedIndex(pool.length)])
      setError(false)
    } catch {
      setError(true)
    }
  }

  return (
    <section className="xa-drive-distributor" aria-labelledby="xa-drive-distributor-title" data-mode="preview-only">
      <div className="xa-drive-distributor__heading">
        <div>
          <p className="xa-drive-distributor__eyebrow">{words.kicker}</p>
          <h2 id="xa-drive-distributor-title">{words.title}</h2>
          <p>{words.lead}</p>
        </div>
        <span className="xa-drive-distributor__status">PREVIEW · 0 EGLD</span>
      </div>
      <div className="xa-drive-distributor__body">
        <div className="xa-drive-distributor__art">
          {selected
            ? <img src={srcFor(selected.file)} alt={selected.id} loading="lazy" decoding="async" />
            : <div className="xa-drive-distributor__mystery" aria-hidden="true"><span>✳</span><span>?</span></div>}
        </div>
        <div className="xa-drive-distributor__controls">
          <p className="xa-drive-distributor__serial" role="status" aria-live="polite">
            {selected ? `${words.revealed} · ${selected.id}` : words.mystery}
          </p>
          <button className="xa-drive-distributor__draw" type="button" onClick={draw}>
            <span aria-hidden="true">✦</span> {selected ? words.again : words.reveal}
          </button>
          {error && <p role="alert" className="xa-drive-distributor__error">{words.error}</p>}
          <Link className="xa-drive-distributor__studio" to="/studio">{words.studio} <span aria-hidden="true">↗</span></Link>
          <p className="xa-drive-distributor__notice">{words.notice}</p>
        </div>
      </div>
    </section>
  )
}
