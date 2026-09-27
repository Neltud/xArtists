/**
 * Musée WebGL — 3e personne · textures (pas de double-proxy) · Acheter paper.
 * Sculptures : photo → volume 3D (placeSculpturesInScene).
 */
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { createSurrealParticles, tickSurrealParticles, addSurrealLights } from '../../lib/museumSurrealFX'
import { createPlayerAvatar, tickAvatarWalk } from '../../lib/museumAvatar'
import { ArtworkDossier, type FrameItem } from './MuseumCorridor'
import { placeSculpturesInScene } from '../../lib/placeSculptures'
import type { RoomBlueprint, WallSeg } from '../../lib/roomBlueprint'
import { blueprintAreaM2 } from '../../lib/roomBlueprint'
import { pointInBlueprintFloor } from '../../lib/loadBlueprint'
import { canListBuyNft } from '../../config/scStatus'
import { useWallet } from '../../context/WalletContext'
import { requestOpenConnect } from '../../lib/walletEvents'
import { presenceSnapshot, visitorWaypoints } from '../../lib/museumVisitors'
import { pulseFromIndex, fetchPulseState, mapPulseToMuseum, type MuseumPulseParams } from '../../lib/pulseMuseum'
import { PULSE_DEMO_CYCLE } from '../../lib/pulseDemo'
import { applyMuseumRealism, addMuseumLights } from '../../lib/museumRealism'

const EYE = 1.65
const WALK = 3.6
const SPRINT = 6.4
const MAX_ART = 24
const PITCH_MAX = 1.15
const ACCEL = 22
const FRICTION = 11
const CAM_DIST = 4.2
const CAM_HEIGHT = 2.35

// NOTE: full file continued in repo via push — lighting block uses museumRealism
// This update is applied only if the tool accepts partial; prefer full content.
export {}
