/** Apply MouthShape to procedural jaw / lips Object3Ds. */
import type { Object3D } from 'three'
import type { MouthShape } from './lipSync'

export function applyMouthShape(
  jaw: Object3D | null,
  lowerLip: Object3D | null,
  upperLip: Object3D | null,
  shape: MouthShape,
  baseJawY = 1.82,
) {
  if (jaw) {
    jaw.position.y = baseJawY - shape.open * 0.055
    jaw.scale.set(1 + shape.width * 0.15, 1, 1 + shape.round * 0.1)
  }
  if (lowerLip) {
    lowerLip.position.y = baseJawY - 0.02 - shape.open * 0.04
    lowerLip.scale.setX(0.9 + shape.width * 0.35)
    lowerLip.scale.setZ(0.9 + shape.round * 0.4)
  }
  if (upperLip) {
    upperLip.position.y = baseJawY + 0.04 - shape.open * 0.01
    upperLip.scale.setX(0.9 + shape.width * 0.3)
  }
}
