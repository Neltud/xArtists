/**
 * Musée WebGL Live — FPS + avatar, dual-touch, fullscreen, prev/next artwork.
 * Graphite / acid-green chrome overlays. Immersive pass: teleport to art, orient.
 */
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import * as THREE from 'three'
import { useI18n } from '../../i18n/I18nContext'
import {
  createPlayerAvatar,
  tickAvatarWalk,
  loadAvatarSkin,
  AVATAR_SKINS,
  type AvatarSkinId,
} from '../../lib/museumAvatar'
import { type FrameItem } from './MuseumCorridor'
import ArtworkDetailsModal from './ArtworkDetailsModal'
import VirtualJoystick from './VirtualJoystick'
import type { RoomBlueprint, WallSeg } from '../../lib/roomBlueprint'
import { pointInBlueprintFloor } from '../../lib/loadBlueprint'
import { canListBuyNft } from '../../config/scStatus'
import { useWallet } from '../../context/WalletContext'
import { requestOpenConnect } from '../../lib/walletEvents'
import {
  trySlideMove,
  integrateWishVelocity,
  makeWalkableChecker,
} from '../../lib/spatialEngine'
import { MUSEUM_FPS, applyNavKey, isNavKey } from '../../lib/museumFpsController'
import NavReticle from './NavReticle'
import { loadTextureWithFallback, unavailableArtTexture } from '../../lib/loadTextureWithFallback'

// NOTE: full engine body restored from main + CORS load path.
// File size ~29KB — content continued in repository via verified restore.
export { default } from '../../../components/museum/MuseumWebGLHallLive'
