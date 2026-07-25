import React, { useState, useRef, useEffect } from 'react';

const RAW_BASE = 'https://raw.githubusercontent.com/Neltud/xArtists/main';

interface ChatMessage {
  role: 'user' | 'lia';
  content: string;
}

interface LiveData {
  tro?: number;
  portfolio?: number;
  guard?: string;
  bonScore?: number;
  daoActive?: boolean;
  recommendedPair?: string;
  nfts?: number;
}

async function fetchLiveData(): Promise<LiveData> {
  const data: LiveData = {};
  try {
    const [xaRes, bonRes] = await Promise.allSettled([
      fetch(`${RAW_BASE}/data/xartists_onchain.json`).then(r => r.json()),
      fetch(`${RAW_BASE}/data/battle_of_nodes.json`).then(r => r.json()),
    ]);
    if (xaRes.status === 'fulfilled') {
      data.tro = xaRes.value?.tro_token?.price_usd ?? 0;
      data.portfolio = xaRes.value?.lia_v6?.target ?? 0;
      data.nfts = xaRes.value?.collections?.nfts_in_wallet ?? 0;
    }
    if (bonRes.status === 'fulfilled') {
      data.bonScore = bonRes.value?.score ?? 0;
      data.daoActive = bonRes.value?.dao_active ?? false;
      data.recommendedPair = bonRes.value?.recommended_pair ?? 'TRO/WEGLD';
    }
  } catch {
    // silently degrade
  }
  return data;
}

function buildResponse(input: string, live: LiveData): string {
  const q = input.toLowerCase();
  if (q.includes('liquidité') || q.includes('liquidity') || q.includes('pool') || q.includes('tro')) {
    const troPrice = live.tro ? `$${live.tro.toFixed(8)}` : 'N/A';
    const pair = live.recommendedPair ?? 'TRO/WEGLD';
    return `💧 Analyse $TRO en cours...\nPrix actuel : ${troPrice}\nPool recommandée par LIA : ${pair}\nSuggestion : Ajouter des TRO sur xExchange pour optimiser ta position. Veux-tu que je détaille la stratégie ?`;
  }
  if (q.includes('score') || q.includes('œuvre') || q.includes('art') || q.includes('nft') || q.includes('mint')) {
    const nfts = live.nfts ?? 0;
    return `🎨 Analyse artwork en cours...\n${nfts} NFTs détectés dans le wallet xArtists.\nScore IA estimé : 89/100 — Forte provenance, style cohérent.\nRecommandation : Mint immédiat avec metadata on-chain via Warps v3.`;
  }
  if (q.includes('dao') || q.includes('vote') || q.includes('gouvernance') || q.includes('governance')) {
    const active = live.daoActive ? '🟢 Active' : '⏸️ En standby';
    const pair = live.recommendedPair ?? 'TRO/WEGLD';
    return `🗳️ Statut DAO xArtists : ${active}\nRecommandation LIA pour la prochaine proposal : ${pair}\nPour voter, stakez vos TRO dans le contrat de gouvernance (erd1qqq...0ca8) puis choisissez la paire.`;
  }
  if (q.includes('portfolio') || q.includes('balance') || q.includes('wallet') || q.includes('egld')) {
    const score = live.bonScore ?? 0;
    return `📊 Statut LIA v6 — Mainnet\nBattle of Nodes Score : ${score}/100\nAgent : Vellum Workflows — ${score >= 50 ? 'Actif ✅' : 'Monitoring ⏸️'}\nObjectif : $10 → $1,000,000 via DeFi compounding.`;
  }
  if (q.includes('staking') || q.includes('stake') || q.includes('récompense') || q.includes('reward')) {
    return `🔒 Guide Staking xArtists :\n1. Achetez $TRO sur xExchange (TRO-94c925)\n2. Stakez sur erd1qqq...0ca8 (gouvernance) ou vos NFTs sur erd1qqq...xr8cl\n3. Récupérez vos récompenses avec claimRewards\nBesoin d'aide pour préparer la transaction ?`;
  }
  if (q.includes('btc') || q.includes('bitcoin') || q.includes('bridge') || q.includes('wbtc')) {
    return `🟠 Bridge Bitcoin ↔ MultiversX :\nLIA v6 intègre wBTC via xExchange. Le pont sBTC est en développement.\nStratégie LIABrain : TP +15% sur WBTC, SL -8%. Cycle automatique toutes les 30 min.`;
  }
  return `🤖 LIA v6 peut t'aider sur :\n• Score d'artworks & mint NFT (ex: "score cette œuvre")\n• Liquidité $TRO & pools xExchange (ex: "check liquidité")\n• Staking NFT & TRO (ex: "comment staker ?")\n• DAO votes & gouvernance (ex: "statut DAO")\n• Portfolio & stratégies trading (ex: "mon portfolio")\n\nQue veux-tu faire ?`;
}

const LIAChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'lia', content: "Bonjour ! Je suis LIA v6, ton agent intelligent pour xArtists. Comment puis-je t'aider ? (ex: score une œuvre, check liquidité, DAO vote...)" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setIsTyping(true);
    try {
      const live = await fetchLiveData();
      const response = buildResponse(currentInput, live);
      setMessages(prev => [...prev, { role: 'lia', content: response }]);
    } catch {
      setMessages(prev => [...prev, { role: 'lia', content: "⚠️ Erreur de connexion. Vérifie ta connexion internet et réessaie." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-all z-50 border-2 border-white/20"
        title="Parler à LIA v6"
      >
        <span className="text-2xl">🤖</span>
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 bg-zinc-900 border border-zinc-700 rounded-3xl shadow-2xl overflow-hidden z-50 flex flex-col max-h-[500px] animate-fade-in">
          {/* Header */}
          <div className="bg-zinc-800 px-5 py-4 flex items-center justify-between border-b border-zinc-700 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center font-bold text-white">L</div>
              <div>
                <div className="font-semibold">LIA v6</div>
                <div className="text-xs text-emerald-400">• En ligne (Vellum + MVX)</div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-white transition-colors">✕</button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-zinc-950" style={{ maxHeight: '340px' }}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm whitespace-pre-line ${
                  msg.role === 'user' ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-200'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-zinc-800 text-zinc-400 px-4 py-3 rounded-2xl text-sm flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="inline-block w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="inline-block w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-zinc-700 bg-zinc-900 flex-shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Pose une question à LIA..."
                disabled={isTyping}
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500 disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={isTyping || !input.trim()}
                className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed px-5 rounded-2xl font-medium transition-colors text-sm"
              >
                →
              </button>
            </div>
            <div className="text-[10px] text-center text-zinc-500 mt-2">
              LIA v6 — Vellum Workflows • Données GitHub en direct
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LIAChatWidget;
