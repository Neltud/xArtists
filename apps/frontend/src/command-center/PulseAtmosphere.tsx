/**
 * PulseAtmosphere — ShaderMaterial plane driven by uSentiment / uVolatility.
 * Mounted as overlay mesh in CommandWall scene (modular).
 */
import * as THREE from 'three'

const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const FRAG = /* glsl */ `
uniform float uTime;
uniform float uSentiment;
uniform float uVolatility;
varying vec2 vUv;

void main() {
  float s = clamp(uSentiment, -1.0, 1.0);
  float v = clamp(uVolatility, 0.0, 1.0);
  // bullish cyan-gold vs bearish red-amber
  vec3 bull = vec3(0.05, 0.75, 0.85);
  vec3 gold = vec3(0.95, 0.75, 0.25);
  vec3 bear = vec3(0.85, 0.15, 0.25);
  vec3 amber = vec3(0.9, 0.45, 0.1);
  vec3 col = s >= 0.0
    ? mix(bull, gold, s)
    : mix(bear, amber, -s);

  float wave = sin(vUv.x * 12.0 + uTime * (1.2 + v * 3.0)) *
               cos(vUv.y * 8.0 - uTime * (0.8 + abs(s)));
  float chaos = s < 0.0 ? (0.15 + v * 0.35) * sin(uTime * 9.0 + vUv.x * 40.0) : 0.0;
  float alpha = 0.12 + abs(s) * 0.18 + v * 0.1 + abs(wave) * 0.08 + abs(chaos) * 0.12;
  // edge soft
  float edge = smoothstep(0.0, 0.15, vUv.x) * smoothstep(1.0, 0.85, vUv.x) *
               smoothstep(0.0, 0.12, vUv.y) * smoothstep(1.0, 0.88, vUv.y);
  gl_FragColor = vec4(col, alpha * edge);
}
`

export function createPulseAtmosphereMesh(): {
  mesh: THREE.Mesh
  uniforms: {
    uTime: { value: number }
    uSentiment: { value: number }
    uVolatility: { value: number }
  }
  dispose: () => void
} {
  const uniforms = {
    uTime: { value: 0 },
    uSentiment: { value: 0 },
    uVolatility: { value: 0.3 },
  }
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const geo = new THREE.PlaneGeometry(2.35, 1.35)
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.z = 0.06
  mesh.userData.pulseShader = true
  return {
    mesh,
    uniforms,
    dispose: () => {
      geo.dispose()
      mat.dispose()
    },
  }
}
