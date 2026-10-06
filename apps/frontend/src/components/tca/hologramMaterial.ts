/** Holographic look — scanlines, pulse, fresnel-ish edge. */
import * as THREE from 'three'

const vertex = /* glsl */ `
varying vec2 vUv;
varying float vFresnel;
void main() {
  vUv = uv;
  vec3 wNorm = normalize(mat3(modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz) * normal);
  vec3 wPos = (modelMatrix * vec4(position, 1.0)).xyz;
  vec3 viewDir = normalize(cameraPosition - wPos);
  vFresnel = pow(1.0 - max(dot(viewDir, wNorm), 0.0), 2.2);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragment = /* glsl */ `
uniform vec3 uGlow;
uniform float uTime;
uniform float uFlicker;
uniform float uScan;
uniform float uPulse;
uniform float uBaseOpacity;
varying vec2 vUv;
varying float vFresnel;
void main() {
  float scan = sin(vUv.y * 180.0 + uTime * 3.0) * 0.5 + 0.5;
  float flicker = 1.0 - uFlicker * (0.5 + 0.5 * sin(uTime * 17.0));
  float pulse = uBaseOpacity + uPulse * sin(uTime * 2.2);
  float alpha = pulse * flicker * (0.75 + 0.25 * scan);
  alpha = mix(alpha, min(1.0, alpha + 0.35), vFresnel);
  vec3 col = mix(uGlow * 0.55, uGlow, vFresnel + scan * uScan);
  gl_FragColor = vec4(col, clamp(alpha, 0.15, 0.95));
}
`

export type HoloParams = {
  glow_color?: string
  flicker_rate?: number
  scanline_opacity?: number
  opacity_pulse?: number
  base_opacity?: number
}

export function createHologramMaterial(p: HoloParams = {}) {
  const color = new THREE.Color(p.glow_color || '#e0c097')
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uGlow: { value: color },
      uTime: { value: 0 },
      uFlicker: { value: p.flicker_rate ?? 0.02 },
      uScan: { value: p.scanline_opacity ?? 0.12 },
      uPulse: { value: p.opacity_pulse ?? 0.05 },
      uBaseOpacity: { value: p.base_opacity ?? 0.82 },
    },
    vertexShader: vertex,
    fragmentShader: fragment,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
  return mat
}

export function applyProsody(
  utter: SpeechSynthesisUtterance,
  speech?: { pitch?: number; rate?: number },
) {
  if (!speech) return
  if (speech.pitch != null) utter.pitch = Math.min(2, Math.max(0.5, speech.pitch))
  if (speech.rate != null) utter.rate = Math.min(1.5, Math.max(0.6, speech.rate))
}
