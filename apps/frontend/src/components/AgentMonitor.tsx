import React, { useState, useEffect } from 'react';
import { DynamicShadowCard } from './DynamicShadowCard';
import { Skeleton } from './Skeleton';

interface Agent {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'processing';
  icon: string;
  lastUpdate: string;
  performance: number;
}

export const AgentMonitor: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([
    {
      id: 'trading',
      name: 'Trading Agent',
      status: 'active',
      icon: '📊',
      lastUpdate: 'just now',
      performance: 92,
    },
    {
      id: 'marketplace',
      name: 'Marketplace Agent',
      status: 'active',
      icon: '🛍️',
      lastUpdate: '2 mins ago',
      performance: 87,
    },
    {
      id: 'yield',
      name: 'Yield Agent',
      status: 'active',
      icon: '💰',
      lastUpdate: '5 mins ago',
      performance: 78,
    },
    {
      id: 'security',
      name: 'Security Agent',
      status: 'active',
      icon: '🛡️',
      lastUpdate: 'just now',
      performance: 95,
    },
    {
      id: 'rwa',
      name: 'RWA Agent',
      status: 'inactive',
      icon: '🏠',
      lastUpdate: '1 hour ago',
      performance: 0,
    },
  ]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching agent data
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timeout);
  }, []);

  const statusColors = {
    active: 'bg-emerald-900/50 text-emerald-400',
    inactive: 'bg-red-900/50 text-red-400',
    processing: 'bg-yellow-900/50 text-yellow-400',
  };

  const statusIcons = {
    active: '●',
    inactive: '○',
    processing: '◐',
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">LIA Agents Monitoring</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {agents.map((agent) => (
          <DynamicShadowCard key={agent.id} variant="default">
            {loading ? (
              <div className="space-y-3">
                <Skeleton width="100%" height={20} />
                <Skeleton width="80%" height={16} />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{agent.icon}</span>
                    <div>
                      <p className="font-semibold">{agent.name}</p>
                      <p className="text-xs text-zinc-400">{agent.lastUpdate}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusColors[agent.status]}`}>
                    {statusIcons[agent.status]} {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                  </span>
                </div>

                {agent.status === 'active' && agent.performance > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-zinc-400">Performance</span>
                      <span className="text-sm font-semibold">{agent.performance}%</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-violet-500 to-fuchsia-500 h-full rounded-full transition-all"
                        style={{ width: `${agent.performance}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </DynamicShadowCard>
        ))}
      </div>
    </div>
  );
};

export default AgentMonitor;
