import React, { useEffect, useState } from 'react';
import { TelemetryEvent } from '../types';
import { X, Battery, MapPin, Clock, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { statusBadgeClass, statusLabel } from '../utils/status';

interface Props {
  robotId: string | null;
  onClose: () => void;
  apiBaseUrl: string;
  currentRobot?: TelemetryEvent;
}

export const RobotDetailModal: React.FC<Props> = ({ robotId, onClose, apiBaseUrl, currentRobot }) => {
  const [history, setHistory] = useState<TelemetryEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!robotId) return;
    setLoading(true);
    fetch(`${apiBaseUrl}/api/robots/history/${robotId}?limit=60`)
      .then((r) => r.json())
      .then((d) => setHistory(d.history || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [robotId, apiBaseUrl]);

  if (!robotId) return null;

  const chartData = history.map((h) => ({ t: `${h.t}s`, battery: h.battery }));

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center">
              <Activity className="w-4 h-4 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white font-mono">{robotId}</span>
                {currentRobot && (
                  <span className={statusBadgeClass(currentRobot.status)}>
                    {statusLabel(currentRobot.status)}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentRobot?.robot_type} · telemetry history
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* current state */}
          {currentRobot && (
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/60">
                <p className="text-slate-500 mb-1.5 flex items-center gap-1">
                  <Battery className="w-3 h-3" /> Battery
                </p>
                <p className="text-lg font-bold font-mono text-white">{currentRobot.battery}%</p>
                <div className="mt-1.5 h-1 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${currentRobot.battery > 50 ? 'bg-emerald-500' : currentRobot.battery > 20 ? 'bg-amber-500' : 'bg-rose-500'}`}
                    style={{ width: `${currentRobot.battery}%` }}
                  />
                </div>
              </div>
              <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/60 col-span-2">
                <p className="text-slate-500 mb-1.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Position (x, y)
                </p>
                <p className="text-lg font-bold font-mono text-white">
                  ({currentRobot.x}, {currentRobot.y})
                </p>
              </div>
            </div>
          )}

          {/* battery chart */}
          <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/60">
            <p className="text-xs font-medium text-slate-400 mb-3">
              Battery over time · <span className="font-mono text-slate-500">GET /api/robots/history/{robotId}</span>
            </p>
            <div className="h-40">
              {loading ? (
                <div className="h-full flex items-center justify-center text-slate-600 text-xs">Loading…</div>
              ) : chartData.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                    <XAxis dataKey="t" stroke="#475569" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis domain={[0, 100]} stroke="#475569" tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 6, fontSize: 11 }}
                    />
                    <Line type="monotone" dataKey="battery" stroke="#a78bfa" strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-600 text-xs">
                  No history yet — check back in a few seconds.
                </div>
              )}
            </div>
          </div>

          {/* recent events table */}
          {history.length > 0 && (
            <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/60">
              <p className="text-xs font-medium text-slate-400 mb-3 flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> Recent events
              </p>
              <div className="space-y-1 max-h-36 overflow-y-auto font-mono text-[11px]">
                {[...history].reverse().slice(0, 12).map((ev, i) => (
                  <div key={i} className="flex items-center gap-3 text-slate-400 py-1 border-b border-slate-700/40 last:border-0">
                    <span className="text-slate-600 w-12">t={ev.t}s</span>
                    <span className={statusBadgeClass(ev.status)}>{ev.status}</span>
                    <span className="text-slate-500 flex-1 text-right">{ev.battery}% · ({ev.x}, {ev.y})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
