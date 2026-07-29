import { useState, useRef, useEffect } from 'react'

/**
 * LIALaunchButton — prominent "Lancer cycle LIA" button that opens a modal
 * showing Vellum workflow execution logs.
 *
 * Currently UI-only (no real API call to Vellum). The `triggerCycle` hook is
 * stubbed so it can be wired to a real Vellum workflow endpoint later:
 *
 *   const res = await fetch('/x/lia/trigger-cycle', { method: 'POST' })
 *   then stream logs into `logs`.
 */

type CycleState = 'idle' | 'running' | 'done'

export default function LIALaunchButton() {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<CycleState>('idle')
  const [logs, setLogs] = useState<string[]>([])
  const logEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll the log area to the bottom on new entries.
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const triggerCycle = async () => {
    setState('running')
    setLogs([])
    const ts = () => new Date().toLocaleTimeString('fr-FR')

    const addLog = (line: string) => {
      setLogs(prev => [...prev, `[${ts()}] ${line}`])
    }

    addLog('LIA cycle triggered')
    addLog('→ Envoi de la requête au workflow Vellum…')

    try {
      // Try the real Vellum proxy endpoint first
      const LIA_TRIGGER_URL = 'https://velay.vellum.ai/019fae5b-f553-744f-a1c7-87202cd7ab19/x/lia/trigger'

      const res = await fetch(LIA_TRIGGER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow_deployment_name: 'lia-v6',
          inputs: [],
        }),
      })

      const data = await res.json()

      if (data.ok) {
        addLog('→ Initialisation du cycle LIA v6…')
        addLog(`✅ Execution ID: ${data.execution?.execution_id || 'N/A'}`)
        if (data.execution?.state) {
          addLog(`→ État: ${data.execution.state}`)
        }
        addLog('→ Cycle déclenché avec succès sur Vellum Workflows')
      } else {
        addLog(`⚠️ Réponse: ${data.error || 'Unknown error'}`)
        addLog('→ Fallback: simulation du cycle…')
        addLog('→ Initialisation du cycle LIA v6…')
        await new Promise(r => setTimeout(r, 800))
        addLog('Waiting for Vellum workflow execution logs…')
      }
    } catch {
      // Fallback to simulation if endpoint is unreachable (e.g. local dev)
      addLog('⚠️ Endpoint Vellum injoignable — mode simulation')
      addLog('→ Initialisation du cycle LIA v6…')
      await new Promise(r => setTimeout(r, 600))
      addLog('Waiting for Vellum workflow execution logs…')
    }

    setState('done')
  }

  const closeModal = () => {
    setOpen(false)
    setState('idle')
    setLogs([])
  }

  return (
    <>
      {/* Launch button */}
      <button
        onClick={() => setOpen(true)}
        className="group relative inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:via-indigo-500 hover:to-purple-500 shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.02] active:scale-95"
      >
        <span className="text-xl transition-transform group-hover:-translate-y-0.5">🚀</span>
        Lancer cycle LIA
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-[#2a2a3a] bg-[#0d0d14] shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between p-4 border-b border-[#2a2a3a]">
              <div className="flex items-center gap-2">
                <span className="text-xl">🚀</span>
                <div>
                  <p className="font-bold">Cycle LIA — Vellum Workflow</p>
                  <p className="text-xs text-gray-500">Déclenchement du cycle agent LIA v6</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-white text-xl leading-none px-2"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            {/* Modal body */}
            <div className="p-4">
              {state === 'idle' ? (
                <div className="text-center py-8">
                  <p className="text-gray-300 mb-1">Prêt à lancer un cycle LIA.</p>
                  <p className="text-xs text-gray-500 mb-6">
                    Le cycle déclenche le workflow Vellum (agents trading / yield / marketplace).
                  </p>
                  <button
                    onClick={triggerCycle}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.02] active:scale-95"
                  >
                    <span className="text-xl">🚀</span> Déclencher maintenant
                  </button>
                </div>
              ) : (
                <>
                  {/* Status line */}
                  <div className="flex items-center gap-2 mb-3 text-sm">
                    {state === 'running' ? (
                      <>
                        <span className="w-3 h-3 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
                        <span className="text-purple-400 font-semibold">Cycle en cours d'exécution…</span>
                      </>
                    ) : (
                      <>
                        <span className="w-3 h-3 rounded-full bg-green-400" />
                        <span className="text-green-400 font-semibold">LIA cycle triggered</span>
                      </>
                    )}
                  </div>

                  {/* Scrollable Vellum logs */}
                  <div className="h-56 overflow-y-auto rounded-xl bg-[#0a0a0f] border border-[#2a2a3a] p-3 mono text-xs text-gray-300">
                    {logs.length === 0 ? (
                      <p className="text-gray-600">Waiting for Vellum workflow execution logs…</p>
                    ) : (
                      logs.map((line, i) => (
                        <p key={i} className="whitespace-pre-wrap break-all">
                          {line}
                        </p>
                      ))
                    )}
                    {state === 'running' && (
                      <p className="text-gray-600 mt-1">Waiting for Vellum workflow execution logs…</p>
                    )}
                    <div ref={logEndRef} />
                  </div>

                  <div className="flex justify-end gap-2 mt-4">
                    <button onClick={closeModal} className="btn-secondary text-sm">Fermer</button>
                    {state === 'done' && (
                      <button
                        onClick={triggerCycle}
                        className="btn-primary text-sm"
                      >
                        🔄 Relancer
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
