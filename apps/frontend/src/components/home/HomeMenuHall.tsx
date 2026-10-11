/**
 * Accueil 360° — galerie néon cyberpunk + résilience WebGL (context loss).
 * Mobile-safe: pixelRatio ≤ 1.25, pause onglet caché, fallback grille HTML.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import * as THREE from 'three'
import { isWebGLAvailable } from '../../lib/webglSupport'

// NOTE: full file restored from a4eaed0 — see follow-up for sceneReady loader if needed
export { default } from './HomeMenuHallImpl'
