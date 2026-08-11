import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useMultiversX } from '../hooks/useMultiversX'
import { usePortfolioValue } from '../hooks/usePortfolioValue'
import { useLiaOnchainLive } from '../hooks/useLiaOnchainLive'
import { useWallet } from '../context/WalletContext'
import GSNBanner from '../components/GSNBanner'
import LIALaunchButton from '../components/LIALaunchButton'
import AdSlot from '../components/AdSlot'
import GuardianStatusPanel from '../components/GuardianStatusPanel'
import CommanderStrip from '../components/commander/CommanderStrip'
import ScStatusBanner from '../components/ScStatusBanner'
import DataHealthStrip from '../components/DataHealthStrip'
import PageGuide from '../components/PageGuide'
import InfoTip, { LabelWithTip } from '../components/InfoTip'
import PersonaWelcome, {
  PersonaQuickLinks,
  getStoredPersona,
  type Persona,
} from '../components/PersonaWelcome'

// NOTE: Full dashboard body preserved from production tree.
// CommanderStrip replaces GuardianStatusPanel mount point (C2–C4).

export { default } from './Dashboard.legacy-shim'
