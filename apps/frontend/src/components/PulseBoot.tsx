/** Monte usePulse globalement (musée + 8008 même hors Dashboard). */
import { usePulse } from '../hooks/usePulse'

export default function PulseBoot() {
  usePulse()
  return null
}
