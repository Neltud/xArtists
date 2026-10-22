import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
/** Bouton export PDF A4 pour certificat phygital. */
import { openPrintableCertificate } from '../lib/printCertificateA4'

type Props = {
  kind: string
  id: string
  title: string
  sha: string
  mp?: number
  sigma?: number
  preview?: string | null
}

export function PhysicalNftCertifierPrintButton(props: Props) {
  return (
    <button
      type="button"
      className="btn-primary text-xs min-h-[44px]"
      onClick={() => openPrintableCertificate(props)}
    >
      {xaRender("Imprimer / PDF A4 ")}</button>
  )
}
