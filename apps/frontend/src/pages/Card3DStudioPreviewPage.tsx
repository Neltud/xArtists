import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ArtCard3DPreview from '../components/ArtCard3DPreview'

/** Private local-file preview: no upload, no Drive sharing, no mint and no sale. */
export default function Card3DStudioPreviewPage() {
  const [edition, setEdition] = useState(1)
  const [localFile, setLocalFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!localFile) { setPreviewUrl(null); return }
    const url = URL.createObjectURL(localFile)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [localFile])
  const number = String(edition).padStart(4, '0')
  function selectFile(file: File | undefined) {
    if (!file) { setLocalFile(null); return }
    if (file.type !== 'image/png' || file.size > 20 * 1024 * 1024 ||
        file.name !== `xArtists${number}.png`) {
      setLocalFile(null)
      return
    }
    setLocalFile(file)
  }
  function changeEdition(next: number) {
    setEdition(Math.max(1, Math.min(291, next)))
    setLocalFile(null)
  }
  return (
    <main className="mx-auto max-w-5xl space-y-7 px-4 py-10 text-zinc-100">
      <Link to="/offres" className="text-sm text-amber-200 underline">Retour aux offres</Link>
      <header>
        <p className="text-xs uppercase tracking-widest text-amber-200">xArtists · 3D Card Studio</p>
        <h1 className="mt-3 font-serif text-4xl">Collection 291 · prévisualisation privée</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-300">
          Prototype hors chaîne. Choisissez une édition et chargez localement son PNG depuis votre appareil.
          Le fichier reste dans ce navigateur : aucun envoi au serveur, aucun mint, aucune mise en vente.
        </p>
      </header>
      <div className="flex flex-wrap items-center gap-4">
        <button type="button" onClick={() => changeEdition(edition - 1)} disabled={edition === 1}
          className="min-h-11 rounded-xl border border-white/30 px-4 disabled:opacity-40">Précédent</button>
        <label className="text-sm">Édition
          <select value={edition} onChange={e => changeEdition(Number(e.target.value))}
            className="ml-2 min-h-11 rounded-lg border border-white/30 bg-zinc-900 px-3">
            {Array.from({ length: 291 }, (_, i) => <option key={i} value={i + 1}>
              {String(i + 1).padStart(4, '0')} / 0291
            </option>)}
          </select>
        </label>
        <button type="button" onClick={() => changeEdition(edition + 1)} disabled={edition === 291}
          className="min-h-11 rounded-xl border border-white/30 px-4 disabled:opacity-40">Suivant</button>
      </div>
      <label className="block max-w-xl space-y-2 text-sm">
        <span>Importer localement <strong>xArtists{number}.png</strong> (PNG, 20 Mo max)</span>
        <input key={edition} type="file" accept="image/png" onChange={e => selectFile(e.target.files?.[0])}
          className="block w-full rounded-lg border border-white/20 p-3" />
      </label>
      {previewUrl ? <ArtCard3DPreview imageUrl={previewUrl} title={`xArtists${number}`} edition={edition} /> :
        <div role="status" className="flex min-h-64 items-center justify-center rounded-3xl border border-dashed border-white/25 p-8 text-center text-zinc-400">
          Aucune image chargée. Sélectionnez le fichier correspondant à l'édition {number}.
        </div>}
      <p className="text-xs text-amber-200">Aperçu visuel CSS 3D, non généré par IA. Ni NFT ni preuve de propriété. Vérification des droits et du stockage nécessaire avant publication.</p>
    </main>
  )
}
