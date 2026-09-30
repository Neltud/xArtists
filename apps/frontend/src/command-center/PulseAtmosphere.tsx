/**
 * PulseAtmosphere — ShaderMaterial driven by uSentiment / uVolatility / uPulseSpeed.
 * Semantic Compiler feeds uniforms (Phase 6).
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
uniform float uPulseSpeed;
uniform vec3 uColor;
varying vec2 vUv;

void main() {
  float s = clamp(uSentiment, -1.0, 1.0);
  float v = clamp(uVolatility, 0.0, 1.0);
  float spd = max(0.3, uPulseSpeed);
  vec3 col = uColor;
  float wave = sin(vUv.x * 12.0 + uTime * spd) * cos(vUv.y * 8.0 - uTime * (0.6 * spd));
  float chaos = s < 0.0 ? (0.12 + v * 0.4) * sin(uTime * 8.0 * spd + vUv.x * 40.0) : 0.0;
  float alpha = 0.12 + abs(s) * 0.18 + v * 0.1 + abs(wave) * 0.08 + abs(chaos) * 0.12;
  float edge = smoothstep(0.0, 0.15, vUv.x) * smoothstep(1.0, 0.85, vUv.x) *
               smoothstep(0.0, 0.12, vUv.y) * smoothstep(1.0, 0.88, vUv.y);
  gl_FragColor = vec4(col, alpha * edge);
}
`

export type AtmosphereUniforms = {
  uTime: { value: number }
  uSentiment: { value: number }
  uVolatility: { value: number }
  uPulseSpeed: { value: number }
  uColor: { value: THREE.Vector3 }
}

export function createPulseAtmosphereMesh(): {
  mesh: THREE.Mesh
  uniforms: AtmosphereUniforms
  dispose: () => void
} {
  const uniforms: AtmosphereUniforms = {
    uTime: { value: 0 },
    uSentiment: { value: 0 },
    uVolatility: { value: 0.3 },
    uPulseSpeed: { value: 1 },
    uColor: { value: new THREE.Vector3(0.12, 0.22, 0.55) },
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

/** Apply semantic compiler output to live uniforms (no alloc) */
export function applySemanticToAtmosphere(
  u: AtmosphereUniforms,
  s: { uSentiment: number; uVolatility: number; uPulseSpeed: number; uColor: [number, number, number] },
  time: number,
) {
  u.uTime.value = time
  u.uSentiment.value = s.uSentiment
  u.uVolatility.value = s.uVolatility
  u.uPulseSpeed.value = s.uPulseSpeed
  u.uColor.value.set(s.uColor[0], s.uColor[1], s.uColor[2])
}
