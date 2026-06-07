import React, { useState } from 'react';

const AIAgent: React.FC = () => {
  const [cycle, setCycle] = useState(0);
  const [decision, setDecision] = useState('WAIT');
  const [confidence, setConfidence] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const runCycle = () => {
    setIsRunning(true);
    setTimeout(() => {
      const newCycle = cycle + 1;
      const newDecision = Math.random() > 0.6 ? 'STAKE' : Math.random() > 0.3 ? 'HOLD' : 'WAIT';
      const newConfidence = Math.floor(Math.random() * 40) + 60;

      setCycle(newCycle);
      setDecision(newDecision);
      setConfidence(newConfidence);
      setFeedback(`Cycle ${newCycle}: ${newDecision} with ${newConfidence}% confidence. ${newDecision === 'STAKE' ? 'Recommending NFT stake.' : 'Monitoring market.'}`);
      setIsRunning(false);
    }, 800);
  };

  return (
    <div className="feature-container">
      <h2>🤖 LIA v5 AI Agent (Interactive)</h2>
      <div style={{marginBottom: 20}}>
        <button onClick={runCycle} disabled={isRunning}>
          {isRunning ? 'Running Cycle...' : 'Run Next Cycle'}
        </button>
        <button onClick={() => { setCycle(0); setDecision('WAIT'); setConfidence(0); setFeedback(''); }} style={{marginLeft:10}}>
          Reset
        </button>
      </div>

      <div>
        <p><strong>Current Cycle:</strong> {cycle}</p>
        <p><strong>Decision:</strong> <span style={{color: decision === 'STAKE' ? 'green' : 'orange'}}>{decision}</span></p>
        <p><strong>Confidence:</strong> {confidence}%</p>
        <p><strong>Feedback:</strong> {feedback || 'Click Run Cycle to start LIA v5 simulation.'}</p>
      </div>

      <p className="demo-note">Interactive simulation. Connect to real on-chain data or oracles for production use.</p>
    </div>
  );
};

export default AIAgent;
