import React, { useState } from 'react';
import { FleetConfig, RobotStatus } from '../types';
import { Sliders, Cpu, Zap, AlertTriangle, Check, RefreshCw } from 'lucide-react';

interface ControlPanelProps {
  config: FleetConfig;
  onUpdateConfig: (newConfig: Partial<FleetConfig>) => Promise<void>;
  onTriggerDisruption: (robotId: string, status: RobotStatus) => Promise<void>;
  selectedRobotId: string | null;
  totalRobots: number;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  config,
  onUpdateConfig,
  onTriggerDisruption,
  selectedRobotId,
  totalRobots,
}) => {
  const [fleetSize, setFleetSize] = useState(config.fleetSize);
  const [tickIntervalMs, setTickIntervalMs] = useState(config.tickIntervalMs);
  const [payloadSizeBytes, setPayloadSizeBytes] = useState(config.payloadSizeBytes);
  const [simulateDisruptions, setSimulateDisruptions] = useState(config.simulateDisruptions);
  const [isApplying, setIsApplying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleApplyConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsApplying(true);
    setMessage(null);

    try {
      await onUpdateConfig({
        fleetSize: Number(fleetSize),
        tickIntervalMs: Number(tickIntervalMs),
        payloadSizeBytes: Number(payloadSizeBytes),
        simulateDisruptions,
      });
      setMessage('Configuration updated dynamically!');
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage('Failed to update config.');
    } finally {
      setIsApplying(false);
    }
  };

  const handleChaosDisrupt = async (status: RobotStatus) => {
    const targetId = selectedRobotId || 'r1';
    try {
      await onTriggerDisruption(targetId, status);
      setMessage(`Disruption applied to ${targetId}: ${status}`);
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage('Failed to apply disruption');
    }
  };

  return (
    <div className="glass-panel p-5 rounded-xl border border-teal-500/30 shadow-2xl bg-dark-card/90">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-dark-border">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Live System Control Knobs</h3>
            <p className="text-xs text-dark-muted">Dynamic Scaling Without Redeploy</p>
          </div>
        </div>
        {message && (
          <span className="text-xs font-semibold text-teal-400 bg-teal-500/10 border border-teal-500/30 px-3 py-1 rounded-full animate-fade-in">
            {message}
          </span>
        )}
      </div>

      <form onSubmit={handleApplyConfig} className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. Fleet Size Slider */}
        <div className="bg-dark-bg/60 p-3.5 rounded-lg border border-dark-border space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-teal-400" />
              Fleet Size (Robots)
            </span>
            <span className="font-mono text-teal-400 font-bold bg-teal-500/10 px-2 py-0.5 rounded">
              {fleetSize}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="1000"
            step="1"
            value={fleetSize}
            onChange={(e) => setFleetSize(Number(e.target.value))}
            className="w-full accent-teal-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>1</span>
            <span>250</span>
            <span>500</span>
            <span>1000+</span>
          </div>
        </div>

        {/* 2. Update Frequency / Interval Slider */}
        <div className="bg-dark-bg/60 p-3.5 rounded-lg border border-dark-border space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Tick Interval (ms)
            </span>
            <span className="font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded">
              {tickIntervalMs} ms ({(1000 / tickIntervalMs).toFixed(1)} Hz)
            </span>
          </div>
          <input
            type="range"
            min="50"
            max="5000"
            step="50"
            value={tickIntervalMs}
            onChange={(e) => setTickIntervalMs(Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>50ms (20Hz)</span>
            <span>1000ms (1Hz)</span>
            <span>5000ms</span>
          </div>
        </div>

        {/* 3. Payload Size Booster */}
        <div className="bg-dark-bg/60 p-3.5 rounded-lg border border-dark-border space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">Payload Overhead</span>
            <span className="font-mono text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded">
              {payloadSizeBytes} Bytes / msg
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="5000"
            step="100"
            value={payloadSizeBytes}
            onChange={(e) => setPayloadSizeBytes(Number(e.target.value))}
            className="w-full accent-purple-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>0 B (Standard)</span>
            <span>2.5 KB</span>
            <span>5 KB</span>
          </div>
        </div>

        {/* Submit Knobs Button */}
        <div className="md:col-span-3 flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-dark-border">
          {/* Chaos Disruption Quick Controls */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              Chaos Injector ({selectedRobotId || 'r1'}):
            </span>
            <button
              type="button"
              onClick={() => handleChaosDisrupt('error')}
              className="px-2.5 py-1 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 font-semibold"
            >
              Set Error
            </button>
            <button
              type="button"
              onClick={() => handleChaosDisrupt('blocked')}
              className="px-2.5 py-1 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 font-semibold"
            >
              Set Blocked
            </button>
            <button
              type="button"
              onClick={() => handleChaosDisrupt('offline')}
              className="px-2.5 py-1 rounded bg-slate-700 text-slate-300 hover:bg-slate-600 font-semibold"
            >
              Set Offline
            </button>
          </div>

          <button
            type="submit"
            disabled={isApplying}
            className="px-5 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center space-x-2 shadow-lg shadow-teal-500/20 transition-all"
          >
            {isApplying ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span>Apply Dynamic Controls</span>
          </button>
        </div>
      </form>
    </div>
  );
};
