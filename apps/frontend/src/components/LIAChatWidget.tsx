import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LIAChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'lia', content: "Bonjour ! Je suis LIA v5, ton agent intelligent pour xArtists. Comment puis-je t'aider aujourd'hui ? (ex: score une œuvre, check liquidité, préparer un swap...)" }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');

    // Simulation LIA (à remplacer par appel réel à Eliza / mx-agent-kit)
    setTimeout(() => {
      let response = "Analyse en cours... ";
      
      if (currentInput.toLowerCase().includes("liquidité") || currentInput.toLowerCase().includes("tro")) {
        response += "TVL du pool xArtists : ~245k EGLD. Suggestion : Ajouter 2000 TRO pour +11.4% APY estimé. Veux-tu que je prépare la transaction ?";
      } else if (currentInput.toLowerCase().includes("score") || currentInput.toLowerCase().includes("œuvre") || currentInput.toLowerCase().includes("art")) {
        response += "Œuvre analysée : Score IA 89/100. Forte provenance, style cohérent. Recommandation : Mint immédiat avec metadata on-chain.";
      } else {
        response += "Je peux t'aider sur le scoring d'artworks, la gestion de liquidité TRO, staking NFT, DAO votes, ou RWA claims. Que veux-tu faire ?";
      }

      setMessages(prev => [...prev, { role: 'lia', content: response }]);
    }, 800);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-all z-50 border-2 border-white/20"
        title="Parler à LIA v5"
      >
        <span className="text-2xl">🤖</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-96 bg-zinc-900 border border-zinc-700 rounded-3xl shadow-2xl overflow-hidden z-50 flex flex-col max-h-[500px]"
          >
            {/* Header */}
            <div className="bg-zinc-800 px-5 py-4 flex items-center justify-between border-b border-zinc-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center">L</div>
                <div>
                  <div className="font-semibold">LIA v5</div>
                  <div className="text-xs text-emerald-400">• En ligne (Eliza + MVX)</div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-white">✕</button>
            </div>

            {/* Messages */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-zinc-950" style={{ maxHeight: '380px' }}>
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${msg.role === 'user' 
                    ? 'bg-violet-600 text-white' 
                    : 'bg-zinc-800 text-zinc-200'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-zinc-700 bg-zinc-900">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Pose une question à LIA..."
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500"
                />
                <button
                  onClick={sendMessage}
                  className="bg-violet-600 hover:bg-violet-700 px-6 rounded-2xl font-medium transition-colors"
                >
                  Envoyer
                </button>
              </div>
              <div className="text-[10px] text-center text-zinc-500 mt-2">
                Connecté à mx-agent-kit • Risques on-chain
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LIAChatWidget;
