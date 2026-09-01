import React from 'react';
import { ConnectionStatus } from '../services/websocket';
import { Wifi, WifiOff, Loader2, Sliders, AlertTriangle, Activity } from 'lucide-react';

interface Props {
  connectionStatus: ConnectionStatus;
  totalRobots: number;
  activeRobots: number;
  attentionCount: number;
  showControlPanel: boolean;
  onToggleControlPanel: () => void;
  eventsPerSec: number;
}

export const Header: React.FC<Props> = ({
  connectionStatus,
  totalRobots,
  activeRobots,
  attentionCount,
  showControlPanel,
  onToggleControlPanel,
  eventsPerSec,
}) => {
  const connBadge = () => {
    if (connectionStatus === 'CONNECTED') {
      return (
        <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live
          {eventsPerSec > 0 && <span className="text-emerald-600 font-mono">({eventsPerSec}/s)</span>}
        </span>
      );
    }
    if (connectionStatus === 'DISCONNECTED') {
      return (
        <span className="flex items-center gap-1.5 text-slate-500 text-xs">
          <WifiOff className="w-3.5 h-3.5" /> Offline
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 text-amber-400 text-xs">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Connecting…
      </span>
    );
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
            <Activity className="w-4 h-4 text-slate-950 font-bold" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-white">Peppermint Robotics</p>
            <p className="text-[10px] text-slate-500">Fleet Dashboard</p>
          </div>
        </div>

        {/* status strip */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg">
            <Wifi className="w-3.5 h-3.5 text-slate-500" />
            {connBadge()}
          </div>

          <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1">
            <span>
              Fleet: <span className="text-white font-semibold font-mono">{totalRobots}</span>
            </span>
            <span className="text-slate-700">|</span>
            <span>
              Active: <span className="text-emerald-400 font-semibold font-mono">{activeRobots}</span>
            </span>
            {attentionCount > 0 && (
              <>
                <span className="text-slate-700">|</span>
                <span className="flex items-center gap-1 text-amber-400 font-medium">
                  <AlertTriangle className="w-3 h-3" />
                  {attentionCount} attention
                </span>
              </>
            )}
          </div>

          <button
            onClick={onToggleControlPanel}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              showControlPanel
                ? 'bg-teal-500 text-slate-950 shadow-sm shadow-teal-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Controls
          </button>
        </div>
      </div>
    </header>
  );
};
