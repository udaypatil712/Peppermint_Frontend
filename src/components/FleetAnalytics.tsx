import React, { useState } from 'react';
import { MetricSnapshot } from '../types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { TrendingUp, Clock, Filter } from 'lucide-react';

interface FleetAnalyticsProps {
  metricsHistory: MetricSnapshot[];
}

export const FleetAnalytics: React.FC<FleetAnalyticsProps> = ({ metricsHistory }) => {
  const [timeWindow, setTimeWindow] = useState<'1m' | '5m' | '15m' | '30m' | 'all'>('5m');
  const [selectedMetric, setSelectedMetric] = useState<'active' | 'attention' | 'battery'>('active');

  // Filter history based on selected time window
  const getFilteredHistory = () => {
    if (metricsHistory.length === 0) return [];
    if (timeWindow === 'all') return metricsHistory;

    const now = Date.now();
    const windowMsMap: Record<string, number> = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '30m': 30 * 60 * 1000,
    };
    const cutoff = now - windowMsMap[timeWindow];
    return metricsHistory.filter((m) => m.timestamp >= cutoff);
  };

  const filteredData = getFilteredHistory();
  const latestMetric = metricsHistory[metricsHistory.length - 1];

  return (
    <div className="glass-panel p-5 rounded-xl border border-dark-border shadow-xl">
      {/* Analytics Card Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-dark-border">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Fleet Performance Trends
            </h3>
            <p className="text-xs text-dark-muted">Live Time-Series Metrics & Active Fraction</p>
          </div>
        </div>

        {/* Time Window Controls */}
        <div className="flex items-center space-x-2 bg-dark-bg p-1 rounded-lg border border-dark-border">
          <Clock className="w-3.5 h-3.5 text-slate-400 ml-2" />
          <span className="text-xs text-slate-400 font-medium">Window:</span>
          {(['1m', '5m', '15m', '30m', 'all'] as const).map((window) => (
            <button
              key={window}
              onClick={() => setTimeWindow(window)}
              className={`px-2.5 py-1 rounded text-xs font-semibold uppercase transition-all ${
                timeWindow === window
                  ? 'bg-teal-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {window}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Category Selector Tabs */}
      <div className="flex items-center space-x-3 mb-4 text-xs">
        <button
          onClick={() => setSelectedMetric('active')}
          className={`px-3 py-1.5 rounded-lg border font-medium flex items-center space-x-2 transition-all ${
            selectedMetric === 'active'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
              : 'border-dark-border text-slate-400 hover:text-white'
          }`}
        >
          <span>Active Fraction (%):</span>
          <span className="font-bold font-mono text-emerald-400">
            {latestMetric ? `${latestMetric.activePercentage}%` : '0%'}
          </span>
        </button>

        <button
          onClick={() => setSelectedMetric('attention')}
          className={`px-3 py-1.5 rounded-lg border font-medium flex items-center space-x-2 transition-all ${
            selectedMetric === 'attention'
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
              : 'border-dark-border text-slate-400 hover:text-white'
          }`}
        >
          <span>Attention Needed:</span>
          <span className="font-bold font-mono text-amber-400">
            {latestMetric ? latestMetric.blockedCount + latestMetric.errorCount + latestMetric.offlineCount : 0}
          </span>
        </button>

        <button
          onClick={() => setSelectedMetric('battery')}
          className={`px-3 py-1.5 rounded-lg border font-medium flex items-center space-x-2 transition-all ${
            selectedMetric === 'battery'
              ? 'bg-purple-500/15 border-purple-500/40 text-purple-400'
              : 'border-dark-border text-slate-400 hover:text-white'
          }`}
        >
          <span>Avg Battery (%):</span>
          <span className="font-bold font-mono text-purple-400">
            {latestMetric ? `${latestMetric.avgBattery}%` : '0%'}
          </span>
        </button>
      </div>

      {/* Recharts Area Chart Container */}
      <div className="h-64 w-full">
        {filteredData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="attentionGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="batteryGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#121824',
                  borderColor: '#1e293b',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />

              {selectedMetric === 'active' && (
                <>
                  <Area
                    type="monotone"
                    dataKey="activePercentage"
                    name="Active Fraction (%)"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#activeGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="activeCount"
                    name="Active Count"
                    stroke="#0ea5e9"
                    strokeWidth={1.5}
                    fillOpacity={0}
                  />
                </>
              )}

              {selectedMetric === 'attention' && (
                <>
                  <Area
                    type="monotone"
                    dataKey="blockedCount"
                    name="Blocked Robots"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#attentionGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="errorCount"
                    name="Error Robots"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fillOpacity={0}
                  />
                  <Area
                    type="monotone"
                    dataKey="offlineCount"
                    name="Offline Robots"
                    stroke="#64748b"
                    strokeWidth={1.5}
                    fillOpacity={0}
                  />
                </>
              )}

              {selectedMetric === 'battery' && (
                <>
                  <Area
                    type="monotone"
                    dataKey="avgBattery"
                    name="Avg Fleet Battery (%)"
                    stroke="#a855f7"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#batteryGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="minBattery"
                    name="Min Battery (%)"
                    stroke="#ec4899"
                    strokeWidth={1.5}
                    fillOpacity={0}
                  />
                </>
              )}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-500 text-sm">
            Waiting for live telemetry stream data...
          </div>
        )}
      </div>
    </div>
  );
};
